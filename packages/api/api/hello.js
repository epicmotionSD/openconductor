// Minimal serverless function
module.exports = (req, res) => {
  res.json({ hello: 'world', time: Date.now() });
};
