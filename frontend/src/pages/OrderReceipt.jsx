import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, Divider, Grid, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useParams, Link } from 'react-router-dom';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../contexts/AuthContext';

const OrderReceipt = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const { api } = useAuth();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // Fetching from orders list and finding specific ID
                const response = await api.get('/orders');
                const found = response.data.find(o => o.id == id);
                setOrder(found);
            } catch {
                console.error('Failed to load order');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, api]);

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}>Generating Receipt...</Box>;
    if (!order) return <Box sx={{ p: 4, textAlign: 'center' }}>Order not found</Box>;

    return (
        <Box className="page-container fade-in">
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <Button
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                    sx={{ mb: 3, display: { print: 'none' } }}
                >
                    Print Receipt
                </Button>

                <Paper elevation={0} sx={{ p: 6, borderRadius: '20px', bgcolor: 'white', border: '1px solid #eee' }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>Order Confirmed!</Typography>
                        <Typography variant="body1" color="text.secondary">Order #{order.id} | {new Date(order.created_at).toLocaleDateString()}</Typography>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    <Grid container spacing={4} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="overline" color="text.secondary">Shipping Address</Typography>
                            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                                {order.shipping_address || 'Address on file'}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                            <Typography variant="overline" color="text.secondary">Order Status</Typography>
                            <Typography variant="h6" color="primary" sx={{ mt: 1, textTransform: 'capitalize' }}>
                                {order.status}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
                    <Table sx={{ mb: 4 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Item</TableCell>
                                <TableCell align="right">Qty</TableCell>
                                <TableCell align="right">Price</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>Eco-Friendly Purchase</TableCell>
                                <TableCell align="right">1</TableCell>
                                <TableCell align="right">৳{order.total_amount}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <Box sx={{ bgcolor: '#f1f8e9', p: 3, borderRadius: '12px', mb: 3 }}>
                        <Typography variant="h6" color="var(--primary-dark)" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            🌿 Environmental Impact
                        </Typography>
                        <Typography variant="body2">
                            Through this purchase, you've helped mitigate carbon emissions and supported sustainable manufacturing.
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>Total: ৳{order.total_amount}</Typography>
                        <Typography variant="body2" color="text.secondary">Paid via EcoPay Secure Gateway</Typography>
                    </Box>
                </Paper>

                <Box sx={{ mt: 4, textAlign: 'center', display: { print: 'none' } }}>
                    <Button component={Link} to="/orders" variant="outlined" sx={{ mr: 2 }}>Back to Orders</Button>
                    <Button component={Link} to="/products" variant="contained">Continue Shopping</Button>
                </Box>
            </Box>
        </Box>
    );
};

export default OrderReceipt;
