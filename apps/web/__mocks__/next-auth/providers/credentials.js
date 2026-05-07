// CJS mock for next-auth/providers/credentials
function Credentials(config) { return { type: 'credentials', ...config }; }
module.exports = Credentials;
module.exports.default = Credentials;
