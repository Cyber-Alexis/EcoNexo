export const environment = {
  production: false,
  apiUrl: typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'  // Desarrollo local sin Docker
    : '/api'                        // Docker / ngrok: el proxy de Angular reenvía al backend
};
