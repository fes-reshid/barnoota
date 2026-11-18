import 'dart:async';

import 'package:material_ui/material_ui.dart';

import 'data/content.dart';
import 'data/store.dart';
import 'logic/hisnul.dart';
import 'logic/plan.dart';
import 'logic/prayer.dart';
import 'logic/reminders.dart';

/// Shared by every screen: the saved data, the content, the reminders and the clock.
class AppState extends ChangeNotifier {
  AppState(this.store, this.content, this.reminders, {DateTime? fixedNow, this.headings, this.hisnul = openHisnul}) {
    now = fixedNow ?? DateTime.now();
    store.addListener(notifyListeners);
    if (fixedNow == null) {
      _timer = Timer.periodic(const Duration(seconds: 20), (_) {
        now = DateTime.now();
        notifyListeners();
      });
    }
  }

  final AppStore store;
  final Content content;
  final Reminders reminders;

  /// The compass heading in degrees. Null in the app, which then reads the phone's compass; tests give their own.
  final Stream<double?>? headings;

  /// Sends the reader to Hisnul Muslim (tests give their own).
  final HisnulOpener hisnul;
  Timer? _timer;
  late DateTime now;

  /// The day shown on the Today screen.
  DateTime selected = dayOnly(DateTime.now());
  int tab = 0;

  Settings get settings => store.settings;
  Place? get place => settings.place;
  DateTime get today => dayOnly(now);

  void selectDay(DateTime d) {
    selected = dayOnly(d);
    notifyListeners();
  }

  void goToDay(DateTime d) {
    selected = dayOnly(d);
    tab = 0;
    notifyListeners();
  }

  void setTab(int i) {
    tab = i;
    notifyListeners();
  }

  DayTimes? timesOn(DateTime d) {
    final p = place;
    return p == null ? null : timesFor(d, p, settings.method, settings.hanafi);
  }

  /// Save the settings, then update the reminders to match.
  Future<void> settingsChanged() async {
    store.save();
    await reminders.reschedule(settings, content);
  }

  @override
  void dispose() {
    _timer?.cancel();
    store.removeListener(notifyListeners);
    super.dispose();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);
  static AppState of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
