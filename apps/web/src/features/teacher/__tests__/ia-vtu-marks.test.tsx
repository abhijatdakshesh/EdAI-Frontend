/**
 * @jest-environment jsdom
 *
 * Unit tests: IAVTUMarks component + exportVTUFormat function
 * Covers: heading render, export button disabled/enabled state,
 *         export trigger, CSV header/row correctness.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

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
    size: _size,
    variant: _variant,
    className: _className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    size?: string;
    variant?: string;
    className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | false)[]) => args.filter(Boolean).join(" "),
}));

// VTU hook — default empty, overridden per test
const mockUseTeacherIAMarks = jest.fn(() => ({ data: [], isLoading: false }));
jest.mock("@/lib/api/vtu", () => ({
  useTeacherIAMarks: (subjectId: string) => mockUseTeacherIAMarks(subjectId),
}));

// Academics hook — default empty
jest.mock("@/lib/api/academics", () => ({
  useClasses: () => ({ data: [], isLoading: false }),
}));

// Other hooks used by teacher-pages — provide safe no-op defaults
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({ data: [], isLoading: false })),
  useMutation: jest.fn(() => ({ mutate: jest.fn(), mutateAsync: jest.fn(), isPending: false })),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("@/lib/api/client", () => ({
  apiGet: jest.fn(),
  apiPatch: jest.fn(),
  apiPost: jest.fn(),
}));

jest.mock("@/lib/api/attendance", () => ({
  useClassAttendanceSummary: () => ({ data: undefined, isLoading: false }),
  useAtRiskStudents: () => ({ data: [], isLoading: false }),
}));

jest.mock("@/lib/api/comms", () => ({
  useAnnouncements: () => ({ data: [] }),
  usePostAnnouncement: () => ({ mutate: jest.fn(), mutateAsync: jest.fn(), isPending: false }),
  useTriggerCall: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("@/lib/auth/use-auth", () => ({
  useAuth: () => ({ session: { user: { id: "EMP001", name: "Test Teacher", email: "test@test.com" } } }),
}));

// ── Import component after mocks ──────────────────────────────────────────────

import { IAVTUMarks } from "../teacher-pages";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TWO_ROWS = [
  { studentUsn: "1RVITM21001", studentName: "Arjun Kumar", ia1: 20, ia2: 18 },
  { studentUsn: "1RVITM21002", studentName: "Priya Sharma", ia1: 15, ia2: 22 },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("IAVTUMarks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeacherIAMarks.mockReturnValue({ data: [], isLoading: false });

    Object.defineProperty(globalThis, "URL", {
      writable: true,
      value: { createObjectURL: jest.fn(() => "blob:mock"), revokeObjectURL: jest.fn() },
    });
  });

  describe("heading", () => {
    it("renders 'IA / VTU Marks' heading", () => {
      render(<IAVTUMarks />);
      expect(screen.getByText("IA / VTU Marks")).toBeInTheDocument();
    });
  });

  describe("export button state", () => {
    it("'Export to VTU Format' button is disabled when rows is empty", () => {
      mockUseTeacherIAMarks.mockReturnValue({ data: [], isLoading: false });
      render(<IAVTUMarks />);
      const btn = screen.getByText("Export to VTU Format");
      expect(btn).toBeDisabled();
    });

    it("'Export to VTU Format' button is enabled when rows exist", () => {
      mockUseTeacherIAMarks.mockReturnValue({ data: TWO_ROWS, isLoading: false });
      render(<IAVTUMarks />);
      const btn = screen.getByText("Export to VTU Format");
      expect(btn).not.toBeDisabled();
    });
  });

  describe("export behaviour", () => {
    it("clicking export triggers URL.createObjectURL", () => {
      mockUseTeacherIAMarks.mockReturnValue({ data: TWO_ROWS, isLoading: false });
      const mockCreateObjectURL = jest.fn(() => "blob:mock");
      Object.defineProperty(globalThis, "URL", {
        writable: true,
        value: { createObjectURL: mockCreateObjectURL, revokeObjectURL: jest.fn() },
      });

      const anchorClick = jest.fn();
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") {
          return { href: "", download: "", click: anchorClick } as unknown as HTMLElement;
        }
        return originalCreateElement(tag);
      });

      render(<IAVTUMarks />);
      fireEvent.click(screen.getByText("Export to VTU Format"));

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(anchorClick).toHaveBeenCalledTimes(1);
    });

    it("downloaded file has correct CSV header line", () => {
      mockUseTeacherIAMarks.mockReturnValue({ data: TWO_ROWS, isLoading: false });

      let capturedCsvContent = "";
      const originalBlob = globalThis.Blob;
      globalThis.Blob = class MockBlob {
        constructor(parts: BlobPart[]) {
          capturedCsvContent = (parts as string[]).join("");
        }
      } as unknown as typeof Blob;

      Object.defineProperty(globalThis, "URL", {
        writable: true,
        value: { createObjectURL: jest.fn(() => "blob:mock"), revokeObjectURL: jest.fn() },
      });

      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") {
          return { href: "", download: "", click: jest.fn() } as unknown as HTMLElement;
        }
        return originalCreateElement(tag);
      });

      render(<IAVTUMarks />);
      fireEvent.click(screen.getByText("Export to VTU Format"));

      expect(capturedCsvContent).toContain(
        "USN,Student Name,IA 1 (/25),IA 2 (/25),IA 3 (/25),Total (/75)"
      );

      globalThis.Blob = originalBlob;
    });

    it("CSV rows contain student USN and correct IA totals", () => {
      mockUseTeacherIAMarks.mockReturnValue({ data: TWO_ROWS, isLoading: false });

      let capturedCsvContent = "";
      const originalBlob = globalThis.Blob;
      globalThis.Blob = class MockBlob {
        constructor(parts: BlobPart[]) {
          capturedCsvContent = (parts as string[]).join("");
        }
      } as unknown as typeof Blob;

      Object.defineProperty(globalThis, "URL", {
        writable: true,
        value: { createObjectURL: jest.fn(() => "blob:mock"), revokeObjectURL: jest.fn() },
      });

      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") {
          return { href: "", download: "", click: jest.fn() } as unknown as HTMLElement;
        }
        return originalCreateElement(tag);
      });

      render(<IAVTUMarks />);
      fireEvent.click(screen.getByText("Export to VTU Format"));

      // Row 1: usn=1RVITM21001, ia1=20, ia2=18, total=38
      expect(capturedCsvContent).toContain("1RVITM21001");
      expect(capturedCsvContent).toContain("1RVITM21002");
      // total = ia1 + ia2 (IA3 is always 0 per exportVTUFormat)
      expect(capturedCsvContent).toContain(",20,18,0,38");
      expect(capturedCsvContent).toContain(",15,22,0,37");

      globalThis.Blob = originalBlob;
    });
  });
});
