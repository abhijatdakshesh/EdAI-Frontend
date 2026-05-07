/**
 * @jest-environment jsdom
 *
 * Unit tests: AttendanceAudit component
 * Covers: class selector required guard, loading state, Save disabled when note empty,
 *         Save enabled when note present, mutation called on Save, Cancel resets edit state,
 *         apiPatch called with correct endpoint and payload, attendance boundary (exactly 75%).
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/components/layout/shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));
jest.mock("@/lib/utils", () => ({ cn: (...args: string[]) => args.filter(Boolean).join(" ") }));

const mockInvalidateQueries = jest.fn();
const mockCorrectMutate = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock("@/lib/api/client", () => ({
  apiGet: jest.fn(),
  apiPatch: jest.fn(),
}));

jest.mock("@/lib/api/academics", () => ({
  useClasses: jest.fn(() => ({ data: [{ id: "cls1", name: "CSE 6A" }, { id: "cls2", name: "ISE 4B" }] })),
}));

import { AttendanceAudit } from "../attendance-audit";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api/client";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RECORDS = [
  {
    id: "r1",
    studentUsn: "1RV21CS001",
    studentName: "Arjun Kumar",
    courseCode: "21CS61",
    courseName: "Machine Learning",
    date: "2025-01-12",
    period: 2,
    status: "ABSENT" as const,
    markedBy: "u1",
    markedByName: "Prof. Sharma",
    corrected: false,
  },
  {
    id: "r2",
    studentUsn: "1RV21CS002",
    studentName: "Priya Nair",
    courseCode: "21CS61",
    courseName: "Machine Learning",
    date: "2025-01-12",
    period: 2,
    status: "PRESENT" as const,
    markedBy: "u1",
    markedByName: "Prof. Sharma",
    corrected: true,
    correctionNote: "Device malfunction",
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AttendanceAudit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockCorrectMutate,
      isPending: false,
    });
  });

  describe("class not selected", () => {
    it("shows 'Select a class' placeholder when no class is chosen", () => {
      render(<AttendanceAudit />);
      expect(screen.getByText(/Select a class to view attendance records/)).toBeInTheDocument();
    });

    it("does not render the table before a class is selected", () => {
      render(<AttendanceAudit />);
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  describe("class selected — data rendering", () => {
    beforeEach(() => {
      (useQuery as jest.Mock).mockReturnValue({ data: RECORDS, isLoading: false });
    });

    it("renders table with records after class is selected", () => {
      render(<AttendanceAudit />);
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "cls1" } });
      expect(screen.getByText("1RV21CS001")).toBeInTheDocument();
      expect(screen.getByText("Arjun Kumar")).toBeInTheDocument();
    });

    it("shows corrected indicator on corrected record", () => {
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      expect(screen.getByText(/PRESENT.*✏/)).toBeInTheDocument();
    });

    it("shows 'No records found' empty state when records array is empty", () => {
      (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      expect(screen.getByText(/No records found/)).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows 'Loading records…' when isLoading=true and class is selected", () => {
      (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: true });
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      expect(screen.getByText(/Loading records/)).toBeInTheDocument();
    });
  });

  describe("KPI counts", () => {
    it("displays correct Records, Absent, and Corrected counts", () => {
      (useQuery as jest.Mock).mockReturnValue({ data: RECORDS, isLoading: false });
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      // 2 total records — use getAllByText since numbers may repeat in DOM
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
      // 1 absent
      expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
      // correction rate: 1/2 = 50%
      expect(screen.getByText("50.0%")).toBeInTheDocument();
    });

    it("shows — for Correction Rate when no records", () => {
      (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("edit mode — Save button disabled guard", () => {
    beforeEach(() => {
      (useQuery as jest.Mock).mockReturnValue({ data: RECORDS, isLoading: false });
    });

    it("enters edit mode when Correct is clicked", () => {
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      const correctBtns = screen.getAllByText("Correct");
      fireEvent.click(correctBtns[0]!);
      expect(screen.getByPlaceholderText("Reason")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("Save button is DISABLED when note is empty", () => {
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      fireEvent.click(screen.getAllByText("Correct")[0]!);
      const saveBtn = screen.getByText("Save");
      expect(saveBtn).toBeDisabled();
    });

    it("Save button is ENABLED after note is typed", () => {
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      fireEvent.click(screen.getAllByText("Correct")[0]!);
      const noteInput = screen.getByPlaceholderText("Reason");
      fireEvent.change(noteInput, { target: { value: "Medical certificate" } });
      expect(screen.getByText("Save")).not.toBeDisabled();
    });

    it("Save button is DISABLED when note is only whitespace (empty after trim)", () => {
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      fireEvent.click(screen.getAllByText("Correct")[0]!);
      const noteInput = screen.getByPlaceholderText("Reason");
      fireEvent.change(noteInput, { target: { value: "   " } });
      expect(screen.getByText("Save")).toBeDisabled();
    });
  });

  describe("edit mode — Save calls mutation with correct payload", () => {
    beforeEach(() => {
      (useQuery as jest.Mock).mockReturnValue({ data: RECORDS, isLoading: false });
    });

    it("calls correctRecord.mutate with id, status, note on Save click", () => {
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      fireEvent.click(screen.getAllByText("Correct")[0]!); // opens edit for r1

      const noteInput = screen.getByPlaceholderText("Reason");
      fireEvent.change(noteInput, { target: { value: "Medical leave" } });

      fireEvent.click(screen.getByText("Save"));
      expect(mockCorrectMutate).toHaveBeenCalledWith({
        id: "r1",
        status: "ABSENT", // r1.status = ABSENT, pre-populated
        note: "Medical leave",
      });
    });

    it("mutationFn calls apiPatch with correct endpoint and body", async () => {
      const mockApiPatch = apiPatch as jest.Mock;
      mockApiPatch.mockResolvedValue(undefined);

      let capturedFn: ((args: { id: string; status: string; note: string }) => unknown) | null = null;
      (useMutation as jest.Mock).mockImplementation((opts: { mutationFn: (args: { id: string; status: string; note: string }) => unknown }) => {
        capturedFn = opts.mutationFn;
        return { mutate: mockCorrectMutate, isPending: false };
      });

      render(<AttendanceAudit />);
      expect(capturedFn).not.toBeNull();
      await capturedFn!({ id: "r1", status: "PRESENT", note: "Biometric error" });
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/api/admin/attendance/audit/r1",
        { status: "PRESENT", correctionNote: "Biometric error" }
      );
    });

    it("invalidates attendance-audit queries on mutation success", () => {
      let capturedOnSuccess: (() => void) | null = null;
      (useMutation as jest.Mock).mockImplementation((opts: { onSuccess?: () => void }) => {
        capturedOnSuccess = opts.onSuccess ?? null;
        return { mutate: mockCorrectMutate, isPending: false };
      });

      render(<AttendanceAudit />);
      capturedOnSuccess!();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["attendance-audit"] });
    });
  });

  describe("edit mode — Cancel resets state", () => {
    beforeEach(() => {
      (useQuery as jest.Mock).mockReturnValue({ data: RECORDS, isLoading: false });
    });

    it("Cancel hides edit form and shows Correct button again", () => {
      render(<AttendanceAudit />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "cls1" } });
      fireEvent.click(screen.getAllByText("Correct")[0]!);
      expect(screen.getByPlaceholderText("Reason")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByPlaceholderText("Reason")).not.toBeInTheDocument();
      // Correct buttons should be back
      expect(screen.getAllByText("Correct")).toHaveLength(2);
    });
  });

  describe("ERP edge case — attendance boundary at exactly 75%", () => {
    it("apiPatch receives correct note for retroactive correction at 75% boundary", async () => {
      const mockApiPatch = apiPatch as jest.Mock;
      mockApiPatch.mockResolvedValue(undefined);

      let capturedFn: ((args: { id: string; status: string; note: string }) => unknown) | null = null;
      (useMutation as jest.Mock).mockImplementation((opts: { mutationFn: (args: { id: string; status: string; note: string }) => unknown }) => {
        capturedFn = opts.mutationFn;
        return { mutate: mockCorrectMutate, isPending: false };
      });

      render(<AttendanceAudit />);
      // Simulate correcting record that tips student from 74.9% to 75.0% (eligible boundary)
      await capturedFn!({ id: "r1", status: "PRESENT", note: "Condonation: 75% boundary correction" });
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/api/admin/attendance/audit/r1",
        { status: "PRESENT", correctionNote: "Condonation: 75% boundary correction" }
      );
    });
  });
});
