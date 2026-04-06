import * as SecureStore from 'expo-secure-store';

// Cambia esta URL por la IP de tu máquina cuando pruebes en dispositivo físico
// Ej: 'http://192.168.100.52:3000/api'
export const API_URL = 'http://192.168.100.52:3000/api';

export const TOKEN_KEY = 'auth_token';

export async function loginRequest(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al iniciar sesión');
  return data as { token: string; user: { id: string; email: string; name: string } };
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
  phone?: string,
  address?: { latitude: number; longitude: number },
) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone, address }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al registrarse');
  return data as { token: string; user: { id: string; email: string; name: string } };
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function cancelReport(id: string, token: string) {
  const response = await fetch(`${API_URL}/reports/${id}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al cancelar');
  return data;
}
