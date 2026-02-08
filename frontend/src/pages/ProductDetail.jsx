import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Button, Divider, Rating, TextField, Avatar, List, ListItem, ListItemAvatar, ListItemText, Alert, CircularProgress, Chip, IconButton } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ChatIcon from '@mui/icons-material/Chat';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import ImageWithFallback from '../components/ImageWithFallback';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [comments, setComments] = useState([]);
    const [canReview, setCanReview] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [commentText, setCommentText] = useState('');
    const [rating, setRating] = useState(5);
    const [loading, setLoading] = useState(true);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [error, setError] = useState('');
    const { api, user, updateCounts } = useAuth();

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const [productRes, reviewsRes, eligibilityRes, commentsRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/reviews/product/${id}`),
                    api.get(`/reviews/eligibility/${id}`),
                    api.get(`/product-comments/${id}`)
                ]);
                setProduct(productRes.data);
                setReviews(reviewsRes.data);
                setCanReview(eligibilityRes.data.canReview);
                setComments(commentsRes.data);
            } catch {
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };
        fetchProductData();
    }, [id, api]);

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        setSubmittingComment(true);
        try {
            await api.post('/product-comments', { product_id: id, comment: commentText });
            setCommentText('');
            const commentsRes = await api.get(`/product-comments/${id}`);
            setComments(commentsRes.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post comment');
        } finally {
            setSubmittingComment(false);
        }
    };



    const handleAddToCart = async () => {
        try {
            await api.post('/cart', { product_id: id });
            updateCounts();
            alert('Added to cart successfully!');
        } catch {
            setError('Failed to add to cart');
        }
    };

    const handleAddReview = async () => {
        if (!reviewText) return;
        try {
            await api.post('/reviews', { product_id: id, rating, comment: reviewText });
            setReviewText('');
            setCanReview(false);
            const reviewsResponse = await api.get(`/reviews/product/${id}`);
            setReviews(reviewsResponse.data);
            alert('Thank you for your feedback!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post review');
        }
    };

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Box className="page-container"><Alert severity="error">{error}</Alert></Box>;
    if (!product) return <Box className="page-container"><Typography>Product not found.</Typography></Box>;

    return (
        <Box className="page-container fade-in">
            <Card className="card" sx={{ overflow: 'hidden', mb: 6 }}>
                <Grid container>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ImageWithFallback
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            sx={{ width: 594, height: 955, objectFit: 'cover' }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                            <Box sx={{ mb: 2 }}>
                                <Chip label="Sustainably Sourced" color="primary" size="small" sx={{ fontWeight: 800, mb: 2 }} />
                                <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>{product.name}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Rating value={product.eco_rating} readOnly precision={0.5} />
                                    <Typography variant="body2" color="text.secondary">({reviews.length} Global Reviews)</Typography>
                                </Box>
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'var(--primary-dark)', mb: 3 }}>
                                ৳{product.price}
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                                {product.description}
                            </Typography>

                            <Box sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)', p: 3, borderRadius: '16px', mb: 4 }}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary">CO2 REDUCTION</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{product.co2_reduction_kg} kg</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary">ECO SCORE</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{product.eco_rating}/5.0</Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={handleAddToCart}
                                    startIcon={<AddShoppingCartIcon />}
                                    sx={{ h: 56, borderRadius: '28px', fontWeight: 900 }}
                                >
                                    Add to Cart
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    component={Link}
                                    to={`/profile/${product.seller_id}`}
                                    sx={{ borderRadius: '28px' }}
                                >
                                    <ChatIcon />
                                </Button>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocalShippingIcon color="action" fontSize="small" />
                                    <Typography variant="caption">Eco-friendly Shipping</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <VerifiedUserIcon color="action" fontSize="small" />
                                    <Typography variant="caption">Verified Quality</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Grid>
                </Grid>
            </Card>

            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}>Community Reviews</Typography>

                {canReview && (
                    <Card className="card" sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.5)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Write a Review</Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" display="block" gutterBottom>Rating</Typography>
                                <Rating value={rating} onChange={(e, v) => setRating(v)} sx={{ mb: 2 }} />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Tell the hub about your experience..."
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                />
                            </Box>
                            <Button variant="contained" onClick={handleAddReview}>Submit Review</Button>
                        </CardContent>
                    </Card>
                )}

                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 0 }}>
                    {reviews.length === 0 ? (
                        <ListItem>
                            <Typography color="text.secondary">No reviews yet. Be the first to share your experience!</Typography>
                        </ListItem>
                    ) : reviews.map((rev, index) => (
                        <ListItem key={rev.id || index} alignItems="flex-start" sx={{ p: 0 }}>
                            <Card sx={{ width: '100%', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar
                                                src={getImageUrl(rev.avatar_url)}
                                                component={Link}
                                                to={rev.user_id === user?.id ? "/profile" : `/profile/${rev.user_id}`}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                {rev.username?.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography
                                                        component={Link}
                                                        to={rev.user_id === user?.id ? "/profile" : `/profile/${rev.user_id}`}
                                                        sx={{ fontWeight: 800, textDecoration: 'none', color: 'inherit', '&:hover': { color: 'var(--primary-main)' } }}
                                                    >
                                                        {rev.username}
                                                    </Typography>
                                                    <Rating value={rev.rating} size="small" readOnly />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="text.primary" sx={{ my: 1 }}>{rev.comment}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{new Date(rev.created_at).toLocaleDateString()}</Typography>
                                                </Box>
                                            }
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </ListItem>
                    ))}
                </List>
            </Box>

            <Divider sx={{ mb: 6 }} />

            <Box sx={{ mb: 10 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}>Product Discussion</Typography>

                <Card className="card" sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.5)' }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Join the Conversation</Typography>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Ask about the product or share your eco-tips..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                disabled={submittingComment}
                            />
                        </Box>
                        <Button
                            variant="contained"
                            onClick={handleAddComment}
                            disabled={submittingComment || !commentText.trim()}
                            startIcon={submittingComment ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {submittingComment ? 'Posting...' : 'Post Comment'}
                        </Button>
                    </CardContent>
                </Card>

                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 0 }}>
                    {comments.length === 0 ? (
                        <ListItem>
                            <Typography color="text.secondary">No discussions yet. Start one!</Typography>
                        </ListItem>
                    ) : comments.map((comm) => (
                        <ListItem key={comm.id} alignItems="flex-start" sx={{ p: 0 }}>
                            <Card sx={{ width: '100%', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar
                                                src={getImageUrl(comm.avatar_url)}
                                                component={Link}
                                                to={comm.user_id === user?.id ? "/profile" : `/profile/${comm.user_id}`}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                {comm.username?.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography
                                                        component={Link}
                                                        to={comm.user_id === user?.id ? "/profile" : `/profile/${comm.user_id}`}
                                                        sx={{ fontWeight: 800, textDecoration: 'none', color: 'inherit', '&:hover': { color: 'var(--primary-main)' } }}
                                                    >
                                                        {comm.username}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(comm.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                                                    {comm.comment}
                                                </Typography>
                                            }
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Box>
    );
};

export default ProductDetail;
