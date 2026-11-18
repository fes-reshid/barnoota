import 'package:adhan_dart/adhan_dart.dart';

import 'plan.dart';

/// Calculation methods the user can choose between.
const methods = <String, String>{
  'muslimWorldLeague': 'Muslim World League',
  'northAmerica': 'North America (ISNA)',
  'egyptian': 'Egyptian General Authority',
  'karachi': 'University of Islamic Sciences, Karachi',
  'ummAlQura': 'Umm al-Qura, Makkah',
  'dubai': 'Dubai',
  'qatar': 'Qatar',
  'kuwait': 'Kuwait',
  'singapore': 'Singapore, Malaysia, Indonesia',
  'turkiye': 'Türkiye (Diyanet)',
  'moonsightingCommittee': 'Moonsighting Committee',
};

CalculationParameters paramsFor(String method, bool hanafi) {
  final p = switch (method) {
    'northAmerica' => CalculationMethodParameters.northAmerica(),
    'egyptian' => CalculationMethodParameters.egyptian(),
    'karachi' => CalculationMethodParameters.karachi(),
    'ummAlQura' => CalculationMethodParameters.ummAlQura(),
    'dubai' => CalculationMethodParameters.dubai(),
    'qatar' => CalculationMethodParameters.qatar(),
    'kuwait' => CalculationMethodParameters.kuwait(),
    'singapore' => CalculationMethodParameters.singapore(),
    'turkiye' => CalculationMethodParameters.turkiye(),
    'moonsightingCommittee' => CalculationMethodParameters.moonsightingCommittee(),
    _ => CalculationMethodParameters.muslimWorldLeague(),
  };
  p.madhab = hanafi ? Madhab.hanafi : Madhab.shafi;
  return p;
}

/// A place the prayer times are worked out for.
class Place {
  const Place(this.name, this.lat, this.lng);
  final String name;
  final double lat, lng;
}

/// All times in the phone's local time zone.
class DayTimes {
  DayTimes({
    required this.date,
    required this.lastThird,
    required this.fajr,
    required this.sunrise,
    required this.duhaStart,
    required this.dhuhr,
    required this.asr,
    required this.maghrib,
    required this.isha,
  });

  final DateTime date, lastThird, fajr, sunrise, duhaStart, dhuhr, asr, maghrib, isha;

  DateTime startOf(String windowId) => switch (windowId) {
        'night' => lastThird,
        'fajr' => fajr,
        'duha' => duhaStart,
        'dhuhr' => dhuhr,
        'asr' => asr,
        'maghrib' => maghrib,
        _ => isha,
      };

  DateTime endOf(String windowId) => switch (windowId) {
        'night' => fajr,
        'fajr' => duhaStart,
        'duha' => dhuhr,
        'dhuhr' => asr,
        'asr' => maghrib,
        'maghrib' => isha,
        _ => addDays(date, 1),
      };

  DateTime timeOfPrayer(String id) => switch (id) {
        'fajr' => fajr,
        'dhuhr' => dhuhr,
        'asr' => asr,
        'maghrib' => maghrib,
        _ => isha,
      };

  /// The window that contains [now], if the date is today.
  String windowAt(DateTime now) {
    var current = 'night';
    for (final id in const ['night', 'fajr', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      if (!now.isBefore(startOf(id))) current = id;
    }
    return current;
  }
}

DayTimes timesFor(DateTime date, Place place, String method, bool hanafi) {
  final params = paramsFor(method, hanafi);
  final coords = Coordinates(place.lat, place.lng);
  final day = dayOnly(date);
  PrayerTimes at(DateTime d) => PrayerTimes(coordinates: coords, date: d, calculationParameters: params);
  final today = at(day);
  final yesterday = at(addDays(day, -1));
  final sunrise = today.sunrise.toLocal();
  return DayTimes(
    date: day,
    lastThird: SunnahTimes(yesterday).lastThirdOfTheNight.toLocal(),
    fajr: today.fajr.toLocal(),
    sunrise: sunrise,
    duhaStart: sunrise.add(const Duration(minutes: 20)),
    dhuhr: today.dhuhr.toLocal(),
    asr: today.asr.toLocal(),
    maghrib: today.maghrib.toLocal(),
    isha: today.isha.toLocal(),
  );
}

/// The next of the five prayers after [now], looking into tomorrow if today's are over.
({String id, String name, DateTime time}) nextPrayer(DateTime now, Place place, String method, bool hanafi) {
  for (var add = 0; add < 3; add++) {
    final t = timesFor(addDays(dayOnly(now), add), place, method, hanafi);
    for (final p in prayers) {
      final time = t.timeOfPrayer(p.id);
      if (time.isAfter(now)) return (id: p.id, name: p.name, time: time);
    }
  }
  final t = timesFor(addDays(dayOnly(now), 1), place, method, hanafi);
  return (id: 'fajr', name: 'Fajr', time: t.fajr);
}

/// Direction of the Qibla in degrees from north.
double qiblaFrom(Place place) => Qibla.qibla(Coordinates(place.lat, place.lng));
