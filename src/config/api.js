// API Configuration - Uses same origin in production (monolithic deployment)
// In development: uses localhost:5000
// In production: uses relative URLs (same origin)

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? 'http://localhost:5000' : '';

export default API_BASE_URL;

// Export specific endpoints
export const API_ENDPOINTS = {
    AUTH: `${API_BASE_URL}/api/auth`,
    ASSIGNMENTS: `${API_BASE_URL}/api/assignments`,
    NOTES: `${API_BASE_URL}/api/notes`,
    HEALTH: `${API_BASE_URL}/api/health`,
};
