import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, LinearProgress, Avatar, Chip, CircularProgress, Container, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import AirIcon from '@mui/icons-material/Air';
import ForestIcon from '@mui/icons-material/Forest';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import PublicIcon from '@mui/icons-material/Public';
import SpaIcon from '@mui/icons-material/Spa';
import GroupIcon from '@mui/icons-material/Group';

import FlashOnIcon from '@mui/icons-material/FlashOn';
import ExploreIcon from '@mui/icons-material/Explore';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const StatRing = ({ value, label, icon, color }) => (
    <Card className="card hover-lift" sx={{
        textAlign: 'center',
        p: 2,
        height: '100%'
    }}>
        <Box sx={{ color, mb: 1.5, display: 'flex', justifyContent: 'center' }}>
            {React.cloneElement(icon, { sx: { fontSize: 32 } })}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>{value.toLocaleString()}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
    </Card>
);

const FeatureCard = ({ icon, title, description, delay }) => (
    <Card className="card hover-lift" sx={{ height: '100%', animationDelay: delay }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{
                width: 80, height: 80,
                borderRadius: '50%',
                bgcolor: 'var(--primary-light)',
                color: 'var(--primary-main)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 3
            }}>
                {icon}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>{title}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {description}
            </Typography>
        </CardContent>
    </Card>
);

