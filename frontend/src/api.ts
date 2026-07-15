import axios, { type AxiosRequestConfig } from 'axios';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  const token = localStorage.getItem('cl_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await axios({
      url: `${API_BASE}${endpoint}`,
      ...options,
      headers,
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || `Request failed`);
  }
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'POST', data }),
  patch: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PATCH', data }),
  put: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PUT', data }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
