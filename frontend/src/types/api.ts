// TypeScript Types - API
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}
