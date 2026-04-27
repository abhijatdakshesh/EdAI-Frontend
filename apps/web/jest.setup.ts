// Ensure fetch exists in Node (Jest runs in Node for these tests, not jsdom)
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  } as unknown as Response);
}
