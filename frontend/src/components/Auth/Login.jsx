import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Card, CardContent, Container, InputAdornment, IconButton } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <Box className="fade-in" sx={{
            minHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            background: 'radial-gradient(circle at top right, rgba(76, 175, 80, 0.1), transparent), radial-gradient(circle at bottom left, rgba(33, 150, 243, 0.1), transparent)'
        }}>
            <Container maxWidth="sm">
                <Card className="card" sx={{ p: { xs: 2, md: 4 } }}>
                    <CardContent>
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: 'var(--primary-main)', mb: 1 }}>
                                Welcome Back
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Continue your impact on the EcoSync Hub
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>{error}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                                required
                                placeholder="userdemo@gmail.com"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal"
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                sx={{
                                    mt: 4,
                                    h: 56,
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    borderRadius: '16px'
                                }}
                            >
                                Sign In
                            </Button>
                        </form>

                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                New to the hub? {' '}
                                <Link to="/register" style={{ color: 'var(--primary-main)', fontWeight: 700, textDecoration: 'none' }}>
                                    Create an Account
                                </Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Login;
