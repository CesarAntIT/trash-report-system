import { useEffect } from 'react';
import { router } from 'expo-router';

// El formulario de registro está integrado en login.tsx (modo 'register').
// Esta ruta redirige al login para que el usuario use el formulario correcto.
export default function RegisterScreen() {
  useEffect(() => {
    router.replace('/(auth)/login');
  }, []);
  return null;
}
