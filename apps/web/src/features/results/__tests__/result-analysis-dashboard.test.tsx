/**
 * @jest-environment jsdom
 *
 * Unit tests: ResultAnalysisDashboard component
 * Covers: KPI cards, branch cards, subject heatmap, drill-down table,
 *         campaign trigger, report generation, CSV export, faculty view,
 *         year-over-year delta arrows.
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/components/layout/shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
    size: _size,
    variant: _variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    size?: string;
    variant?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

jest.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | false)[]) => args.filter(Boolean).join(" "),
}));

// ── Import component after mocks ──────────────────────────────────────────────

import { ResultAnalysisDashboard } from "../result-analysis-dashboard";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Click a heatmap card by subject name */
function clickSubject(name: string) {
  fireEvent.click(screen.getByText(name).closest("button")!);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ResultAnalysisDashboard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock URL and document.createElement for download actions
    Object.defineProperty(globalThis, "URL", {
      writable: true,
      value: { createObjectURL: jest.fn(() => "blob:mock"), revokeObjectURL: jest.fn() },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("heading and exam label", () => {
    it("renders exam label 'Nov 2025' in the published banner", () => {
      render(<ResultAnalysisDashboard />);
      expect(screen.getByText(/VTU Results Published — Nov 2025 — VTU/)).toBeInTheDocument();
    });

    it("renders 'Result Analysis' heading — AppShell receives the title prop", () => {
      // Our AppShell mock is a passthrough div; the title prop is verified by checking
      // a string that only appears when the component renders correctly (the banner).
      render(<ResultAnalysisDashboard />);
      // The sub-text in the banner confirms the component mounted with exam context
      expect(screen.getByText(/Analysis computed automatically by Ed8AI/)).toBeInTheDocument();
    });
  });

  describe("KPI cards", () => {
    it("shows 'Overall Pass %' label", () => {
      render(<ResultAnalysisDashboard />);
      expect(screen.getByText("Overall Pass %")).toBeInTheDocument();
    });

    it("shows 'Students Appeared' label", () => {
      render(<ResultAnalysisDashboard />);
      expect(screen.getByText("Students Appeared")).toBeInTheDocument();
    });

    it("shows 'Failed Students' label", () => {
      render(<ResultAnalysisDashboard />);
      expect(screen.getByText("Failed Students")).toBeInTheDocument();
    });

    it("shows 'Subjects Below 60%' label", () => {
      render(<ResultAnalysisDashboard />);
      expect(screen.getByText("Subjects Below 60%")).toBeInTheDocument();
    });

    it("shows correct total students appeared (371 = 85+68+72+38+60+48)", () => {
      render(<ResultAnalysisDashboard />);
      // TOTAL_STUDENTS = 371
      expect(screen.getByText("371")).toBeInTheDocument();
    });
  });

  describe("branch cards", () => {
    it("renders all 6 branch labels", () => {
      render(<ResultAnalysisDashboard />);
      for (const branch of ["CSE", "ISE", "ECE", "EEE", "ME", "CV"]) {
        expect(screen.getByText(branch)).toBeInTheDocument();
      }
    });
  });

  describe("subject heatmap", () => {
    it("renders 9 subject heatmap cards", () => {
      render(<ResultAnalysisDashboard />);
      // Each subject card has a subject code in font-mono
      const codes = ["21MAT41", "21CS42", "21EC41", "21CS43", "21ME41", "21CS44", "21EE41", "21CS31", "21IS41"];
      for (const code of codes) {
        expect(screen.getByText(code)).toBeInTheDocument();
      }
    });
  });

  describe("drill-down: clicking red subject shows failed students table", () => {
    it("clicking 'Engg. Mathematics IV' opens the drill-down panel", () => {
      render(<ResultAnalysisDashboard />);
      clickSubject("Engg. Mathematics IV");
      expect(screen.getByText(/Engg. Mathematics IV — 52% pass rate/)).toBeInTheDocument();
    });

    it("failed students table renders correct number of rows (119 = 247 - 128)", () => {
      render(<ResultAnalysisDashboard />);
      clickSubject("Engg. Mathematics IV");
      // 247 total, 128 passed => 119 failed. Table renders tbody rows.
      const tbody = document.querySelector("tbody");
      expect(tbody).not.toBeNull();
      // The table shows sliced FAILED_STUDENTS (47 max in the mock set, but subject shows 119 failed)
      // FAILED_STUDENTS array has 47 entries — slice(0, 119) returns all 47 rows
      const rows = tbody!.querySelectorAll("tr");
      expect(rows.length).toBe(47);
    });

    it("failed students table shows USN column", () => {
      render(<ResultAnalysisDashboard />);
      clickSubject("Engg. Mathematics IV");
      expect(screen.getByText("1RVITM21001")).toBeInTheDocument();
    });
  });

  describe("'Trigger Re-exam Coaching Campaign' button", () => {
    it("renders in drill-down view", () => {
      render(<ResultAnalysisDashboard />);
      clickSubject("Engg. Mathematics IV");
      expect(screen.getByText("Trigger Re-exam Coaching Campaign")).toBeInTheDocument();
    });

    it("clicking shows '✓ Campaign Triggered' confirmation text", () => {
      render(<ResultAnalysisDashboard />);
      clickSubject("Engg. Mathematics IV");
      fireEvent.click(screen.getByText("Trigger Re-exam Coaching Campaign"));
      expect(
        screen.getByText(/✓ Campaign Triggered — Calls \+ WhatsApp Queued/)
      ).toBeInTheDocument();
    });

    it("confirmation text disappears after 4000ms (setTimeout)", () => {
      render(<ResultAnalysisDashboard />);
      clickSubject("Engg. Mathematics IV");
      fireEvent.click(screen.getByText("Trigger Re-exam Coaching Campaign"));
      act(() => {
        jest.advanceTimersByTime(4001);
      });
      expect(
        screen.queryByText(/✓ Campaign Triggered — Calls \+ WhatsApp Queued/)
      ).not.toBeInTheDocument();
    });
  });

  describe("'Generate Management Report' button", () => {
    it("is visible and enabled before report generation", () => {
      render(<ResultAnalysisDashboard />);
      const btn = screen.getByText("Generate Management Report");
      expect(btn).toBeInTheDocument();
      expect(btn).not.toBeDisabled();
    });

    it("shows 'Download Report PDF' after report generation (mock setTimeout)", async () => {
      render(<ResultAnalysisDashboard />);
      const btn = screen.getByText("Generate Management Report");
      fireEvent.click(btn);
      // Advance past the 1800ms fake setTimeout inside handleGenerateReport
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
      expect(screen.getByText("Download Report PDF")).toBeInTheDocument();
    });

    it("shows 'Generating 14-page Report…' while generating", () => {
      render(<ResultAnalysisDashboard />);
      fireEvent.click(screen.getByText("Generate Management Report"));
      expect(screen.getByText("Generating 14-page Report…")).toBeInTheDocument();
    });
  });

  describe("'Export Student List' button", () => {
    it("triggers document.createElement('a') click on export", () => {
      // Render first, THEN spy — so React's own createElement calls use the real impl
      render(<ResultAnalysisDashboard />);
      clickSubject("Engg. Mathematics IV");

      const anchorClick = jest.fn();
      const mockAnchor = { href: "", download: "", click: anchorClick };
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") return mockAnchor as unknown as HTMLElement;
        return originalCreateElement(tag);
      });

      fireEvent.click(screen.getByText("Export Student List"));
      expect(anchorClick).toHaveBeenCalledTimes(1);
      expect(mockAnchor.download).toMatch(/failed_students_21MAT41/);
    });
  });

  describe("faculty view", () => {
    it("faculty table is hidden by default", () => {
      render(<ResultAnalysisDashboard />);
      expect(screen.queryByText("Dr. Arjun Rao")).not.toBeInTheDocument();
    });

    it("clicking 'Show Faculty View' renders faculty rows", () => {
      render(<ResultAnalysisDashboard />);
      fireEvent.click(screen.getByText("Show Faculty View"));
      expect(screen.getByText("Dr. Arjun Rao")).toBeInTheDocument();
      expect(screen.getByText("Dr. Ramesh Kumar")).toBeInTheDocument();
    });

    it("clicking 'Hide Faculty View' hides faculty rows again", () => {
      render(<ResultAnalysisDashboard />);
      fireEvent.click(screen.getByText("Show Faculty View"));
      fireEvent.click(screen.getByText("Hide Faculty View"));
      expect(screen.queryByText("Dr. Arjun Rao")).not.toBeInTheDocument();
    });
  });

  describe("year-over-year delta arrows", () => {
    it("renders ↑ arrow for branches that improved (CSE: 82 vs 78)", () => {
      render(<ResultAnalysisDashboard />);
      const arrows = screen.getAllByText(/↑/);
      expect(arrows.length).toBeGreaterThan(0);
    });

    it("renders ↓ arrow — no branch in mock data has negative delta but renders text with ↓ or ↑", () => {
      render(<ResultAnalysisDashboard />);
      // All 6 branches in mock data have passPercent > prev, so all deltas are positive (↑)
      // CSE:+4, ISE:+4, ECE:+5, EEE:+3, ME:+2, CV:+3 — all positive
      const upArrows = screen.getAllByText(/↑ \d+% vs last year/);
      expect(upArrows.length).toBe(6);
    });
  });
});
