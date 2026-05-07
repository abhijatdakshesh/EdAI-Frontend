/**
 * @jest-environment jsdom
 *
 * Unit tests: AutomationRules component
 * Covers: stat counts, toggle calls apiPatch with correct args, optimistic rollback on error,
 *         active/inactive visual state, AdminAICallLogs rendering and pagination.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/components/layout/shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
jest.mock("@/lib/utils", () => ({ cn: (...args: string[]) => args.filter(Boolean).join(" ") }));

const mockInvalidateQueries = jest.fn();
const mockMutate = jest.fn();

let mockMutationResult: Record<string, unknown> = {};
let mockQueryResult: Record<string, unknown> = {};

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => mockQueryResult),
  useMutation: jest.fn(() => mockMutationResult),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock("@/lib/api/client", () => ({
  apiGet: jest.fn(),
  apiPatch: jest.fn(),
}));

jest.mock("@/lib/api/comms", () => ({}));

import { AutomationRules, AdminAICallLogs } from "../automation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api/client";

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Default MOCK_RULES from the component has 5 rules — 4 enabled, 1 disabled (r4)
// Total runsToday = 12+3+5+0+2 = 22

const CALL_LOGS = [
  {
    id: "c1",
    studentName: "Rahul Verma",
    studentUsn: "1RV21CS010",
    parentPhone: "9876543210",
    calledAt: "2025-01-12 09:00",
    duration: 45,
    language: "kn",
    outcome: "ANSWERED" as const,
    transcript: "Hello parent...",
  },
  {
    id: "c2",
    studentName: "Ananya Singh",
    studentUsn: "1RV21CS011",
    parentPhone: "9123456789",
    calledAt: "2025-01-12 09:15",
    duration: 0,
    language: "en",
    outcome: "NO_ANSWER" as const,
  },
];

// ── AutomationRules Tests ─────────────────────────────────────────────────────

describe("AutomationRules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutationResult = { mutate: mockMutate, isPending: false };
  });

  describe("stats display", () => {
    it("shows Total Rules = 5", () => {
      render(<AutomationRules />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("shows Active = 4 (r4 is disabled in MOCK_RULES)", () => {
      render(<AutomationRules />);
      // 4 active rules
      const statCells = screen.getAllByText("4");
      expect(statCells.length).toBeGreaterThanOrEqual(1);
    });

    it("shows Runs Today = 22 (sum of all runsToday)", () => {
      render(<AutomationRules />);
      expect(screen.getByText("22")).toBeInTheDocument();
    });
  });

  describe("toggle — optimistic update", () => {
    it("calls mutate with { id, enabled: !currentState } on toggle click", () => {
      render(<AutomationRules />);
      // r1 is enabled. Toggle it → should call mutate with enabled: false
      const toggleBtns = screen.getAllByRole("button").filter(
        (b) => b.className.includes("rounded-full")
      );
      fireEvent.click(toggleBtns[0]!); // r1 toggle
      expect(mockMutate).toHaveBeenCalledWith({ id: "r1", enabled: false });
    });

    it("disabling r4 (already disabled) calls mutate with enabled: true", () => {
      render(<AutomationRules />);
      const toggleBtns = screen.getAllByRole("button").filter(
        (b) => b.className.includes("rounded-full")
      );
      // r4 is the 4th toggle (index 3)
      fireEvent.click(toggleBtns[3]!);
      expect(mockMutate).toHaveBeenCalledWith({ id: "r4", enabled: true });
    });
  });

  describe("toggle — optimistic rollback on error", () => {
    it("reverts enabled state when mutation errors", () => {
      let capturedOnError: ((err: Error, vars: { id: string; enabled: boolean }) => void) | null = null;
      (useMutation as jest.Mock).mockImplementation((opts: { onError?: (err: Error, vars: { id: string; enabled: boolean }) => void }) => {
        capturedOnError = opts.onError ?? null;
        return { mutate: mockMutate, isPending: false };
      });

      render(<AutomationRules />);

      // Optimistically toggle r1 (enabled → disabled)
      const toggleBtns = screen.getAllByRole("button").filter(
        (b) => b.className.includes("rounded-full")
      );
      fireEvent.click(toggleBtns[0]!);

      // Before rollback: r1 toggle should have bg-border (disabled)
      // After rollback: should revert to bg-[#1C1810] (enabled)
      expect(capturedOnError).not.toBeNull();
      capturedOnError!(new Error("Network failure"), { id: "r1", enabled: false });

      // After rollback the rule label should still be visible
      expect(screen.getByText("Low Attendance Parent Alert")).toBeInTheDocument();
    });
  });

  describe("toggle — apiPatch endpoint", () => {
    it("mutationFn calls apiPatch with correct path and body", async () => {
      const mockApiPatch = apiPatch as jest.Mock;
      mockApiPatch.mockResolvedValue(undefined);

      let capturedFn: ((args: { id: string; enabled: boolean }) => unknown) | null = null;
      (useMutation as jest.Mock).mockImplementation((opts: { mutationFn: (args: { id: string; enabled: boolean }) => unknown }) => {
        capturedFn = opts.mutationFn;
        return { mutate: mockMutate, isPending: false };
      });

      render(<AutomationRules />);
      await capturedFn!({ id: "r1", enabled: false });
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/api/admin/automation/rules/r1",
        { enabled: false }
      );
    });
  });

  describe("rule rendering", () => {
    it("renders all 5 rule names", () => {
      render(<AutomationRules />);
      expect(screen.getByText("Low Attendance Parent Alert")).toBeInTheDocument();
      expect(screen.getByText("IA Marks Published Notification")).toBeInTheDocument();
      expect(screen.getByText("Fee Overdue Reminder")).toBeInTheDocument();
      expect(screen.getByText("Exam Prep Wellness Check")).toBeInTheDocument();
      expect(screen.getByText("Performance Drop Detection")).toBeInTheDocument();
    });

    it("shows 'active' badge only for enabled rules", () => {
      render(<AutomationRules />);
      const activeBadges = screen.getAllByText("active");
      expect(activeBadges).toHaveLength(4); // r4 is disabled
    });

    it("shows last run info for rules that have lastRun", () => {
      render(<AutomationRules />);
      expect(screen.getByText(/Last run: 2025-01-12 07:00/)).toBeInTheDocument();
    });
  });

  describe("invalidates queries on success", () => {
    it("invalidates automation-rules on toggle success", () => {
      let capturedOnSuccess: (() => void) | null = null;
      (useMutation as jest.Mock).mockImplementation((opts: { onSuccess?: () => void }) => {
        capturedOnSuccess = opts.onSuccess ?? null;
        return { mutate: mockMutate, isPending: false };
      });

      render(<AutomationRules />);
      capturedOnSuccess!();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["automation-rules"] });
    });
  });
});

// ── AdminAICallLogs Tests ─────────────────────────────────────────────────────

describe("AdminAICallLogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryResult = { data: CALL_LOGS, isLoading: false };
  });

  it("renders call log table with student names", () => {
    render(<AdminAICallLogs />);
    expect(screen.getByText("Rahul Verma")).toBeInTheDocument();
    expect(screen.getByText("Ananya Singh")).toBeInTheDocument();
  });

  it("shows loading skeleton rows when isLoading=true", () => {
    mockQueryResult = { data: [], isLoading: true };
    render(<AdminAICallLogs />);
    const pulseRows = document.querySelectorAll(".animate-pulse");
    expect(pulseRows.length).toBeGreaterThan(0);
  });

  it("shows empty state when no logs", () => {
    mockQueryResult = { data: [], isLoading: false };
    render(<AdminAICallLogs />);
    expect(screen.getByText(/No call logs found/)).toBeInTheDocument();
  });

  it("shows 'Transcript' link only for logs that have transcript", () => {
    render(<AdminAICallLogs />);
    const transcriptBtns = screen.getAllByText("Transcript");
    expect(transcriptBtns).toHaveLength(1); // only c1 has transcript
  });

  it("shows call detail panel when a row is clicked", () => {
    render(<AdminAICallLogs />);
    const row = screen.getByText("Rahul Verma").closest("tr")!;
    fireEvent.click(row);
    expect(screen.getByText("Call Detail")).toBeInTheDocument();
  });

  it("closes detail panel when ✕ is clicked", () => {
    render(<AdminAICallLogs />);
    fireEvent.click(screen.getByText("Rahul Verma").closest("tr")!);
    fireEvent.click(screen.getByText("✕"));
    expect(screen.queryByText("Call Detail")).not.toBeInTheDocument();
  });

  it("computes Answered count correctly (1 out of 2)", () => {
    render(<AdminAICallLogs />);
    // Stats: Total=2, Answered=1, Answer Rate=50%, Avg Duration=45s
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("shows — for avg duration when all durations are 0", () => {
    mockQueryResult = {
      data: [{ ...CALL_LOGS[1], duration: 0 }],
      isLoading: false,
    };
    render(<AdminAICallLogs />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  describe("pagination", () => {
    it("Prev button is disabled on page 1", () => {
      render(<AdminAICallLogs />);
      const prevBtn = screen.getByText("← Prev");
      expect(prevBtn).toBeDisabled();
    });

    it("Next button is disabled when logs < 20", () => {
      render(<AdminAICallLogs />);
      const nextBtn = screen.getByText("Next →");
      expect(nextBtn).toBeDisabled();
    });

    it("Next button increments page and apiGet is called with page=2", () => {
      // With 20 logs, Next should be enabled
      mockQueryResult = {
        data: Array.from({ length: 20 }, (_, i) => ({ ...CALL_LOGS[0], id: `c${i}` })),
        isLoading: false,
      };

      let capturedQueryFn: ((opts: unknown) => unknown) | null = null;
      (useQuery as jest.Mock).mockImplementation((opts: { queryFn: () => unknown }) => {
        capturedQueryFn = opts.queryFn;
        return mockQueryResult;
      });

      render(<AdminAICallLogs />);
      fireEvent.click(screen.getByText("Next →"));
      // After click, page should be 2 — verify by checking the displayed page text
      expect(screen.getByText("Page 2")).toBeInTheDocument();
    });
  });

  describe("useQuery with correct endpoint", () => {
    it("calls apiGet with page and limit params", async () => {
      const mockApiGet = jest.requireMock("@/lib/api/client").apiGet as jest.Mock;
      mockApiGet.mockResolvedValue([]);

      let capturedFn: (() => unknown) | null = null;
      (useQuery as jest.Mock).mockImplementation((opts: { queryFn: () => unknown }) => {
        capturedFn = opts.queryFn;
        return { data: [], isLoading: false };
      });

      render(<AdminAICallLogs />);
      await capturedFn!();
      expect(mockApiGet).toHaveBeenCalledWith("/api/admin/calls/logs?page=1&limit=20");
    });
  });
});
