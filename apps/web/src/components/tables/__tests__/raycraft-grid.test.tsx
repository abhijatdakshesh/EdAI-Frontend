/**
 * @jest-environment jsdom
 *
 * Unit tests: RaycraftGrid component + AG Grid module registration.
 * Covers: ModuleRegistry.registerModules called once at load,
 *         AllCommunityModule passed, wrapper div class, default/custom height,
 *         custom className, AgGridReact prop spread.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// jest.mock factories are hoisted before variable declarations, so we cannot
// reference a const declared in the outer scope inside the factory.
// Use jest.fn() inline and capture the reference after import instead.

jest.mock("ag-grid-community", () => ({
  ModuleRegistry: {
    registerModules: jest.fn(),
  },
  AllCommunityModule: { id: "allCommunity" },
}));

jest.mock("ag-grid-react", () => ({
  AgGridReact: ({ rowData, columnDefs, "data-testid": testId }: {
    rowData?: unknown[];
    columnDefs?: unknown[];
    "data-testid"?: string;
  }) => (
    <div
      data-testid={testId ?? "ag-grid-react"}
      data-rowdata={JSON.stringify(rowData ?? [])}
      data-coldefs={JSON.stringify(columnDefs ?? [])}
    />
  ),
}));

jest.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | false)[]) => args.filter(Boolean).join(" "),
}));

// CSS imports handled by jest moduleNameMapper — no manual mocking needed

// ── Import component after mocks (module executes registerModules at load) ────

import { RaycraftGrid } from "../raycraft-grid";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

// After import, grab the spy reference from the module mock
const mockRegisterModules = ModuleRegistry.registerModules as jest.Mock;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RaycraftGrid", () => {
  describe("module registration (at module load time)", () => {
    it("ModuleRegistry.registerModules is called exactly once", () => {
      // The module-level call happens on first import; subsequent re-imports
      // are cached by Node module system. One call at module init.
      expect(mockRegisterModules).toHaveBeenCalledTimes(1);
    });

    it("AllCommunityModule is passed to registerModules", () => {
      expect(mockRegisterModules).toHaveBeenCalledWith([AllCommunityModule]);
    });
  });

  describe("wrapper div", () => {
    it("renders a div with class 'ag-theme-alpine'", () => {
      const { container } = render(<RaycraftGrid />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("ag-theme-alpine");
    });

    it("renders a div with class 'ag-theme-raycraft'", () => {
      const { container } = render(<RaycraftGrid />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("ag-theme-raycraft");
    });
  });

  describe("height prop", () => {
    it("default height prop is 360 applied via style", () => {
      const { container } = render(<RaycraftGrid />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.height).toBe("360px");
    });

    it("custom numeric height prop is applied via style", () => {
      const { container } = render(<RaycraftGrid height={600} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.height).toBe("600px");
    });

    it("custom string height prop is applied via style", () => {
      const { container } = render(<RaycraftGrid height="50vh" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.height).toBe("50vh");
    });
  });

  describe("className prop", () => {
    it("custom className is merged via cn() into wrapper div", () => {
      const { container } = render(<RaycraftGrid className="my-custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("my-custom-class");
    });
  });

  describe("AgGridReact prop spread", () => {
    it("AgGridReact receives extra props via spread", () => {
      const rowData = [{ id: 1 }];
      const columnDefs = [{ field: "id" }];
      render(<RaycraftGrid rowData={rowData} columnDefs={columnDefs} />);
      const grid = screen.getByTestId("ag-grid-react");
      expect(grid.getAttribute("data-rowdata")).toBe(JSON.stringify(rowData));
      expect(grid.getAttribute("data-coldefs")).toBe(JSON.stringify(columnDefs));
    });
  });
});
