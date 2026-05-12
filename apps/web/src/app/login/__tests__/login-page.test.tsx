/**
 * @jest-environment jsdom
 *
 * KAN-27: after a successful sign-in the URL changed but the UI stayed on the
 * login form until a manual refresh. The fix calls router.refresh() AND
 * router.replace(home) once getSession() resolves the role. These tests pin
 * that behavior in place.
 */

import React from "react";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
    push: jest.fn(),
  }),
}));

const mockSignIn = jest.fn();
const mockGetSession = jest.fn();
const mockUseSession = jest.fn(() => ({ data: null, status: "unauthenticated" }));

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  getSession: (...args: unknown[]) => mockGetSession(...args),
  useSession: () => mockUseSession(),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type = "button",
    disabled,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    type?: "button" | "submit";
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
  }) => (
    <button type={type} disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

import LoginPage from "../page";

beforeEach(() => {
  mockReplace.mockClear();
  mockRefresh.mockClear();
  mockSignIn.mockReset();
  mockGetSession.mockReset();
  mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
});

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.submit(screen.getByRole("button", { name: /continue|signing/i }).closest("form")!);
}

describe("LoginPage — KAN-27 navigates after successful signIn without manual refresh", () => {
  it("STUDENT login: calls router.refresh() AND router.replace('/student/dashboard')", async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null });
    mockGetSession.mockResolvedValue({ user: { role: "STUDENT", email: "s@rvce.edu" } });

    render(<LoginPage />);
    await act(async () => {
      fillAndSubmit("s@rvce.edu", "Student@123");
    });

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
    expect(mockSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ email: "s@rvce.edu", password: "Student@123", redirect: false }),
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith("/student/dashboard");
  });

  it("ADMIN login: replaces to /dashboard", async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null });
    mockGetSession.mockResolvedValue({ user: { role: "ADMIN", email: "a@rvce.edu" } });

    render(<LoginPage />);
    await act(async () => {
      fillAndSubmit("a@rvce.edu", "Admin@123");
    });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard"));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("PARENT login: replaces to /parent/dashboard", async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null });
    mockGetSession.mockResolvedValue({ user: { role: "PARENT", email: "p@rvce.edu" } });

    render(<LoginPage />);
    await act(async () => {
      fillAndSubmit("p@rvce.edu", "Parent@123");
    });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/parent/dashboard"));
  });

  it("falls back to /dashboard when getSession returns no role", async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null });
    mockGetSession.mockResolvedValue(null);

    render(<LoginPage />);
    await act(async () => {
      fillAndSubmit("x@rvce.edu", "P@ssword1");
    });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard"));
  });

  it("does NOT navigate on signIn error — surfaces the inline error message", async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: "CredentialsSignin" });

    render(<LoginPage />);
    await act(async () => {
      fillAndSubmit("bad@rvce.edu", "wrong");
    });

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(
      screen.getByText(/invalid email or password/i),
    ).toBeInTheDocument();
  });
});
