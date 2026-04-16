import { axiosInstance } from "./url.service";

export const adminLogin = async (email, password) => {
    try {
        const response = await axiosInstance.post("/admin/login", { email, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getDashboardStats = async () => {
    try {
        const response = await axiosInstance.get("/admin/dashboard");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAllUsers = async (page = 1, search = '') => {
    try {
        const response = await axiosInstance.get(`/admin/users?page=${page}&search=${search}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getUserDetails = async (userId) => {
    try {
        const response = await axiosInstance.get(`/admin/users/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const toggleUserBlock = async (userId) => {
    try {
        const response = await axiosInstance.put(`/admin/users/${userId}/toggle-block`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteUser = async (userId) => {
    try {
        const response = await axiosInstance.delete(`/admin/users/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getReports = async (status = 'pending', page = 1) => {
    try {
        const response = await axiosInstance.get(`/admin/reports?status=${status}&page=${page}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const resolveReport = async (reportId, action, status) => {
    try {
        const response = await axiosInstance.put(`/admin/reports/${reportId}/resolve`, { action, status });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAnalytics = async (period = '7') => {
    try {
        const response = await axiosInstance.get(`/admin/analytics?period=${period}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
