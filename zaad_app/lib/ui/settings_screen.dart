import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';

import '../app_state.dart';
import '../core/theme.dart';
import '../logic/hisnul.dart';
import '../logic/location.dart';
import '../logic/prayer.dart';
import '../logic/quran.dart';
import 'place_picker.dart';
import 'quran_goal.dart';
import 'widgets.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final s = app.settings;
    return ListView(padding: const EdgeInsets.only(bottom: 28), children: [
      Container(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
        decoration: const BoxDecoration(gradient: LinearGradient(colors: [Zc.deep, Zc.green]), border: Border(bottom: BorderSide(color: Zc.gold2, width: 3))),
        child: Column(children: [
          Text('SETTINGS', style: display(22, color: Zc.gold2, letter: 3)),
          Text('Everything stays on your phone', style: serif(14.5, color: Colors.white70, style: FontStyle.italic)),
        ]),
      ),
      const SizedBox(height: 14),
      const _T('Prayer times'),
      Panel(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(children: [
          ListTile(
            leading: const Icon(Icons.place, color: Zc.green),
            title: Text(s.place?.name ?? 'Not set', style: serif(16.5, wght: 600)),
            subtitle: Text(s.place == null ? '' : '${s.place!.lat.toStringAsFixed(3)}, ${s.place!.lng.toStringAsFixed(3)}', style: label(10.5, color: Zc.muted, letter: .6)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _placeSheet(context, app),
          ),
          const Divider(height: 1),
          ListTile(
            title: Text('Calculation method', style: serif(15.5)),
            subtitle: Text(methods[s.method] ?? '', style: serif(13.5, color: Zc.muted)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _methodSheet(context, app),
          ),
          const Divider(height: 1),
          SwitchListTile(
            title: Text('Hanafi \'Asr', style: serif(15.5)),
            subtitle: Text('Later \'Asr time (shadow twice its length)', style: serif(13.5, color: Zc.muted)),
            value: s.hanafi,
            onChanged: (v) {
              s.hanafi = v;
              app.settingsChanged();
            },
          ),
        ]),
      ),
      const _T("Qur'an"),
      Panel(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: ListTile(
          leading: const Icon(Icons.menu_book, color: Zc.green),
          title: Text('Daily goal', style: serif(15.5)),
          subtitle: Text(
            app.store.quran.isSet
                ? '${describePages(s.quranPerDay)} · next page ${app.store.quran.nextPage}'
                : 'Choose how much you can read each day',
            style: serif(13.5, color: Zc.muted),
          ),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => showQuranGoal(context),
        ),
      ),
      const _T('Hisnul Muslim'),
      Panel(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(children: [
          ListTile(
            leading: const Icon(Icons.wb_twilight, color: Zc.green),
            title: Text('Morning adhkar', style: serif(15.5)),
            subtitle: Text('Opens your Hisnul Muslim app', style: serif(13.5, color: Zc.muted)),
            onTap: () => app.hisnul(hisnulMorning),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.nights_stay_outlined, color: Zc.green),
            title: Text('Evening adhkar', style: serif(15.5)),
            subtitle: Text('Opens your Hisnul Muslim app', style: serif(13.5, color: Zc.muted)),
            onTap: () => app.hisnul(hisnulEvening),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.shop, color: Zc.green),
            title: Text('Get the Hisnul Muslim app', style: serif(15.5)),
            subtitle: Text('On Google Play', style: serif(13.5, color: Zc.muted)),
            onTap: openHisnulStore,
          ),
        ]),
      ),
      const _T('Reminders'),
      Panel(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(children: [
          SwitchListTile(
            title: Text('At each prayer time', style: serif(15.5)),
            value: s.remindPrayer,
            onChanged: (v) => _remind(context, app, () => s.remindPrayer = v, v),
          ),
          SwitchListTile(
            title: Text('Ten minutes before', style: serif(15.5)),
            value: s.remindBefore,
            onChanged: s.remindPrayer ? (v) { s.remindBefore = v; app.settingsChanged(); } : null,
          ),
          SwitchListTile(
            title: Text('Morning and evening adhkar', style: serif(15.5)),
            value: s.remindAdhkar,
            onChanged: (v) => _remind(context, app, () => s.remindAdhkar = v, v),
          ),
        ]),
      ),
      const _T('Your data'),
      Panel(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(children: [
          ListTile(
            leading: const Icon(Icons.copy_all, color: Zc.green),
            title: Text('Copy a backup', style: serif(15.5)),
            subtitle: Text('Copies everything to the clipboard. Paste it into a note or message to keep it.', style: serif(13.5, color: Zc.muted)),
            onTap: () async {
              await Clipboard.setData(ClipboardData(text: app.store.exportJson()));
              if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Backup copied')));
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.restore, color: Zc.green),
            title: Text('Restore from a backup', style: serif(15.5)),
            onTap: () => _restore(context, app),
          ),
        ]),
      ),
      const _T('About'),
      Panel(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Zaad · Provision for the Day', style: display(15, letter: .6)),
          const SizedBox(height: 6),
          Text(
            'The names of Allah, the hadith (with their narrators and sources) and the Sunnahs are the same as in the printed Zaad planner. '
            'The Arabic of the hadith is taken from the source collections. Prayer times are calculated on your phone with the method you choose; '
            'check them against your local mosque. This app is for learning and reminders: please verify religious matters with a qualified teacher.',
            style: serif(13.5, color: Zc.muted),
          ),
          const SizedBox(height: 8),
          Text('diinislaam.com/planner', style: label(11, color: Zc.green, letter: .8)),
        ]),
      ),
    ]);
  }

  Future<void> _remind(BuildContext context, AppState app, VoidCallback set, bool on) async {
    if (on) {
      final ok = await app.reminders.requestPermission();
      if (!ok) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Notifications are off for Zaad. Turn them on in your phone\'s settings.')));
        }
        return;
      }
    }
    set();
    await app.settingsChanged();
  }

  void _placeSheet(BuildContext context, AppState app) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.my_location),
            title: const Text('Use my location'),
            onTap: () async {
              Navigator.pop(ctx);
              final (res, place) = await locateMe();
              if (place != null) {
                app.settings
                  ..placeName = place.name
                  ..lat = place.lat
                  ..lng = place.lng;
                await app.settingsChanged();
              } else if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not use your location (${res.name}). Choose a city instead.')));
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.location_city),
            title: const Text('Choose a city'),
            onTap: () async {
              Navigator.pop(ctx);
              final c = await pickCity(context);
              if (c != null) {
                app.settings
                  ..placeName = c.name
                  ..lat = c.lat
                  ..lng = c.lng;
                await app.settingsChanged();
              }
            },
          ),
        ]),
      ),
    );
  }

  void _methodSheet(BuildContext context, AppState app) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => SafeArea(
        child: ListView(shrinkWrap: true, children: [
          for (final e in methods.entries)
            ListTile(
              title: Text(e.value),
              trailing: app.settings.method == e.key ? const Icon(Icons.check, color: Zc.green) : null,
              onTap: () {
                app.settings.method = e.key;
                app.settingsChanged();
                Navigator.pop(ctx);
              },
            ),
        ]),
      ),
    );
  }

  Future<void> _restore(BuildContext context, AppState app) async {
    final c = TextEditingController();
    final text = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Restore'),
        content: TextField(controller: c, maxLines: 6, decoration: const InputDecoration(hintText: 'Paste your backup here')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, c.text), child: const Text('Restore')),
        ],
      ),
    );
    if (text == null || text.trim().isEmpty || !context.mounted) return;
    final ok = app.store.importJson(text);
    if (ok) await app.settingsChanged();
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ok ? 'Restored' : 'That is not a Zaad backup')));
  }
}

class _T extends StatelessWidget {
  const _T(this.t);
  final String t;
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 8), child: Eyebrow(t));
}
