import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Avatar,
    Button,
    Stack,
    Dialog,
    TextField,
    IconButton,
    Chip,
    CircularProgress,
    LinearProgress,
    Alert
} from '@mui/material';
import {
    PlayArrow,
    Stop,
    Videocam,
    Chat,
    Share,
    Close,
    FavoriteBorder,
    Favorite
} from '@mui/icons-material';
import axios from 'axios';

const LiveStreams = () => {
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    useEffect(() => {
        fetchStreams();
        const interval = setInterval(fetchStreams, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchStreams = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/live-streams');
            setStreams(response.data);
        } catch (err) {
            console.error('Error fetching live streams:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartStream = async () => {
        try {
            const response = await axios.post('/api/live-streams', formData);
            setIsStreaming(true);
            setOpenDialog(false);
            setFormData({ title: '', description: '' });
            fetchStreams();
        } catch (err) {
            console.error('Error starting stream:', err);
        }
    };

    const liveStreams = streams.filter(s => s.status === 'live');
    const endedStreams = streams.filter(s => s.status === 'ended');

    return (
        <Box sx={{ py: 4 }}>
            {liveStreams.length > 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    🔴 Live Now: {liveStreams.length} stream{liveStreams.length !== 1 ? 's' : ''} available
                </Alert>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Live Streams
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Videocam />}
                    onClick={() => setOpenDialog(true)}
                    color={isStreaming ? 'error' : 'primary'}
                >
                    {isStreaming ? 'Stop Streaming' : 'Go Live'}
                </Button>
            </Stack>

            {loading ? (
                <CircularProgress />
            ) : (
                <Box>
                    {/* Live Streams */}
                    {liveStreams.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                                🔴 Currently Live
                            </Typography>
                            <Stack spacing={2}>
                                {liveStreams.map(stream => (
                                    <LiveStreamCard key={stream.id} stream={stream} onRefresh={fetchStreams} />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Ended Streams */}
                    {endedStreams.length > 0 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Recent Replays
                            </Typography>
                            <Stack spacing={2}>
                                {endedStreams.map(stream => (
                                    <LiveStreamCard key={stream.id} stream={stream} isEnded onRefresh={fetchStreams} />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {streams.length === 0 && (
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                            No live streams at the moment. Be the first to go live!
                        </Typography>
                    )}
                </Box>
            )}

            <StartStreamDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onStart={handleStartStream}
                formData={formData}
                setFormData={setFormData}
            />
        </Box>
    );
};

const LiveStreamCard = ({ stream, isEnded, onRefresh }) => {
    const [liked, setLiked] = useState(false);
    const [comments, setComments] = useState('');

    const handleLike = async () => {
        try {
            // Add like reaction
            setLiked(!liked);
        } catch (err) {
            console.error('Error liking stream:', err);
        }
    };

    return (
        <Card
            sx={{
                mb: 2,
                '&:hover': { boxShadow: 6 },
                position: 'relative'
            }}
        >
            {!isEnded && (
                <Box sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: 'error.main',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    zIndex: 1
                }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white', animation: 'blink 1s infinite' }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>LIVE</Typography>
                </Box>
            )}

            <CardHeader
                avatar={<Avatar src={stream.profile_picture} />}
                title={stream.username}
                subheader={new Date(stream.started_at).toLocaleString()}
            />

            <CardContent>
                <Box
                    sx={{
                        backgroundColor: '#000',
                        height: 300,
                        borderRadius: 1,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {stream.thumbnail_url && (
                        <Box
                            component="img"
                            src={stream.thumbnail_url}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                    <Box sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1
                    }}>
                        <Typography variant="caption">
                            {stream.total_viewers} watching
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="h6" sx={{ mb: 1 }}>
                    {stream.title}
                </Typography>

                {stream.description && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {stream.description}
                    </Typography>
                )}

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Button
                        size="small"
                        startIcon={liked ? <Favorite /> : <FavoriteBorder />}
                        onClick={handleLike}
                        sx={{ color: liked ? 'error.main' : 'inherit' }}
                    >
                        {stream.total_likes}
                    </Button>
                    <Button
                        size="small"
                        startIcon={<Chat />}
                    >
                        {stream.comment_count || 0} Comments
                    </Button>
                    <Button
                        size="small"
                        startIcon={<Share />}
                    >
                        Share
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};

const StartStreamDialog = ({ open, onClose, onStart, formData, setFormData }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Go Live</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Stack>

                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        label="Stream Title"
                        placeholder="What are you streaming about?"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        placeholder="Tell your viewers more about this stream"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />

                    <Alert severity="info">
                        Make sure you have camera and microphone permissions enabled.
                    </Alert>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={onClose}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<PlayArrow />}
                            onClick={onStart}
                        >
                            Start Streaming
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Dialog>
    );
};

export default LiveStreams;
