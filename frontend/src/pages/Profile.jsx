import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent, Grid, Avatar, Button, TextField, LinearProgress, Divider, Chip, Alert, CircularProgress, Tabs, Tab, IconButton, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AirIcon from '@mui/icons-material/Air';
import ForestIcon from '@mui/icons-material/Forest';
import EditIcon from '@mui/icons-material/Edit';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CakeIcon from '@mui/icons-material/Cake';
import WcIcon from '@mui/icons-material/Wc';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState(0);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', stock: '', image_url: '', eco_rating: 5, co2_reduction_kg: 0
  });
  const { api, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const productFileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(res.data.url);
    } catch (err) {
      console.error(err);
      alert('Image upload failed');
    }
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProductForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch (err) {
      console.error(err);
      alert('Image upload failed');
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await api.get('/profile');
        setProfile(profileRes.data);
        setBio(profileRes.data.bio || '');
        setAvatarUrl(profileRes.data.avatar_url || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [api]);

  const handleUpdate = async () => {
    try {
      await api.put('/profile', {
        bio,
        avatar_url: avatarUrl,
        firstName: profile.first_name,
        lastName: profile.last_name,
        birthDate: profile.birth_date,
        gender: profile.gender
      });
      const profileRes = await api.get('/profile');
      setProfile(profileRes.data);
      setEditing(false);
      refreshUser(); // Update global user state
      alert('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', productForm);
      alert('Product listed for sale!');
      setProductForm({ name: '', description: '', price: '', stock: '', image_url: '', eco_rating: 5, co2_reduction_kg: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!profile) return <Box className="page-container"><Typography>Profile not found.</Typography></Box>;

  // Use First + Last Name if available, otherwise Username
  const displayName = (profile.first_name && profile.last_name)
    ? `${profile.first_name} ${profile.last_name}`
    : profile.username;

  return (
    <Box className="page-container fade-in" sx={{ p: 0, overflow: 'hidden' }}>
      {/* Cover Photo Area - Facebook Style */}


      <Container maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {/* Profile Header */}
        <Box sx={{ position: 'relative', mb: 4, px: { xs: 2, md: 4 } }}>
          <Card className="card" sx={{ mt: 4, p: 4, bgcolor: 'transparent', overflow: 'visible', border: 'none', boxShadow: 'none' }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-end' },
              gap: 3
            }}>
              {/* Profile Picture */}
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={getImageUrl(avatarUrl)}
                  sx={{
                    width: 180,
                    height: 180,
                    border: '6px solid white',
                    bgcolor: 'var(--primary-main)',
                    fontSize: '4.5rem',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  {profile.username.charAt(0).toUpperCase()}
                </Avatar>
                {editing && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <IconButton
                      onClick={() => fileInputRef.current.click()}
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        bgcolor: 'var(--primary-main)',
                        color: 'white',
                        '&:hover': { bgcolor: 'var(--primary-dark)' },
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    >
                      <CameraAltIcon />
                    </IconButton>
                  </>
                )}
              </Box>

              {/* Name & Headline */}
              <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'center', md: 'flex-start' }, mb: 0.5 }}>
                  <Typography variant="h2" sx={{ fontWeight: 900 }}>
                    {displayName}
                  </Typography>
                  <Chip label="WARRIOR" size="small" sx={{ bgcolor: 'var(--primary-main)', color: 'white', fontWeight: 900, borderRadius: '6px' }} />
                </Box>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  {profile.email} • Joined {formatDate(profile.created_at)}
                </Typography>
                <Typography variant="body1" sx={{
                  fontWeight: 500,
                  color: 'text.secondary',
                  bgcolor: 'rgba(0,0,0,0.03)',
                  p: 1.5,
                  borderRadius: '12px',
                  display: 'inline-block',
                  border: '1px dashed rgba(0,0,0,0.1)'
                }}>
                  {profile.bio || "Eco-Warrior • Change Maker • Sustainability Advocate"}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Button
                  variant={editing ? "contained" : "outlined"}
                  color={editing ? "success" : "primary"}
                  startIcon={editing ? null : <EditIcon />}
                  onClick={() => setEditing(!editing)}
                  sx={{ borderRadius: '14px', px: 4, py: 1.5, fontWeight: 800, textTransform: 'none', boxShadow: editing ? '0 8px 16px rgba(46, 125, 50, 0.2)' : 'none' }}
                >
                  {editing ? "Exit Edit Mode" : "Edit Profile"}
                </Button>
              </Box>
            </Box>
          </Card>

          <Divider sx={{ mt: 2 }} />

          {/* Tabs Navigation */}
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            sx={{
              mt: 1,
              '& .MuiTab-root': { fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1.2, minHeight: 60 },
              '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0' }
            }}
          >
            <Tab label="About" />
            <Tab label="Sell Center" />
          </Tabs>
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={3} sx={{ px: { xs: 2, md: 4 }, pb: 6 }}>
          {/* Left Column: Intro & Photos */}
          <Grid size={{ xs: 12, md: 5 }}>
            {editing && (
              <Card className="card" sx={{ mb: 3, p: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Edit Details</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profile.first_name || ''}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profile.last_name || ''}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Birthday"
                        type="date"
                        value={profile.birth_date ? new Date(profile.birth_date).toISOString().split('T')[0] : ''}
                        onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        select
                        label="Gender"
                        value={profile.gender || ''}
                        onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                        SelectProps={{ native: true }}
                      >
                        <option value="">Select Gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="custom">Custom</option>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Bio" multiline rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
                    </Grid>
                    {/* Image URL field removed */}
                    <Grid size={{ xs: 12 }}>
                      <Button variant="contained" fullWidth onClick={handleUpdate}>Save Details</Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}



            {/* Stats Card */}
            <Card className="card" sx={{ mb: 3, overflow: 'hidden', position: 'relative' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ForestIcon color="primary" /> Impact Score
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(76, 175, 80, 0.1)' }}>
                      <EmojiEventsIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 900, color: 'var(--primary-main)' }}>{profile.eco_points}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Points</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(33, 150, 243, 0.1)' }}>
                      <AirIcon sx={{ fontSize: 32, mb: 1, color: '#1976d2' }} />
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#1976d2' }}>{profile.carbon_saved_kg}kg</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>CO2 Saved</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{
                      p: 2.5,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                        <ForestIcon sx={{ fontSize: 32 }} />
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1, color: 'white' }}>{profile.trees_planted}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.9 }}>Living Trees Sponsored</Typography>
                        </Box>
                      </Box>
                      <AddShoppingCartIcon sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.1 }} />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Posts (Challenges & Activities) */}
          <Grid size={{ xs: 12, md: 7 }}>
            {tab === 1 ? (
              <Card className="card">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>List Your Eco-Product</Typography>
                  <form onSubmit={handleProductSubmit}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Product Name" name="name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Price (৳)" name="price" type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Description" name="description" multiline rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Stock Quantity" name="stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <input
                          type="file"
                          ref={productFileInputRef}
                          hidden
                          accept="image/*"
                          onChange={handleProductImageUpload}
                        />
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Button
                            variant="outlined"
                            onClick={() => productFileInputRef.current.click()}
                          >
                            Upload Product Image
                          </Button>
                          {productForm.image_url && (
                            <Box
                              component="img"
                              src={getImageUrl(productForm.image_url)}
                              sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
                            />
                          )}
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Eco Rating (1-5)" name="eco_rating" type="number" value={productForm.eco_rating} onChange={(e) => setProductForm({ ...productForm, eco_rating: e.target.value })} inputProps={{ min: 1, max: 5 }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="CO2 Reduction (kg)" name="co2_reduction_kg" type="number" value={productForm.co2_reduction_kg} onChange={(e) => setProductForm({ ...productForm, co2_reduction_kg: e.target.value })} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button type="submit" variant="contained" size="large" startIcon={<AddShoppingCartIcon />}>List Product</Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            ) : tab === 0 ? (
              <Card className="card" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Intro</Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <PersonIcon color="action" />
                    <Typography variant="body1">
                      {profile.role === 'admin' ? 'Administrator' : profile.role === 'seller' ? 'Seller' : 'Member'} at <strong style={{ color: 'var(--primary-main)' }}>EcoSync Hub</strong>
                    </Typography>
                  </Box>

                  {profile.birth_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <CakeIcon color="action" />
                      <Typography variant="body1">Birthday: <strong>{formatDate(profile.birth_date)}</strong></Typography>
                    </Box>
                  )}

                  {profile.gender && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <WcIcon color="action" />
                      <Typography variant="body1">Gender: <span style={{ textTransform: 'capitalize' }}>{profile.gender}</span></Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <CalendarMonthIcon color="action" />
                    <Typography variant="body1">Joined {formatDate(profile.created_at)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : null}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile;