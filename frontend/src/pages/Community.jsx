import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { Box, Typography, Card, CardContent, Avatar, TextField, Button, List, ListItem, IconButton, CardMedia, Tooltip, Chip, CircularProgress, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import MessageIcon from '@mui/icons-material/Message';
import SendIcon from '@mui/icons-material/Send';
import PublicIcon from '@mui/icons-material/Public';
import ShareIcon from '@mui/icons-material/Share';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';

const Community = () => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const { api, user } = useAuth();
    const fileInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImageUrl(res.data.url);
        } catch {
            alert('Failed to upload image');
        }
    };

    const fetchPosts = useCallback(async () => {
        try {
            const response = await api.get('/community/posts');
            setPosts(response.data);
        } catch {
            console.error('Failed to fetch posts');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePost = async () => {
        if (!newPost.trim()) return;
        try {
            await api.post('/community/posts', { content: newPost, image_url: imageUrl });
            setNewPost('');
            setImageUrl('');
            fetchPosts();
        } catch {
            alert('Failed to share your thought with the hub');
        }
    };

    const handleLike = async (postId) => {
        try {
            await api.post(`/community/posts/${postId}/like`);
            fetchPosts();
        } catch {
            console.error('Failed to update reaction');
        }
    };

    const [shareAnchorEl, setShareAnchorEl] = useState(null);
    const [sharingPost, setSharingPost] = useState(null);

    const handleShareClick = (event, post) => {
        setShareAnchorEl(event.currentTarget);
        setSharingPost(post);
    };

    const handleShareClose = () => {
        setShareAnchorEl(null);
        setSharingPost(null);
    };

    const shareOnSocial = (platform) => {
        if (!sharingPost) return;
        const text = encodeURIComponent(`Check out this eco-thought from ${sharingPost.username}: "${sharingPost.content}" on EcoSync Hub!`);
        const url = encodeURIComponent(window.location.origin + '/community');
        let shareUrl = '';

        switch (platform) {
            case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
            case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
            case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
            case 'copy':
                navigator.clipboard.writeText(`${window.location.origin}/community - ${sharingPost.content}`);
                alert('Link copied to clipboard!');
                handleShareClose();
                return;
        }
        if (shareUrl) window.open(shareUrl, '_blank');
        handleShareClose();
    };

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box className="page-container fade-in">
            <Box sx={{ mb: 6, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Social Feed</Typography>
                <Typography variant="h6" color="text.secondary">Connect with fellow warriors and share your green journey</Typography>
            </Box>

            {user ? (
                <Card className="card" sx={{ mb: 6, p: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
                            <Avatar src={getImageUrl(user?.avatar_url)} sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{user?.username?.charAt(0)}</Avatar>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    placeholder="What's happening in your eco-journey?"
                                    multiline
                                    rows={2}
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    InputProps={{ disableUnderline: true, sx: { fontSize: '1.2rem', fontWeight: 500 } }}
                                    sx={{ mb: 2 }}
                                />

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 3 }}>
                                    <Button
                                        size="medium"
                                        variant="outlined"
                                        onClick={() => fileInputRef.current.click()}
                                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3 }}
                                    >
                                        Share a visual moment
                                    </Button>
                                    {imageUrl && (
                                        <Box sx={{ position: 'relative' }}>
                                            <Box
                                                component="img"
                                                src={getImageUrl(imageUrl)}
                                                sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--primary-main)' }}
                                            />
                                            <IconButton size="small" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'white', '&:hover': { bgcolor: '#eee' } }} onClick={() => setImageUrl('')}>
                                                <Typography sx={{ fontSize: 10, fontWeight: 900 }}>✕</Typography>
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>

                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textAlign: { xs: 'center', sm: 'left' } }}>Your post will be public to the hub</Typography>
                                    <Button
                                        variant="contained"
                                        onClick={handlePost}
                                        disabled={!newPost.trim()}
                                        sx={{
                                            borderRadius: '16px',
                                            px: 5,
                                            py: 1.5,
                                            fontWeight: 900,
                                            boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)',
                                            textTransform: 'none'
                                        }}
                                    >
                                        Share Now
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card sx={{ mb: 6, p: 4, textAlign: 'center', bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: '24px', border: '2px dashed var(--primary-light)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Join the Conversation!</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Anonymous guests can view recent posts, but you need an account to share your thoughts and react.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button component={Link} to="/login" variant="contained" sx={{ borderRadius: '12px' }}>Login</Button>
                        <Button component={Link} to="/register" variant="outlined" sx={{ borderRadius: '12px' }}>Join Now</Button>
                    </Box>
                </Card>
            )}

            <List sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {posts.map((post) => (
                    <ListItem key={post.id} disablePadding>
                        <Card className="card hover-lift" sx={{ width: '100%', p: 0, overflow: 'hidden', borderRadius: '24px' }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar
                                            src={getImageUrl(post.avatar_url)}
                                            component={Link}
                                            to={user && user.id === post.user_id ? "/profile" : `/profile/${post.user_id}`}
                                            sx={{
                                                width: 52,
                                                height: 52,
                                                mr: 2,
                                                bgcolor: 'var(--primary-main)',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                border: '2px solid white'
                                            }}
                                        >
                                            {post.username.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 900,
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    '&:hover': { color: 'var(--primary-main)' }
                                                }}
                                                component={Link}
                                                to={user && user.id === post.user_id ? "/profile" : `/profile/${post.user_id}`}
                                            >
                                                {post.username}
                                                <PublicIcon sx={{ fontSize: 16, color: 'var(--primary-main)' }} />
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', opacity: 0.8 }}>Impact Guardian • {new Date(post.created_at).toLocaleDateString()}</Typography>
                                        </Box>
                                    </Box>
                                    {user && user.id !== post.user_id && (
                                        <Tooltip title="Direct Message">
                                            <IconButton component={Link} to={`/messages`} state={{ recipient_id: post.user_id }} sx={{ bgcolor: 'rgba(0,0,0,0.03)', color: 'var(--primary-main)' }}>
                                                <MessageIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>

                                <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.7, color: '#2c3e50', fontWeight: 500 }}>{post.content}</Typography>

                                {post.image_url && (
                                    <Box sx={{ borderRadius: '20px', overflow: 'hidden', mb: 3, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
                                        <CardMedia
                                            component="img"
                                            image={getImageUrl(post.image_url)}
                                            alt="Post moment"
                                            sx={{
                                                maxHeight: 500,
                                                width: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease',
                                                '&:hover': { transform: 'scale(1.02)' }
                                            }}
                                        />
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Button
                                        onClick={() => user ? handleLike(post.id) : null}
                                        disabled={!user}
                                        startIcon={post.isLiked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                                        sx={{
                                            color: post.isLiked ? 'white' : 'text.secondary',
                                            bgcolor: post.isLiked ? 'var(--primary-main)' : 'rgba(0,0,0,0.05)',
                                            borderRadius: '12px',
                                            px: 3,
                                            fontWeight: 800,
                                            opacity: user ? 1 : 0.6,
                                            '&:hover': { bgcolor: post.isLiked ? 'var(--primary-dark)' : 'rgba(0,0,0,0.1)' }
                                        }}
                                    >
                                        {post.likes} reactions
                                    </Button>
                                    <Tooltip title={user ? "Join conversation" : "Login to participate"}>
                                        <span>
                                            <IconButton disabled={!user} sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                                                <SendIcon sx={{ fontSize: 20, transform: 'rotate(-45deg)', mt: -0.5 }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Share this impact">
                                        <IconButton onClick={(e) => handleShareClick(e, post)} sx={{ bgcolor: 'rgba(0,0,0,0.03)', color: 'var(--primary-main)' }}>
                                            <ShareIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </CardContent>
                        </Card>
                    </ListItem>
                ))}
            </List>

            <Menu
                anchorEl={shareAnchorEl}
                open={Boolean(shareAnchorEl)}
                onClose={handleShareClose}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        mt: 1,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        minWidth: 180
                    }
                }}
            >
                <MenuItem onClick={() => shareOnSocial('twitter')}>
                    <ListItemIcon><TwitterIcon fontSize="small" sx={{ color: '#1DA1F2' }} /></ListItemIcon>
                    <ListItemText primary="Twitter" />
                </MenuItem>
                <MenuItem onClick={() => shareOnSocial('facebook')}>
                    <ListItemIcon><FacebookIcon fontSize="small" sx={{ color: '#4267B2' }} /></ListItemIcon>
                    <ListItemText primary="Facebook" />
                </MenuItem>
                <MenuItem onClick={() => shareOnSocial('whatsapp')}>
                    <ListItemIcon><WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} /></ListItemIcon>
                    <ListItemText primary="WhatsApp" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => shareOnSocial('copy')}>
                    <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Copy Link" />
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default Community;
