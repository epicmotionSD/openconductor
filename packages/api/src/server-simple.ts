import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Basic API endpoint
app.get('/v1/servers', (req, res) => {
  res.json({
    success: true,
    data: {
      servers: [
        {
          id: "1",
          slug: "openmemory",
          name: "OpenMemory",
          tagline: "Hierarchical memory for AI agents",
          category: "memory",
          tags: ["memory", "ai", "agents"],
          repository: {
            url: "https://github.com/openai/openmemory",
            owner: "openai", 
            name: "openmemory",
            stars: 1600
          },
          installation: {
            cli: "openconductor install openmemory"
          },
          verified: true,
          featured: true
        }
      ]
    }
  });
});

// Start server IMMEDIATELY
app.listen(PORT, () => {
  console.log(`🚀 OpenConductor API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API endpoint: http://localhost:${PORT}/v1/servers`);
});

export default app;