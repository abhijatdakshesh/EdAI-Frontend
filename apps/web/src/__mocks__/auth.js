// Jest manual mock for src/auth.ts — keeps next-auth ESM out of test runs
const auth = jest.fn(() => Promise.resolve(null));
const signIn = jest.fn();
const signOut = jest.fn();
const handlers = { GET: jest.fn(), POST: jest.fn() };

module.exports = { auth, signIn, signOut, handlers };
