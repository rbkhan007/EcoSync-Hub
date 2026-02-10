import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { Box, Typography, Card, CardContent, Avatar, TextField, Button, List, ListItem, IconButton, CardMedia, Tooltip, Chip, CircularProgress, Divider, Grid, Paper, FormControlLabel, Checkbox, Switch } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import MessageIcon from '@mui/icons-material/Message';
import SendIcon from '@mui/icons-material/Send';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';

const Community = () => {
    const [posts, setPosts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [feedType, setFeedType] = useState('global'); // global, personal, groups, group
    const [newPost, setNewPost] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [ecoImpactType, setEcoImpactType] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [nickname, setNickname] = useState('');
    const [trendingTags, setTrendingTags] = useState([]);
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
            setLoading(true);
            let url = '/community/posts'; // Default global

            if (selectedGroupId) {
                url = `/groups/${selectedGroupId}/posts`;
            } else if (feedType === 'personal') {
                url = '/community/feed';
            } else if (feedType === 'groups') {
                url = '/community/groups-feed';
            }

            const response = await api.get(url);
            setPosts(response.data);
        } catch {
            console.error('Failed to fetch posts');
        } finally {
            setLoading(false);
        }
    }, [api, selectedGroupId, feedType]);

    const fetchGroups = useCallback(async () => {
        try {
            const response = await api.get('/groups');
            setGroups(response.data);
        } catch {
            console.error('Failed to fetch groups');
        }
    }, [api]);

    const fetchTrendingTags = useCallback(async () => {
        try {
            const response = await api.get('/community/trending-tags');
            setTrendingTags(response.data);
        } catch {
            console.error('Failed to fetch trending tags');
        }
    }, [api]);


    useEffect(() => {
        fetchGroups();
        fetchTrendingTags();
    }, [fetchGroups, fetchTrendingTags]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Update selected group object when ID changes
    useEffect(() => {
        if (selectedGroupId) {
            const group = groups.find(g => g.id === selectedGroupId);
            setSelectedGroup(group || null);
        } else {
            setSelectedGroup(null);
        }
    }, [selectedGroupId, groups]);

    const handlePost = async () => {
        if (!newPost.trim()) return;
        try {
            const payload = {
                content: newPost,
                image_url: imageUrl,
                eco_impact_type: ecoImpactType || null,
                is_anonymous: isAnonymous,
                nickname: isAnonymous ? (nickname || 'Anonymous Member') : null
            };

            let url = '/community/posts';
            if (selectedGroupId) {
                url = `/groups/${selectedGroupId}/posts`;
            }

            await api.post(url, payload);
            setNewPost('');
            setImageUrl('');
            setEcoImpactType('');
            setNickname('');
            setIsAnonymous(false);
            fetchPosts();
        } catch {
            alert('Failed to share your thought');
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
                <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
                    {selectedGroup ? selectedGroup.name : (
                        feedType === 'personal' ? 'My Feed' :
                            feedType === 'groups' ? 'Groups Activity' : 'Global Feed'
                    )}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    {selectedGroup ? selectedGroup.description : (
                        feedType === 'personal' ? 'Updates from your friends and your own journey' :
                            feedType === 'groups' ? 'Latest from communities you have joined' :
                                'Connect with fellow warriors and share your green journey'
                    )}
                </Typography>
                {selectedGroup && (
                    <Button onClick={() => setSelectedGroupId(null)} sx={{ mt: 1, borderRadius: '12px' }} variant="outlined" startIcon={<PublicIcon />}>
                        Back to Global Feed
                    </Button>
                )}
            </Box>

            <Grid container spacing={4}>
                {/* Groups Sidebar */}
                <Grid item xs={12} md={3}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.8)', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
                            <GroupIcon color="primary" /> Your Communities
                        </Typography>
                        <List>
                            <ListItem
                                button
                                selected={!selectedGroupId && feedType === 'global'}
                                onClick={() => { setSelectedGroupId(null); setFeedType('global'); }}
                                sx={{
                                    borderRadius: '16px',
                                    mb: 1,
                                    bgcolor: (!selectedGroupId && feedType === 'global') ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                    color: (!selectedGroupId && feedType === 'global') ? 'var(--primary-main)' : 'inherit'
                                }}
                            >
                                <ListItemIcon><PublicIcon color={(!selectedGroupId && feedType === 'global') ? "primary" : "inherit"} /></ListItemIcon>
                                <ListItemText primary="Global Feed" primaryTypographyProps={{ fontWeight: (!selectedGroupId && feedType === 'global') ? 800 : 500 }} />
                            </ListItem>
                            {user && (
                                <>
                                    <ListItem
                                        button
                                        selected={!selectedGroupId && feedType === 'personal'}
                                        onClick={() => { setSelectedGroupId(null); setFeedType('personal'); }}
                                        sx={{
                                            borderRadius: '16px',
                                            mb: 1,
                                            bgcolor: (!selectedGroupId && feedType === 'personal') ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                            color: (!selectedGroupId && feedType === 'personal') ? 'var(--primary-main)' : 'inherit'
                                        }}
                                    >
                                        <ListItemIcon><ThumbUpIcon color={(!selectedGroupId && feedType === 'personal') ? "primary" : "inherit"} /></ListItemIcon>
                                        <ListItemText primary="My Feed" secondary="Friends & You" primaryTypographyProps={{ fontWeight: (!selectedGroupId && feedType === 'personal') ? 800 : 500 }} />
                                    </ListItem>
                                    <ListItem
                                        button
                                        selected={!selectedGroupId && feedType === 'groups'}
                                        onClick={() => { setSelectedGroupId(null); setFeedType('groups'); }}
                                        sx={{
                                            borderRadius: '16px',
                                            mb: 1,
                                            bgcolor: (!selectedGroupId && feedType === 'groups') ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                            color: (!selectedGroupId && feedType === 'groups') ? 'var(--primary-main)' : 'inherit'
                                        }}
                                    >
                                        <ListItemIcon><GroupIcon color={(!selectedGroupId && feedType === 'groups') ? "primary" : "inherit"} /></ListItemIcon>
                                        <ListItemText primary="Groups Feed" secondary="All your groups" primaryTypographyProps={{ fontWeight: (!selectedGroupId && feedType === 'groups') ? 800 : 500 }} />
                                    </ListItem>
                                </>
                            )}
                            <Divider sx={{ my: 1 }} />
                            {groups.map(group => (
                                <ListItem
                                    key={group.id}
                                    button
                                    selected={selectedGroupId === group.id}
                                    onClick={() => { setSelectedGroupId(group.id); setFeedType('group'); }}
                                    sx={{
                                        borderRadius: '16px',
                                        mb: 1,
                                        bgcolor: selectedGroupId === group.id ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                        color: selectedGroupId === group.id ? 'var(--primary-main)' : 'inherit'
                                    }}
                                >
                                    <Avatar src={getImageUrl(group.cover_image_url)} sx={{ width: 32, height: 32, mr: 2 }}>{group.name[0]}</Avatar>
                                    <ListItemText primary={group.name} secondary={`${group.member_count} members`} primaryTypographyProps={{ fontWeight: selectedGroupId === group.id ? 800 : 500 }} />
                                </ListItem>
                            ))}
                        </List>
                        <Button fullWidth variant="contained" component={Link} to="/groups" sx={{ mt: 2, borderRadius: '12px' }}>
                            Discover Groups
                        </Button>
                    </Paper>

                    {/* Trending Hashtags */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', bgcolor: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.1)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            🔥 Trending Tags
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {trendingTags.length > 0 ? (
                                trendingTags.map((tag, idx) => (
                                    <Chip
                                        key={idx}
                                        label={`#${tag.tag_name}`}
                                        size="small"
                                        onClick={() => {
                                            setNewPost(prev => prev + ` #${tag.tag_name} `);
                                        }}
                                        sx={{
                                            fontWeight: 700,
                                            bgcolor: 'white',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            '&:hover': { bgcolor: 'var(--primary-light)', color: 'white' }
                                        }}
                                    />
                                ))
                            ) : (
                                <Typography variant="caption" color="text.secondary">No trending tags yet</Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Main Feed */}
                <Grid item xs={12} md={9}>
                    {user ? (
                        <Card className="card" sx={{ mb: 6, p: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <Avatar
                                        src={isAnonymous ? null : getImageUrl(user?.avatar_url)}
                                        sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    >
                                        {isAnonymous ? <LockIcon /> : user?.username?.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            fullWidth
                                            variant="standard"
                                            placeholder={selectedGroup ? `Share with ${selectedGroup.name}...` : "What's happening in your eco-journey?"}
                                            multiline
                                            rows={2}
                                            value={newPost}
                                            onChange={(e) => setNewPost(e.target.value)}
                                            InputProps={{ disableUnderline: true, sx: { fontSize: '1.2rem', fontWeight: 500 } }}
                                            sx={{ mb: 2 }}
                                        />

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mr: 1 }}>TAG IMPACT:</Typography>
                                            {[
                                                { id: 'Energy Saving', icon: '⚡' },
                                                { id: 'Waste Reduction', icon: '♻️' },
                                                { id: 'Sustainable Purchase', icon: '🛍️' },
                                                { id: 'Tree Planting', icon: '🌱' },
                                                { id: 'Water Conservation', icon: '💧' }
                                            ].map((tag) => (
                                                <Chip
                                                    key={tag.id}
                                                    label={`${tag.icon} ${tag.id}`}
                                                    onClick={() => setEcoImpactType(ecoImpactType === tag.id ? '' : tag.id)}
                                                    variant={ecoImpactType === tag.id ? 'filled' : 'outlined'}
                                                    color={ecoImpactType === tag.id ? 'secondary' : 'default'}
                                                    sx={{
                                                        borderRadius: '8px',
                                                        fontWeight: 700,
                                                        borderColor: 'rgba(0,0,0,0.1)',
                                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                                                    }}
                                                />
                                            ))}
                                        </Box>

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

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                            {selectedGroup && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <FormControlLabel
                                                        control={<Checkbox checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} icon={<LockIcon fontSize="small" />} checkedIcon={<LockIcon fontSize="small" color="primary" />} />}
                                                        label={<Typography variant="body2" fontWeight={600}>Post Anonymously</Typography>}
                                                    />
                                                    {isAnonymous && (
                                                        <TextField
                                                            size="small"
                                                            placeholder="Nickname"
                                                            value={nickname}
                                                            onChange={(e) => setNickname(e.target.value)}
                                                            sx={{ width: 120 }}
                                                            InputProps={{ sx: { borderRadius: '10px', fontSize: '0.9rem' } }}
                                                        />
                                                    )}
                                                </Box>
                                            )}

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{selectedGroup ? 'Group visible' : 'Public to hub'}</Typography>
                                                <Button
                                                    variant="contained"
                                                    onClick={handlePost}
                                                    disabled={!newPost.trim()}
                                                    sx={{
                                                        borderRadius: '16px',
                                                        px: 4,
                                                        py: 1,
                                                        fontWeight: 900,
                                                        boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)',
                                                        textTransform: 'none'
                                                    }}
                                                >
                                                    Post
                                                </Button>
                                            </Box>
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
                                                    src={getImageUrl(post.avatar_url || post.profile_picture)}
                                                    component={(!post.is_anonymous && user) ? Link : 'div'}
                                                    to={(!post.is_anonymous && user) ? (user.id === post.user_id ? "/profile" : `/profile/${post.user_id}`) : '#'}
                                                    sx={{
                                                        width: 52,
                                                        height: 52,
                                                        mr: 2,
                                                        bgcolor: post.is_anonymous ? '#ccc' : 'var(--primary-main)',
                                                        cursor: !post.is_anonymous ? 'pointer' : 'default',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                        border: '2px solid white'
                                                    }}
                                                >
                                                    {post.is_anonymous ? <LockIcon /> : post.username?.charAt(0)}
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
                                                            '&:hover': { color: !post.is_anonymous ? 'var(--primary-main)' : 'inherit' }
                                                        }}
                                                        component={(!post.is_anonymous && user) ? Link : 'div'}
                                                        to={(!post.is_anonymous && user) ? (user.id === post.user_id ? "/profile" : `/profile/${post.user_id}`) : '#'}
                                                    >
                                                        {post.username}
                                                        {post.impact_verified && (
                                                            <Tooltip title="Eco-Impact Verified">
                                                                <Chip
                                                                    size="small"
                                                                    label="VERIFIED IMPACT"
                                                                    color="success"
                                                                    variant="filled"
                                                                    sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900, ml: 1 }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                        {post.is_anonymous ?
                                                            <Chip size="small" icon={<LockIcon sx={{ fontSize: 12 }} />} label="Anonymous" sx={{ height: 20, fontSize: '0.65rem' }} /> :
                                                            <PublicIcon sx={{ fontSize: 16, color: 'var(--primary-main)' }} />
                                                        }
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {post.group_name ? (
                                                            <>
                                                                in
                                                                <Box component="span" sx={{ fontWeight: 800, color: 'var(--primary-main)' }}>
                                                                    {post.group_name}
                                                                </Box>
                                                                •
                                                            </>
                                                        ) : (
                                                            post.eco_impact_type ? (
                                                                <Box component="span" sx={{ fontWeight: 800, color: 'var(--secondary-main)', mr: 0.5 }}>
                                                                    {post.eco_impact_type} •
                                                                </Box>
                                                            ) : (
                                                                post.is_anonymous ? 'Group Member •' : 'Impact Guardian •'
                                                            )
                                                        )}
                                                        {new Date(post.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {user && user.id !== post.user_id && !post.is_anonymous && (
                                                <Tooltip title="Direct Message">
                                                    <IconButton component={Link} to={`/messages`} state={{ recipient_id: post.user_id }} sx={{ bgcolor: 'rgba(0,0,0,0.03)', color: 'var(--primary-main)' }}>
                                                        <MessageIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>

                                        <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.7, color: '#2c3e50', fontWeight: 500 }}>
                                            {post.content.split(/(\s+)/).map((part, i) => (
                                                part.startsWith('#') ? (
                                                    <Box
                                                        key={i}
                                                        component="span"
                                                        sx={{
                                                            color: 'var(--primary-main)',
                                                            fontWeight: 800,
                                                            cursor: 'pointer',
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                        onClick={() => {
                                                            alert(`Searching for ${part}... (Coming in next release)`);
                                                        }}
                                                    >
                                                        {part}
                                                    </Box>
                                                ) : part
                                            ))}
                                        </Typography>

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
                                                {post.likes || post.total_reactions || 0} reactions
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
                </Grid>
            </Grid>

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
