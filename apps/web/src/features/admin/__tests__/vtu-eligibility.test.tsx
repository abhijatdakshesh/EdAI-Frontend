/**
 * @jest-environment jsdom
 *
 * Unit tests: VTUAdmin — Exam Eligibility view and Condonation modal.
 * Covers: KPI cards, flagged-student table, condonation modal open/close,
 *         modal fields, editable textarea, download, filter tabs, windows tab.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

jest.mock("@/lib/api/vtu", () => ({
  useVTUWindows: () => ({ data: [], isLoading: false }),
  useCreateVTUWindow: () => ({ mutate: jest.fn(), isPending: false }),
  useVTUPendingStudents: () => ({ data: [], isLoading: false }),
  useVTUDeptOverview: () => ({ data: [] }),
  useSendVTUReminders: () => ({ mutate: jest.fn(), isPending: false }),
  useRunEligibilityCheck: () => ({ mutate: jest.fn(), isPending: false }),
}));

// ── Import component after mocks ──────────────────────────────────────────────

import { VTUAdmin } from "../vtu-admin";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("VTUAdmin — Exam Eligibility View", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "URL", {
      writable: true,
      value: { createObjectURL: jest.fn(() => "blob:mock"), revokeObjectURL: jest.fn() },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("default active tab", () => {
    it("renders 'Exam Eligibility' tab as the default view", () => {
      render(<VTUAdmin />);
      // Eligibility view KPI cards are visible by default
      expect(screen.getByText("Total Students")).toBeInTheDocument();
    });

    it("does not show 'No windows yet' text in eligibility view", () => {
      render(<VTUAdmin />);
      expect(screen.queryByText(/No windows yet/)).not.toBeInTheDocument();
    });
  });

  describe("KPI cards", () => {
    it("shows '247' for Total Students", () => {
      render(<VTUAdmin />);
      expect(screen.getByText("247")).toBeInTheDocument();
    });

    it("shows '200' for Fully Eligible", () => {
      render(<VTUAdmin />);
      expect(screen.getByText("200")).toBeInTheDocument();
    });

    it("shows '47' for Flagged", () => {
      render(<VTUAdmin />);
      expect(screen.getByText("47")).toBeInTheDocument();
    });
  });

  describe("student table — default 'all' filter", () => {
    it("renders table with at least one 'Blocked' badge", () => {
      render(<VTUAdmin />);
      const blocked = screen.getAllByText(/Blocked/);
      expect(blocked.length).toBeGreaterThan(0);
    });

    it("'Generate Condonation' link is visible for flagged rows", () => {
      render(<VTUAdmin />);
      const links = screen.getAllByText("Generate Condonation");
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe("condonation modal", () => {
    function openFirstCondonation() {
      render(<VTUAdmin />);
      const links = screen.getAllByText("Generate Condonation");
      fireEvent.click(links[0]!);
    }

    it("clicking 'Generate Condonation' opens modal with 'Condonation Application' heading", () => {
      openFirstCondonation();
      expect(screen.getByText("Condonation Application")).toBeInTheDocument();
    });

    it("modal shows student USN (first flagged student: 1RVITM21001)", () => {
      openFirstCondonation();
      // USN appears in modal subtitle and in the textarea template — at least one match
      const matches = screen.getAllByText(/1RVITM21001/);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("modal shows student name", () => {
      openFirstCondonation();
      // "Arjun Kumar" appears in both the modal header subtitle and table rows
      const matches = screen.getAllByText(/Arjun Kumar/);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("modal shows attendance % label", () => {
      openFirstCondonation();
      // The grid shows label "Attendance"
      const labels = screen.getAllByText("Attendance");
      expect(labels.length).toBeGreaterThan(0);
    });

    it("modal shows IA Average label", () => {
      openFirstCondonation();
      expect(screen.getByText("IA Average")).toBeInTheDocument();
    });

    it("modal shows Fee Due label", () => {
      openFirstCondonation();
      expect(screen.getByText("Fee Due")).toBeInTheDocument();
    });

    it("modal has editable textarea with pre-filled template text containing student USN", () => {
      openFirstCondonation();
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toContain("1RVITM21001");
    });

    it("textarea text is editable", () => {
      openFirstCondonation();
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "custom text" } });
      expect(textarea.value).toBe("custom text");
    });

    it("'Download Application' button triggers document.createElement('a') click", () => {
      openFirstCondonation();
      const mockAnchor = { href: "", download: "", click: jest.fn() };
      jest.spyOn(document, "createElement").mockReturnValue(mockAnchor as unknown as HTMLElement);
      fireEvent.click(screen.getByText("Download Application"));
      expect(mockAnchor.click).toHaveBeenCalledTimes(1);
      expect(mockAnchor.download).toMatch(/Condonation_1RVITM21001/);
    });

    it("'Cancel' button closes the modal", () => {
      openFirstCondonation();
      expect(screen.getByText("Condonation Application")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByText("Condonation Application")).not.toBeInTheDocument();
    });

    it("'✕' button closes the modal", () => {
      openFirstCondonation();
      fireEvent.click(screen.getByText("✕"));
      expect(screen.queryByText("Condonation Application")).not.toBeInTheDocument();
    });
  });

  describe("eligibility filters", () => {
    it("clicking 'Flagged (47)' filter shows only blocked students (no 'Eligible' badge without block)", () => {
      render(<VTUAdmin />);
      fireEvent.click(screen.getByText("Flagged (47)"));
      // All visible rows should be flagged — no 'Eligible' badge (without Blocked prefix)
      const eligibleBadges = screen.queryAllByText("Eligible");
      expect(eligibleBadges.length).toBe(0);
    });

    it("clicking 'Eligible (200)' filter hides all 'Generate Condonation' links", () => {
      render(<VTUAdmin />);
      fireEvent.click(screen.getByText("Eligible (200)"));
      expect(screen.queryByText("Generate Condonation")).not.toBeInTheDocument();
    });

    it("clicking 'Eligible (200)' filter shows 'Eligible' badges", () => {
      render(<VTUAdmin />);
      fireEvent.click(screen.getByText("Eligible (200)"));
      const eligibleBadges = screen.getAllByText("Eligible");
      expect(eligibleBadges.length).toBeGreaterThan(0);
    });
  });

  describe("Registration Windows tab", () => {
    it("clicking 'Registration Windows' tab switches view to show 'No windows yet'", () => {
      render(<VTUAdmin />);
      // useVTUWindows returns [] so empty state message should appear
      fireEvent.click(screen.getByText("Registration Windows"));
      expect(screen.getByText(/No windows yet/)).toBeInTheDocument();
    });
  });
});
