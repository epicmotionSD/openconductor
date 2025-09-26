const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static(__dirname));

// Route handlers for our marketing pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/platform', (req, res) => {
    res.sendFile(path.join(__dirname, 'platform.html'));
});

app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'pricing.html'));
});

app.get('/enterprise', (req, res) => {
    res.sendFile(path.join(__dirname, 'enterprise.html'));
});

app.get('/customers', (req, res) => {
    res.sendFile(path.join(__dirname, 'trust-signals.html'));
});

// Documentation routes
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

app.get('/docs/*', (req, res) => {
    // For now, serve the main docs page for all doc routes
    res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'blog', 'index.html'));
});

app.get('/blog/*', (req, res) => {
    // For now, serve the main blog page for all blog routes
    res.sendFile(path.join(__dirname, 'blog', 'index.html'));
});

app.get('/community', (req, res) => {
    res.sendFile(path.join(__dirname, 'community.html'));
});

app.get('/enterprise/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'enterprise', 'demo.html'));
});

app.get('/enterprise/*', (req, res) => {
    // Serve enterprise demo page for all enterprise routes
    res.sendFile(path.join(__dirname, 'enterprise', 'demo.html'));
});

app.get('/start-free', (req, res) => {
    res.sendFile(path.join(__dirname, 'start-free.html'));
});

app.get('/auth/login', (req, res) => {
    res.send(`
        <h1>Sign In - OpenConductor</h1>
        <p>User authentication coming soon...</p>
        <a href="/">← Back to Homepage</a>
    `);
});

app.get('/onboarding/*', (req, res) => {
    res.send(`
        <h1>Welcome to OpenConductor!</h1>
        <p>User onboarding coming soon...</p>
        <a href="/">← Back to Homepage</a>
    `);
});

// 404 handler
app.get('*', (req, res) => {
    res.status(404).send(`
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">← Back to Homepage</a>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 OpenConductor Marketing Website running at http://localhost:${PORT}`);
    console.log(`
📄 Available Pages:
   Homepage: http://localhost:${PORT}/
   Platform: http://localhost:${PORT}/platform
   Pricing:  http://localhost:${PORT}/pricing
   Enterprise: http://localhost:${PORT}/enterprise
   Customers: http://localhost:${PORT}/customers
   
🎯 Enterprise Marketing Website Features:
   ✅ Hero section with "Stop the Alert Storm" messaging
   ✅ Trinity AI agent showcase and value propositions
   ✅ Transparent pricing with ROI calculator
   ✅ Enterprise security and compliance messaging
   ✅ Customer testimonials and social proof
   ✅ Advanced analytics and lead scoring
   
Ready for enterprise lead generation! 🏢
    `);
});