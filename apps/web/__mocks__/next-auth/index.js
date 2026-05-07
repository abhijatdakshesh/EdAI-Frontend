// CJS mock for next-auth — keeps ESM @auth/core out of Jest's module graph
function NextAuth() {
  return {
    handlers: { GET: jest.fn(), POST: jest.fn() },
    auth: function(handler) {
      return function(req) {
        req.auth = { accessToken: 'test-token', user: { role: 'ADMIN' } };
        return handler(req);
      };
    },
    signIn: jest.fn(),
    signOut: jest.fn(),
  };
}
NextAuth.default = NextAuth;
module.exports = NextAuth;
module.exports.default = NextAuth;
