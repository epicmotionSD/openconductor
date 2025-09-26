/**
 * OpenConductor Terminal - Main Entry Point
 *
 * Bootstrap the unified Trinity AI + MCP Terminal with Bloomberg Terminal-style interface
 * for OpenConductor AI agent orchestration and MCP server automation platform.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import TrinityMCPUnified from './components/trinity/TrinityMCPUnified';
import './styles/main.css';

// OpenConductor Unified Terminal App Component
const OpenConductorApp: React.FC = () => {
  return (
    <TrinityMCPUnified
      webSocketUrl={(import.meta as any).env?.VITE_WEBSOCKET_URL || 'ws://localhost:8080'}
      autoConnect={true}
      theme="bloomberg"
      onAgentInteraction={(agent, action, data) => {
        console.log(`[OpenConductor] Agent interaction: ${agent} -> ${action}`, data);
        
        // Integration with OpenConductor's backend API for Trinity AI + MCP coordination
      }}
      onMCPInteraction={(action, data) => {
        console.log(`[OpenConductor] MCP interaction: ${action}`, data);
        
        // Integration with MCP backend services
      }}
    />
  );
};

// Initialize Trinity AI Terminal
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <OpenConductorApp />
  </React.StrictMode>
);

// Hot Module Replacement for development
if (typeof window !== 'undefined' && 'hot' in import.meta) {
  (import.meta as any).hot?.accept();
}

// Global error handler for Trinity AI Terminal
window.addEventListener('error', (event) => {
  console.error('[Trinity Terminal] Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Trinity Terminal] Unhandled promise rejection:', event.reason);
});