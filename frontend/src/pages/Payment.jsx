import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Divider, CircularProgress, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Payment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { api } = useAuth();
    const { total, address, orderItems } = location.state || {};

    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!total || !orderItems) {
            navigate('/cart');
        }
    }, [total, orderItems, navigate]);

    const handlePayment = async () => {
        setProcessing(true);
        setError('');
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Create order on backend
            const response = await api.post('/orders', {
                total_amount: total,
                shipping_address: address,
                order_items: orderItems
            });

            setSuccess(true);
            setTimeout(() => {
                navigate(`/order/${response.data.id}/receipt`);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (!total) return null;

    return (
        <Box className="page-container fade-in" sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, mb: 4, textAlign: 'center' }}>
                Secure Checkout
            </Typography>

            <Card className="card">
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom>Order Summary</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Items ({orderItems?.length})</Typography>
                        <Typography>৳{total}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography>Shipping</Typography>
                        <Typography color="success.main">FREE</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Total</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--primary-main)' }}>৳{total}</Typography>
                    </Box>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Shipping to:</Typography>
                    <Typography variant="body2" sx={{ mb: 4, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>{address}</Typography>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    {success ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 1 }} />
                            <Typography variant="h6">Payment Successful!</Typography>
                            <Typography variant="body2" color="text.secondary">Redirecting to your receipt...</Typography>
                        </Box>
                    ) : (
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handlePayment}
                            disabled={processing}
                            sx={{ height: 56, fontWeight: 700, fontSize: '1.1rem' }}
                        >
                            {processing ? <CircularProgress size={24} color="inherit" /> : `Pay ৳${total} Now`}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default Payment;
