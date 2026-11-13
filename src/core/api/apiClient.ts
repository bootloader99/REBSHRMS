import { appConfig } from '../../config/appConfig';

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody { message?: string; error?: string; code?: string; }

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.api.timeoutMs);
  try {
    const response = await fetch(`${appConfig.api.baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-Mock-Scenario': appConfig.api.mockScenario, ...(options.headers as Record<string, string> | undefined) },
    });
    const body = await response.json().catch(() => null) as T | ApiErrorBody | null;
    if (!response.ok) {
      const errorBody = body as ApiErrorBody | null;
      throw new ApiError(
        errorBody?.message ?? errorBody?.error ?? `Request failed (${response.status}).`,
        response.status,
        errorBody?.code,
      );
    }
    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}
