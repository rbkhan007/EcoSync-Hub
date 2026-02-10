import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Avatar,
    TextField,
    Button,
    IconButton,
    Typography,
    Stack,
    CircularProgress,
    Alert,
    Divider,
    Chip,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link } from 'react-router-dom';
import Stories from '../components/Stories';

const Feed = () => {
    const { api, user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedPost, setExpandedPost] = useState(null);
    const [expandedComments, setExpandedComments] = useState({});
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletePostId, setDeletePostId] = useState(null);

    // Fetch posts
    const fetchPosts = useCallback(async (pageNum = 1) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/posts/feed?page=${pageNum}&limit=10`);
            setPosts(response.data.posts || []);
            setTotalPages(response.data.pagination?.pages || 1);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load posts');
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchPosts(page);
    }, [page, fetchPosts]);

    // Create new post
    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            setError('Please write something before posting');
            return;
        }

        try {
            await api.post('/posts', { content: newPostContent });
            setNewPostContent('');
            setPage(1);
            fetchPosts(1);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create post');
        }
    };

    // Like/unlike post
    const handleLikePost = async (postId, isLiked) => {
        try {
            if (isLiked) {
                await api.delete(`/posts/${postId}/like`);
            } else {
                await api.post(`/posts/${postId}/like`);
            }
            // Optimistically update UI
            setPosts(posts.map(p =>
                p.id === postId
                    ? { ...p, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1, liked_by_user: !isLiked }
                    : p
            ));
        } catch (err) {
            console.error('Error liking post:', err);
        }
    };

    // Toggle comments visibility
    const handleToggleComments = async (postId) => {
        if (expandedComments[postId]) {
            setExpandedComments(prev => ({ ...prev, [postId]: false }));
            return;
        }

        try {
            const response = await api.get(`/posts/${postId}/comments`);
            setExpandedComments(prev => ({ ...prev, [postId]: response.data }));
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    // Delete post
    const handleDeletePost = async () => {
        try {
            await api.delete(`/posts/${deletePostId}`);
            setPosts(posts.filter(p => p.id !== deletePostId));
            setDeleteConfirmOpen(false);
            setDeletePostId(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete post');
        }
    };

    // Menu handlers
    const handleMenuClick = (event, postId) => {
        setAnchorEl(event.currentTarget);
        setSelectedPostId(postId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPostId(null);
    };

    const handleDeleteClick = (postId) => {
        setDeletePostId(postId);
        setDeleteConfirmOpen(true);
        handleMenuClose();
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 3 }}>
            {/* Stories Section */}
            <Stories />

            {/* Create Post Card */}
            {user && (
                <Card sx={{ mb: 3 }} className="card">
                    <CardHeader
                        avatar={<Avatar src={getImageUrl(user.avatar_url)} alt={user.username} />}
                        title={`Hello, ${user.username}!`}
                        subtitle="What's on your mind?"
                    />
                    <CardContent>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Share your eco-friendly thoughts and actions..."
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button variant="outlined" color="inherit" onClick={() => setNewPostContent('')}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCreatePost}
                                disabled={!newPostContent.trim()}
                            >
                                Post
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Error Message */}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {/* Loading */}
            {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />}

            {/* Posts Feed */}
            {!loading && posts.length === 0 && (
                <Alert severity="info">No posts yet. Be the first to share something!</Alert>
            )}

            {posts.map((post) => (
                <Card key={post.id} sx={{ mb: 3 }} className="card">
                    {/* Post Header */}
                    <CardHeader
                        avatar={<Avatar src={getImageUrl(post.avatar_url)} alt={post.username} />}
                        action={
                            user?.id === post.user_id && (
                                <>
                                    <IconButton size="small" onClick={(e) => handleMenuClick(e, post.id)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={selectedPostId === post.id && Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                    >
                                        <MenuItem onClick={() => handleDeleteClick(post.id)}>Delete</MenuItem>
                                    </Menu>
                                </>
                            )
                        }
                        title={
                            <Link
                                to={`/user/${post.user_id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                {post.username}
                            </Link>
                        }
                        subheader={new Date(post.created_at).toLocaleDateString()}
                    />

                    {/* Post Content */}
                    <CardContent>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {post.content}
                        </Typography>
                        {post.image_url && (
                            <Box
                                component="img"
                                src={getImageUrl(post.image_url)}
                                alt="Post"
                                sx={{ width: '100%', borderRadius: 1, mb: 2 }}
                            />
                        )}

                        {/* Post Stats */}
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <Chip
                                icon={<FavoriteBorderIcon />}
                                label={`${post.likes_count} likes`}
                                variant="outlined"
                                size="small"
                            />
                            <Chip
                                icon={<ChatBubbleOutlineIcon />}
                                label={`${post.comments_count} comments`}
                                variant="outlined"
                                size="small"
                            />
                        </Stack>
                    </CardContent>

                    <Divider />

                    {/* Post Actions */}
                    <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                        <Button
                            startIcon={post.liked_by_user ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            color={post.liked_by_user ? 'error' : 'inherit'}
                            fullWidth
                            onClick={() => handleLikePost(post.id, post.liked_by_user)}
                        >
                            Like
                        </Button>
                        <Button
                            startIcon={<ChatBubbleOutlineIcon />}
                            fullWidth
                            onClick={() => handleToggleComments(post.id)}
                        >
                            Comment
                        </Button>
                        <Button startIcon={<ShareIcon />} fullWidth>
                            Share
                        </Button>
                    </Box>

                    {/* Comments Section */}
                    {expandedComments[post.id] && (
                        <>
                            <Divider />
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                    Comments
                                </Typography>
                                {Array.isArray(expandedComments[post.id]) && expandedComments[post.id].length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        No comments yet.
                                    </Typography>
                                ) : (
                                    <Stack spacing={2}>
                                        {Array.isArray(expandedComments[post.id]) && expandedComments[post.id].map((comment) => (
                                            <Box key={comment.id}>
                                                <Stack direction="row" spacing={1}>
                                                    <Avatar
                                                        src={getImageUrl(comment.avatar_url)}
                                                        alt={comment.username}
                                                        sx={{ width: 32, height: 32 }}
                                                    />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Link
                                                            to={`/user/${comment.user_id}`}
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            <Typography variant="subtitle2" color="primary">
                                                                {comment.username}
                                                            </Typography>
                                                        </Link>
                                                        <Typography variant="body2">
                                                            {comment.content}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(comment.created_at).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </>
                    )}
                </Card>
            ))}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'center' }}>
                    <Button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Previous
                    </Button>
                    <Typography sx={{ py: 1 }}>
                        Page {page} of {totalPages}
                    </Typography>
                    <Button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </Button>
                </Stack>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Delete Post?</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this post? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeletePost} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Feed;
