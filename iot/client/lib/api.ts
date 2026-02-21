import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 8000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
