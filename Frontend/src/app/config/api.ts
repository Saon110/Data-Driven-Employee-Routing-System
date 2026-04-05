export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

// Keep empty for current backend routes (e.g. /auth/login). Set to '/v1' if backend adds version prefix.
export const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? '';

export const apiUrl = (path: string) => `${API_BASE_URL}${API_PREFIX}${path}`;
