import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';

const API_URL = API_ENDPOINTS.ASSIGNMENTS;

// Helper to get auth headers with JWT token
const getAuthHeaders = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const { token } = JSON.parse(userInfo);
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }
    return {};
};

export const base44 = {
    entities: {
        Assignment: {
            list: async (sort) => {
                const response = await axios.get(API_URL, getAuthHeaders());
                return response.data;
            },
            create: async (data) => {
                const response = await axios.post(API_URL, data, getAuthHeaders());
                return response.data;
            },
            update: async (id, data) => {
                const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
                return response.data;
            },
            delete: async (id) => {
                const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
                return response.data;
            }
        }
    }
};

