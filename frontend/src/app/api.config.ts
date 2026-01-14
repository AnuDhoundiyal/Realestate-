export const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const apiUrl = isLocal ? 'http://localhost:5000/api' : '/api';
