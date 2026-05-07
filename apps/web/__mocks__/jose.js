// CJS mock for jose — avoids ESM errors in Jest node env
const SignJWT = jest.fn().mockImplementation(() => ({
  setProtectedHeader: jest.fn().mockReturnThis(),
  setIssuedAt: jest.fn().mockReturnThis(),
  setExpirationTime: jest.fn().mockReturnThis(),
  setSubject: jest.fn().mockReturnThis(),
  sign: jest.fn().mockResolvedValue('mock.jwt.token'),
}));
const jwtVerify = jest.fn().mockResolvedValue({ payload: {}, protectedHeader: {} });
const importJWK = jest.fn().mockResolvedValue({});
const generateSecret = jest.fn().mockResolvedValue({});

module.exports = { SignJWT, jwtVerify, importJWK, generateSecret };
