import 'dart:math' as math;

import '../logic/prayer.dart';

/// Cities to choose from when the phone's location is not used. All offline.
const cities = <Place>[
  Place('Makkah', 21.4225, 39.8262), Place('Madinah', 24.4672, 39.6111), Place('Riyadh', 24.7136, 46.6753), Place('Jeddah', 21.4858, 39.1925),
  Place('Dubai', 25.2048, 55.2708), Place('Doha', 25.2854, 51.5310), Place('Kuwait City', 29.3759, 47.9774), Place('Amman', 31.9454, 35.9284),
  Place('Cairo', 30.0444, 31.2357), Place('Alexandria', 31.2001, 29.9187), Place('Istanbul', 41.0082, 28.9784), Place('Ankara', 39.9334, 32.8597),
  Place('Addis Ababa', 9.0300, 38.7400), Place('Dire Dawa', 9.5931, 41.8661), Place('Jimma', 7.6731, 36.8344), Place('Harar', 9.3126, 42.1180),
  Place('Adama (Nazret)', 8.5400, 39.2700), Place('Nairobi', -1.2921, 36.8219), Place('Mombasa', -4.0435, 39.6682), Place('Mogadishu', 2.0469, 45.3182),
  Place('Djibouti', 11.5721, 43.1456), Place('Khartoum', 15.5007, 32.5599), Place('Kampala', 0.3476, 32.5825), Place('Dar es Salaam', -6.7924, 39.2083),
  Place('Lagos', 6.5244, 3.3792), Place('Casablanca', 33.5731, -7.5898), Place('Algiers', 36.7538, 3.0588), Place('Tunis', 36.8065, 10.1815),
  Place('Johannesburg', -26.2041, 28.0473), Place('Cape Town', -33.9249, 18.4241), Place('London', 51.5074, -0.1278), Place('Birmingham', 52.4862, -1.8904),
  Place('Paris', 48.8566, 2.3522), Place('Berlin', 52.5200, 13.4050), Place('Amsterdam', 52.3676, 4.9041), Place('Stockholm', 59.3293, 18.0686),
  Place('Oslo', 59.9139, 10.7522), Place('Moscow', 55.7558, 37.6173), Place('New York', 40.7128, -74.0060), Place('Washington DC', 38.9072, -77.0369),
  Place('Minneapolis', 44.9778, -93.2650), Place('Columbus', 39.9612, -82.9988), Place('Chicago', 41.8781, -87.6298), Place('Houston', 29.7604, -95.3698),
  Place('Los Angeles', 34.0522, -118.2437), Place('Seattle', 47.6062, -122.3321), Place('Toronto', 43.6532, -79.3832), Place('Ottawa', 45.4215, -75.6972),
  Place('Calgary', 51.0447, -114.0719), Place('Vancouver', 49.2827, -123.1207), Place('Melbourne', -37.8136, 144.9631), Place('Sydney', -33.8688, 151.2093),
  Place('Brisbane', -27.4698, 153.0251), Place('Perth', -31.9505, 115.8605), Place('Adelaide', -34.9285, 138.6007), Place('Canberra', -35.2809, 149.1300),
  Place('Auckland', -36.8485, 174.7633), Place('Karachi', 24.8607, 67.0011), Place('Lahore', 31.5204, 74.3587), Place('Islamabad', 33.6844, 73.0479),
  Place('Delhi', 28.6139, 77.2090), Place('Dhaka', 23.8103, 90.4125), Place('Kuala Lumpur', 3.1390, 101.6869), Place('Singapore', 1.3521, 103.8198),
  Place('Jakarta', -6.2088, 106.8456), Place('Tehran', 35.6892, 51.3890), Place('Baghdad', 33.3152, 44.3661), Place('Beirut', 33.8938, 35.5018),
  Place('Kabul', 34.5553, 69.2075), Place('Tashkent', 41.2995, 69.2401), Place('Baku', 40.4093, 49.8671), Place('Sarajevo', 43.8563, 18.4131),
];

double distanceKm(Place a, Place b) {
  const r = 6371.0;
  double rad(double d) => d * math.pi / 180;
  final dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  final h = math.pow(math.sin(dLat / 2), 2) + math.cos(rad(a.lat)) * math.cos(rad(b.lat)) * math.pow(math.sin(dLng / 2), 2);
  return 2 * r * math.asin(math.sqrt(h));
}

/// A friendly name for coordinates: the nearest listed city if it is close, otherwise "My location".
String nameFor(double lat, double lng) {
  final here = Place('', lat, lng);
  Place? best;
  var bestKm = 1e9;
  for (final c in cities) {
    final km = distanceKm(here, c);
    if (km < bestKm) {
      bestKm = km;
      best = c;
    }
  }
  return best != null && bestKm < 60 ? best.name : 'My location';
}
