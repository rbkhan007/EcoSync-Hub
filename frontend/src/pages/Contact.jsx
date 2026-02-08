import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Card, CardContent, Grid, Alert, Container } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';

const Contact = () => {
    const [sent, setSent] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <Box className="page-container fade-in">
            <Container maxWidth="lg">
                <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, textAlign: 'center' }}>Get in Touch</Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 8, textAlign: 'center' }}>
                    Have questions about a product or partnership? We're here to help.
                </Typography>

                <Grid container spacing={6}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <EmailIcon color="primary" />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Email Us</Typography>
                                    <Typography color="text.secondary">support@ecosynchub.com</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <PhoneIcon color="primary" />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Call Us</Typography>
                                    <Typography color="text.secondary">+880 17 0000 0000</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <LocationOnIcon color="primary" />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Visit Us</Typography>
                                    <Typography color="text.secondary">UIU Tower, Madani Avenue, Dhaka 1212</Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Card className="card" sx={{ bgcolor: 'var(--primary-main)', color: 'white' }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>24/7 Support</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Our typical response time is under 12 hours for all eco-warrior inquiries.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                        {sent ? (
                            <Alert severity="success" sx={{ borderRadius: '16px', py: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Message Sent!</Typography>
                                <Typography>Thanks for reaching out. We'll get back to you shortly.</Typography>
                                <Button onClick={() => setSent(false)} sx={{ mt: 2 }}>Send another</Button>
                            </Alert>
                        ) : (
                            <Card className="card">
                                <CardContent sx={{ p: 4 }}>
                                    <form onSubmit={handleSubmit}>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <TextField fullWidth label="Your Name" required variant="outlined" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <TextField fullWidth label="Email Address" required type="email" variant="outlined" />
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <TextField fullWidth label="Subject" required variant="outlined" />
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <TextField fullWidth label="Message" required multiline rows={6} variant="outlined" />
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <Button type="submit" variant="contained" size="large" fullWidth sx={{ h: 56, fontWeight: 700 }}>
                                                    Send Message
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Contact;
