// Ensure fetch exists in Node (Jest runs in Node for these tests, not jsdom)
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  } as unknown as Response);
}

// Extend jest matchers with @testing-library/jest-dom when running in jsdom
// (component tests opt-in via @jest-environment jsdom docblock)
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@testing-library/jest-dom');
}
