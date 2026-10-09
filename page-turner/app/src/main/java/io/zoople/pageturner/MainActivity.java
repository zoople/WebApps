package io.zoople.pageturner;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.KeyEvent;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

@SuppressLint("MissingPermission")
public class MainActivity extends Activity implements HidService.Listener {
    private static final int REQ_PERMS = 1, REQ_BT_ON = 2;

    private static final int BG = Color.parseColor("#14171A");
    private static final int CARD = Color.parseColor("#22272C");
    private static final int ACCENT = Color.parseColor("#E8DCC2");
    private static final int TEXT = Color.parseColor("#E6E6E6");
    private static final int MUTED = Color.parseColor("#9AA3AB");
    private static final int OK = Color.parseColor("#7FC8A9");

    private TextView status;
    private View dot;
    private Button startStop;

    private int dp(float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private GradientDrawable rounded(int color, float radius) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(radius));
        return g;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.setPadding(dp(16), dp(16), dp(16), dp(16));
        root.setFitsSystemWindows(true);

        // status row
        LinearLayout statusRow = new LinearLayout(this);
        statusRow.setOrientation(LinearLayout.HORIZONTAL);
        statusRow.setGravity(Gravity.CENTER_VERTICAL);
        statusRow.setBackground(rounded(CARD, 14));
        statusRow.setPadding(dp(14), dp(12), dp(14), dp(12));
        dot = new View(this);
        GradientDrawable dotBg = new GradientDrawable();
        dotBg.setShape(GradientDrawable.OVAL);
        dotBg.setColor(MUTED);
        dot.setBackground(dotBg);
        statusRow.addView(dot, new LinearLayout.LayoutParams(dp(12), dp(12)));
        status = new TextView(this);
        status.setTextColor(TEXT);
        status.setTextSize(15);
        LinearLayout.LayoutParams stp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        stp.leftMargin = dp(12);
        statusRow.addView(status, stp);
        root.addView(statusRow);

        // page buttons: previous small on top, next large below (thumb-friendly)
        Button prev = bigButton("◀  Previous", CARD, TEXT, 26);
        prev.setOnClickListener(v -> turn(v, false));
        LinearLayout.LayoutParams pp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f);
        pp.topMargin = dp(14);
        root.addView(prev, pp);

        Button next = bigButton("Next  ▶", ACCENT, BG, 34);
        next.setOnClickListener(v -> turn(v, true));
        LinearLayout.LayoutParams np = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 2.2f);
        np.topMargin = dp(12);
        root.addView(next, np);

        // options
        LinearLayout opts = new LinearLayout(this);
        opts.setOrientation(LinearLayout.VERTICAL);
        opts.setBackground(rounded(CARD, 14));
        opts.setPadding(dp(14), dp(4), dp(14), dp(4));
        LinearLayout.LayoutParams op = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        op.topMargin = dp(14);
        opts.addView(toggle("Volume buttons turn pages (screen off too)", Prefs.volumeKeys(this), on -> {
            Prefs.setVolumeKeys(this, on);
            restartService();
        }));
        opts.addView(toggle("Volume up = next page", Prefs.swapped(this), on -> Prefs.setSwapped(this, on)));
        opts.addView(toggle("Send Page Up/Down instead of arrows", Prefs.pageKeys(this),
                on -> Prefs.setPageKeys(this, on)));
        root.addView(opts, op);

        startStop = bigButton("", CARD, TEXT, 17);
        startStop.setOnClickListener(v -> {
            if (HidService.isRunning()) {
                startService(new Intent(this, HidService.class).setAction(HidService.ACTION_STOP));
                main().postDelayed(this::refreshButton, 300);
            } else {
                ensureReadyAndStart();
            }
        });
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52));
        sp.topMargin = dp(12);
        root.addView(startStop, sp);

        setContentView(root);
        ensureReadyAndStart();
    }

    private android.os.Handler main() {
        return getWindow().getDecorView().getHandler() != null ? getWindow().getDecorView().getHandler()
                : new android.os.Handler(getMainLooper());
    }

    private Button bigButton(String label, int bg, int fg, float size) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextColor(fg);
        b.setTextSize(size);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setBackground(rounded(bg, 20));
        b.setStateListAnimator(null);
        return b;
    }

    interface OnToggle {
        void set(boolean on);
    }

    private View toggle(String label, boolean value, OnToggle cb) {
        Switch s = new Switch(this);
        s.setText(label);
        s.setTextColor(TEXT);
        s.setTextSize(15);
        s.setChecked(value);
        s.setPadding(0, dp(10), 0, dp(10));
        s.setOnCheckedChangeListener((btn, on) -> cb.set(on));
        return s;
    }

    private void turn(View v, boolean next) {
        v.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
        if (!HidService.sendPage(next)) {
            onStatus("Not running. Press Start.", false);
        }
    }

    // volume buttons while the app is open
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (Prefs.volumeKeys(this) && (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN || keyCode == KeyEvent.KEYCODE_VOLUME_UP)) {
            if (event.getRepeatCount() == 0) {
                boolean down = keyCode == KeyEvent.KEYCODE_VOLUME_DOWN;
                boolean next = Prefs.swapped(this) != down;
                HidService.sendPage(next);
            }
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (Prefs.volumeKeys(this) && (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN || keyCode == KeyEvent.KEYCODE_VOLUME_UP)) {
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }

    // ---- start-up checks ----------------------------------------------------------------
    private void ensureReadyAndStart() {
        List<String> need = new ArrayList<>();
        for (String p : new String[]{Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_ADVERTISE}) {
            if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) need.add(p);
        }
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            need.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        if (!need.isEmpty()) {
            onStatus("Allow Nearby devices (and notifications) so the phone can act as a page turner.", false);
            requestPermissions(need.toArray(new String[0]), REQ_PERMS);
            return;
        }
        BluetoothManager bm = getSystemService(BluetoothManager.class);
        BluetoothAdapter a = bm != null ? bm.getAdapter() : null;
        if (a == null) {
            onStatus("This phone has no Bluetooth.", false);
            return;
        }
        if (!a.isEnabled()) {
            onStatus("Bluetooth is off.", false);
            startActivityForResult(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), REQ_BT_ON);
            return;
        }
        startForegroundService(new Intent(this, HidService.class).setAction(HidService.ACTION_START));
        main().postDelayed(this::refreshButton, 300);
    }

    private void restartService() {
        if (!HidService.isRunning()) return;
        startService(new Intent(this, HidService.class).setAction(HidService.ACTION_STOP));
        main().postDelayed(this::ensureReadyAndStart, 600);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_PERMS) return;
        for (int i = 0; i < permissions.length; i++) {
            if (!Manifest.permission.POST_NOTIFICATIONS.equals(permissions[i])
                    && grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                onStatus("Nearby devices permission is needed. Grant it in Settings → Apps → Page Turner → Permissions.", false);
                return;
            }
        }
        ensureReadyAndStart();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_BT_ON && resultCode == RESULT_OK) ensureReadyAndStart();
    }

    @Override
    protected void onResume() {
        super.onResume();
        HidService.setListener(this);
        refreshButton();
    }

    @Override
    protected void onPause() {
        HidService.setListener(null);
        super.onPause();
    }

    private void refreshButton() {
        startStop.setText(HidService.isRunning() ? "Stop" : "Start");
    }

    @Override
    public void onStatus(String s, boolean isConnected) {
        runOnUiThread(() -> {
            status.setText(s);
            ((GradientDrawable) dot.getBackground()).setColor(isConnected ? OK : MUTED);
            refreshButton();
        });
    }
}
