import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, Typography, Grid, IconButton, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import ImageWithFallback from '../components/ImageWithFallback';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const { api, updateCounts } = useAuth();

    const fetchWishlist = React.useCallback(async () => {
        try {
            const response = await api.get('/wishlist');
            setWishlist(response.data);
        } catch {
            console.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchWishlist();
    }, [api, fetchWishlist]);

    const removeFromWishlist = async (productId) => {
        try {
            await api.delete(`/wishlist/${productId}`);
            fetchWishlist();
            updateCounts();
        } catch {
            alert('Failed to remove item');
        }
    };

    const addToCart = async (productId) => {
        try {
            await api.post('/cart', { product_id: productId });
            updateCounts();
            alert('Added to cart');
        } catch {
            alert('Failed to add to cart');
        }
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}>Loading Wishlist...</Box>;

    return (
        <Box className="page-container fade-in">
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, mb: 4 }}>
                💖 My Wishlist
            </Typography>
            {wishlist.length === 0 ? (
                <Card className="card" sx={{ textAlign: 'center', p: 5 }}>
                    <Typography variant="h6" color="text.secondary">Your wishlist is empty.</Typography>
                    <Button component={Link} to="/products" variant="contained" sx={{ mt: 3 }}>
                        Browse Products
                    </Button>
                </Card>
            ) : (
                <Grid container spacing={4}>
                    {wishlist.map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.product_id}>
                            <Card className="card hover-lift" sx={{ h: '100%', display: 'flex', flexDirection: 'column' }}>
                                <ImageWithFallback
                                    src={getImageUrl(item.image_url)}
                                    alt={item.name}
                                    sx={{ height: 200, width: '100%', objectFit: 'cover', borderRadius: '12px' }}
                                />
                                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                                    <Typography variant="h6" gutterBottom>{item.name}</Typography>
                                    <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                                        ৳{item.price}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            startIcon={<ShoppingCartIcon />}
                                            onClick={() => addToCart(item.product_id)}
                                        >
                                            Add to Cart
                                        </Button>
                                        <IconButton color="error" onClick={() => removeFromWishlist(item.product_id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default Wishlist;
