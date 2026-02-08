import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Box, Button, TextField, IconButton, Snackbar, Alert, Grid, Divider, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import ImageWithFallback from '../components/ImageWithFallback';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [shippingAddress, setShippingAddress] = useState({})
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { api, updateCounts } = useAuth();
    const navigate = useNavigate();

    const fetchCart = useCallback(async () => {
        try {
            const response = await api.get('/cart');
            setCartItems(response.data);
        } catch {
            setError('Failed to load cart');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Fetch user's default address
    useEffect(() => {
        const fetchDefaultAddress = async () => {
            try {
                const response = await api.get('/addresses');
                const defaultAddr = response.data.find(addr => addr.is_default);
                if (defaultAddr) {
                    setShippingAddress({
                        full_name: defaultAddr.full_name,
                        phone: defaultAddr.phone,
                        house_flat_no: defaultAddr.house_flat_no,
                        road_street: defaultAddr.road_street,
                        area_locality: defaultAddr.area_locality,
                        post_office: defaultAddr.post_office,
                        thana_upazila: defaultAddr.thana_upazila,
                        district: defaultAddr.district,
                        division: defaultAddr.division,
                        postal_code: defaultAddr.postal_code,
                        country: defaultAddr.country
                    });
                }
            } catch {
                console.log('No saved addresses found');
            }
        };
        fetchDefaultAddress();
    }, [api]);

    const updateQuantity = async (id, quantity) => {
        if (quantity < 1) return;
        try {
            await api.put(`/cart/${id}`, { quantity });
            fetchCart();
        } catch {
            setError('Failed to update quantity');
        }
    };

    const removeItem = async (id) => {
        try {
            await api.delete(`/cart/${id}`);
            fetchCart();
            updateCounts();
        } catch {
            setError('Failed to remove item');
        }
    };

    const handleCheckout = async () => {
        if (!shippingAddress.full_name || !shippingAddress.house_flat_no || !shippingAddress.thana_upazila || !shippingAddress.district || !shippingAddress.postal_code) {
            setError('Please fill in all required shipping address fields');
            return;
        }
        const orderItems = cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
        }));
        const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const addressString = `${shippingAddress.full_name}
${shippingAddress.house_flat_no}${shippingAddress.road_street ? ', ' + shippingAddress.road_street : ''}
${shippingAddress.area_locality}${shippingAddress.post_office ? ', ' + shippingAddress.post_office : ''}
${shippingAddress.thana_upazila}
${shippingAddress.district}${shippingAddress.division ? ', ' + shippingAddress.division : ''}
${shippingAddress.postal_code}
${shippingAddress.country || 'BANGLADESH'}`.replace(/\n+/g, '\n').trim();

        try {
            // Save address to address book as default
            await api.post('/addresses', {
                ...shippingAddress,
                address_type: 'home',
                is_default: true
            });

            setSnackbar({
                open: true,
                message: 'Address saved to your address book!',
                severity: 'success'
            });

            // Proceed to payment after a short delay
            setTimeout(() => {
                navigate('/payment', {
                    state: {
                        total,
                        address: addressString,
                        orderItems
                    }
                });
            }, 500);
        } catch (error) {
            // If address save fails, still proceed to checkout but show warning
            console.error('Failed to save address:', error);
            setSnackbar({
                open: true,
                message: 'Proceeding to checkout (address not saved)',
                severity: 'warning'
            });

            setTimeout(() => {
                navigate('/payment', {
                    state: {
                        total,
                        address: addressString,
                        orderItems
                    }
                });
            }, 500);
        }
    };

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box className="page-container fade-in">
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Eco Cart</Typography>
                    <Typography variant="h6" color="text.secondary">Review your sustainable selections</Typography>
                </Box>
                <ShoppingCartIcon sx={{ fontSize: 48, color: 'var(--primary-main)' }} />
            </Box>

            {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

            {cartItems.length === 0 ? (
                <Card className="card" sx={{ p: 6, textAlign: 'center' }}>
                    <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Your cart is empty</Typography>
                    <Typography color="text.secondary" sx={{ mb: 4 }}>Start adding eco-friendly products to your cart</Typography>
                    <Button variant="contained" href="/products">Browse Products</Button>
                </Card>
            ) : (
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Cart Items ({cartItems.length})</Typography>
                            {cartItems.map((item) => (
                                <Card key={item.id} className="card" sx={{
                                    mb: 3,
                                    transition: '0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            {item.image_url && (
                                                <ImageWithFallback
                                                    src={getImageUrl(item.image_url)}
                                                    alt={item.name}
                                                    sx={{
                                                        width: 100,
                                                        height: 100,
                                                        borderRadius: '12px',
                                                        objectFit: 'cover',
                                                        flexShrink: 0
                                                    }}
                                                />
                                            )}
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{item.name}</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    ৳{parseFloat(item.price).toLocaleString()} each
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <TextField
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                                        inputProps={{ min: 1 }}
                                                        sx={{ width: 80 }}
                                                        size="small"
                                                    />
                                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--primary-main)' }}>
                                                        ৳{(item.price * item.quantity).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <IconButton
                                                onClick={() => removeItem(item.id)}
                                                sx={{
                                                    color: 'error.main',
                                                    '&:hover': { bgcolor: 'error.light', color: 'white' }
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card className="card" sx={{ position: 'sticky', top: 20 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 4 }}>Order Summary</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography>Subtotal ({cartItems.length} items)</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>৳{total.toLocaleString()}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                    <Typography>Shipping</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>Free</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Total</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--primary-main)' }}>
                                        ৳{total.toLocaleString()}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        <Card className="card" sx={{ mt: 3 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Shipping Address</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                                    Please provide your delivery address in Bangladeshi format
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Full Name"
                                            value={shippingAddress.full_name || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                                            required
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Phone"
                                            value={shippingAddress.phone || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="House/Flat No"
                                            value={shippingAddress.house_flat_no || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, house_flat_no: e.target.value })}
                                            required
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Road/Street"
                                            value={shippingAddress.road_street || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, road_street: e.target.value })}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Area/Locality"
                                            value={shippingAddress.area_locality || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, area_locality: e.target.value })}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Post Office"
                                            value={shippingAddress.post_office || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, post_office: e.target.value })}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Thana/Upazila"
                                            value={shippingAddress.thana_upazila || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, thana_upazila: e.target.value })}
                                            required
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="District"
                                            value={shippingAddress.district || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, district: e.target.value })}
                                            required
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Division"
                                            value={shippingAddress.division || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, division: e.target.value })}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Postal Code"
                                            value={shippingAddress.postal_code || ''}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                                            required
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Country"
                                            value={shippingAddress.country || 'BANGLADESH'}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={handleCheckout}
                                    sx={{ mt: 3, fontWeight: 800 }}
                                >
                                    Proceed to Checkout
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Cart;