const Home = () => {
    const { user, api } = useAuth();
    const [stats, setStats] = useState({});
    const [globalStats, setGlobalStats] = useState({ users: 0, products: 0, orders: 0, totalCO2Saved: 0 });
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                const [statsRes, topUsersRes] = await Promise.all([
                    api.get('/stats'),
                    api.get('/leaderboard/top')
                ]);
                setGlobalStats(statsRes.data);
                setTopUsers(topUsersRes.data);
            } catch {
                console.error('Failed to fetch public data');
            }
        };
        fetchPublicData();

        if (user) {
            // ... existing dashboard fetch logic ...
            const fetchDashboardData = async () => {
                try {
                    const [_cartRes, challengesRes, ordersRes] = await Promise.all([
                        api.get('/cart'),
                        api.get('/challenges/user/me'),
                        api.get('/orders')
                    ]);
                    const challengesCompleted = challengesRes.data.filter(c => c.status === 'completed').length;
                    const totalOrders = ordersRes.data.length;
                    setStats({
                        ecoPoints: user.eco_points,
                        carbonSaved: user.carbon_saved_kg,
                        challengesCompleted,
                        totalOrders
                    });
                } catch {
                    console.error('Failed to load dashboard data');
                } finally {
                    setLoading(false);
                }
            };
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, [user, api]);

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

    // PUBLIC LANDING PAGE
    if (!user) {
        return (
            <Box className="fade-in" sx={{ overflow: 'hidden' }}>
                {/* Hero Section */}
                <Box sx={{
                    position: 'relative',
                    bgcolor: 'var(--primary-main)',
                    color: 'white',
                    pt: { xs: 8, md: 16 },
                    pb: { xs: 12, md: 20 },
                    px: { xs: 2, md: 4 },
                    borderRadius: { xs: 0, md: '0 0 50px 50px' },
                    textAlign: 'center'
                }}>
                    <Container maxWidth="lg">
                        <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontSize: { xs: '2.5rem', md: '4rem' }, color: 'white' }}>
                            Connect. Act. Impact.
                        </Typography>
                        <Typography variant="h5" sx={{ mb: 5, opacity: 0.9, maxWidth: 800, mx: 'auto', lineHeight: 1.5 }}>
                            Join the global community of eco-conscious changemakers. Shop sustainable products, complete eco-missions, and track your carbon footprint.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                            <Button
                                component={Link} to="/register"
                                variant="contained"
                                size="large"
                                sx={{
                                    bgcolor: 'white', color: 'var(--primary-main)',
                                    fontWeight: 800, px: 4, py: 1.5,
                                    fontSize: '1.1rem',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                }}
                            >
                                Start Your Journey
                            </Button>
                            <Button
                                component={Link} to="/login"
                                variant="outlined"
                                size="large"
                                sx={{
                                    color: 'white', borderColor: 'white',
                                    fontWeight: 800, px: 4, py: 1.5,
                                    fontSize: '1.1rem',
                                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                Sign In
                            </Button>
                        </Stack>
                    </Container>
                    <ForestIcon sx={{ position: 'absolute', bottom: -50, right: -50, fontSize: 400, opacity: 0.1, transform: 'rotate(-20deg)' }} />
                </Box>

                {/* Features Section */}
                <Container maxWidth="lg" sx={{ mt: -10, mb: 10, position: 'relative', zIndex: 2 }}>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FeatureCard
                                icon={<ShoppingBagIcon sx={{ fontSize: 40 }} />}
                                title="Eco Marketplace"
                                description="Discover and buy sustainable products from verified sellers. Every purchase helps the planet."
                                delay="0.1s"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FeatureCard
                                icon={<EmojiEventsIcon sx={{ fontSize: 40 }} />}
                                title="Gamified Challenges"
                                description="Complete daily eco-missions, earn points, and level up your impact score while saving CO2."
                                delay="0.2s"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FeatureCard
                                icon={<GroupsIcon sx={{ fontSize: 40 }} />}
                                title="Community Hub"
                                description="Connect with friends, share your progress, and join local events to make a collective difference."
                                delay="0.3s"
                            />
                        </Grid>
                    </Grid>
                </Container>

                {/* Mission & About Section */}
                <Container maxWidth="lg" sx={{ mb: 12 }}>
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, mb: 3 }}>Our Mission</Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.6 }}>
                            EcoSync Hub is a global ecosystem designed to harmonize modern commerce with planetary health.
                            We believe every purchase should be a step towards a greener future.
                        </Typography>
                    </Box>

                    <Grid container spacing={4} sx={{ mb: 10 }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card className="card height-100" sx={{ textAlign: 'center', p: 4, height: '100%' }}>
                                <PublicIcon sx={{ fontSize: 60, color: 'var(--primary-main)', mb: 2 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Global Impact</Typography>
                                <Typography variant="h3" color="primary" sx={{ fontWeight: 900, mb: 1 }}>{globalStats.totalCO2Saved}kg</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    of CO2 saved collectively by our community. We track every gram to ensure transparency.
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card className="card height-100" sx={{ textAlign: 'center', p: 4, height: '100%' }}>
                                <SpaIcon sx={{ fontSize: 60, color: 'var(--primary-main)', mb: 2 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Curated Quality</Typography>
                                <Typography variant="h3" color="primary" sx={{ fontWeight: 900, mb: 1 }}>{globalStats.products}+</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Verified sustainable products available now, from bamboo tech to organic skincare.
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card className="card height-100" sx={{ textAlign: 'center', p: 4, height: '100%' }}>
                                <GroupIcon sx={{ fontSize: 60, color: 'var(--primary-main)', mb: 2 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Community Driven</Typography>
                                <Typography variant="h3" color="primary" sx={{ fontWeight: 900, mb: 1 }}>{globalStats.users}+</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Eco-warriors have joined the movement. Compete, share, and grow together.
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Community Heroes Section replaced here */}
                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '24px', p: 6, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>Community Heroes</Typography>
                        <Grid container spacing={4} justifyContent="center">
                            {topUsers.length > 0 ? (
                                topUsers.map((hero, i) => (
                                    <Grid size={{ xs: 'auto' }} key={hero.id || i}>
                                        <Avatar
                                            src={hero.avatar_url || `https://i.pravatar.cc/150?u=${hero.id}`}
                                            sx={{ width: 100, height: 100, mb: 2, mx: 'auto', border: '4px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                                        />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{hero.username}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {hero.role === 'admin' ? 'Eco Admin' : 'Eco Warrior'} • {hero.carbon_saved_kg}kg Saved
                                        </Typography>
                                    </Grid>
                                ))
                            ) : (
                                <Typography color="text.secondary">Join us to become our first hero!</Typography>
                            )}
                        </Grid>
                    </Box>
                </Container>
            </Box >
        );
    }


    // AUTHENTICATED DASHBOARD (Existing Logic)
    return (
        <Box className="page-container fade-in">
            <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3 }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontSize: { xs: '2rem', sm: '3rem' } }}>Global Hub</Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        Welcome back, <strong style={{ color: 'var(--primary-main)' }}>{user.username}</strong>. You've saved {stats.carbonSaved}kg CO2 this month.
                    </Typography>
                </Box>
                <Avatar
                    src={user.avatar_url}
                    component={Link}
                    to="/profile"
                    sx={{ width: { xs: 56, sm: 64 }, height: { xs: 56, sm: 64 }, border: '3px solid white', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                >
                    {user.username.charAt(0)}
                </Avatar>
            </Box>

            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatRing value={stats.ecoPoints || 0} label="Eco Points" icon={<MilitaryTechIcon />} color="#ffb300" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatRing value={stats.carbonSaved || 0} label="CO2 Saved (kg)" icon={<AirIcon />} color="#2196f3" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatRing value={stats.challengesCompleted || 0} label="Missions" icon={<ForestIcon />} color="#4caf50" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatRing value={stats.totalOrders || 0} label="Hub Orders" icon={<LocalMallIcon />} color="#ff9800" />
                </Grid>
            </Grid>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, lg: 7 }}>
                    <Card className="card" sx={{ p: 1, position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Impact Progression</Typography>
                                    <Typography variant="body2" color="text.secondary">Your path to becoming a Senior Eco-Guardian</Typography>
                                </Box>
                                <Chip icon={<FlashOnIcon />} label="Level 4" color="primary" sx={{ fontWeight: 800 }} />
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Eco-Mastery</Typography>
                                    <Typography variant="body2" color="text.secondary">{stats.ecoPoints}/2500 XP</Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min((stats.ecoPoints / 25), 100)}
                                    sx={{ height: 12, borderRadius: 6, bgcolor: 'rgba(0,0,0,0.05)' }}
                                />
                            </Box>

                            <Grid container spacing={2}>
                                {['Zero Carbon Hero', 'Forest Protector', 'Waste Reducer'].map((badge, i) => (
                                    <Grid size={{ xs: 4 }} key={i}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: i === 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0,0,0,0.02)', borderRadius: '16px' }}>
                                            <MilitaryTechIcon color={i === 0 ? 'primary' : 'disabled'} />
                                            <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 700 }}>{badge}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                        <AirIcon sx={{ position: 'absolute', right: -40, top: -40, fontSize: 200, opacity: 0.03 }} />
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 5 }}>
                    <Card sx={{ bgcolor: 'var(--primary-main)', color: 'white', borderRadius: '24px', p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: 'white' }}>Ready for a new mission?</Typography>
                            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
                                There are 12 active challenges in your local community today. Join one to double your eco-points!
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    component={Link}
                                    to="/challenges"
                                    variant="contained"
                                    sx={{ bgcolor: 'white', color: 'var(--primary-main)', fontWeight: 800, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                                >
                                    View Missions
                                </Button>
                                <Button
                                    component={Link}
                                    to="/community"
                                    sx={{ color: 'white', fontWeight: 700, borderColor: 'rgba(255,255,255,0.3)' }}
                                    variant="outlined"
                                    startIcon={<ExploreIcon />}
                                >
                                    Social Feed
                                </Button>
                            </Box>
                        </Box>
                        <ForestIcon sx={{ position: 'absolute', right: -20, bottom: -20, fontSize: 180, opacity: 0.1 }} />
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Home;
