import 'package:material_ui/material_ui.dart';

/// Colours of the Zaad planner: deep green, gold, warm paper.
class Zc {
  static const green = Color(0xFF0F5A4F);
  static const deep = Color(0xFF0B3B35);
  static const ink = Color(0xFF25221C);
  static const gold = Color(0xFFB8913F);
  static const gold2 = Color(0xFFE7C873);
  static const paper = Color(0xFFFDFBF5);
  static const soft = Color(0xFFE3F0EC);
  static const muted = Color(0xFF75694F);
  static const line = Color(0xFFCFC6B2);

  /// One colour for each window of the day.
  static const fajr = Color(0xFF3B4A8C);
  static const duha = Color(0xFFB8913F);
  static const dhuhr = Color(0xFF0F5A4F);
  static const asr = Color(0xFF8A5A1D);
  static const maghrib = Color(0xFF7A2E3A);
  static const isha = Color(0xFF5B3A8C);
  static const night = Color(0xFF1D2A4A);
}

const String arabicFont = 'Scheherazade';

/// A colour made lighter on the dark theme so it can still be read there.
Color tone(BuildContext context, Color base) =>
    Theme.of(context).brightness == Brightness.dark ? Color.lerp(base, Colors.white, .5)! : base;

TextStyle ar(double size, {Color? color, FontWeight? weight, double height = 1.9}) =>
    TextStyle(fontFamily: arabicFont, fontSize: size, color: color, fontWeight: weight, height: height);

/// The Latin fonts have no ﷺ, so it falls back to the Arabic font.
const _fallback = [arabicFont];

TextStyle serif(double size, {Color? color, FontStyle? style, double height = 1.45, double wght = 400}) => TextStyle(
    fontFamily: 'Lora', fontFamilyFallback: _fallback, fontSize: size, color: color, fontStyle: style, height: height, fontVariations: [FontVariation('wght', wght)]);

TextStyle display(double size, {Color? color, double letter = 1.2, double wght = 700}) => TextStyle(
    fontFamily: 'Cinzel', fontFamilyFallback: _fallback, fontSize: size, color: color, letterSpacing: letter, fontVariations: [FontVariation('wght', wght)]);

TextStyle label(double size, {Color? color, double letter = 1.4, double wght = 600}) => TextStyle(
    fontFamily: 'Inter', fontFamilyFallback: _fallback, fontSize: size, color: color, letterSpacing: letter, fontVariations: [FontVariation('wght', wght)]);

ThemeData zaadTheme(Brightness b) {
  final dark = b == Brightness.dark;
  final scheme = ColorScheme.fromSeed(
    seedColor: Zc.green,
    brightness: b,
    primary: dark ? const Color(0xFF6FC2AE) : Zc.green,
    secondary: Zc.gold,
    surface: dark ? const Color(0xFF0D1A18) : Zc.paper,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: dark ? const Color(0xFF0D1A18) : Zc.paper,
    fontFamily: 'Lora',
    cardTheme: CardThemeData(
      elevation: 0,
      color: dark ? const Color(0xFF14302B) : Colors.white,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: dark ? const Color(0xFF244A43) : Zc.line.withValues(alpha: .7)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: dark ? const Color(0xFF0B1513) : Colors.white,
      indicatorColor: dark ? const Color(0xFF1F4A42) : Zc.soft,
      labelTextStyle: WidgetStatePropertyAll(label(10.5, letter: .6)),
    ),
  );
}
