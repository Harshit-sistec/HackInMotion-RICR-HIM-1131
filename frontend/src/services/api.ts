export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('nova_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (!response.ok || json.error) {
    throw new Error(json.error?.message || 'API Error');
  }

  return json.data;
}
