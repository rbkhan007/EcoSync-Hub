import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, IconButton, Alert, Tooltip } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { api } = useAuth();

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch {
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch {
            console.error('Failed to mark as read');
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch {
            console.error('Failed to delete notification');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'friend': return <PersonAddIcon color="primary" />;
            case 'order': return <LocalShippingIcon color="info" />;
            case 'challenge': return <EmojiEventsIcon color="warning" />;
            case 'success': return <CheckCircleOutlineIcon color="success" />;
            default: return <InfoIcon color="disabled" />;
        }
    };

    if (loading) return <div className="page-container">Loading notifications...</div>;

    return (
        <Box className="page-container fade-in">
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, textAlign: 'center' }}>Activity Hub</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>Real-time updates on your eco-journey</Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {notifications.length === 0 ? (
                <Card className="card">
                    <CardContent sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">You're all caught up! No new notifications.</Typography>
                    </CardContent>
                </Card>
            ) : (
                <List>
                    {notifications.map((n) => (
                        <Card key={n.id} className="card" sx={{ mb: 2, opacity: n.is_read ? 0.7 : 1, transition: '0.3s' }}>
                            <ListItem
                                secondaryAction={
                                    <Box>
                                        {!n.is_read && (
                                            <Tooltip title="Mark as Read">
                                                <IconButton onClick={() => markAsRead(n.id)} size="small">
                                                    <CheckCircleOutlineIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Delete">
                                            <IconButton onClick={() => deleteNotification(n.id)} size="small" color="error">
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: n.is_read ? '#f5f5f5' : '#e8f5e9' }}>
                                        {getIcon(n.type)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: n.is_read ? 'normal' : 'bold' }}>
                                                {n.title}
                                            </Typography>
                                            {!n.is_read && <Chip label="New" color="success" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />}
                                        </Box>
                                    }
                                    secondary={
                                        <Box component="span">
                                            <Typography variant="body2" color="text.primary" component="span" display="block">
                                                {n.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(n.created_at).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </Card>
                    ))}
                </List>
            )}
        </Box>
    );
};

export default Notifications;
