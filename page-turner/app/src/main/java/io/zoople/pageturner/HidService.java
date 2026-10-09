package io.zoople.pageturner;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertisingSet;
import android.bluetooth.le.AdvertisingSetCallback;
import android.bluetooth.le.AdvertisingSetParameters;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.VolumeProvider;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.ParcelUuid;
import android.util.Log;

import java.lang.reflect.Method;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Presents the phone as a Bluetooth LE keyboard (HID over GATT) that only ever sends
 * "next page" / "previous page" key presses.
 *
 * The GATT server and advertising live in this foreground service for as long as it runs,
 * so the phone keeps one identity and the reader can reconnect without re-pairing.
 */
@SuppressLint("MissingPermission")
public class HidService extends Service {
    private static final String TAG = "PageTurner";

    public static final String ACTION_START = "io.zoople.pageturner.START";
    public static final String ACTION_STOP = "io.zoople.pageturner.STOP";
    public static final String ACTION_NEXT = "io.zoople.pageturner.NEXT";
    public static final String ACTION_PREV = "io.zoople.pageturner.PREV";

    // Keyboard usages (HID usage page 0x07)
    public static final byte KEY_RIGHT = 0x4F, KEY_LEFT = 0x50, KEY_PAGE_DOWN = 0x4E, KEY_PAGE_UP = 0x4B;

    private static UUID u16(int v) {
        return UUID.fromString(String.format("0000%04x-0000-1000-8000-00805f9b34fb", v));
    }

    static final UUID HID_SERVICE = u16(0x1812);
    static final UUID HID_INFO = u16(0x2A4A);
    static final UUID REPORT_MAP = u16(0x2A4B);
    static final UUID HID_CONTROL = u16(0x2A4C);
    static final UUID REPORT = u16(0x2A4D);
    static final UUID PROTOCOL_MODE = u16(0x2A4E);
    static final UUID BOOT_KBD_IN = u16(0x2A22);
    static final UUID DIS_SERVICE = u16(0x180A);
    static final UUID MANUFACTURER = u16(0x2A29);
    static final UUID PNP_ID = u16(0x2A50);
    static final UUID BATTERY_SERVICE = u16(0x180F);
    static final UUID BATTERY_LEVEL = u16(0x2A19);
    static final UUID CCCD = u16(0x2902);
    static final UUID REPORT_REF = u16(0x2908);

    /** Plain 8-byte keyboard, report id 1: [modifiers][reserved][6 key slots]. */
    private static final byte[] REPORT_MAP_VALUE = new byte[]{
            0x05, 0x01,       // Usage Page (Generic Desktop)
            0x09, 0x06,       // Usage (Keyboard)
            (byte) 0xA1, 0x01, // Collection (Application)
            (byte) 0x85, 0x01, //   Report ID (1)
            0x05, 0x07,       //   Usage Page (Key Codes)
            0x19, (byte) 0xE0, //   Usage Minimum (224)
            0x29, (byte) 0xE7, //   Usage Maximum (231)
            0x15, 0x00,       //   Logical Minimum (0)
            0x25, 0x01,       //   Logical Maximum (1)
            0x75, 0x01,       //   Report Size (1)
            (byte) 0x95, 0x08, //   Report Count (8)
            (byte) 0x81, 0x02, //   Input (Data, Variable, Absolute) ; modifiers
            (byte) 0x95, 0x01, //   Report Count (1)
            0x75, 0x08,       //   Report Size (8)
            (byte) 0x81, 0x01, //   Input (Constant) ; reserved
            (byte) 0x95, 0x06, //   Report Count (6)
            0x75, 0x08,       //   Report Size (8)
            0x15, 0x00,       //   Logical Minimum (0)
            0x25, 0x65,       //   Logical Maximum (101)
            0x05, 0x07,       //   Usage Page (Key Codes)
            0x19, 0x00,       //   Usage Minimum (0)
            0x29, 0x65,       //   Usage Maximum (101)
            (byte) 0x81, 0x00, //   Input (Data, Array) ; key slots
            (byte) 0xC0        // End Collection
    };

    // ---- state shared with the UI ---------------------------------------------------------
    public interface Listener {
        void onStatus(String status, boolean connected);
    }

    private static volatile HidService instance;
    private static volatile Listener listener;
    private static volatile String lastStatus = "Stopped";
    private static volatile boolean lastConnected = false;

    public static boolean isRunning() {
        return instance != null;
    }

