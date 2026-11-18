import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import '../data/content.dart';
import '../data/store.dart';
import 'plan.dart';
import 'prayer.dart';

/// Prayer-time and adhkar reminders, scheduled on the phone for the coming week.
/// Everything is local: no server, no account.
class Reminders {
  final _plugin = FlutterLocalNotificationsPlugin();
  bool _ready = false;

  bool get supported => !kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS);

  Future<void> init() async {
    if (!supported || _ready) return;
    tzdata.initializeTimeZones();
    try {
      final info = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(info.identifier));
    } catch (_) {
      // falls back to UTC; times are still converted from the phone's own clock below
    }
    await _plugin.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(requestAlertPermission: false, requestBadgePermission: false, requestSoundPermission: false),
      ),
    );
    _ready = true;
  }

  /// Ask for permission to show notifications. Returns whether it was granted.
  Future<bool> requestPermission() async {
    if (!supported) return false;
    await init();
    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    final ios = _plugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
    var ok = true;
    if (android != null) {
      ok = await android.requestNotificationsPermission() ?? false;
      try {
        await android.requestExactAlarmsPermission();
      } catch (_) {}
    }
    if (ios != null) ok = await ios.requestPermissions(alert: true, badge: false, sound: true) ?? false;
    return ok;
  }

  Future<void> cancelAll() async {
    if (!supported) return;
    await init();
    await _plugin.cancelAll();
  }

  /// Cancel everything and schedule the next seven days again from the current settings.
  Future<void> reschedule(Settings s, Content content) async {
    if (!supported) return;
    await init();
    await _plugin.cancelAll();
    final place = s.place;
    if (place == null || !(s.remindPrayer || s.remindAdhkar)) return;
    final now = DateTime.now();
    var id = 100;
    for (var add = 0; add < 7; add++) {
      final day = addDays(dayOnly(now), add);
      final t = timesFor(day, place, s.method, s.hanafi);
      final name = content.names[nameIndexFor(day, content.names.length)];
      if (s.remindPrayer) {
        for (final p in prayers) {
          final when = t.timeOfPrayer(p.id);
          await _at(id++, when, now, '${p.name} · ${_clock(when)}', '${name.transliteration}: ${name.live}', 'prayer');
          if (s.remindBefore) {
            await _at(id++, when.subtract(const Duration(minutes: 10)), now, '${p.name} in 10 minutes', 'Get ready for prayer.', 'prayer');
          }
        }
      }
      if (s.remindAdhkar) {
        await _at(id++, t.sunrise.add(const Duration(minutes: 10)), now, 'Morning adhkar', 'Begin the day with the remembrance of Allah.', 'adhkar');
        await _at(id++, t.asr.add(const Duration(minutes: 10)), now, 'Evening adhkar', 'Say them before the sun sets.', 'adhkar');
      }
    }
  }

  String _clock(DateTime d) => '${two(d.hour)}:${two(d.minute)}';

  Future<void> _at(int id, DateTime when, DateTime now, String title, String body, String channel) async {
    if (!when.isAfter(now)) return;
    final details = NotificationDetails(
      android: AndroidNotificationDetails(
        channel == 'prayer' ? 'zaad_prayer' : 'zaad_adhkar',
        channel == 'prayer' ? 'Prayer times' : 'Adhkar',
        channelDescription: channel == 'prayer' ? 'A reminder at each prayer time' : 'Morning and evening adhkar',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: const DarwinNotificationDetails(presentAlert: true, presentSound: true),
    );
    final at = tz.TZDateTime.from(when, tz.local);
    try {
      await _plugin.zonedSchedule(
        id: id,
        title: title,
        body: body,
        scheduledDate: at,
        notificationDetails: details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      );
    } catch (_) {
      // exact alarms were not allowed: a few minutes' delay is better than no reminder
      try {
        await _plugin.zonedSchedule(
          id: id,
          title: title,
          body: body,
          scheduledDate: at,
          notificationDetails: details,
          androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        );
      } catch (_) {}
    }
  }
}
