import { API_CONFIG } from '../config/api';
import { storage } from '../utils/storage';

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; issue: string }>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

class ApiClient {
  private generateRequestId(): string {
    return 'req_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  private getAuthHeader(): Record<string, string> {
    const tokens = storage.get<{ accessToken?: string }>('tokens', {});
    if (tokens?.accessToken) {
      return { Authorization: `Bearer ${tokens.accessToken}` };
    }
    return {};
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit & { idempotencyKey?: string } = {}
  ): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const requestId = this.generateRequestId();

    const headers: Record<string, string> = {
      ...API_CONFIG.HEADERS,
      'X-Request-ID': requestId,
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string> || {}),
    };

    if (options.idempotencyKey) {
      headers['X-Idempotency-Key'] = options.idempotencyKey;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorData: ApiErrorResponse = {
          success: false,
          statusCode: response.status,
          error: {
            code: data?.error?.code || `HTTP_${response.status}`,
            message: data?.error?.message || data?.message || response.statusText || 'An unexpected error occurred.',
            details: data?.error?.details || [],
          },
          meta: {
            requestId: response.headers.get('X-Request-ID') || requestId,
            timestamp: new Date().toISOString(),
          }
        };

        if (response.status === 401) {
          // Token expired or invalid - dispatch unauthorized event
          window.dispatchEvent(new CustomEvent('wabi:unauthorized'));
        }

        throw errorData;
      }

      return data as T;
    } catch (err: any) {
      if (err?.statusCode) {
        throw err;
      }

      // Network failure or abort
      const networkError: ApiErrorResponse = {
        success: false,
        statusCode: 0,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to Wabi SACCO Core Banking servers. Please verify your internet connection.',
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        }
      };
      throw networkError;
    }
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any, options?: RequestInit & { idempotencyKey?: string }): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
