/**
 * OpenConductor API Client
 * Production-ready HTTP client for backend API communication
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    version: string;
    requestId: string;
    executionTime?: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

class APIClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api.openconductor.ai';
  }

  /**
   * Set authentication tokens
   */
  setAuth(token: string, refreshToken?: string) {
    this.token = token;
    this.refreshToken = refreshToken || null;
  }

  /**
   * Clear authentication tokens
   */
  clearAuth() {
    this.token = null;
    this.refreshToken = null;
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      throw new APIError(
        data.error?.message || `HTTP ${response.status}`,
        response.status,
        data.error?.code || 'HTTP_ERROR',
        data.error?.details
      );
    }

    return data;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<APIResponse<T>> {
    const headers = { ...this.getAuthHeaders() };
    delete headers['Content-Type']; // Let browser set multipart boundary

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<APIResponse<any>> {
    return this.get('/health');
  }
}

/**
 * API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }

  get isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR';
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isValidationError(): boolean {
    return this.status === 400 || this.code === 'VALIDATION_ERROR';
  }

  get isNotFoundError(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Request interceptor for retry logic
 */
export class RetryableAPIClient extends APIClient {
  private maxRetries = 3;
  private retryDelay = 1000;

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 1
  ): Promise<APIResponse<T>> {
    try {
      return await super['request']<T>(endpoint, options);
    } catch (error) {
      if (error instanceof APIError && attempt < this.maxRetries) {
        if (error.isServerError || error.isNetworkError) {
          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * attempt)
          );
          return this.request<T>(endpoint, options, attempt + 1);
        }
      }
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new RetryableAPIClient();
export default apiClient;