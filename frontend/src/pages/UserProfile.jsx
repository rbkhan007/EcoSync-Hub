import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import { Box, Typography, Card, CardContent, Grid, Avatar, Button, Chip, Divider, CircularProgress, Alert } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AirIcon from '@mui/icons-material/Air';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ForestIcon from '@mui/icons-material/Forest';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { api } = useAuth();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/auth/user/${id}`);
                setUser(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id, api]);

    const handleAddFriend = async () => {
        try {
            await api.post('/friends/request', { friend_id: id });
            alert('Friend request sent to the warrior!');
        } catch {
            alert('Could not send friend request. You might already be connected.');
        }
    };

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Box className="page-container"><Alert severity="error">{error}</Alert></Box>;
    if (!user) return <Box className="page-container"><Typography>Eco-warrior not found.</Typography></Box>;

    return (
        <Box className="page-container fade-in">
            <Grid container spacing={4} justifyContent="center">
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card className="card" sx={{ p: 0, overflow: 'visible', textAlign: 'center' }}>
                        {/* Header Background Decoration */}
                        <Box sx={{
                            height: 120,
                            borderRadius: '24px 24px 0 0',
                            background: 'linear-gradient(135deg, var(--primary-main) 0%, var(--primary-dark) 100%)',
                            opacity: 0.8
                        }} />

                        <Box sx={{ px: { xs: 3, md: 6 }, pb: 6, position: 'relative' }}>
                            <Avatar
                                src={getImageUrl(user.avatar_url)}
                                sx={{
                                    width: 180,
                                    height: 180,
                                    mx: 'auto',
                                    mt: -12,
                                    mb: 3,
                                    border: '8px solid white',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                                    bgcolor: 'var(--primary-main)',
                                    fontSize: '5rem'
                                }}
                            >
                                {user.username?.charAt(0).toUpperCase()}
                            </Avatar>

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h2" sx={{ fontWeight: 900, mb: 1 }}>{user.username}</Typography>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                                    <Chip label="ELITE WARRIOR" sx={{ bgcolor: 'var(--primary-main)', color: 'white', fontWeight: 900 }} />
                                    <Chip label="VERIFIED" variant="outlined" sx={{ fontWeight: 800 }} />
                                </Box>
                                <Typography variant="h6" color="text.secondary" sx={{
                                    maxWidth: 600,
                                    mx: 'auto',
                                    lineHeight: 1.6,
                                    fontStyle: user.bio ? 'normal' : 'italic',
                                    bgcolor: 'rgba(0,0,0,0.02)',
                                    p: 2,
                                    borderRadius: '16px'
                                }}>
                                    {user.bio || "This warrior is yet to pen their eco-story."}
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 6 }} />

                            <Grid container spacing={3} sx={{ mb: 6 }}>
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: '20px' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Eco Points</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                                            <EmojiEventsIcon color="primary" sx={{ fontSize: 24 }} />
                                            <Typography variant="h4" sx={{ fontWeight: 900 }}>{user.eco_points}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <Box sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)', borderRadius: '20px' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>CO2 Saved</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                                            <AirIcon color="secondary" sx={{ fontSize: 24 }} />
                                            <Typography variant="h4" sx={{ fontWeight: 900 }}>{user.carbon_saved_kg}kg</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.05)', borderRadius: '20px' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Rank</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, mt: 1, color: '#ed6c02' }}>Guardian</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <Box sx={{ p: 2, bgcolor: 'rgba(156, 39, 176, 0.05)', borderRadius: '20px' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Impact</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                                            <ForestIcon color="success" sx={{ fontSize: 24 }} />
                                            <Typography variant="h4" sx={{ fontWeight: 900 }}>{user.trees_planted}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                                <Button
                                    variant="contained"
                                    component={Link}
                                    to={`/messages`}
                                    state={{ recipient_id: user.id }}
                                    startIcon={<ChatIcon />}
                                    sx={{ borderRadius: '16px', px: 6, py: 2, fontWeight: 900, boxShadow: '0 8px 24px rgba(46, 125, 50, 0.25)' }}
                                >
                                    Initiate Transmission
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleAddFriend}
                                    startIcon={<PersonAddIcon />}
                                    sx={{ borderRadius: '16px', px: 6, py: 2, fontWeight: 900, border: '2px solid' }}
                                >
                                    Force Connect
                                </Button>
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default UserProfile;
