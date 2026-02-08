import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    // Global counters
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);
    const [messageCount, setMessageCount] = useState(0);

    const API_BASE_URL = useMemo(() => import.meta.env.VITE_API_URL || 'http://localhost:5000/api', []);
    const SOCKET_URL = useMemo(() => API_BASE_URL.replace('/api', ''), [API_BASE_URL]);

    // Create axios instance - Memoized to prevent recreation on every render
    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: API_BASE_URL,
        });

        // Add request interceptor to attach token
        instance.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
        return instance;
    }, [API_BASE_URL]);

    const logout = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
        localStorage.removeItem('token');
        setUser(null);
        setCartCount(0);
        setWishlistCount(0);
        setNotificationCount(0);
        setMessageCount(0);
    }, [socket]);

    // Socket initialization
    const initSocket = useCallback((token) => {
        if (!token) return;

        // Only create a new socket if it doesn't exist
        setSocket(prevSocket => {
            if (prevSocket) return prevSocket;

            const newSocket = io(SOCKET_URL, {
                auth: { token }
            });
            return newSocket;
        });
    }, [SOCKET_URL]);

    // Fetch global counts (Cart, Wishlist, Notifications, Messages)
    const updateCounts = useCallback(async () => {
        try {
            const [cartRes, wishlistRes, notifRes, msgRes] = await Promise.all([
                api.get('/cart'),
                api.get('/wishlist'),
                api.get('/notifications'),
                api.get('/messages/unread-count')
            ]);
            setCartCount(cartRes.data.length || 0);
            setWishlistCount(wishlistRes.data.length || 0);
            setNotificationCount(notifRes.data.filter(n => !n.is_read).length);
            setMessageCount(msgRes.data.unread || 0);
        } catch (error) {
            console.error('Failed to update counts', error);
        }
    }, [api]);

    const fetchUserData = useCallback(async () => {
        try {
            const response = await api.get('/profile');
            if (response.data) {
                setUser(response.data);
                // Fetch counts after user is loaded
                updateCounts();
            }
        } catch (err) {
            console.error('Failed to fetch user data', err);
            logout();
        } finally {
            setLoading(false);
        }
    }, [api, logout, updateCounts]);

    // Check for existing token on app load
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserData();
            initSocket(token);
        } else {
            setLoading(false);
        }
    }, [fetchUserData, initSocket]);

    const login = useCallback(async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;
            localStorage.setItem('token', token);
            setUser({ ...userData, token });
            initSocket(token);
            updateCounts(); // Update counts on login
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    }, [api, initSocket, updateCounts]);

    const register = useCallback(async (userData) => {
        try {
            await api.post('/auth/register', userData);
            return { success: true, message: 'Registration successful' };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    }, [api]);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get('/profile');
            if (response.data) {
                setUser(response.data);
            }
        } catch (err) {
            console.error('Failed to refresh user data', err);
        }
    }, [api]);

    const value = useMemo(() => ({
        user,
        login,
        register,
        logout,
        api,
        loading,
        socket,
        cartCount,
        wishlistCount,
        notificationCount,
        messageCount,
        updateCounts,
        refreshUser
    }), [user, login, register, logout, api, loading, socket, cartCount, wishlistCount, notificationCount, messageCount, updateCounts, refreshUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
