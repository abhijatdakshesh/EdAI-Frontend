import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";

import "raycraft_colors.dart";

abstract class RaycraftTextStyles {
  // ── Display (Cormorant Garamond) ──────────────────────────────────────────
  static TextStyle displayLg = GoogleFonts.cormorantGaramond(
    fontSize: 36,
    fontWeight: FontWeight.w400,
    fontStyle: FontStyle.italic,
    color: RaycraftColors.textPrimary,
    height: 1.15,
  );

  static TextStyle displaySm = GoogleFonts.cormorantGaramond(
    fontSize: 24,
    fontWeight: FontWeight.w500,
    color: RaycraftColors.textPrimary,
    height: 1.2,
  );

  // ── UI text (Inter) ───────────────────────────────────────────────────────
  static const TextStyle uiLg = TextStyle(
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: FontWeight.w500,
    color: RaycraftColors.textPrimary,
    height: 1.3,
  );

  static const TextStyle uiMd = TextStyle(
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: FontWeight.w500,
    color: RaycraftColors.textPrimary,
    height: 1.4,
  );

  static const TextStyle uiSm = TextStyle(
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: RaycraftColors.textPrimary,
    height: 1.4,
  );

  // ── Body (Inter) ──────────────────────────────────────────────────────────
  static const TextStyle body = TextStyle(
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: RaycraftColors.textPrimary,
    height: 1.625,
  );

  static const TextStyle bodySm = TextStyle(
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: RaycraftColors.textSecondary,
    height: 1.5,
  );

  // ── Label / Caption ───────────────────────────────────────────────────────
  static const TextStyle label = TextStyle(
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: FontWeight.w300,
    color: RaycraftColors.textMuted,
    letterSpacing: 2.5,
    height: 1.4,
  );

  static const TextStyle labelTrack = TextStyle(
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: FontWeight.w600,
    color: RaycraftColors.textMuted,
    letterSpacing: 3.0,
    height: 1.4,
  );

  static const TextStyle caption = TextStyle(
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: FontWeight.w400,
    color: RaycraftColors.textSecondary,
    height: 1.4,
  );

  // ── Monospace ─────────────────────────────────────────────────────────────
  static const TextStyle mono = TextStyle(
    fontFamily: "JetBrains Mono",
    fontSize: 11,
    fontWeight: FontWeight.w400,
    color: RaycraftColors.textMuted,
    height: 1.4,
  );

  // ── Button ────────────────────────────────────────────────────────────────
  static const TextStyle button = TextStyle(
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: RaycraftColors.textInverse,
    height: 1.4,
    letterSpacing: 0.5,
  );
}
