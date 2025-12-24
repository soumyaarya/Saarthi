import axios from 'axios';

const API_URL = 'http://localhost:5000/api/assignments';

// Helper to get current user ID
const getUserId = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo)._id : null;
};

export const base44 = {
    entities: {
        Assignment: {
            list: async (sort) => {
                const userId = getUserId();
                if (!userId) return []; // Should handle this better (redirect to auth)

                const response = await axios.get(`${API_URL}?userId=${userId}`);
                return response.data;
            },
            create: async (data) => {
                const userId = getUserId();
                const response = await axios.post(API_URL, { ...data, userId });
                return response.data;
            },
            update: async (id, data) => {
                const response = await axios.put(`${API_URL}/${id}`, data);
                return response.data;
            },
            delete: async (id) => {
                const response = await axios.delete(`${API_URL}/${id}`);
                return response.data;
            }
        }
    }
};
