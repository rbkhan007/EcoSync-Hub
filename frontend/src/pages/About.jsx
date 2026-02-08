import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, Container } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import EcoIcon from '@mui/icons-material/Eco';
import GroupIcon from '@mui/icons-material/Group';

const About = () => {
    return (
        <Box className="page-container fade-in">
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h2" sx={{ fontWeight: 900, mb: 2 }}>Our Mission</Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                        EcoSync Hub is a global ecosystem designed to harmonize modern commerce with planetary health.
                        We believe every purchase should be a step towards a greener future.
                    </Typography>
                </Box>

                <Grid container spacing={4} sx={{ mb: 10 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card className="card" sx={{ textAlign: 'center', p: 4, height: '100%' }}>
                            <PublicIcon sx={{ fontSize: 60, color: 'var(--primary-main)', mb: 2 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Global Impact</Typography>
                            <Typography variant="body2" color="text.secondary">
                                We track every kg of CO2 saved by our community, providing transparent data on our collective journey to net-zero.
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card className="card" sx={{ textAlign: 'center', p: 4, height: '100%' }}>
                            <EcoIcon sx={{ fontSize: 60, color: 'var(--primary-main)', mb: 2 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Curated Quality</Typography>
                            <Typography variant="body2" color="text.secondary">
                                All products on our platform are verified for their sustainability credentials, from bamboo tech to organic skincare.
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card className="card" sx={{ textAlign: 'center', p: 4, height: '100%' }}>
                            <GroupIcon sx={{ fontSize: 60, color: 'var(--primary-main)', mb: 2 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Community Driven</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Join eco-challenges, share progress in our feed, and compete with friends to see who can make the most impact.
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '24px', p: 6, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>The Team</Typography>
                    <Grid container spacing={4} justifyContent="center">
                        {[1, 2, 3].map((i) => (
                            <Grid key={i}>
                                <Avatar src={`https://i.pravatar.cc/150?u=${i}`} sx={{ width: 100, height: 100, mb: 2, mx: 'auto', border: '4px solid white' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Eco Visionary {i}</Typography>
                                <Typography variant="caption" color="text.secondary">Founder / Developer</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
};

export default About;
