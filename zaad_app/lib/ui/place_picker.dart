import 'package:material_ui/material_ui.dart';

import '../core/theme.dart';
import '../data/cities.dart';
import '../logic/prayer.dart';

/// A searchable list of cities. Prayer times are worked out on the phone from the place chosen.
Future<Place?> pickCity(BuildContext context) => Navigator.of(context).push<Place>(MaterialPageRoute(builder: (_) => const _CityPage()));

class _CityPage extends StatefulWidget {
  const _CityPage();
  @override
  State<_CityPage> createState() => _CityPageState();
}

class _CityPageState extends State<_CityPage> {
  String q = '';

  @override
  Widget build(BuildContext context) {
    final list = [for (final c in cities) if (c.name.toLowerCase().contains(q.toLowerCase())) c]..sort((a, b) => a.name.compareTo(b.name));
    return Scaffold(
      appBar: AppBar(title: Text('Choose a city', style: display(18))),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: TextField(
            autofocus: false,
            onChanged: (v) => setState(() => q = v),
            decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: 'Search', border: OutlineInputBorder(borderRadius: BorderRadius.circular(14))),
          ),
        ),
        Expanded(
          child: ListView(children: [
            for (final c in list)
              ListTile(
                leading: const Icon(Icons.location_city, color: Zc.green),
                title: Text(c.name, style: serif(16.5)),
                subtitle: Text('${c.lat.toStringAsFixed(2)}, ${c.lng.toStringAsFixed(2)}', style: label(10.5, color: Zc.muted, letter: .6)),
                onTap: () => Navigator.of(context).pop(c),
              ),
            if (list.isEmpty) Padding(padding: const EdgeInsets.all(24), child: Text('No city matches. Use "Use my location" instead.', style: serif(15, color: Zc.muted))),
          ]),
        ),
      ]),
    );
  }
}
