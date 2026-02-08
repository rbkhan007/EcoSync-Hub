import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Typography, Box, TextField, Button, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, Tabs, Tab, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';

const Friends = () => {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState('');
    const { api } = useAuth();

    const fetchSocialData = useCallback(async () => {
        setLoading(true);
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                api.get('/friends'),
                api.get('/friends/requests')
            ]);
            setFriends(friendsRes.data);
            setRequests(requestsRes.data);
        } catch {
            setError('Failed to load social data');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchSocialData();
    }, [fetchSocialData]);

    const handleSearch = async () => {
        if (!searchQuery) return;
        setSearchLoading(true);
        try {
            // Assume there's a search endpoint or we use the users list with filter
            const response = await api.get(`/auth/users?search=${searchQuery}`);
            setSearchResults(response.data.filter(u => u.id !== api.defaults.headers.common['user-id'])); // Filter self
        } catch {
            setError('Search failed');
        } finally {
            setSearchLoading(false);
        }
    };

    const sendRequest = async (userId) => {
        try {
            await api.post('/friends/request', { friend_id: userId });
            alert('Friend request sent!');
            setSearchResults(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send request');
        }
    };

    const acceptRequest = async (requestId) => {
        try {
            await api.post(`/friends/accept/${requestId}`);
            alert('Request accepted!');
            fetchSocialData();
        } catch {
            alert('Failed to accept request');
        }
    };

    if (loading && tabValue !== 2) return <div className="page-container">Loading...</div>;

    return (
        <Box className="page-container fade-in">
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, textAlign: 'center' }}>Social Hub</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>Connect with fellow eco-warriors and friends</Typography>

            <Tabs
                value={tabValue}
                onChange={(e, v) => setTabValue(v)}
                centered
                sx={{ mb: 4, '& .MuiTabs-indicator': { backgroundColor: '#4caf50' }, '& .MuiTab-root.Mui-selected': { color: '#4caf50' } }}
            >
                <Tab label={`Friends (${friends.length})`} />
                <Tab label={`Requests (${requests.length})`} />
                <Tab label="Find Friends" />
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {tabValue === 0 && (
                <Box>
                    {friends.length === 0 ? (
                        <Typography align="center" color="text.secondary">No friends yet. Start connecting!</Typography>
                    ) : (
                        <List>
                            {friends.map((friend) => (
                                <Card key={friend.id} className="card" sx={{ mb: 2 }}>
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar src={friend.avatar_url} sx={{ bgcolor: '#4caf50' }}>
                                                {friend.username?.charAt(0).toUpperCase() || 'U'}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={friend.username || 'Anonymous'}
                                            secondary={`Member since ${friend.created_at ? new Date(friend.created_at).toLocaleDateString() : 'N/A'}`}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button variant="outlined" size="small" component={Link} to={`/profile/${friend.id}`} sx={{ color: '#4caf50', borderColor: '#4caf50' }}>
                                                Profile
                                            </Button>
                                            <Button variant="contained" size="small" component={Link} to={`/messages?user=${friend.id}`} sx={{ backgroundColor: '#2196f3', '&:hover': { backgroundColor: '#1976d2' } }}>
                                                Message
                                            </Button>
                                        </Box>
                                    </ListItem>
                                </Card>
                            ))}
                        </List>
                    )}
                </Box>
            )}

            {tabValue === 1 && (
                <Box>
                    {requests.length === 0 ? (
                        <Typography align="center" color="text.secondary">No pending requests.</Typography>
                    ) : (
                        <List>
                            {requests.map((req) => (
                                <Card key={req.id} className="card" sx={{ mb: 2 }}>
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar src={req.avatar_url} sx={{ bgcolor: '#4caf50' }}>
                                                {req.username?.charAt(0).toUpperCase() || 'U'}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={req.username || 'User'} secondary="Sent you a friend request" />
                                        <Button
                                            variant="contained"
                                            startIcon={<CheckIcon />}
                                            onClick={() => acceptRequest(req.request_id)}
                                            sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                                        >
                                            Accept
                                        </Button>
                                    </ListItem>
                                </Card>
                            ))}
                        </List>
                    )}
                </Box>
            )}

            {tabValue === 2 && (
                <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
                        <TextField
                            fullWidth
                            placeholder="Enter username to search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            disabled={searchLoading}
                            sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                        >
                            {searchLoading ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
                        </Button>
                    </Box>

                    <List>
                        {searchResults.map((user) => (
                            <Card key={user.id} className="card" sx={{ mb: 2 }}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar src={user.avatar_url} sx={{ bgcolor: '#4caf50' }}>
                                            {user.username?.charAt(0).toUpperCase() || 'U'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={user.username || 'User'} secondary={user.bio || "No bio available"} />
                                    <Button
                                        variant="contained"
                                        startIcon={<PersonAddIcon />}
                                        onClick={() => sendRequest(user.id)}
                                        sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                                    >
                                        Connect
                                    </Button>
                                </ListItem>
                            </Card>
                        ))}
                    </List>
                </Box>
            )}
        </Box>
    );
};

export default Friends;




