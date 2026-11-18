import 'package:material_ui/material_ui.dart';

import '../app_state.dart';
import 'journey_screen.dart';
import 'names_screen.dart';
import 'onboarding.dart';
import 'qibla_screen.dart';
import 'settings_screen.dart';
import 'today_screen.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    if (!app.settings.onboarded) return const Onboarding();
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: IndexedStack(index: app.tab, children: const [TodayScreen(), NamesScreen(), QiblaScreen(), JourneyScreen(), SettingsScreen()]),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: app.tab,
        onDestinationSelected: app.setTab,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.today_outlined), selectedIcon: Icon(Icons.today), label: 'Today'),
          NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), selectedIcon: Icon(Icons.auto_awesome), label: 'Names'),
          NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore), label: 'Qibla'),
          NavigationDestination(icon: Icon(Icons.insights_outlined), selectedIcon: Icon(Icons.insights), label: 'Journey'),
          NavigationDestination(icon: Icon(Icons.tune), selectedIcon: Icon(Icons.tune), label: 'Settings'),
        ],
      ),
    );
  }
}
