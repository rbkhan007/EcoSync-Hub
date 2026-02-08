import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Grid, Card, CardContent, CardMedia, InputAdornment, Tabs, Tab, CircularProgress, Chip, Avatar, CardActionArea } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import ImageWithFallback from '../components/ImageWithFallback';

const Search = () => {
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState(0); // 0: Products, 1: Challenges, 2: Users
    const [results, setResults] = useState({ products: [], challenges: [], users: [] });
    const [loading, setLoading] = useState(false);
    const { api } = useAuth();

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults({ products: [], challenges: [], users: [] });
                return;
            }
            setLoading(true);
            try {
                // In a real app, this would be a single search API. 
                // Here we fetch all and filter client-side for simplicity, 
                // OR we can try to call specific APIs if they support searching.
                const [prodRes, chalRes, userRes] = await Promise.all([
                    api.get(`/products?search=${query}`),
                    api.get('/challenges'),
                    api.get('/auth/users')
                ]);

                // Filter logic
                const filteredProducts = prodRes.data.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
                const filteredChallenges = chalRes.data.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
                const filteredUsers = userRes.data.filter(u => u.username.toLowerCase().includes(query.toLowerCase()));

                setResults({
                    products: filteredProducts,
                    challenges: filteredChallenges,
                    users: filteredUsers
                });
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 500);
        return () => clearTimeout(timer);
    }, [query, api]);

    return (
        <Box className="page-container fade-in">
            <Box sx={{ maxWidth: 800, mx: 'auto', mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, textAlign: 'center', mb: 4 }}>Explorations</Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search for eco-products, challenges, or eco-warriors..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="primary" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '20px', bgcolor: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }
                    }}
                />
            </Box>

            <Tabs
                value={tab}
                onChange={(e, val) => setTab(val)}
                centered
                sx={{ mb: 4 }}
                TabIndicatorProps={{ sx: { height: 4, borderRadius: 2 } }}
            >
                <Tab label={`Products (${results.products.length})`} sx={{ fontWeight: 700 }} />
                <Tab label={`Challenges (${results.challenges.length})`} sx={{ fontWeight: 700 }} />
                <Tab label={`Users (${results.users.length})`} sx={{ fontWeight: 700 }} />
            </Tabs>

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={3}>
                    {tab === 0 && results.products.map(product => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
                            <Card className="card hover-lift" sx={{ h: '100%' }}>
                                <CardActionArea component={Link} to={`/product/${product.id}`} sx={{ h: '100%' }}>
                                    <ImageWithFallback src={getImageUrl(product.image_url)} alt={product.name} sx={{ height: 180, width: '100%', objectFit: 'cover', borderRadius: 2 }} />
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{product.name}</Typography>
                                        <Typography color="primary" sx={{ fontWeight: 800 }}>৳{product.price}</Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}

                    {tab === 1 && results.challenges.map(challenge => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={challenge.id}>
                            <Card className="card hover-lift" sx={{ h: '100%' }}>
                                <CardActionArea component={Link} to={`/challenges/${challenge.id}`} sx={{ h: '100%', alignItems: 'flex-start', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                    <CardContent sx={{ width: '100%' }}>
                                        <Chip label={challenge.category} size="small" color="secondary" sx={{ mb: 1 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{challenge.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">{challenge.points_reward} Points</Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}

                    {tab === 2 && results.users.map(u => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={u.id}>
                            <Card className="card hover-lift">
                                <CardActionArea component={Link} to={`/profile/${u.id}`}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar src={getImageUrl(u.avatar_url)}>{u.username.charAt(0)}</Avatar>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{u.username}</Typography>
                                            <Typography variant="body2" color="text.secondary">{u.eco_points} Eco Points</Typography>
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}

                    {query && !loading && results.products.length === 0 && results.challenges.length === 0 && results.users.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Typography variant="h5" color="text.secondary">No results found for "{query}"</Typography>
                                <Typography variant="body2" color="text.disabled">Try different keywords or categories.</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    );
};

export default Search;