    public static void setListener(Listener l) {
        listener = l;
        if (l != null) l.onStatus(lastStatus, lastConnected);
    }

    public static boolean sendPage(boolean next) {
        HidService s = instance;
        if (s == null) return false;
        s.main.post(() -> s.pressPage(next));
        return true;
    }

    // ---- service internals ----------------------------------------------------------------
    private final Handler main = new Handler(Looper.getMainLooper());
    private BluetoothManager btManager;
    private BluetoothGattServer server;
    private BluetoothLeAdvertiser advertiser;
    private AdvertisingSetCallback advCallback;
    private boolean advertising = false;
    private boolean triedStableAddress = false;
    private boolean stableAddressWorks = true;

    private BluetoothGattCharacteristic reportChar;
    private final Map<UUID, byte[]> charValues = new HashMap<>();
    private final ArrayDeque<BluetoothGattService> pendingServices = new ArrayDeque<>();
    private final Map<String, BluetoothDevice> connected = new LinkedHashMap<>();
    private final Set<String> subscribed = new HashSet<>();
    private final Map<String, byte[]> cccdValues = new HashMap<>();

    private final ArrayDeque<byte[]> reportQueue = new ArrayDeque<>();
    private int inFlight = 0;
    private final Runnable inFlightTimeout = () -> {
        inFlight = 0;
        pumpReports();
    };

    private MediaSession mediaSession;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;
        if (ACTION_STOP.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (instance == null) {
            instance = this;
            startForeground(1, buildNotification("Starting…"), ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
            startHid();
        }
        if (ACTION_NEXT.equals(action)) pressPage(true);
        if (ACTION_PREV.equals(action)) pressPage(false);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        instance = null;
        stopAdvertising();
        if (server != null) {
            try {
                for (BluetoothDevice d : connected.values()) server.cancelConnection(d);
                server.close();
            } catch (Exception e) {
                Log.w(TAG, "close", e);
            }
            server = null;
        }
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }
        main.removeCallbacksAndMessages(null);
        setStatus("Stopped", false);
        super.onDestroy();
    }

    // ---- setup ----------------------------------------------------------------------------
    private void startHid() {
        btManager = getSystemService(BluetoothManager.class);
        BluetoothAdapter adapter = btManager != null ? btManager.getAdapter() : null;
        if (adapter == null || !adapter.isEnabled()) {
            setStatus("Bluetooth is off. Turn it on and press Start.", false);
            return;
        }
        advertiser = adapter.getBluetoothLeAdvertiser();
        if (advertiser == null) {
            setStatus("This phone can't advertise over Bluetooth LE.", false);
            return;
        }
        server = btManager.openGattServer(this, gattCallback);
        if (server == null) {
            setStatus("Couldn't open the Bluetooth GATT server.", false);
            return;
        }
        pendingServices.add(buildHidService());
        pendingServices.add(buildDeviceInfoService());
        pendingServices.add(buildBatteryService());
        addNextService();
        if (Prefs.volumeKeys(this)) setupVolumeKeys();
    }

    private void addNextService() {
        BluetoothGattService next = pendingServices.poll();
        if (next == null) {
            startAdvertising();
            return;
        }
        if (!server.addService(next)) {
            setStatus("Failed to register Bluetooth service " + next.getUuid(), false);
        }
    }

    private BluetoothGattCharacteristic ch(UUID uuid, int props, int perms, byte[] value) {
        BluetoothGattCharacteristic c = new BluetoothGattCharacteristic(uuid, props, perms);
        if (value != null) charValues.put(uuid, value);
        return c;
    }

    private BluetoothGattService buildHidService() {
        BluetoothGattService s = new BluetoothGattService(HID_SERVICE, BluetoothGattService.SERVICE_TYPE_PRIMARY);
        int R = BluetoothGattCharacteristic.PERMISSION_READ;
        int W = BluetoothGattCharacteristic.PERMISSION_WRITE;

        s.addCharacteristic(ch(HID_INFO, BluetoothGattCharacteristic.PROPERTY_READ, R,
                new byte[]{0x11, 0x01, 0x00, 0x03})); // HID 1.11, no country, remote-wake + normally-connectable
        s.addCharacteristic(ch(REPORT_MAP, BluetoothGattCharacteristic.PROPERTY_READ, R, REPORT_MAP_VALUE));
        s.addCharacteristic(ch(HID_CONTROL, BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE, W, null));
        s.addCharacteristic(ch(PROTOCOL_MODE,
                BluetoothGattCharacteristic.PROPERTY_READ | BluetoothGattCharacteristic.PROPERTY_WRITE
                        | BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
                R | W, new byte[]{0x01}));

        reportChar = ch(REPORT, BluetoothGattCharacteristic.PROPERTY_READ | BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                R, new byte[8]);
        BluetoothGattDescriptor cccd = new BluetoothGattDescriptor(CCCD,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE);
        BluetoothGattDescriptor ref = new BluetoothGattDescriptor(REPORT_REF, BluetoothGattDescriptor.PERMISSION_READ);
        reportChar.addDescriptor(cccd);
        reportChar.addDescriptor(ref);
        s.addCharacteristic(reportChar);

        // Boot keyboard input as a fallback some hosts look for.
        BluetoothGattCharacteristic boot = ch(BOOT_KBD_IN,
                BluetoothGattCharacteristic.PROPERTY_READ | BluetoothGattCharacteristic.PROPERTY_NOTIFY, R, new byte[8]);
        boot.addDescriptor(new BluetoothGattDescriptor(CCCD,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE));
        s.addCharacteristic(boot);
        return s;
    }

    private BluetoothGattService buildDeviceInfoService() {
        BluetoothGattService s = new BluetoothGattService(DIS_SERVICE, BluetoothGattService.SERVICE_TYPE_PRIMARY);
        int R = BluetoothGattCharacteristic.PERMISSION_READ;
        s.addCharacteristic(ch(MANUFACTURER, BluetoothGattCharacteristic.PROPERTY_READ, R, "PageTurner".getBytes()));
        // PnP ID: USB vendor source, vendor 0x1209 (pid.codes, open source), product 0x5054, version 1.0
        s.addCharacteristic(ch(PNP_ID, BluetoothGattCharacteristic.PROPERTY_READ, R,
                new byte[]{0x02, 0x09, 0x12, 0x54, 0x50, 0x00, 0x01}));
        return s;
    }

    private BluetoothGattService buildBatteryService() {
        BluetoothGattService s = new BluetoothGattService(BATTERY_SERVICE, BluetoothGattService.SERVICE_TYPE_PRIMARY);
        BluetoothGattCharacteristic level = ch(BATTERY_LEVEL,
                BluetoothGattCharacteristic.PROPERTY_READ | BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ, new byte[]{100});
        level.addDescriptor(new BluetoothGattDescriptor(CCCD,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE));
        s.addCharacteristic(level);
        return s;
    }

