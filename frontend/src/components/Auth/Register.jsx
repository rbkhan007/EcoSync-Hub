import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Card, CardContent, Container, InputAdornment, IconButton, Grid, Select, MenuItem, FormControl, InputLabel, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CakeIcon from '@mui/icons-material/Cake';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        birthMonth: '',
        birthDay: '',
        birthYear: '',
        gender: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (field) => (e) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate age (must be 13+)
        const birthDate = new Date(formData.birthYear, formData.birthMonth - 1, formData.birthDay);
        const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 13) {
            setError('You must be at least 13 years old to register.');
            return;
        }

        const result = await register(formData);
        if (result.success) {
            setSuccess('Welcome to the movement! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2500);
        } else {
            setError(result.message);
        }
    };

    // Generate arrays for birthday dropdowns
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    return (
        <Box className="fade-in" sx={{
            minHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            py: 4,
            background: 'radial-gradient(circle at top left, rgba(76, 175, 80, 0.1), transparent), radial-gradient(circle at bottom right, rgba(33, 150, 243, 0.1), transparent)'
        }}>
            <Container maxWidth="md">
                <Card className="card" sx={{ p: { xs: 2, md: 4 } }}>
                    <CardContent>
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: 'var(--primary-main)', mb: 1 }}>
                                Create a new account
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                It's quick and easy.
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                {/* First Name & Last Name */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="First name"
                                        value={formData.firstName}
                                        onChange={handleChange('firstName')}
                                        required
                                        placeholder="John"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Last name"
                                        value={formData.lastName}
                                        onChange={handleChange('lastName')}
                                        required
                                        placeholder="Doe"
                                    />
                                </Grid>

                                {/* Username */}
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        value={formData.username}
                                        onChange={handleChange('username')}
                                        required
                                        placeholder="eco_warrior"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                {/* Email */}
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Email address"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange('email')}
                                        required
                                        placeholder="warrior@ecosync.com"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailIcon color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                {/* Password */}
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="New password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange('password')}
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
                                </Grid>

                                {/* Birthday */}
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CakeIcon color="action" sx={{ fontSize: 20 }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            Birthday
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={1}>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <FormControl fullWidth required>
                                                <InputLabel>Month</InputLabel>
                                                <Select
                                                    value={formData.birthMonth}
                                                    onChange={handleChange('birthMonth')}
                                                    label="Month"
                                                >
                                                    {months.map((month, index) => (
                                                        <MenuItem key={month} value={index + 1}>{month}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <FormControl fullWidth required>
                                                <InputLabel>Day</InputLabel>
                                                <Select
                                                    value={formData.birthDay}
                                                    onChange={handleChange('birthDay')}
                                                    label="Day"
                                                >
                                                    {days.map(day => (
                                                        <MenuItem key={day} value={day}>{day}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <FormControl fullWidth required>
                                                <InputLabel>Year</InputLabel>
                                                <Select
                                                    value={formData.birthYear}
                                                    onChange={handleChange('birthYear')}
                                                    label="Year"
                                                >
                                                    {years.map(year => (
                                                        <MenuItem key={year} value={year}>{year}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Gender */}
                                <Grid size={{ xs: 12 }}>
                                    <FormControl component="fieldset" required>
                                        <FormLabel component="legend" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                                            Gender
                                        </FormLabel>
                                        <RadioGroup
                                            row
                                            value={formData.gender}
                                            onChange={handleChange('gender')}
                                        >
                                            <FormControlLabel
                                                value="female"
                                                control={<Radio />}
                                                label="Female"
                                                sx={{
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    px: 2,
                                                    py: 0.5,
                                                    mr: 1,
                                                    flex: 1
                                                }}
                                            />
                                            <FormControlLabel
                                                value="male"
                                                control={<Radio />}
                                                label="Male"
                                                sx={{
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    px: 2,
                                                    py: 0.5,
                                                    mr: 1,
                                                    flex: 1
                                                }}
                                            />
                                            <FormControlLabel
                                                value="custom"
                                                control={<Radio />}
                                                label="Custom"
                                                sx={{
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    px: 2,
                                                    py: 0.5,
                                                    flex: 1
                                                }}
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, mb: 2 }}>
                                By clicking Sign Up, you agree to our Terms, Privacy Policy and Cookies Policy.
                                You may receive SMS notifications from us and can opt out at any time.
                            </Typography>

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                sx={{
                                    mt: 2,
                                    height: 56,
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    borderRadius: '12px',
                                    bgcolor: 'var(--primary-main)',
                                    '&:hover': {
                                        bgcolor: 'var(--primary-dark)'
                                    }
                                }}
                            >
                                Sign Up
                            </Button>
                        </form>

                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Already have an account? {' '}
                                <Link to="/login" style={{ color: 'var(--primary-main)', fontWeight: 700, textDecoration: 'none' }}>
                                    Log in
                                </Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Register;
