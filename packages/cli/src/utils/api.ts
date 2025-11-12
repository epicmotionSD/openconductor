import fetch from 'node-fetch';
import type { MCPServer, MCPServerSearchParams, MCPServerSearchResult } from '@openconductor/shared';

export class OpenConductorAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OPENCONDUCTOR_API_URL || 'https://api.openconductor.ai';
  }

  async searchServers(params: MCPServerSearchParams = {}): Promise<MCPServerSearchResult> {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('query', params.query);
    if (params.category) searchParams.append('category', params.category);
    if (params.tags?.length) searchParams.append('tags', params.tags.join(','));
    if (params.verified !== undefined) searchParams.append('verified', params.verified.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const url = `${this.baseUrl}/api/servers?${searchParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data;
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to connect to OpenConductor API. Please check your internet connection.');
      }
      throw error;
    }
  }

  async getServer(identifier: string): Promise<MCPServer> {
    const url = `${this.baseUrl}/api/servers/${encodeURIComponent(identifier)}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Server '${identifier}' not found`);
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data;
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to connect to OpenConductor API. Please check your internet connection.');
      }
      throw error;
    }
  }

  async getStats(): Promise<any> {
    const url = `${this.baseUrl}/api/servers/stats/categories`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data;
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to connect to OpenConductor API. Please check your internet connection.');
      }
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    const url = `${this.baseUrl}/health`;
    
    try {
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const api = new OpenConductorAPI();