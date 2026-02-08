import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, Grid, Chip, Button, Divider, Skeleton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { api } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        setOrders(response.data);
      } catch {
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [api]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'success';
      case 'shipped': return 'primary';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) return (
    <Box className="page-container">
      <Skeleton variant="text" height={60} width="300px" sx={{ mb: 4 }} />
      <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: '20px' }} />
      <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: '20px' }} />
    </Box>
  );

  return (
    <Box className="page-container fade-in">
      <Typography variant="h3" sx={{ mb: 4, fontWeight: 800 }}>📦 My Orders</Typography>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {orders.length === 0 ? (
        <Card className="card" sx={{ textAlign: 'center', p: 5 }}>
          <Typography variant="h6" color="text.secondary">No orders yet.</Typography>
          <Button component={Link} to="/products" sx={{ mt: 2 }} variant="contained">Start Shopping</Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid size={{ xs: 12 }} key={order.id}>
              <Card className="card" sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Order Placed</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Order Total</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--primary-dark)' }}>
                      ৳{order.total_amount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">OrderID</Typography>
                    <Typography variant="body2">#{order.id}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Chip
                      label={order.status.toUpperCase()}
                      color={getStatusColor(order.status)}
                      sx={{ fontWeight: 800, px: 1 }}
                    />
                    {order.payment_status && (
                      <Chip
                        label={`Payment: ${order.payment_status}`}
                        color={order.payment_status === 'succeeded' ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShippingIcon color="action" />
                    <Typography variant="body2">
                      Shipping to: <strong>{order.shipping_address || 'Default Address'}</strong>
                    </Typography>
                  </Box>
                  <Button
                    component={Link}
                    to={`/order/${order.id}/receipt`}
                    startIcon={<ReceiptLongIcon />}
                    variant="outlined"
                    size="small"
                  >
                    View Receipt
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Orders;
