import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Avatar, Chip, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, CircularProgress, Alert, Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import OrdersIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BackIcon from '@mui/icons-material/ArrowBack';
import RevenueIcon from '@mui/icons-material/TrendingUp';
import SalesIcon from '@mui/icons-material/ShoppingCart';
import EcoIcon from '@mui/icons-material/Spa';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';

const CustomTabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const Seller = () => {
    const [tabValue, setTabValue] = useState(0);
    const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, eco_impact: 0 });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Product Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState({
        name: '', description: '', price: '', stock: '', image_url: '', eco_rating: 5, co2_reduction_kg: 0
    });
    const fileInputRef = useRef(null);

    const { api } = useAuth();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, productsRes, ordersRes, customersRes] = await Promise.all([
                api.get('/sellers/dashboard/stats'),
                api.get('/products/seller/me'),
                api.get('/sellers/dashboard/orders'),
                api.get('/sellers/dashboard/customers')
            ]);
            setStats(statsRes.data);
            setProducts(productsRes.data || []);
            setOrders(ordersRes.data || []);
            setCustomers(customersRes.data || []);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const handleOpenDialog = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setForm(product);
        } else {
            setEditingProduct(null);
            setForm({ name: '', description: '', price: '', stock: '', image_url: '', eco_rating: 5, co2_reduction_kg: 0 });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => setOpenDialog(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setForm(prev => ({ ...prev, image_url: res.data.url }));
        } catch (err) {
            console.error(err);
            alert('Image upload failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, form);
            } else {
                await api.post('/products', form);
            }
            handleCloseDialog();
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Action failed');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchData();
            } catch (err) {
                console.error(err);
                alert('Delete failed');
            }
        }
    };

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box className="page-container fade-in" sx={{ p: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Seller Hub</Typography>
                    <Typography variant="h6" color="text.secondary">Manage your eco-empire</Typography>
                </Box>
                <Button component={Link} to="/" startIcon={<BackIcon />} variant="outlined" sx={{ borderRadius: '12px' }}>Back to Marketplace</Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontWeight: 800, fontSize: '1rem' } }}>
                    <Tab icon={<DashboardIcon />} iconPosition="start" label="Overview" />
                    <Tab icon={<InventoryIcon />} iconPosition="start" label="Inventory" />
                    <Tab icon={<OrdersIcon />} iconPosition="start" label="Orders" />
                    <Tab icon={<PeopleIcon />} iconPosition="start" label="CRM" />
                </Tabs>
            </Box>

            {/* OVERVIEW TAB */}
            <CustomTabPanel value={tabValue} index={0}>
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.1 }}><RevenueIcon sx={{ fontSize: 40 }} /></Box>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>Total Revenue</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: 'primary.main' }}>৳{parseFloat(stats.revenue || 0).toLocaleString()}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.1 }}><SalesIcon sx={{ fontSize: 40 }} /></Box>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>Total Sales</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: 'secondary.main' }}>{stats.orders}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.1 }}><EcoIcon sx={{ fontSize: 40 }} /></Box>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>Eco Impact</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: 'success.main' }}>{stats.eco_impact}kg CO₂</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.1 }}><InventoryIcon sx={{ fontSize: 40 }} /></Box>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>Active Items</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: 'info.main' }}>{stats.products}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </CustomTabPanel>

            {/* INVENTORY TAB */}
            <CustomTabPanel value={tabValue} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Product Catalog</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: '12px', fontWeight: 800 }}>Add Product</Button>
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Price</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Stock</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Eco Rating</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar src={getImageUrl(p.image_url)} variant="rounded" sx={{ width: 44, height: 44 }} />
                                            <Typography sx={{ fontWeight: 700 }}>{p.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>৳{p.price}</TableCell>
                                    <TableCell>
                                        <Chip label={p.stock} color={p.stock > 10 ? "success" : "warning"} size="small" sx={{ fontWeight: 800 }} />
                                    </TableCell>
                                    <TableCell>{p.eco_rating}/5</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpenDialog(p)} color="primary"><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDeleteProduct(p.id)} color="error"><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CustomTabPanel>

            {/* ORDERS TAB */}
            <CustomTabPanel value={tabValue} index={2}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Live Orders</Typography>
                <TableContainer component={Paper} sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Total Value</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((o) => (
                                <TableRow key={o.id}>
                                    <TableCell sx={{ fontWeight: 800 }}>#{o.id}</TableCell>
                                    <TableCell>{o.customer_name}</TableCell>
                                    <TableCell sx={{ maxWidth: 250 }}>
                                        <Typography variant="body2" noWrap>{o.product_names}</Typography>
                                        <Typography variant="caption" color="text.secondary">{o.total_items} items total</Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>৳{o.total_amount}</TableCell>
                                    <TableCell>
                                        <Chip label={(o.status || 'pending').toUpperCase()} color={o.status === 'delivered' ? 'success' : 'primary'} size="small" sx={{ fontWeight: 800 }} />
                                    </TableCell>
                                    <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CustomTabPanel>

            {/* CRM TAB */}
            <CustomTabPanel value={tabValue} index={3}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Customer Relationships</Typography>
                <Grid container spacing={3}>
                    {customers.map((c) => (
                        <Grid item xs={12} md={6} lg={4} key={c.id}>
                            <Card sx={{ borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'none' }}>
                                <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={getImageUrl(c.avatar_url)} sx={{ width: 60, height: 60 }} />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>{c.username}</Typography>
                                        <Typography variant="body2" color="text.secondary">{c.email}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" display="block" color="text.secondary">SPENT</Typography>
                                        <Typography sx={{ fontWeight: 800, color: 'success.main' }}>৳{c.total_spent}</Typography>
                                        <Chip label={`${c.order_count} Orders`} size="small" sx={{ mt: 0.5, fontWeight: 700 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </CustomTabPanel>

            {/* PRODUCT DIALOG */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
                <DialogTitle sx={{ fontWeight: 900 }}>{editingProduct ? 'Edit Product' : 'Add New Sustainable Item'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField fullWidth label="Product Name" name="name" value={form.name} onChange={handleChange} required />
                        <TextField fullWidth label="Description" name="description" multiline rows={3} value={form.description} onChange={handleChange} required />
                        <Grid container spacing={2}>
                            <Grid item xs={6}><TextField fullWidth label="Price (৳)" name="price" type="number" value={form.price} onChange={handleChange} required /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="Stock Quantity" name="stock" type="number" value={form.stock} onChange={handleChange} required /></Grid>
                        </Grid>
                        <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: '12px', textAlign: 'center' }}>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                            {form.image_url ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={getImageUrl(form.image_url)} variant="rounded" sx={{ width: 60, height: 60 }} />
                                    <Typography variant="caption" color="success.main">Image Ready</Typography>
                                    <Button size="small" onClick={() => fileInputRef.current.click()}>Replace</Button>
                                </Box>
                            ) : (
                                <Button startIcon={<AddIcon />} onClick={() => fileInputRef.current.click()}>Upload Image</Button>
                            )}
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6}><TextField fullWidth label="Eco Rating (1-5)" name="eco_rating" type="number" value={form.eco_rating} onChange={handleChange} required /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="CO2 Reduction (kg)" name="co2_reduction_kg" type="number" value={form.co2_reduction_kg} onChange={handleChange} required /></Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog} sx={{ fontWeight: 800 }}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: '12px', px: 4, fontWeight: 900 }}>
                        {editingProduct ? 'Save Changes' : 'Publish Product'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Seller;
