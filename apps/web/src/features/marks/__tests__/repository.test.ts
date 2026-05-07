/**
 * Unit tests: marks/repository.ts
 *
 * Covers: USE_MOCK=true bypasses apiClient, USE_MOCK false/undefined calls
 * apiClient.get, apiClient.get rejection falls back to mock,
 * verifyAssessment mock bypass, verifyAssessment calls apiClient.post.
 *
 * NOTE: No @jest-environment jsdom — runs in default Node environment per jest.config.js.
 * process.env must be set BEFORE requiring the module because USE_MOCK is evaluated
 * at module load time (const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === "true").
 * We use jest.resetModules() + require() per test.
 */

// ── Shared mock state ─────────────────────────────────────────────────────────

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
  },
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

// mock-data is a named export — mock it once; the values don't change
jest.mock("@/features/marks/mock-data", () => ({
  mockMarksDashboard: {
    updatedAt: "2025-01-01T00:00:00.000Z",
    flaggedSubmissions: 14,
    assessments: [
      {
        assessmentId: "ASM-ENG-2201",
        courseCode: "ENG2201",
        title: "Internal Assessment 2",
        maxMarks: 30,
        pendingVerification: 5,
      },
    ],
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fresh-load the repository module with a given NEXT_PUBLIC_USE_MOCKS value.
 * jest.resetModules() purges the module registry so the const is re-evaluated.
 */
function loadRepository(useMocks: string | undefined) {
  jest.resetModules();
  if (useMocks === undefined) {
    delete process.env.NEXT_PUBLIC_USE_MOCKS;
  } else {
    process.env.NEXT_PUBLIC_USE_MOCKS = useMocks;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/features/marks/repository") as typeof import("../repository");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("marks/repository.ts — getMarksDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_USE_MOCKS;
  });

  it("returns mockMarksDashboard without calling apiClient when USE_MOCKS==='true'", async () => {
    const { getMarksDashboard } = loadRepository("true");
    const result = await getMarksDashboard();

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.flaggedSubmissions).toBe(14);
    expect(result.assessments[0]?.assessmentId).toBe("ASM-ENG-2201");
  });

  it("calls apiClient.get when USE_MOCKS is undefined (not set)", async () => {
    const apiResponse = {
      updatedAt: "2025-06-01T00:00:00.000Z",
      flaggedSubmissions: 3,
      assessments: [],
    };
    mockGet.mockResolvedValueOnce(apiResponse);

    const { getMarksDashboard } = loadRepository(undefined);
    const result = await getMarksDashboard();

    expect(mockGet).toHaveBeenCalledWith("/academics/marks/dashboard");
    expect(result.flaggedSubmissions).toBe(3);
  });

  it("calls apiClient.get when USE_MOCKS==='false'", async () => {
    const apiResponse = {
      updatedAt: "2025-06-01T00:00:00.000Z",
      flaggedSubmissions: 7,
      assessments: [],
    };
    mockGet.mockResolvedValueOnce(apiResponse);

    const { getMarksDashboard } = loadRepository("false");
    const result = await getMarksDashboard();

    expect(mockGet).toHaveBeenCalledWith("/academics/marks/dashboard");
    expect(result.flaggedSubmissions).toBe(7);
  });

  it("falls back to mockMarksDashboard when apiClient.get rejects", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));

    const { getMarksDashboard } = loadRepository("false");
    const result = await getMarksDashboard();

    // Should not throw; falls back to mock
    expect(result.flaggedSubmissions).toBe(14);
  });
});

describe("marks/repository.ts — verifyAssessment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_USE_MOCKS;
  });

  it("returns without calling apiClient.post when USE_MOCKS==='true'", async () => {
    const { verifyAssessment } = loadRepository("true");
    await verifyAssessment("ASM-123");

    expect(mockPost).not.toHaveBeenCalled();
  });

  it("calls apiClient.post with correct endpoint when USE_MOCKS==='false'", async () => {
    mockPost.mockResolvedValueOnce(undefined);

    const { verifyAssessment } = loadRepository("false");
    await verifyAssessment("ASM-456");

    expect(mockPost).toHaveBeenCalledWith("/academics/marks/verify", { assessmentId: "ASM-456" });
  });

  it("does not throw if apiClient.post rejects (no-op catch)", async () => {
    mockPost.mockRejectedValueOnce(new Error("Endpoint not implemented"));

    const { verifyAssessment } = loadRepository("false");
    await expect(verifyAssessment("ASM-789")).resolves.toBeUndefined();
  });
});
