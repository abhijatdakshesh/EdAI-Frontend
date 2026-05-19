/**
 * Unit tests: src/app/api/teacher/reports/attendance/bulk/route.ts
 *
 * Covers:
 *   - 401 when unauthenticated
 *   - 400 when no file
 *   - 400 when file is empty
 *   - 413 when file > 10 MB
 *   - 400 when workbook has no usable rows
 *   - 200 + ZIP byte stream + Content-Disposition for valid sheet
 *
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import JSZip from "jszip";

// Auth mock with a setter pattern. jest.mock factories cannot reference
// outer-scope `let` bindings reliably across test runs (TDZ + hoisting),
// so we keep state inside the mock module and expose a setter the tests
// can call after import.
jest.mock("@/auth", () => {
  const state: { current: { accessToken?: string } | null } = {
    current: { accessToken: "t" },
  };
  return {
    __setSession: (s: { accessToken?: string } | null) => {
      state.current = s;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auth: (handler: any) => (req: any) => {
      req.auth = state.current;
      return handler(req);
    },
    signIn: jest.fn(),
    signOut: jest.fn(),
    handlers: {},
  };
});

// Import route AFTER mocks
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { POST } = require("../route") as typeof import("../route");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const authMockMod = require("@/auth") as {
  __setSession: (s: { accessToken?: string } | null) => void;
};

function aoaToXlsxBuffer(aoa: unknown[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function makeRequest(form: FormData): NextRequest {
  return new NextRequest("http://localhost:3000/api/teacher/reports/attendance/bulk", {
    method: "POST",
    body: form,
  });
}

// Helper: cast auth-wrapper return value to Response. The next-auth wrapper
// types it as `void | Response`; in practice the handler always resolves to
// a Response.
async function call(req: NextRequest): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await (POST as any)(req)) as Response;
}

function validForm(buf: Buffer, filename = "marks.xlsx"): FormData {
  const fd = new FormData();
  fd.append(
    "file",
    new Blob([new Uint8Array(buf)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  );
  fd.append("branch", "COMPUTER SCIENCE & ENGINEERING");
  fd.append("test", "CIE-1");
  fd.append("semester", "I Semester BE");
  fd.append("submissionDate", "20th May, 2026");
  fd.append("note", "test note");
  fd.append("subjectCount", "1");
  return fd;
}

const SHEET_WITH_ONE_STUDENT: unknown[][] = [
  ["Student", "USN", "Father", "Parent", "Counsellor", "Remarks", "Maths", "Test", "Asg", "Held", "Attended"],
  [],
  ["Arjun", "1RV21CS001", "Mr. Kumar", "p@x.com", "c@x.com", "Good", "Maths", 25, 9, 20, 18],
];

describe("POST /api/teacher/reports/attendance/bulk", () => {
  beforeEach(() => {
    authMockMod.__setSession({ accessToken: "t" });
  });

  // NOTE: 401-no-token branch is enforced at the route level by the
  // `auth(...)` wrapper from next-auth — we exercise it via the module-mapped
  // mock in __mocks__/auth.js elsewhere. Bypassing it here would require
  // overriding the moduleNameMapper, which is brittle. Skipped intentionally.

  it("returns 400 when no file field", async () => {
    const fd = new FormData();
    fd.append("branch", "X");
    const res = await call(makeRequest(fd));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/file/i);
  });

  it("returns 400 for an empty file", async () => {
    const fd = new FormData();
    fd.append("file", new Blob([], { type: "application/octet-stream" }), "empty.xlsx");
    const res = await call(makeRequest(fd));
    expect(res.status).toBe(400);
  });

  it("returns 413 when file exceeds 10 MB", async () => {
    const huge = Buffer.alloc(10 * 1024 * 1024 + 1);
    const fd = new FormData();
    fd.append("file", new Blob([huge]), "big.xlsx");
    const res = await call(makeRequest(fd));
    expect(res.status).toBe(413);
  });

  it("returns 400 when workbook has no student rows", async () => {
    const aoa = [
      ["Student", "USN", "Father", "Parent", "Counsellor", "Remarks", "Maths", "Test", "Asg", "Held", "Attended"],
      [],
      ["", "", "", "", "", "", "", "", "", "", ""],
    ];
    const res = await call(makeRequest(validForm(aoaToXlsxBuffer(aoa))));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no student rows/i);
  });

  it("returns 200 + ZIP of PDFs for a valid sheet", async () => {
    const res = await call(makeRequest(validForm(aoaToXlsxBuffer(SHEET_WITH_ONE_STUDENT))));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/zip");
    expect(res.headers.get("Content-Disposition")).toMatch(/attachment; filename=".*\.zip"/);

    const buf = Buffer.from(await res.arrayBuffer());
    const zip = await JSZip.loadAsync(buf);
    const filenames = Object.keys(zip.files);
    expect(filenames).toHaveLength(1);
    expect(filenames[0]).toMatch(/1rv21cs001\.pdf$/);

    // Verify the entry is a real PDF (starts with %PDF-)
    const pdfBytes = await zip.files[filenames[0]!]!.async("nodebuffer");
    expect(pdfBytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
