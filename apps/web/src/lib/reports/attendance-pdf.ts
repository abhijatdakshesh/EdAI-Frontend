/**
 * Per-student attendance report PDF (pdf-lib, no native deps).
 *
 * Layout mirrors the reference Report-Generator (RV header → branch + test
 * heading → date → addressed-to block → attendance table → remarks → note →
 * submission line → signature placeholder → footer).
 *
 * We don't ship the bitmap header/signature assets here (kept lightweight);
 * the PDF renders text equivalents that downstream consumers can replace
 * with embedded images later by adding the asset bytes to /public/reports/.
 */

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

import type { ParsedSheet, StudentRow } from "./parse-attendance-xlsx";

export interface ReportConfig {
  branch: string;
  test: string;
  semester: string;
  submissionDate: string; // pre-formatted "13th May, 2026"
  note: string;
}

const PAGE_WIDTH = 612; // US Letter
const PAGE_HEIGHT = 792;
const MARGIN_X = 50;

interface DrawCtx {
  page: PDFPage;
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  y: number;
}

function newPage(ctx: DrawCtx): void {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - 40;
}

function ensureSpace(ctx: DrawCtx, needed: number): void {
  if (ctx.y - needed < 40) newPage(ctx);
}

function drawText(
  ctx: DrawCtx,
  text: string,
  opts: {
    font?: PDFFont;
    size?: number;
    align?: "left" | "center";
    color?: ReturnType<typeof rgb>;
    underline?: boolean;
    indent?: number;
  } = {},
): void {
  const font = opts.font ?? ctx.font;
  const size = opts.size ?? 10;
  ensureSpace(ctx, size + 4);
  const width = font.widthOfTextAtSize(text, size);
  let x = MARGIN_X + (opts.indent ?? 0);
  if (opts.align === "center") {
    x = (PAGE_WIDTH - width) / 2;
  }
  ctx.page.drawText(text, {
    x,
    y: ctx.y,
    size,
    font,
    color: opts.color ?? rgb(0, 0, 0),
  });
  if (opts.underline) {
    ctx.page.drawLine({
      start: { x, y: ctx.y - 2 },
      end: { x: x + width, y: ctx.y - 2 },
      thickness: 0.6,
      color: opts.color ?? rgb(0, 0, 0),
    });
  }
  ctx.y -= size + 4;
}

