import { writable } from 'svelte/store';
import api from '../services/api';
import { orderStore } from './order';
import { navigation } from './navigation';

function decodeJwt(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    const fullName = payload.FullName || payload.fullName || payload.name || 'Usuario';
    const email =
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      payload.email ||
      payload.name ||
      '';
    const name = fullName ? fullName.split(' ')[0] : (email ? email.split('@')[0] : 'Usuario');
    return { name, email, fullName };
  } catch (err) {
    return null;
  }
}

function getStoredToken() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
  } catch (e) {
    console.error('Error reading token from localStorage', e);
  }
  return null;
}

function createAuthStore() {
  const initialToken = getStoredToken();
  const initialUser = initialToken ? decodeJwt(initialToken) : null;

  const { subscribe, set, update } = writable({
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!(initialToken && initialUser)
  });

  const login = async (email, password) => {
    try {
      const response = await api.post('/user/Login', { email, password });
      const { accessToken } = response.data;
      if (!accessToken) {
        throw new Error('No se recibió token de acceso');
      }

      try {
        localStorage.setItem('accessToken', accessToken);
      } catch (e) {
        console.error('Error writing token to localStorage', e);
      }
      const user = decodeJwt(accessToken);

      set({
        token: accessToken,
        user,
        isAuthenticated: !!user
      });

      navigation.navigate('home');
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.title ||
        err.message ||
        'Error al iniciar sesión';
      return { success: false, message };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('accessToken');
    } catch (e) {
      console.error('Error removing token from localStorage', e);
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false
    });
    orderStore.reset();
    navigation.navigate('home');
  };

  const register = async (userData) => {
    try {
      // Saneamiento de datos de registro
      const sanitized = {
        firstName: (userData.firstName || '').trim(),
        lastName: (userData.lastName || '').trim(),
        email: (userData.email || '').trim().toLowerCase(),
        password: userData.password
      };

      const response = await api.post('/user/register', sanitized);
      return { success: true, data: response.data };
    } catch (err) {
      let message = 'Error al registrar usuario';
      if (err.response?.data?.errors) {
        const errorList = Object.values(err.response.data.errors).flat();
        message = errorList.join(', ');
      } else if (err.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err.response?.data?.title) {
        message = err.response.data.title;
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, message };
    }
  };

  return {
    subscribe,
    login,
    logout,
    register
  };
}

export const auth = createAuthStore();
