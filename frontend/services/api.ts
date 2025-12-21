import { User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const setToken = (token: string) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');
export const removeToken = () => localStorage.removeItem('token');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            removeToken();
            // Optionally trigger global logout event
            throw new Error("Unauthorized");
        }
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'API request failed');
    }

    return response.json();
}

export const auth = {
    register: (data: any) => request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => request<{ access_token: string }>('/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data)
    }),
    me: () => request<User>('/auth/me'),
};

export const stories = {
    list: () => request<any[]>('/stories'),
    create: (data: any) => request<any>('/stories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/stories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/stories/${id}`, { method: 'DELETE' }),
    review: (id: string, index: number, quality: number) =>
        request<any>(`/stories/${id}/review`, { method: 'POST', body: JSON.stringify({ associationIndex: index, quality }) }),
};

export const playlists = {
    list: () => request<any[]>('/playlists'),
    create: (data: any) => request<any>('/playlists', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => request<any>(`/playlists/${id}`),
    delete: (id: string) => request<void>(`/playlists/${id}`, { method: 'DELETE' }),
    addStory: (id: string, storyId: string) => request<any>(`/playlists/${id}/stories/${storyId}`, { method: 'POST' }),
    removeStory: (id: string, storyId: string) => request<any>(`/playlists/${id}/stories/${storyId}`, { method: 'DELETE' }),
};

export default request;
