import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to extract clean server error messages
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend returns a formatted success = false error, extract its message
    const backendMessage = error.response?.data?.message;
    const fallbackMessage = error.message || 'An unexpected network error occurred.';
    const formattedError = backendMessage || fallbackMessage;
    
    return Promise.reject(formattedError);
  }
);

export default client;
