import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_BASE_URL.replace('/api', '');

export const useRealtime = () => {
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            auth: {
                token: localStorage.getItem('token')
            }
        });

        socket.on('connect', () => {
            console.log('Real-time socket connected');
        });

        socket.on('db_update', (payload) => {
            console.log('Real-time DB Update received:', payload);
            setLastUpdate(payload);
        });

        socket.on('disconnect', () => {
            console.log('Real-time socket disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return lastUpdate;
};
