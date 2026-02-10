import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardMedia,
    CardContent,
    Typography,
    IconButton,
    Stack,
    Avatar,
    AvatarGroup,
    Chip,
    Dialog,
    TextField,
    Button,
    CircularProgress,
    Grid
} from '@mui/material';
import {
    Favorite,
    FavoriteBorder,
    PlayArrow,
    Share,
    Remove
} from '@mui/icons-material';
import axios from 'axios';

const Reels = () => {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [userLikes, setUserLikes] = useState(new Set());
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReel, setSelectedReel] = useState(null);

    useEffect(() => {
        fetchReels();
    }, [page]);

    const fetchReels = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/reels', { params: { page } });
            setReels(response.data);
        } catch (err) {
            console.error('Error fetching reels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (reelId) => {
        try {
            await axios.post(`/api/reels/${reelId}/like`);
            setUserLikes(prev => new Set([...prev, reelId]));
        } catch (err) {
            console.error('Error liking reel:', err);
        }
    };

    const handleShare = (reel) => {
        setSelectedReel(reel);
        setOpenDialog(true);
    };

    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                Trending Reels
            </Typography>

            {loading && <CircularProgress />}

            <Grid container spacing={3}>
                {reels.map(reel => (
                    <Grid item xs={12} sm={6} md={4} key={reel.id}>
                        <Card
                            sx={{
                                height: '100%',
                                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                                transition: 'all 0.3s'
                            }}
                        >
                            <CardMedia
                                component="video"
                                height="300"
                                image={reel.video_url}
                                sx={{ position: 'relative', cursor: 'pointer' }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: 'white',
                                        fontSize: '3rem',
                                        opacity: 0.7
                                    }}
                                >
                                    <PlayArrow fontSize="inherit" />
                                </Box>
                            </CardMedia>

                            <CardContent>
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar src={reel.profile_picture} sx={{ width: 32, height: 32 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2">{reel.username}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {reel.views_count} views
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Typography variant="body2" noWrap>{reel.title}</Typography>

                                    <Stack direction="row" spacing={1} justifyContent="space-between">
                                        <Stack direction="row" spacing={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleLike(reel.id)}
                                                sx={{ color: userLikes.has(reel.id) ? 'error.main' : 'inherit' }}
                                            >
                                                {userLikes.has(reel.id) ? <Favorite /> : <FavoriteBorder />}
                                            </IconButton>
                                            <Typography variant="caption">{reel.likes_count}</Typography>
                                        </Stack>

                                        <Button
                                            size="small"
                                            startIcon={<Share />}
                                            onClick={() => handleShare(reel)}
                                        >
                                            Share
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'center' }}>
                <Button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                >
                    Previous
                </Button>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                    Page {page + 1}
                </Typography>
                <Button onClick={() => setPage(page + 1)}>Next</Button>
            </Stack>

            <ReelShareDialog
                open={openDialog}
                reel={selectedReel}
                onClose={() => setOpenDialog(false)}
            />
        </Box>
    );
};

const ReelShareDialog = ({ open, reel, onClose }) => {
    const [message, setMessage] = useState('');

    const handleShare = async () => {
        try {
            await axios.post('/api/shares', {
                original_reel_id: reel.id,
                share_message: message
            });
            onClose();
        } catch (err) {
            console.error('Error sharing reel:', err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Share Reel</Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Add a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleShare}>Share</Button>
                </Stack>
            </Box>
        </Dialog>
    );
};

export default Reels;