    // ---- advertising ----------------------------------------------------------------------
    private void startAdvertising() {
        if (advertiser == null || advertising || !connected.isEmpty()) return;
        AdvertisingSetParameters.Builder pb = new AdvertisingSetParameters.Builder()
                .setLegacyMode(true)
                .setConnectable(true)
                .setScannable(true)
                .setInterval(AdvertisingSetParameters.INTERVAL_LOW)
                .setTxPowerLevel(AdvertisingSetParameters.TX_POWER_HIGH);
        triedStableAddress = false;
        if (stableAddressWorks) {
            // Ask for the phone's fixed public address so the reader's saved pairing keeps
            // matching. Not every Android build allows this; if it is refused we fall back.
            try {
                Method m = pb.getClass().getMethod("setOwnAddressType", int.class);
                m.invoke(pb, 0 /* ADDRESS_TYPE_PUBLIC */);
                triedStableAddress = true;
            } catch (Throwable t) {
                stableAddressWorks = false;
            }
        }
        AdvertiseData data = new AdvertiseData.Builder()
                .addServiceUuid(new ParcelUuid(HID_SERVICE))
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)
                .build();
        AdvertiseData scanResponse = new AdvertiseData.Builder()
                .setIncludeDeviceName(true)
                .build();
        advCallback = new AdvertisingSetCallback() {
            @Override
            public void onAdvertisingSetStarted(AdvertisingSet set, int txPower, int status) {
                if (status == AdvertisingSetCallback.ADVERTISE_SUCCESS) {
                    advertising = true;
                    setStatus("Ready to pair. On the X3: Controls → Bluetooth → Scan, then pick \""
                            + adapterName() + "\".", false);
                } else if (triedStableAddress) {
                    stableAddressWorks = false;
                    advertising = false;
                    main.post(HidService.this::startAdvertising);
                } else {
                    advertising = false;
                    setStatus("Advertising failed (code " + status + "). Try Stop, then Start.", false);
                }
            }

            @Override
            public void onAdvertisingSetStopped(AdvertisingSet set) {
                advertising = false;
            }
        };
        try {
            advertiser.startAdvertisingSet(pb.build(), data, scanResponse, null, null, advCallback);
        } catch (Throwable t) {
            if (triedStableAddress) {
                stableAddressWorks = false;
                main.post(this::startAdvertising);
            } else {
                setStatus("Advertising failed: " + t.getMessage(), false);
            }
        }
    }

    private void stopAdvertising() {
        if (advertiser != null && advCallback != null) {
            try {
                advertiser.stopAdvertisingSet(advCallback);
            } catch (Throwable ignored) {
            }
        }
        advertising = false;
    }

    private String adapterName() {
        try {
            String n = btManager.getAdapter().getName();
            return n != null ? n : "your phone";
        } catch (Throwable t) {
            return "your phone";
        }
    }

    // ---- GATT callbacks -------------------------------------------------------------------
    private final BluetoothGattServerCallback gattCallback = new BluetoothGattServerCallback() {
        @Override
        public void onServiceAdded(int status, BluetoothGattService service) {
            main.post(HidService.this::addNextService);
        }

        @Override
        public void onConnectionStateChange(BluetoothDevice device, int status, int newState) {
            main.post(() -> {
                String addr = device.getAddress();
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    connected.put(addr, device);
                    stopAdvertising();
                    setStatus("Connected to " + name(device) + ". Pairing / waiting for the reader…", true);
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    connected.remove(addr);
                    subscribed.remove(addr);
                    if (connected.isEmpty()) {
                        setStatus("Reader disconnected. Waiting for it to reconnect…", false);
                        main.postDelayed(HidService.this::startAdvertising, 300);
                    }
                }
            });
        }

        @Override
        public void onCharacteristicReadRequest(BluetoothDevice device, int requestId, int offset,
                                                BluetoothGattCharacteristic characteristic) {
            byte[] v = charValues.get(characteristic.getUuid());
            respond(device, requestId, offset, v != null ? v : new byte[0]);
        }

        @Override
        public void onCharacteristicWriteRequest(BluetoothDevice device, int requestId,
                                                 BluetoothGattCharacteristic characteristic, boolean preparedWrite,
                                                 boolean responseNeeded, int offset, byte[] value) {
            if (PROTOCOL_MODE.equals(characteristic.getUuid()) && value != null && value.length > 0) {
                charValues.put(PROTOCOL_MODE, new byte[]{value[0]});
            }
            if (responseNeeded) server.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value);
        }

        @Override
        public void onDescriptorReadRequest(BluetoothDevice device, int requestId, int offset,
                                            BluetoothGattDescriptor descriptor) {
            byte[] v;
            if (REPORT_REF.equals(descriptor.getUuid())) {
                v = new byte[]{0x01, 0x01}; // report id 1, input report
            } else if (CCCD.equals(descriptor.getUuid())) {
                byte[] stored = cccdValues.get(key(device, descriptor));
                v = stored != null ? stored : new byte[]{0x00, 0x00};
            } else {
                v = new byte[0];
            }
            respond(device, requestId, offset, v);
        }

        @Override
        public void onDescriptorWriteRequest(BluetoothDevice device, int requestId, BluetoothGattDescriptor descriptor,
                                             boolean preparedWrite, boolean responseNeeded, int offset, byte[] value) {
            if (CCCD.equals(descriptor.getUuid()) && value != null) {
                cccdValues.put(key(device, descriptor), value.clone());
                UUID owner = descriptor.getCharacteristic().getUuid();
                boolean on = value.length > 0 && (value[0] & 0x01) != 0;
                if (REPORT.equals(owner) || BOOT_KBD_IN.equals(owner)) {
                    main.post(() -> {
                        if (on) subscribed.add(device.getAddress());
                        else subscribed.remove(device.getAddress());
                        if (on) setStatus("Connected to " + name(device) + ". Ready: tap to turn pages.", true);
                    });
                }
            }
            if (responseNeeded) server.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value);
        }

        @Override
        public void onExecuteWrite(BluetoothDevice device, int requestId, boolean execute) {
            server.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null);
        }

        @Override
        public void onNotificationSent(BluetoothDevice device, int status) {
            main.post(() -> {
                if (inFlight > 0) inFlight--;
                if (inFlight == 0) {
                    main.removeCallbacks(inFlightTimeout);
                    main.postDelayed(HidService.this::pumpReports, 15);
                }
            });
        }
    };

    private void respond(BluetoothDevice device, int requestId, int offset, byte[] full) {
        if (server == null) return;
        if (offset > full.length) {
            server.sendResponse(device, requestId, BluetoothGatt.GATT_INVALID_OFFSET, offset, null);
            return;
        }
        byte[] part = new byte[full.length - offset];
        System.arraycopy(full, offset, part, 0, part.length);
        server.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, part);
    }

    private static String key(BluetoothDevice d, BluetoothGattDescriptor desc) {
        return d.getAddress() + "/" + desc.getCharacteristic().getUuid();
    }

    private String name(BluetoothDevice d) {
        try {
            String n = d.getName();
            return n != null && !n.isEmpty() ? n : "reader";
        } catch (Throwable t) {
            return "reader";
        }
    }

    // ---- sending keys ---------------------------------------------------------------------
    private void pressPage(boolean next) {
        if (connected.isEmpty() || subscribed.isEmpty()) {
            setStatus(connected.isEmpty()
                    ? "Not connected. Open a book on the X3 so its Bluetooth comes on."
                    : "Connected, but the reader hasn't finished setting up yet.", !connected.isEmpty());
            return;
        }
        boolean pageKeys = Prefs.pageKeys(this);
        byte usage = next ? (pageKeys ? KEY_PAGE_DOWN : KEY_RIGHT) : (pageKeys ? KEY_PAGE_UP : KEY_LEFT);
        reportQueue.add(new byte[]{0, 0, usage, 0, 0, 0, 0, 0});
        reportQueue.add(new byte[8]);
        pumpReports();
    }

    private void pumpReports() {
        if (inFlight > 0 || server == null) return;
        byte[] r = reportQueue.poll();
        if (r == null) return;
        charValues.put(REPORT, r);
        for (BluetoothDevice d : connected.values()) {
            if (!subscribed.contains(d.getAddress())) continue;
            try {
                int rc = server.notifyCharacteristicChanged(d, reportChar, false, r);
                if (rc == 0 /* BluetoothStatusCodes.SUCCESS */) inFlight++;
            } catch (Throwable t) {
                Log.w(TAG, "notify", t);
            }
        }
        if (inFlight > 0) {
            main.postDelayed(inFlightTimeout, 400);
        } else if (!reportQueue.isEmpty()) {
            main.postDelayed(this::pumpReports, 40);
        }
    }

    // ---- volume keys while the screen is off ----------------------------------------------
    private void setupVolumeKeys() {
        try {
            mediaSession = new MediaSession(this, "PageTurner");
            mediaSession.setPlaybackToRemote(new VolumeProvider(VolumeProvider.VOLUME_CONTROL_RELATIVE, 100, 50) {
                @Override
                public void onAdjustVolume(int direction) {
                    if (direction == 0) return;
                    boolean down = direction < 0;
                    boolean next = Prefs.swapped(HidService.this) != down;
                    main.post(() -> pressPage(next));
                }
            });
            mediaSession.setPlaybackState(new PlaybackState.Builder()
                    .setState(PlaybackState.STATE_PLAYING, 0, 1f)
                    .setActions(PlaybackState.ACTION_PLAY_PAUSE)
                    .build());
            mediaSession.setActive(true);
        } catch (Throwable t) {
            Log.w(TAG, "media session", t);
        }
    }

    // ---- status + notification ------------------------------------------------------------
    private void setStatus(String s, boolean isConnected) {
        lastStatus = s;
        lastConnected = isConnected;
        Listener l = listener;
        if (l != null) main.post(() -> l.onStatus(s, isConnected));
        if (instance != null) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.notify(1, buildNotification(isConnected ? "Connected" : s));
        }
    }

    private Notification buildNotification(String text) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null && nm.getNotificationChannel("turner") == null) {
            NotificationChannel ch = new NotificationChannel("turner", "Page Turner", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new Notification.Builder(this, "turner")
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle("Page Turner")
                .setContentText(text)
                .setOngoing(true)
                .setContentIntent(open)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .addAction(new Notification.Action.Builder(null, "◀ Prev", svc(ACTION_PREV, 1)).build())
                .addAction(new Notification.Action.Builder(null, "Next ▶", svc(ACTION_NEXT, 2)).build())
                .addAction(new Notification.Action.Builder(null, "Stop", svc(ACTION_STOP, 3)).build())
                .build();
    }

    private PendingIntent svc(String action, int code) {
        Intent i = new Intent(this, HidService.class).setAction(action);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
}
