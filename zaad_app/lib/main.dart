import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';

import 'app_state.dart';
import 'core/theme.dart';
import 'data/content.dart';
import 'data/store.dart';
import 'logic/reminders.dart';
import 'ui/home.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  final store = await AppStore.open();
  final content = await Content.load();
  final reminders = Reminders();
  final state = AppState(store, content, reminders);
  // tapping a morning or evening adhkar reminder opens Hisnul Muslim at that chapter
  reminders.onTap = (payload) {
    if (payload.startsWith('hisnul:')) {
      final chapter = int.tryParse(payload.substring(7));
      if (chapter != null) state.hisnul(chapter);
    }
  };
  runApp(ZaadApp(state: state));
  // reminders are set up after the first screen is up, so a slow permission dialog never delays the app
  reminders.init().then((_) => reminders.reschedule(store.settings, content));
}

class ZaadApp extends StatelessWidget {
  const ZaadApp({super.key, required this.state});
  final AppState state;

  @override
  Widget build(BuildContext context) => AppScope(
        state: state,
        child: MaterialApp(
          title: 'Zaad',
          debugShowCheckedModeBanner: false,
          theme: zaadTheme(Brightness.light),
          darkTheme: zaadTheme(Brightness.dark),
          home: const Home(),
        ),
      );
}
