package com.zoople.zerotozen;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends Activity {

    /** WebView that never reports itself hidden, so Chromium keeps audio and timers running with the screen off. */
    static class AlwaysOnWebView extends WebView {
        AlwaysOnWebView(Context c) { super(c); }
        @Override protected void onWindowVisibilityChanged(int visibility) {
            if (visibility != View.GONE) super.onWindowVisibilityChanged(View.VISIBLE);
        }
    }

    private WebView web;

    /** Exposed to the page as window.ZZ */
    class Bridge {
        @JavascriptInterface public void start(String text) {
            Intent i = new Intent(MainActivity.this, KeepAliveService.class);
            i.putExtra("text", text);
            if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
        }
        @JavascriptInterface public void stop() {
            stopService(new Intent(MainActivity.this, KeepAliveService.class));
        }
        @JavascriptInterface public boolean isNative() { return true; }
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(Color.parseColor("#0d1320"));
        getWindow().setNavigationBarColor(Color.parseColor("#0d1320"));
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 1);
        }

        web = new AlwaysOnWebView(this);
        web.setBackgroundColor(Color.parseColor("#0d1320"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setBuiltInZoomControls(false);
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "ZZ");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    // Deliberately do NOT call web.onPause(): that would freeze audio when the screen locks.
    @Override protected void onResume() { super.onResume(); web.resumeTimers(); }
    @Override protected void onStop() { super.onStop(); web.resumeTimers(); }

    @Override
    public void onBackPressed() { moveTaskToBack(true); }

    @Override
    protected void onDestroy() {
        stopService(new Intent(this, KeepAliveService.class));
        web.destroy();
        super.onDestroy();
    }
}
