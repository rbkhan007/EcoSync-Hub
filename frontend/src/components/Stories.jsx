import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Typography,
    Avatar,
    Button,
    Stack,
    Dialog,
    TextField,
    IconButton,
    Chip,
    CircularProgress
} from '@mui/material';
import {
    FavoriteBorder,
    Favorite,
    ChatBubbleOutline,
    ShareOutlined,
    ThumbUpOutlined,
    EmojiEmotions
} from '@mui/icons-material';
import axios from 'axios';

const Stories = ({ userId, onStoryClick }) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedStory, setSelectedStory] = useState(null);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/stories');
            setStories(response.data);
        } catch (err) {
            console.error('Error fetching stories:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStoryView = async (story) => {
        setSelectedStory(story);
        setOpenDialog(true);

        try {
            await axios.post(`/api/stories/${story.id}/view`);
        } catch (err) {
            console.error('Error marking story as viewed:', err);
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 2 }}>
            {loading ? (
                <CircularProgress size={24} />
            ) : (
                stories.map(story => (
                    <Box
                        key={story.id}
                        onClick={() => handleStoryView(story)}
                        sx={{
                            minWidth: 120,
                            height: 180,
                            borderRadius: 2,
                            backgroundImage: `url(${story.media_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            border: story.is_viewed ? '2px solid gray' : '3px solid #2E7D32',
                            '&:hover': { opacity: 0.8 }
                        }}
                    >
                        <Avatar
                            src={story.profile_picture}
                            sx={{ position: 'absolute', top: 8, left: 8, width: 32, height: 32 }}
                        />
                        <Typography
                            sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                right: 8,
                                color: 'white',
                                fontSize: '0.75rem',
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}
                            noWrap
                        >
                            {story.username}
                        </Typography>
                    </Box>
                ))
            )}

            <StoryViewer
                open={openDialog}
                story={selectedStory}
                onClose={() => setOpenDialog(false)}
            />
        </Box>
    );
};

// Story Viewer Component
const StoryViewer = ({ open, story, onClose }) => {
    const [viewCount, setViewCount] = useState(0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            {story && (
                <Box sx={{ position: 'relative', backgroundColor: '#000' }}>
                    <Box
                        sx={{
                            width: '100%',
                            height: 500,
                            backgroundImage: `url(${story.media_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                    <Box sx={{ p: 2, backgroundColor: '#fff' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar src={story.profile_picture} />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1">{story.username}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {story.view_count} views
                                </Typography>
                            </Box>
                            <Button onClick={onClose}>Close</Button>
                        </Stack>
                        {story.caption && (
                            <Typography variant="body2" sx={{ mt: 2 }}>{story.caption}</Typography>
                        )}
                    </Box>
                </Box>
            )}
        </Dialog>
    );
};

export default Stories;
