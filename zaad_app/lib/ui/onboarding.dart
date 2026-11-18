import 'package:material_ui/material_ui.dart';

import '../app_state.dart';
import '../core/theme.dart';
import '../logic/location.dart';
import 'place_picker.dart';

class Onboarding extends StatefulWidget {
  const Onboarding({super.key});
  @override
  State<Onboarding> createState() => _OnboardingState();
}

class _OnboardingState extends State<Onboarding> {
  bool busy = false;
  String? message;
  bool remind = true;

  Future<void> _locate(AppState app) async {
    setState(() {
      busy = true;
      message = null;
    });
    final (res, place) = await locateMe();
    if (!mounted) return;
    setState(() {
      busy = false;
      message = switch (res) {
        LocationResult.ok => null,
        LocationResult.serviceOff => 'Location is switched off on this phone. Turn it on, or choose a city.',
        LocationResult.denied => 'Permission was not given. You can choose a city instead.',
        LocationResult.deniedForever => 'Location is blocked for Zaad in Settings. You can choose a city instead.',
        LocationResult.failed => 'Could not find your location. Choose a city instead.',
      };
    });
    if (place != null) _set(app, place.name, place.lat, place.lng);
  }

  void _set(AppState app, String name, double lat, double lng) {
    app.settings
      ..placeName = name
      ..lat = lat
      ..lng = lng;
    app.store.save();
  }

  Future<void> _finish(AppState app) async {
    if (remind) {
      final ok = await app.reminders.requestPermission();
      app.settings
        ..remindPrayer = ok
        ..remindAdhkar = ok;
    }
    app.settings.onboarded = true;
    await app.settingsChanged();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final place = app.place;
    return Scaffold(
      backgroundColor: Zc.deep,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text('ZAAD', style: display(44, color: Zc.gold2, letter: 10)),
                Text('زَادُ اليَوْم', style: ar(30, color: Zc.gold2, height: 1.5)),
                Text('Your day, prayer by prayer', style: serif(17, color: Colors.white, style: FontStyle.italic)),
                const SizedBox(height: 28),
                Card(
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Where are you?', style: display(18, color: Zc.green)),
                      const SizedBox(height: 6),
                      Text('Zaad works out the five prayer times and the Qibla on your phone. Your location never leaves it.', style: serif(15, color: Zc.ink)),
                      const SizedBox(height: 14),
                      if (place != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Zc.soft, borderRadius: BorderRadius.circular(12)),
                          child: Row(children: [
                            const Icon(Icons.place, color: Zc.green),
                            const SizedBox(width: 8),
                            Expanded(child: Text(place.name, style: serif(16.5, color: Zc.ink, wght: 600))),
                          ]),
                        ),
                      if (message != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(message!, style: serif(14, color: Zc.maghrib))),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: busy ? null : () => _locate(app),
                            icon: busy ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.my_location, size: 18),
                            label: const Text('My location'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              final c = await pickCity(context);
                              if (c != null) _set(app, c.name, c.lat, c.lng);
                            },
                            icon: const Icon(Icons.location_city, size: 18),
                            label: const Text('Pick a city'),
                          ),
                        ),
                      ]),
                      const Divider(height: 28),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        value: remind,
                        onChanged: (v) => setState(() => remind = v),
                        title: Text('Remind me at each prayer', style: serif(16, color: Zc.ink, wght: 600)),
                        subtitle: Text('And morning and evening adhkar. You can change this later.', style: serif(13.5, color: Zc.muted)),
                      ),
                    ]),
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: Zc.gold2,
                      foregroundColor: Zc.deep,
                      disabledBackgroundColor: Colors.white12,
                      disabledForegroundColor: Colors.white38,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: place == null ? null : () => _finish(app),
                    child: Text(place == null ? 'Choose where you are to begin' : 'Begin', style: label(13.5, letter: 1.2, wght: 700)),
                  ),
                ),
                const SizedBox(height: 14),
                Text('No account. No ads. Works without internet.', style: label(10.5, color: Colors.white70, letter: 1)),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
