import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_BASE_URL.replace('/api', '');

export const useRealtime = () => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socketInstance = io(SOCKET_URL, {
            transports: ['websocket'],
            auth: { token }
        });

        socketInstance.on('connect', () => {
            console.log('Real-time socket connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Real-time socket disconnected');
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return { socket, isConnected };
};
