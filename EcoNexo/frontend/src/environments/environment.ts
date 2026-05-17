export const environment = {
  production: false,
  // Detectar si estamos en Docker o desarrollo local
  apiUrl: typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api'  // Desarrollo local
    : '/api'
};
