import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../contexts/AuthContext';

const AddressBook = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [form, setForm] = useState({
        full_name: '', phone: '', house_flat_no: '', road_street: '',
        area_locality: '', thana_upazila: '', district: '', postal_code: '',
        address_type: 'home', is_default: false
    });

    const { api } = useAuth();

    const fetchAddresses = useCallback(async () => {
        try {
            const response = await api.get('/addresses');
            setAddresses(response.data);
        } catch {
            console.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleOpen = (address = null) => {
        if (address) {
            setForm(address);
            setEditMode(true);
            setCurrentId(address.id);
        } else {
            setForm({
                full_name: '', phone: '', house_flat_no: '', road_street: '',
                area_locality: '', thana_upazila: '', district: '', postal_code: '',
                address_type: 'home', is_default: false
            });
            setEditMode(false);
        }
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        try {
            if (editMode) {
                await api.put(`/addresses/${currentId}`, form);
            } else {
                await api.post('/addresses', form);
            }
            fetchAddresses();
            handleClose();
        } catch {
            alert('Failed to save address');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/addresses/${id}`);
            fetchAddresses();
        } catch {
            alert('Failed to delete address');
        }
    };

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box className="page-container fade-in">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>Address Book</Typography>
                    <Typography variant="h6" color="text.secondary">Default shipping destinations for your eco-hauls</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: '12px', h: 48, px: 3 }}>
                    Add New
                </Button>
            </Box>

            <Grid container spacing={3}>
                {addresses.length === 0 ? (
                    <Grid size={12}>
                        <Card className="card" sx={{ py: 8, textAlign: 'center' }}>
                            <Typography color="text.secondary">No addresses saved.</Typography>
                        </Card>
                    </Grid>
                ) : addresses.map((addr) => (
                    <Grid size={{ xs: 12, md: 6 }} key={addr.id}>
                        <Card className="card" sx={{ height: '100%', position: 'relative', border: addr.is_default ? '2px solid var(--primary-main)' : 'none' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                                    {addr.address_type === 'home' ? <HomeIcon color="primary" /> :
                                        addr.address_type === 'work' ? <WorkIcon color="primary" /> : <BusinessIcon color="primary" />}
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{addr.full_name}</Typography>
                                    {addr.is_default && <Chip label="DEFAULT" size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.6rem' }} />}
                                </Box>
                                <Typography variant="body2">{addr.house_flat_no}{addr.road_street ? `, ${addr.road_street}` : ''}</Typography>
                                <Typography variant="body2">{addr.area_locality}{addr.thana_upazila ? `, ${addr.thana_upazila}` : ''}</Typography>
                                <Typography variant="body2">{addr.district} - {addr.postal_code}</Typography>
                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>{addr.phone}</Typography>

                                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpen(addr)}>Edit</Button>
                                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(addr.id)}>Delete</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>{editMode ? 'Edit Address' : 'New Address'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField fullWidth required label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth required label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </Grid>
                        <Grid size={12}>
                            <TextField fullWidth required label="House / Flat No" value={form.house_flat_no} onChange={(e) => setForm({ ...form, house_flat_no: e.target.value })} />
                        </Grid>
                        <Grid size={12}>
                            <TextField fullWidth label="Road / Street" value={form.road_street} onChange={(e) => setForm({ ...form, road_street: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth required label="Thana / Upazila" value={form.thana_upazila} onChange={(e) => setForm({ ...form, thana_upazila: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth required label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth required label="Postal Code" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField select fullWidth label="Type" value={form.address_type} onChange={(e) => setForm({ ...form, address_type: e.target.value })} SelectProps={{ native: true }}>
                                <option value="home">Home</option>
                                <option value="work">Work</option>
                                <option value="other">Other</option>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>Save Address</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AddressBook;
