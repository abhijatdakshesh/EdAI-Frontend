// Required by src/auth.ts at module load time — prevents "AUTH_SECRET env var is required" throw
process.env.AUTH_SECRET = 'test-secret-for-jest-do-not-use-in-production';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Ensure fetch exists in Node (Jest runs in Node for these tests, not jsdom)
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  } as unknown as Response);
}
