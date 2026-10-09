package io.zoople.pageturner;

import android.content.Context;
import android.content.SharedPreferences;

final class Prefs {
    private Prefs() {
    }

    private static SharedPreferences p(Context c) {
        return c.getSharedPreferences("pageturner", Context.MODE_PRIVATE);
    }

    /** false = arrow keys (default), true = Page Up / Page Down. */
    static boolean pageKeys(Context c) {
        return p(c).getBoolean("pageKeys", false);
    }

    static void setPageKeys(Context c, boolean v) {
        p(c).edit().putBoolean("pageKeys", v).apply();
    }

    /** Volume buttons turn pages, including with the screen off. */
    static boolean volumeKeys(Context c) {
        return p(c).getBoolean("volumeKeys", true);
    }

    static void setVolumeKeys(Context c, boolean v) {
        p(c).edit().putBoolean("volumeKeys", v).apply();
    }

    /** Swap which button is next/previous. */
    static boolean swapped(Context c) {
        return p(c).getBoolean("swapped", false);
    }

    static void setSwapped(Context c, boolean v) {
        p(c).edit().putBoolean("swapped", v).apply();
    }
}
