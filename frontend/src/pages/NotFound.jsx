import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import PublicOffIcon from '@mui/icons-material/PublicOff';

const NotFound = () => {
    return (
        <Box className="page-container fade-in" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 12 }}>
            <Container maxWidth="sm">
                <PublicOffIcon sx={{ fontSize: 120, color: 'text.disabled', mb: 4 }} />
                <Typography variant="h2" sx={{ fontWeight: 900, mb: 2 }}>404</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Oops! Page Drifted Away</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
                    The resource you are looking for might have been moved or destroyed.
                    Let's get you back to the green hub.
                </Typography>
                <Button component={Link} to="/" variant="contained" size="large" sx={{ h: 56, px: 6, borderRadius: '28px', fontWeight: 700 }}>
                    Return to Hub
                </Button>
            </Container>
        </Box>
    );
};

export default NotFound;
