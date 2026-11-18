import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zaad/app_state.dart';
import 'package:zaad/main.dart';
import 'support.dart';
import 'package:zaad/logic/prayer.dart';

void main() {
  setUpAll(loadFonts);

  Future<void> shoot(WidgetTester tester, AppState state, String name, {double height = 2400}) async {
    tester.view.devicePixelRatio = 2;
    tester.view.physicalSize = Size(390 * 2, height * 2);
    addTearDown(tester.view.resetPhysicalSize);
    await tester.pumpWidget(ZaadApp(state: state));
    await tester.pump(const Duration(milliseconds: 600));
    await expectLater(find.byType(ZaadApp), matchesGoldenFile('goldens/$name.png'));
  }

  testWidgets('today', (t) async => shoot(t, await makeState(), 'today'));
  testWidgets('names', (t) async {
    final s = await makeState()..tab = 1;
    await shoot(t, s, 'names', height: 1500);
  });
  testWidgets('journey', (t) async {
    final s = await makeState()..tab = 3;
    await shoot(t, s, 'journey', height: 1900);
  });
  testWidgets('settings', (t) async {
    final s = await makeState()..tab = 4;
    await shoot(t, s, 'settings', height: 1500);
  });
  testWidgets('onboarding', (t) async => shoot(t, await makeState(onboarded: false, withData: false), 'onboarding', height: 844));
  testWidgets('qibla', (t) async {
    final s = await makeState(heading: 40)..tab = 2;
    await shoot(t, s, 'qibla', height: 844);
  });
  testWidgets('qibla facing', (t) async {
    final s = await makeState(heading: qiblaFrom(const Place('Melbourne', -37.8136, 144.9631)))..tab = 2;
    await shoot(t, s, 'qibla_facing', height: 844);
  });
  testWidgets('today dark', (t) async {
    t.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    addTearDown(t.platformDispatcher.clearPlatformBrightnessTestValue);
    await shoot(t, await makeState(), 'today_dark', height: 1500);
  });
}
