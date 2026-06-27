// Simple test endpoint - using Vercel's expected function format
module.exports = function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'OpenConductor API is alive',
    time: new Date().toISOString()
  });
};
