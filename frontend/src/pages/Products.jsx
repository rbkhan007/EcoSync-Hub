import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Button, Chip, TextField, Dialog, DialogTitle, DialogContent, InputAdornment, Alert, CircularProgress, Tooltip, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import ImageWithFallback from '../components/ImageWithFallback';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const { api, updateCounts } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/categories')
                ]);
                const sortedProducts = productsRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setProducts(sortedProducts);
                setCategories(categoriesRes.data);
            } catch {
                setError('Failed to load products');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [api]);

    const handleAddToCart = async (productId) => {
        try {
            await api.post('/cart', { product_id: productId });
            updateCounts();
            alert('Selection added to your eco-cart!');
        } catch {
            setError('Failed to update cart');
        }
    };

    const handleAddToWishlist = async (productId) => {
        try {
            await api.post('/wishlist', { product_id: productId });
            updateCounts();
            alert('Product added to wishlist!');
        } catch {
            setError('Failed to add to wishlist');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box className="page-container fade-in">
            <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 3 }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Eco Marketplace</Typography>
                    <Typography variant="h6" color="text.secondary">Sustainable essentials for a conscious lifestyle</Typography>
                </Box>
                <TextField
                    placeholder="Search sustainable gear..."
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: { xs: '100%', md: 350 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

            <Grid container spacing={4}>
                {filteredProducts.map((product) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
                        <Card className="card hover-lift" sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 0, borderRadius: '24px' }}>
                            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                                <ImageWithFallback
                                    src={getImageUrl(product.image_url)}
                                    alt={product.name}
                                    sx={{ height: 200, width: '100%', objectFit: 'cover', filter: 'brightness(0.98)', transition: 'transform 0.5s ease', '&:hover': { transform: 'scale(1.1)' } }}
                                />
                                <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
                                    <Chip
                                        icon={<StarIcon sx={{ color: '#ffb300 !important', fontSize: '16px' }} />}
                                        label={product.eco_rating}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', fontWeight: 800, fontSize: '0.75rem', px: 1, border: '1px solid rgba(0,0,0,0.05)' }}
                                    />
                                </Box>
                                <Chip
                                    label={`${product.co2_reduction_kg}kg CO₂ Saved`}
                                    color="primary"
                                    size="small"
                                    sx={{ position: 'absolute', bottom: 16, left: 16, fontWeight: 800, fontSize: '0.75rem', px: 1.5, py: 1.5, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </Box>

                            <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption" color="primary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, mb: 1 }}>
                                    {categories.find(c => c.id === product.category_id)?.name || 'Eco Goods'}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, fontSize: '1.2rem', lineHeight: 1.2 }}>{product.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{
                                    mb: 3,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.6
                                }}>
                                    {product.description}
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'var(--primary-dark)', fontSize: '1.4rem' }}>
                                            ৳{parseFloat(product.price).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="View Details">
                                            <IconButton component={Link} to={`/product/${product.id}`} sx={{ bgcolor: 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' } }}>
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Wishlist">
                                            <IconButton onClick={() => handleAddToWishlist(product.id)} sx={{ bgcolor: 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: 'rgba(255,0,0,0.05)', color: 'error.main' } }}>
                                                <FavoriteBorderIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => handleAddToCart(product.id)}
                                            startIcon={<AddShoppingCartIcon />}
                                            sx={{ px: 2, py: 1, borderRadius: '12px', fontWeight: 800, boxShadow: 'var(--neon-glow)' }}
                                        >
                                            Add
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Products;
