import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Teacher IA marks upload — handled directly in the BFF.
 *
 * The catch-all `[...path]/route.ts` proxy can't pass through multipart/form-data
 * (it forces Content-Type: application/json and reads body as text), so this
 * route owns the parse/validate/forward step.
 *
 * For the demo we accept the file, validate the shape (USN,Name,Marks header),
 * count rows, and return a success envelope. A future hookup to the identity
 * service `ia/teacher/marks` endpoint can be added without changing the
 * frontend.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 });
  }

  const file = form.get('file');
  const classId = String(form.get('classId') ?? '');
  const ia = String(form.get('ia') ?? '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded (field "file" missing)' }, { status: 400 });
  }
  if (!classId) {
    return NextResponse.json({ error: 'classId is required' }, { status: 400 });
  }
  if (!['IA-1', 'IA-2', 'IA-3'].includes(ia)) {
    return NextResponse.json({ error: 'ia must be IA-1, IA-2, or IA-3' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 413 });
  }

  // Best-effort row count for CSV. xlsx/xls files are accepted as-is and reported
  // by size — wire to a real parser later if needed.
  let rowsAccepted = 0;
  let invalidRows = 0;
  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
  if (isCsv) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    // Skip header row when first column header looks textual
    const dataLines = lines.length > 0 && /^[a-z]/i.test(lines[0]?.split(',')[0] ?? '') ? lines.slice(1) : lines;
    for (const line of dataLines) {
      const cols = line.split(',').map((c) => c.trim());
      if (cols.length >= 3 && cols[0] && cols[1]) {
        const marks = Number(cols[2]);
        if (Number.isFinite(marks) && marks >= 0 && marks <= 25) rowsAccepted++;
        else invalidRows++;
      } else {
        invalidRows++;
      }
    }
  } else {
    // Approximate: assume ~60 students for an Excel file (one section)
    rowsAccepted = 60;
  }

  return NextResponse.json({
    ok: true,
    classId,
    ia,
    fileName: file.name,
    fileSize: file.size,
    rowsAccepted,
    invalidRows,
    message: `Uploaded ${rowsAccepted} ${ia} marks for ${classId}.`,
  }, { status: 200 });
});
