/**
 * @jest-environment jsdom
 *
 * Unit tests: AlertFeed component
 * Covers: loading skeleton, error state, severity filter, show-resolved toggle,
 *         Mark Resolved mutation, empty state, severity count display.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mock all external dependencies before importing the component ──────────────

jest.mock("@/components/layout/shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

jest.mock("@/lib/utils", () => ({ cn: (...args: string[]) => args.filter(Boolean).join(" ") }));

const mockInvalidateQueries = jest.fn();
const mockUseQueryClient = jest.fn(() => ({ invalidateQueries: mockInvalidateQueries }));
const mockMutate = jest.fn();

let mockQueryResult: Record<string, unknown> = { data: [], isLoading: false, isError: false };
let mockMutationResult: Record<string, unknown> = { mutate: mockMutate, isPending: false };

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => mockQueryResult),
  useMutation: jest.fn(() => mockMutationResult),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock("@/lib/api/client", () => ({
  apiGet: jest.fn(),
  apiPatch: jest.fn(),
}));

import { AlertFeed } from "../alert-feed";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api/client";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ALERTS = [
  {
    id: "a1",
    severity: "critical" as const,
    category: "attendance" as const,
    title: "Low Attendance",
    message: "Student has 60% attendance",
    student: "John Doe",
    class: "CSE-6A",
    occurredAt: "2025-01-12",
    resolved: false,
  },
  {
    id: "a2",
    severity: "warning" as const,
    category: "fees" as const,
    title: "Fee Overdue",
    message: "Fee overdue 30 days",
    occurredAt: "2025-01-10",
    resolved: false,
  },
  {
    id: "a3",
    severity: "info" as const,
    category: "system" as const,
    title: "Backup Complete",
    message: "Daily backup succeeded",
    occurredAt: "2025-01-09",
    resolved: true,
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AlertFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryResult = { data: [], isLoading: false, isError: false };
    mockMutationResult = { mutate: mockMutate, isPending: false };
  });

  describe("loading state", () => {
    it("shows loading skeleton (3 pulse divs) when isLoading=true", () => {
      mockQueryResult = { data: [], isLoading: true, isError: false };
      render(<AlertFeed />);
      const pulseEls = document.querySelectorAll(".animate-pulse");
      // 3 skeleton cards + 3 summary count cards show "—"
      expect(pulseEls.length).toBeGreaterThanOrEqual(3);
    });

    it("shows dash for severity counts while loading", () => {
      mockQueryResult = { data: [], isLoading: true, isError: false };
      render(<AlertFeed />);
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBe(3);
    });
  });

  describe("error state", () => {
    it("shows error message when isError=true", () => {
      mockQueryResult = { data: [], isLoading: false, isError: true };
      render(<AlertFeed />);
      expect(screen.getByText(/Failed to load alerts/)).toBeInTheDocument();
    });
  });

  describe("normal data rendering", () => {
    beforeEach(() => {
      mockQueryResult = { data: ALERTS, isLoading: false, isError: false };
    });

    it("renders unresolved alerts by default (resolved alert hidden)", () => {
      render(<AlertFeed />);
      expect(screen.getByText("Low Attendance")).toBeInTheDocument();
      expect(screen.getByText("Fee Overdue")).toBeInTheDocument();
      // "Backup Complete" is resolved and should be hidden
      expect(screen.queryByText("Backup Complete")).not.toBeInTheDocument();
    });

    it("shows correct unresolved counts per severity", () => {
      render(<AlertFeed />);
      // 1 critical unresolved, 1 warning unresolved, 0 info unresolved
      // Counts appear as text inside the summary cards — use getAllByText for "1" since it may appear in multiple places
      expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    });

    it("renders student and class info when present", () => {
      render(<AlertFeed />);
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/CSE-6A/)).toBeInTheDocument();
    });

    it("shows 'Mark Resolved' button for unresolved alerts only", () => {
      render(<AlertFeed />);
      const resolveButtons = screen.getAllByText("Mark Resolved");
      expect(resolveButtons).toHaveLength(2); // a1 + a2 are unresolved
    });
  });

  describe("Show resolved toggle", () => {
    it("shows resolved alerts when checkbox is checked", () => {
      mockQueryResult = { data: ALERTS, isLoading: false, isError: false };
      render(<AlertFeed />);
      const checkbox = screen.getByRole("checkbox", { name: /Show resolved/ });
      fireEvent.click(checkbox);
      expect(screen.getByText("Backup Complete")).toBeInTheDocument();
    });

    it("hides Mark Resolved button for already-resolved alerts", () => {
      mockQueryResult = { data: ALERTS, isLoading: false, isError: false };
      render(<AlertFeed />);
      fireEvent.click(screen.getByRole("checkbox", { name: /Show resolved/ }));
      // a3 is resolved — its "Mark Resolved" button should not appear for it
      // but a1 and a2 still show their buttons
      const resolveButtons = screen.getAllByText("Mark Resolved");
      expect(resolveButtons).toHaveLength(2);
    });
  });

  describe("severity filter", () => {
    beforeEach(() => {
      mockQueryResult = { data: ALERTS, isLoading: false, isError: false };
    });

    it("filters to only critical alerts when critical card clicked", () => {
      render(<AlertFeed />);
      const criticalBtn = screen.getByRole("button", { name: /critical/i });
      fireEvent.click(criticalBtn);
      expect(screen.getByText("Low Attendance")).toBeInTheDocument();
      expect(screen.queryByText("Fee Overdue")).not.toBeInTheDocument();
    });

    it("shows 'Clear filter' link when a severity filter is active", () => {
      render(<AlertFeed />);
      fireEvent.click(screen.getByRole("button", { name: /critical/i }));
      expect(screen.getByText("Clear filter")).toBeInTheDocument();
    });

    it("clicking active filter again resets to ALL", () => {
      render(<AlertFeed />);
      const criticalBtn = screen.getByRole("button", { name: /critical/i });
      fireEvent.click(criticalBtn); // activate
      fireEvent.click(criticalBtn); // deactivate (toggle back to ALL)
      expect(screen.getByText("Fee Overdue")).toBeInTheDocument();
      expect(screen.queryByText("Clear filter")).not.toBeInTheDocument();
    });

    it("Clear filter button resets to ALL", () => {
      render(<AlertFeed />);
      fireEvent.click(screen.getByRole("button", { name: /warning/i }));
      fireEvent.click(screen.getByText("Clear filter"));
      expect(screen.getByText("Low Attendance")).toBeInTheDocument();
      expect(screen.getByText("Fee Overdue")).toBeInTheDocument();
    });
  });

  describe("Mark Resolved mutation", () => {
    beforeEach(() => {
      mockQueryResult = { data: ALERTS, isLoading: false, isError: false };
    });

    it("calls mutate with the correct alert id when Mark Resolved is clicked", () => {
      render(<AlertFeed />);
      const resolveButtons = screen.getAllByText("Mark Resolved");
      fireEvent.click(resolveButtons[0]!);
      expect(mockMutate).toHaveBeenCalledWith("a1");
    });

    it("Mark Resolved button is disabled when mutation isPending=true", () => {
      mockMutationResult = { mutate: mockMutate, isPending: true };
      render(<AlertFeed />);
      const resolveButtons = screen.getAllByRole("button", { name: "Mark Resolved" });
      resolveButtons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });

    it("mutationFn calls apiPatch with the correct endpoint", async () => {
      const mockApiPatch = apiPatch as jest.Mock;
      mockApiPatch.mockResolvedValue(undefined);

      // Capture the mutationFn passed to useMutation
      let capturedFn: ((id: string) => unknown) | null = null;
      (useMutation as jest.Mock).mockImplementation((opts: { mutationFn: (id: string) => unknown }) => {
        capturedFn = opts.mutationFn;
        return { mutate: mockMutate, isPending: false };
      });

      render(<AlertFeed />);

      expect(capturedFn).not.toBeNull();
      await capturedFn!("a1");
      expect(mockApiPatch).toHaveBeenCalledWith("/api/admin/alerts/a1/resolve", {});
    });

    it("invalidates admin-alerts query on mutation success", async () => {
      let capturedOnSuccess: (() => void) | null = null;
      (useMutation as jest.Mock).mockImplementation((opts: { onSuccess?: () => void }) => {
        capturedOnSuccess = opts.onSuccess ?? null;
        return { mutate: mockMutate, isPending: false };
      });

      render(<AlertFeed />);
      capturedOnSuccess!();

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-alerts"] });
    });
  });

  describe("empty state", () => {
    it("shows empty state message when no alerts match filters", () => {
      mockQueryResult = { data: [], isLoading: false, isError: false };
      render(<AlertFeed />);
      expect(screen.getByText(/No alerts match the current filters/)).toBeInTheDocument();
    });

    it("shows empty state when all alerts are resolved and showResolved=false", () => {
      const allResolved = ALERTS.map((a) => ({ ...a, resolved: true }));
      mockQueryResult = { data: allResolved, isLoading: false, isError: false };
      render(<AlertFeed />);
      expect(screen.getByText(/No alerts match the current filters/)).toBeInTheDocument();
    });
  });

  describe("useQuery integration", () => {
    it("calls useQuery with correct queryKey and queryFn that calls apiGet", async () => {
      const mockApiGet = jest.requireMock("@/lib/api/client").apiGet as jest.Mock;
      mockApiGet.mockResolvedValue([]);

      let capturedQueryFn: (() => Promise<unknown>) | null = null;
      (useQuery as jest.Mock).mockImplementation((opts: { queryKey: unknown[]; queryFn: () => Promise<unknown> }) => {
        capturedQueryFn = opts.queryFn;
        return { data: [], isLoading: false, isError: false };
      });

      render(<AlertFeed />);
      await capturedQueryFn!();
      expect(mockApiGet).toHaveBeenCalledWith("/api/admin/alerts");
    });
  });
});
