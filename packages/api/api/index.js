// Vercel serverless function entry point
// Use require() for compatibility with Vercel's Node.js runtime
const app = require('../dist/server').default;

module.exports = app;
