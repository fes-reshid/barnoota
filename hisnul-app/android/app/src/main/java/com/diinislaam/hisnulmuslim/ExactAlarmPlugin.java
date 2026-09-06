package com.diinislaam.hisnulmuslim;

import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Android 12+ (API 31+) requires SCHEDULE_EXACT_ALARM for prayer-time
// reminders to fire at their precise instant, but unlike ACCESS_FINE_LOCATION
// or POST_NOTIFICATIONS, there is no runtime permission dialog for it - the
// user has to flip it on manually via a dedicated system settings screen.
// This plugin checks whether that's already allowed, and - if not - opens
// that settings screen directly instead of asking the reader to go find it
// themselves under Settings > Apps > ... > Special app access.
@CapacitorPlugin(name = "ExactAlarm")
public class ExactAlarmPlugin extends Plugin {
    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        boolean can = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            can = am != null && am.canScheduleExactAlarms();
        }
        JSObject ret = new JSObject();
        ret.put("value", can);
        call.resolve(ret);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
        }
        call.resolve();
    }
}
