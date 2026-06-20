import axios from 'axios';

const GATEWAY = import.meta.env.VITE_API_URL || 'https://task-manager-xp1g.onrender.com/api/v1';

const BASE_URLS = {
    AUTH: GATEWAY,
    TASKS: GATEWAY,
    GROUPS: GATEWAY,
    SCHEDULER: `${GATEWAY}/scheduler`
};

const createApiInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Add interceptor to attach token
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = token;
        }
        return config;
    });

    // Add interceptor to handle session expiry
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            const is401 = error.response && error.response.status === 401;
            const isJwtExpired = error.response && error.response.data && 
                                (JSON.stringify(error.response.data).toLowerCase().includes('jwt expired') || 
                                 JSON.stringify(error.response.data).toLowerCase().includes('tokenexpirederror'));

            if (is401 || isJwtExpired) {
                // Dispatch custom event for session expiry
                window.dispatchEvent(new CustomEvent('session-expired'));
                localStorage.removeItem('token');
            }
            return Promise.reject(error);
        }
    );

    return instance;
};

const authApi = createApiInstance(BASE_URLS.AUTH);
const tasksApi = createApiInstance(BASE_URLS.TASKS);
const groupsApi = createApiInstance(BASE_URLS.GROUPS);
const schedulerApi = createApiInstance(BASE_URLS.SCHEDULER);

export const authService = {
    login: async (email, password) => {
        const response = await authApi.post('/login', {
            email: email,
            password: password,
        });
        return response;
    },
    createUser: async (userData) => {
        const response = await authApi.post('/createUser', userData);
        return response.data;
    },
    OauthCreation: async (token) => {
        const response = await authApi.post('/oauthcreation', {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response;
    },
    otpVerification: async (otp, email) => {
        const res = await authApi.post('/otpverification', { otp, email });
        return res;
    }
};

export const groupService = {
    getGroups: async () => {
        const response = await groupsApi.get("/group/groups");
        return response;
    },
    createGroups: async (name, description = "", workspaceType = "Personal", members = []) => {
        const response = await groupsApi.post(
            '/group/groups',
            { name, description, workspaceType, members }
        );
        return response.data;
    },
    updateGroup: async (groupId, body) => {
        const response = await groupsApi.put(`/group/${groupId}/update`, { body });
        return response.data;
    },
    deleteGroup: async (id) => {
        const response = await groupsApi.delete(`/group/groups/${id}`);
        return response.data;
    },
    scheduleTasks: async (groupId, constraints = {}) => {
        const response = await groupsApi.post(`/group/groups/${groupId}/schedule`, constraints);
        return response.data;
    }
};

export const taskSERVICES = {
    getALLTASKS: async (groupId) => {
        const response = await tasksApi.get(`/task/${groupId}/tasks`);
        return response.data;
    },
    createTASK: async (groupId, taskData) => {
        const response = await tasksApi.post(`/task/${groupId}/tasks`, taskData);
        return response.data;
    },
    updateTASK: async (groupId, taskId, updateData) => {
        const response = await tasksApi.patch(`/task/${groupId}/tasks/${taskId}`, updateData);
        return response.data;
    },
    deleteTASK: async (groupId, taskId) => {
        const response = await tasksApi.delete(`/task/${groupId}/tasks/${taskId}`);
        return response.data;
    }
};

export const adminService = {
    getAllUsers: async () => {
        const response = await authApi.get('/admin/users');
        return response.data;
    },
    deleteUser: async (userId) => {
        const response = await authApi.delete(`/admin/users/${userId}`);
        return response.data;
    },
    getAllGroups: async () => {
        const response = await groupsApi.get('/group/admin/all');
        return response.data;
    },
    deleteGroup: async (groupId) => {
        const response = await groupsApi.delete(`/group/admin/${groupId}`);
        return response.data;
    },
    getAllTasks: async () => {
        const response = await tasksApi.get('/task/admin/all');
        return response.data;
    },
    deleteTask: async (taskId) => {
        const response = await tasksApi.delete(`/task/admin/${taskId}`);
        return response.data;
    }
};

export const schedulerService = {
    generateSchedule: async (tasks, constraints, policy, algorithmType) => {
        const response = await schedulerApi.post('/generate', {
            tasks,
            constraints,
            policy,
            algorithmType
        });
        return response.data;
    }
};

export default {
    authService,
    groupService,
    taskSERVICES,
    adminService,
    schedulerService
};
