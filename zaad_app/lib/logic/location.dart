import 'package:geolocator/geolocator.dart';

import '../data/cities.dart';
import 'prayer.dart';

enum LocationResult { ok, serviceOff, denied, deniedForever, failed }

/// Asks the phone where it is. Nothing is sent anywhere: the position is only used to work out prayer times on the phone.
Future<(LocationResult, Place?)> locateMe() async {
  try {
    if (!await Geolocator.isLocationServiceEnabled()) return (LocationResult.serviceOff, null);
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
    if (perm == LocationPermission.denied) return (LocationResult.denied, null);
    if (perm == LocationPermission.deniedForever) return (LocationResult.deniedForever, null);
    final pos = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.low, timeLimit: Duration(seconds: 25)),
    );
    return (LocationResult.ok, Place(nameFor(pos.latitude, pos.longitude), pos.latitude, pos.longitude));
  } catch (_) {
    return (LocationResult.failed, null);
  }
}
