import "package:flutter/material.dart";
import "package:flutter/services.dart";

import "raycraft_colors.dart";
import "raycraft_text_styles.dart";

ThemeData raycraftTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: RaycraftColors.background,
    colorScheme: const ColorScheme.light(
      primary: RaycraftColors.primary,
      onPrimary: RaycraftColors.textInverse,
      secondary: RaycraftColors.surface,
      onSecondary: RaycraftColors.textPrimary,
      error: RaycraftColors.danger,
      onError: RaycraftColors.textInverse,
      surface: RaycraftColors.surface,
      onSurface: RaycraftColors.textPrimary,
      outline: RaycraftColors.border,
      outlineVariant: RaycraftColors.borderStrong,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: RaycraftColors.background,
      foregroundColor: RaycraftColors.textPrimary,
      elevation: 0,
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    ),
    textTheme: TextTheme(
      headlineLarge: RaycraftTextStyles.displayLg,
      bodyLarge: RaycraftTextStyles.body,
      bodyMedium: RaycraftTextStyles.bodySm,
      labelSmall: RaycraftTextStyles.label,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: RaycraftColors.primary,
        foregroundColor: RaycraftColors.textInverse,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
        textStyle: RaycraftTextStyles.button,
      ),
    ),
    cardTheme: CardTheme(
      color: RaycraftColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(6),
        side: const BorderSide(color: RaycraftColors.border),
      ),
    ),
  );
}