function drawSpacer(ctx: DrawCtx, h = 8): void {
  ensureSpace(ctx, h);
  ctx.y -= h;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const tentative = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(tentative, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = tentative;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedText(
  ctx: DrawCtx,
  text: string,
  opts: { size?: number; indent?: number; font?: PDFFont } = {},
): void {
  const size = opts.size ?? 10;
  const indent = opts.indent ?? 0;
  const maxWidth = PAGE_WIDTH - MARGIN_X * 2 - indent;
  const font = opts.font ?? ctx.font;
  const lines = wrap(text, font, size, maxWidth);
  for (const line of lines) {
    drawText(ctx, line, { size, indent, font });
  }
}

function drawTable(
  ctx: DrawCtx,
  headers: string[],
  rows: string[][],
  colWidths: number[],
): void {
  const rowHeight = 22;
  const headerHeight = 28;
  const x0 = MARGIN_X;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  ensureSpace(ctx, headerHeight + rowHeight);

  // Header row
  let x = x0;
  ctx.page.drawRectangle({
    x: x0,
    y: ctx.y - headerHeight,
    width: totalWidth,
    height: headerHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(0.96, 0.94, 0.88),
  });
  for (let i = 0; i < headers.length; i++) {
    const w = colWidths[i]!;
    const text = headers[i] ?? "";
    const lines = wrap(text, ctx.bold, 8, w - 8);
    const startY = ctx.y - 12;
    for (let li = 0; li < lines.length; li++) {
      const tw = ctx.bold.widthOfTextAtSize(lines[li]!, 8);
      ctx.page.drawText(lines[li]!, {
        x: x + (w - tw) / 2,
        y: startY - li * 10,
        size: 8,
        font: ctx.bold,
      });
    }
    if (i < headers.length - 1) {
      const lineX = x + w;
      ctx.page.drawLine({
        start: { x: lineX, y: ctx.y - headerHeight },
        end: { x: lineX, y: ctx.y },
        thickness: 0.6,
      });
    }
    x += w;
  }
  ctx.y -= headerHeight;

  // Body rows
  for (const r of rows) {
    ensureSpace(ctx, rowHeight);
    ctx.page.drawRectangle({
      x: x0,
      y: ctx.y - rowHeight,
      width: totalWidth,
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.6,
    });
    let cx = x0;
    for (let i = 0; i < r.length; i++) {
      const w = colWidths[i]!;
      const cell = r[i] ?? "";
      const align = i === 1 ? "left" : "center";
      const lines = wrap(cell, ctx.font, 9, w - 8);
      const startY = ctx.y - 12;
      for (let li = 0; li < lines.length; li++) {
        const tw = ctx.font.widthOfTextAtSize(lines[li]!, 9);
        const tx = align === "left" ? cx + 4 : cx + (w - tw) / 2;
        ctx.page.drawText(lines[li]!, {
          x: tx,
          y: startY - li * 10,
          size: 9,
          font: ctx.font,
        });
      }
      if (i < r.length - 1) {
        ctx.page.drawLine({
          start: { x: cx + w, y: ctx.y - rowHeight },
          end: { x: cx + w, y: ctx.y },
          thickness: 0.3,
        });
      }
      cx += w;
    }
    ctx.y -= rowHeight;
  }
}

function todayFormatted(): string {
  const d = new Date();
  const day = d.getDate();
  const suffix =
    day >= 11 && day <= 13
      ? "th"
      : day % 10 === 1
      ? "st"
      : day % 10 === 2
      ? "nd"
      : day % 10 === 3
      ? "rd"
      : "th";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day}${suffix} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

export async function generateAttendancePdf(
  student: StudentRow,
  sheet: ParsedSheet,
  config: ReportConfig,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const ctx: DrawCtx = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    font,
    bold,
    y: PAGE_HEIGHT - 40,
  };

  // Institution header (text placeholder for the RV bitmap).
  drawText(ctx, "RV INSTITUTE OF TECHNOLOGY AND MANAGEMENT", {
    font: bold,
    size: 14,
    align: "center",
  });
  drawText(ctx, "Bengaluru — Affiliated to VTU, Belagavi", {
    size: 9,
    align: "center",
  });
  drawSpacer(ctx, 6);
  drawText(ctx, config.branch.toUpperCase(), {
    font: bold,
    size: 12,
    align: "center",
    underline: true,
  });
  drawText(ctx, config.test.toUpperCase(), {
    font: bold,
    size: 12,
    align: "center",
    underline: true,
  });
  drawSpacer(ctx, 6);

  // Date
  drawText(ctx, todayFormatted(), { size: 10 });
  drawSpacer(ctx, 4);

  // Salutation
  drawText(ctx, "To,", { size: 10 });
  drawText(ctx, `      Mr/Mrs  ${student.fatherName},`, {
    font: bold,
    size: 10,
  });
  drawSpacer(ctx, 2);

  // Intro paragraph
  drawWrappedText(
    ctx,
    `            The Attendance report of your ward ${student.studentName}, ${student.usn} studying in ${config.semester.trim()} is given below:`,
    { size: 10 },
  );
  drawSpacer(ctx, 6);

  // Table
  const headers = [
    "Sl. No",
    "Subject Name",
    "Classes Held",
    "Classes Attended",
    "Attendance %",
    sheet.testMarksHeader,
    sheet.assignmentHeader,
  ];
  const colWidths = [36, 170, 56, 64, 60, 60, 66];
  const tableRows = student.subjects.map((s, i) => [
    String(i + 1),
    s.subject,
    s.classesHeld === "-" ? "-" : String(s.classesHeld),
    s.classesAttended === "-" ? "-" : String(s.classesAttended),
    s.attendancePct === "-" ? "-" : `${s.attendancePct}%`,
    s.testMarks,
    s.assignment,
  ]);
  drawTable(ctx, headers, tableRows, colWidths);
  drawSpacer(ctx, 8);

  // Remarks
  ensureSpace(ctx, 24);
  ctx.page.drawText("Remarks: ", {
    x: MARGIN_X,
    y: ctx.y,
    size: 10,
    font: bold,
  });
  const remarksWidth = bold.widthOfTextAtSize("Remarks: ", 10);
  ctx.page.drawText(student.remarks || "—", {
    x: MARGIN_X + remarksWidth,
    y: ctx.y,
    size: 10,
    font,
  });
  ctx.y -= 14;
  drawSpacer(ctx, 4);

  // Note
  ensureSpace(ctx, 16);
  ctx.page.drawText("Note: ", {
    x: MARGIN_X,
    y: ctx.y,
    size: 10,
    font: bold,
  });
  const noteWidth = bold.widthOfTextAtSize("Note: ", 10);
  const noteText = config.note || "—";
  const noteLines = wrap(
    noteText,
    font,
    10,
    PAGE_WIDTH - MARGIN_X * 2 - noteWidth,
  );
  for (let i = 0; i < noteLines.length; i++) {
    ctx.page.drawText(noteLines[i]!, {
      x: i === 0 ? MARGIN_X + noteWidth : MARGIN_X,
      y: ctx.y - i * 12,
      size: 10,
      font,
    });
  }
  ctx.y -= 12 * Math.max(1, noteLines.length);
  drawSpacer(ctx, 6);

  // Submission line
  drawWrappedText(
    ctx,
    `Please sign and send the report to "${student.counsellorEmail || "your assigned counsellor"}" on or before ${config.submissionDate}.`,
    { size: 10 },
  );
  drawSpacer(ctx, 20);

  // Signature placeholder (text — institutions can swap in a bitmap later)
  drawText(ctx, "_____________________________", { size: 10 });
  drawText(ctx, "Head of Department", { font: bold, size: 10 });
  drawSpacer(ctx, 16);
  drawText(ctx, "This report was auto-generated through ed8ai", {
    size: 9,
    align: "center",
  });

  return doc.save();
}
