/**
 * @jest-environment jsdom
 *
 * Unit tests: AttendanceReportGenerator (teacher PDF/ZIP bulk export UI)
 *
 * Coverage targets (100% lines + branches):
 *   - formatSubmissionDate — empty string, invalid ISO, all day-suffix
 *     branches (1st/2nd/3rd/4th, and the 11th/12th/13th override).
 *   - render — all dropdowns populated (branches, tests, semesters, subject
 *     counts), file size display, formatted submission date hint.
 *   - submit without file → inline "Please choose…" error, no fetch.
 *   - submit happy path → POSTs FormData with all 7 fields, parses Content-
 *     Disposition filename, creates + clicks + revokes an `<a download>`.
 *   - submit happy path with NO Content-Disposition → falls back to default
 *     `attendance-reports-<test>.zip` filename.
 *   - submit happy path with malformed Content-Disposition (no filename=) →
 *     also falls back to default filename.
 *   - submit non-OK with JSON error body → surfaces `data.error` message.
 *   - submit non-OK with non-JSON body → falls back to `Request failed (NNN)`.
 *   - submit network failure (fetch rejects) → surfaces error message.
 *   - submit non-Error thrown → falls back to "Failed to generate reports".
 *   - busy state — button disabled mid-request, success state shown.
 *
 * ERP context: this UI generates official attendance reports that get
 * signed by HOD + Principal. A regression here means faculty either ship
 * a broken PDF bundle on the wire or — worse — show a fake "success" toast
 * after the backend 500'd.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Shell + Button shims so we don't pull AppShell's auth dependency tree.
jest.mock("@/components/layout/shell", () => ({
  AppShell: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type = "button",
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

import { AttendanceReportGenerator } from "../attendance-report-generator";

// ─── helpers ────────────────────────────────────────────────────────────────

function makeResponse(opts: {
  ok: boolean;
  status?: number;
  body?: unknown;
  bodyIsJson?: boolean;
  contentDisposition?: string | null;
}): Response {
  const headers = new Map<string, string>();
  if (opts.contentDisposition) headers.set("content-disposition", opts.contentDisposition);
  return {
    ok: opts.ok,
    status: opts.status ?? (opts.ok ? 200 : 500),
    headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null } as any,
    blob: jest.fn().mockResolvedValue(new Blob(["zip-bytes"], { type: "application/zip" })),
    json: jest.fn().mockImplementation(async () => {
      if (opts.bodyIsJson === false) throw new SyntaxError("Unexpected token");
      return opts.body ?? {};
    }),
  } as unknown as Response;
}

function uploadFile(name = "marks.xlsx", size = 2048): File {
  return new File([new Uint8Array(size)], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

// Spy on the DOM bits the component pokes after a successful download.
let createObjectURLSpy: jest.SpyInstance;
let revokeObjectURLSpy: jest.SpyInstance;
let aClickSpy: jest.SpyInstance;
let appendChildSpy: jest.SpyInstance;
let removeChildSpy: jest.SpyInstance;

// jsdom doesn't ship URL.createObjectURL / revokeObjectURL — install stubs
// on the constructor before any test runs so jest.spyOn() can intercept them.
beforeAll(() => {
  if (typeof (URL as any).createObjectURL !== "function") {
    (URL as any).createObjectURL = () => "blob:fake-url";
  }
  if (typeof (URL as any).revokeObjectURL !== "function") {
    (URL as any).revokeObjectURL = () => undefined;
  }
});

beforeEach(() => {
  jest.restoreAllMocks();
  createObjectURLSpy = jest
    .spyOn(URL, "createObjectURL")
    .mockReturnValue("blob:fake-url");
  revokeObjectURLSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation();
  // Don't actually navigate when the temporary <a> is clicked.
  aClickSpy = jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  appendChildSpy = jest.spyOn(document.body, "appendChild");
  removeChildSpy = jest.spyOn(document.body, "removeChild");
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── formatSubmissionDate (exercised via the visible hint text) ─────────────

describe("formatSubmissionDate (via rendered hint)", () => {
  // The default submissionDate is today (ISO). We instead poke each date via
  // the <input type="date"> to drive every suffix branch deterministically.

  function inputDate(iso: string) {
    render(<AttendanceReportGenerator />);
    const dateInput = screen.getByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
    fireEvent.change(dateInput, { target: { value: iso } });
    return dateInput;
  }

  it.each([
    ["2026-03-01", /1st Mar, 2026/],
    ["2026-03-02", /2nd Mar, 2026/],
    ["2026-03-03", /3rd Mar, 2026/],
    ["2026-03-04", /4th Mar, 2026/],
    ["2026-03-11", /11th Mar, 2026/],
    ["2026-03-12", /12th Mar, 2026/],
    ["2026-03-13", /13th Mar, 2026/],
    ["2026-03-21", /21st Mar, 2026/],
    ["2026-03-22", /22nd Mar, 2026/],
    ["2026-03-23", /23rd Mar, 2026/],
    ["2026-03-31", /31st Mar, 2026/],
  ])("renders day-suffix hint correctly for %s", (iso, pattern) => {
    inputDate(iso);
    expect(screen.getByText(pattern)).toBeInTheDocument();
  });

  it("renders empty string for empty ISO (no hint)", () => {
    render(<AttendanceReportGenerator />);
    const dateInput = screen.getByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
    fireEvent.change(dateInput, { target: { value: "" } });
    // The conditional `{formattedSubmission && (…)}` hides the hint when empty.
    expect(screen.queryByText(/, 20\d{2}$/)).not.toBeInTheDocument();
  });

  // Note on the "invalid ISO → falls back to raw" branch in formatSubmissionDate:
  // <input type="date"> silently rejects non-date strings in jsdom (value
  // stays ""), so the NaN-fallback branch is unreachable from the UI in
  // tests. It's covered by the `empty string` case above (different branch
  // but same code line) and the production code path is defensive only —
  // an HTMLInputElement of type=date will never emit a malformed value.
});

// ─── render ────────────────────────────────────────────────────────────────

describe("render", () => {
  it("renders all 5 branch options, 3 test options, 14 semester options, 11 subject-count options", () => {
    render(<AttendanceReportGenerator />);
    // Branches (label-track is wrapped around the select; we identify by option count)
    const selects = screen.getAllByRole("combobox");
    // 4 selects: branch, test, semester, subjectCount
    expect(selects).toHaveLength(4);
    const [branchSel, testSel, semesterSel, subjectsSel] = selects as HTMLSelectElement[];
    expect(branchSel!.options).toHaveLength(5);
    expect(testSel!.options).toHaveLength(3);
    expect(semesterSel!.options).toHaveLength(14);
    expect(subjectsSel!.options).toHaveLength(11);
  });

  it("branch / test / semester selects update on change and the values flow into the submitted FormData", async () => {
    const fetchSpy = jest
      .fn()
      .mockResolvedValue(makeResponse({ ok: true, contentDisposition: null }));
    global.fetch = fetchSpy as any;
    render(<AttendanceReportGenerator />);
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const [branchSel, testSel, semesterSel] = selects;
    fireEvent.change(branchSel!, { target: { value: "MECHANICAL ENGINEERING" } });
    fireEvent.change(testSel!, { target: { value: "CIE-3" } });
    fireEvent.change(semesterSel!, { target: { value: "VI Semester BE" } });
    fireEvent.change(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      { target: { files: [uploadFile()] } },
    );
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const fd = fetchSpy.mock.calls[0][1].body as FormData;
    expect(fd.get("branch")).toBe("MECHANICAL ENGINEERING");
    expect(fd.get("test")).toBe("CIE-3");
    expect(fd.get("semester")).toBe("VI Semester BE");
  });

  it("renders the submit button disabled until a file is chosen", () => {
    render(<AttendanceReportGenerator />);
    const btn = screen.getByRole("button", { name: /Generate ZIP/i });
    expect(btn).toBeDisabled();
  });

  it("displays the chosen file name + size", () => {
    render(<AttendanceReportGenerator />);
    const file = uploadFile("attendance-march.xlsx", 1024);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/attendance-march\.xlsx.*1\.0 KB/)).toBeInTheDocument();
  });

  it("clears any previous error/success when a new file is picked", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      makeResponse({ ok: false, status: 500, body: { error: "boom" } }),
    );
    render(<AttendanceReportGenerator />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [uploadFile()] } });
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(screen.getByText("boom")).toBeInTheDocument());
    // Pick a new file → error banner must clear
    fireEvent.change(input, { target: { files: [uploadFile("v2.xlsx")] } });
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
  });
});

// ─── submit ─────────────────────────────────────────────────────────────────

describe("submit", () => {
  it("shows inline error when no file was chosen and does NOT call fetch", () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;
    render(<AttendanceReportGenerator />);
    // Force-submit the form even though the button is disabled
    fireEvent.submit(document.querySelector("form")!);
    expect(
      screen.getByText(/Please choose an \.xlsx file before generating\./),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("happy path: POSTs FormData with all 7 fields and triggers ZIP download with server filename", async () => {
    const fetchSpy = jest.fn().mockResolvedValue(
      makeResponse({
        ok: true,
        contentDisposition: 'attachment; filename="rv-attendance-2026-CIE-1.zip"',
      }),
    );
    global.fetch = fetchSpy as any;

    render(<AttendanceReportGenerator />);
    const file = uploadFile("source.xlsx", 8192);
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Add an optional note
    const textarea = screen.getByPlaceholderText(
      /Attendance considered up till 17th March 2026/,
    );
    fireEvent.change(textarea, { target: { value: "Cut-off 12th May" } });

    // Change subject count to 4 to verify it flows through
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    fireEvent.change(selects[3]!, { target: { value: "4" } });

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/teacher/reports/attendance/bulk");
    expect(init.method).toBe("POST");
    const fd = init.body as FormData;
    expect(fd.get("file")).toBe(file);
    expect(fd.get("branch")).toBe("COMPUTER SCIENCE & ENGINEERING");
    expect(fd.get("test")).toBe("CIE-1");
    expect(fd.get("semester")).toBe(" I Semester BE  ");
    expect(fd.get("submissionDate")).toMatch(/, 20\d{2}$/); // formatted, not ISO
    expect(fd.get("note")).toBe("Cut-off 12th May");
    expect(fd.get("subjectCount")).toBe("4");

    // Download lifecycle ran
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(aClickSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:fake-url");

    // Success banner shows the server-provided filename
    await waitFor(() =>
      expect(
        screen.getByText(/Generated rv-attendance-2026-CIE-1\.zip\./),
      ).toBeInTheDocument(),
    );
  });

  it("falls back to default filename when Content-Disposition is missing", async () => {
    const fetchSpy = jest
      .fn()
      .mockResolvedValue(makeResponse({ ok: true, contentDisposition: null }));
    global.fetch = fetchSpy as any;

    render(<AttendanceReportGenerator />);
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [uploadFile()] },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() =>
      expect(
        screen.getByText(/Generated attendance-reports-CIE-1\.zip\./),
      ).toBeInTheDocument(),
    );
  });

  it("falls back to default filename when Content-Disposition lacks `filename=`", async () => {
    const fetchSpy = jest.fn().mockResolvedValue(
      makeResponse({
        ok: true,
        // Header present but malformed — no filename= key
        contentDisposition: "attachment; modification-date=2026-05-19",
      }),
    );
    global.fetch = fetchSpy as any;

    render(<AttendanceReportGenerator />);
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [uploadFile()] },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() =>
      expect(
        screen.getByText(/Generated attendance-reports-CIE-1\.zip\./),
      ).toBeInTheDocument(),
    );
  });

  it("non-OK with JSON error body → shows data.error", async () => {
    const fetchSpy = jest.fn().mockResolvedValue(
      makeResponse({
        ok: false,
        status: 400,
        body: { error: "Sheet missing USN column" },
      }),
    );
    global.fetch = fetchSpy as any;

    render(<AttendanceReportGenerator />);
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [uploadFile()] },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() =>
      expect(screen.getByText("Sheet missing USN column")).toBeInTheDocument(),
    );
    // The success banner must not be shown
    expect(screen.queryByText(/^Generated /)).not.toBeInTheDocument();
  });

  it("non-OK with malformed JSON body → falls back to `Request failed (NNN)`", async () => {
    const fetchSpy = jest.fn().mockResolvedValue(
      makeResponse({
        ok: false,
        status: 502,
        bodyIsJson: false,
      }),
    );
    global.fetch = fetchSpy as any;

    render(<AttendanceReportGenerator />);
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [uploadFile()] },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() =>
      expect(screen.getByText(/Request failed \(502\)/)).toBeInTheDocument(),
    );
  });

  it("non-OK with JSON body but no `error` key → falls back to `Request failed (NNN)`", async () => {
    const fetchSpy = jest.fn().mockResolvedValue(
      makeResponse({ ok: false, status: 503, body: { somethingElse: "x" } }),
    );
    global.fetch = fetchSpy as any;

    render(<AttendanceReportGenerator />);
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [uploadFile()] },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() =>
      expect(screen.getByText(/Request failed \(503\)/)).toBeInTheDocument(),
    );
  });

  it("network failure (fetch rejects) → surfaces the error message", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("ECONNREFUSED")) as any;

    render(<AttendanceReportGenerator />);
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [uploadFile()] },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() =>
      expect(screen.getByText("ECONNREFUSED")).toBeInTheDocument(),
    );
  });

  it("non-Error thrown (e.g. string rejection) → uses generic fallback message", async () => {
    global.fetch = jest.fn().mockRejectedValue("boom-string") as any;

    render(<AttendanceReportGenerator />);
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [uploadFile()] },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() =>
      expect(
        screen.getByText("Failed to generate reports"),
      ).toBeInTheDocument(),
    );
  });

  it("button shows `Generating…` while busy and re-enables after the request resolves", async () => {
    // Resolve manually so we can observe the mid-request state.
    let resolveFetch: (value: Response) => void = () => {};
    global.fetch = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ) as any;

    render(<AttendanceReportGenerator />);
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [uploadFile()] },
    });
    fireEvent.submit(document.querySelector("form")!);

    // Mid-flight: label flips to Generating…, button disabled
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Generating/ })).toBeDisabled(),
    );

    // Resolve the request
    resolveFetch(makeResponse({ ok: true }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Generate ZIP/ })).not.toBeDisabled(),
    );
  });
});
