import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, Grid, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useAuth } from '../contexts/AuthContext';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { api } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await api.get('/auth/users');
                const sortedUsers = response.data.sort((a, b) => b.eco_points - a.eco_points);
                setUsers(sortedUsers.slice(0, 20));
            } catch {
                console.error('Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [api]);

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box className="page-container fade-in">
            <Box sx={{ textAlign: 'center', mb: 10, position: 'relative' }}>
                <Box sx={{
                    position: 'absolute',
                    top: -100,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 600,
                    height: 600,
                    background: 'radial-gradient(circle, rgba(76, 175, 80, 0.08) 0%, transparent 70%)',
                    zIndex: -1
                }} />
                <Box sx={{ display: 'inline-flex', p: 3, borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%', bgcolor: 'rgba(255, 179, 0, 0.1)', mb: 3, animation: 'morph 8s ease-in-out infinite' }}>
                    <EmojiEventsIcon sx={{ fontSize: 70, color: '#ffb300' }} />
                </Box>
                <Typography variant="h1" sx={{ fontWeight: 950, mb: 1, background: 'linear-gradient(45deg, var(--primary-dark), var(--primary-main))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -1 }}>Impact Hall of Fame</Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8, maxWidth: 600, mx: 'auto' }}>Honoring the frontline warriors of the global sustainability movement</Typography>
            </Box>

            {/* Podium for Top 3 */}
            <Grid container spacing={3} sx={{ mb: 12, alignItems: 'flex-end', justifyContent: 'center' }}>
                {users.slice(0, 3).length > 0 && (isMobile ? [0, 1, 2] : [1, 0, 2]).map((rankIdx, i) => {
                    const user = users[rankIdx];
                    if (!user) return null;
                    const rank = rankIdx + 1;
                    const isFirst = rank === 1;

                    return (
                        <Grid size={{ xs: 12, sm: 4 }} key={user.id} sx={{ order: i, mt: isMobile ? 8 : 0 }}>
                            <Card className="card hover-lift" sx={{
                                height: isFirst ? 380 : rank === 2 ? 320 : 280,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'visible',
                                background: isFirst
                                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%)'
                                    : 'white',
                                border: isFirst ? '3px solid #ffd700' : '1px solid var(--glass-border)',
                                boxShadow: isFirst ? '0 20px 40px rgba(255, 215, 0, 0.15)' : 'var(--card-shadow)',
                                borderRadius: '32px',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}>
                                <Box sx={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                                    <Avatar
                                        src={user.avatar_url}
                                        sx={{
                                            width: isFirst ? 140 : 110,
                                            height: isFirst ? 140 : 110,
                                            border: isFirst ? '6px solid #ffd700' : '5px solid white',
                                            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                                            bgcolor: 'var(--primary-main)',
                                            fontSize: '3.5rem'
                                        }}
                                    >
                                        {user.username?.charAt(0)}
                                    </Avatar>
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 5,
                                        right: 5,
                                        width: isFirst ? 48 : 40,
                                        height: isFirst ? 48 : 40,
                                        bgcolor: rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isFirst ? '#000' : 'white',
                                        fontWeight: 900,
                                        fontSize: isFirst ? '1.2rem' : '1rem',
                                        border: '4px solid white',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        {rank}
                                    </Box>
                                </Box>
                                <Box sx={{ mt: 8, textAlign: 'center', px: 2 }}>
                                    <Typography variant={isFirst ? "h4" : "h5"} sx={{ fontWeight: 900, mb: 0.5 }}>{user.username}</Typography>
                                    <Typography variant="body2" color="primary" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 3, letterSpacing: 1 }}>
                                        {rank === 1 ? 'Grand Master' : rank === 2 ? 'Elite Guardian' : 'Lead Warrior'}
                                    </Typography>
                                    <Box sx={{ py: 1, px: 3, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '20px', display: 'inline-block' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 950, color: isFirst ? '#d4af37' : 'var(--primary-main)' }}>
                                            {user.eco_points.toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Points</Typography>
                                    </Box>
                                </Box>
                                {isFirst && <WorkspacePremiumIcon sx={{ position: 'absolute', top: 20, right: 20, color: '#ffd700', fontSize: 50, opacity: 0.9, transform: 'rotate(15deg)' }} />}
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            <TableContainer component={Paper} className="card" sx={{ overflow: 'hidden', p: 0, borderRadius: '24px' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, p: { xs: 2, sm: 3 }, width: { xs: 60, sm: 100 } }}>RANK</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>WARRIOR</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800 }}>IMPACT SCORE</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, pr: 4, display: { xs: 'none', sm: 'table-cell' } }}>STATUS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user, index) => (
                            <TableRow
                                key={user.id}
                                hover
                                sx={{
                                    transition: '0.3s',
                                    '&:last-child td, &:last-child th': { border: 0 },
                                    bgcolor: index < 3 ? 'rgba(76, 175, 80, 0.02)' : 'inherit'
                                }}
                            >
                                <TableCell sx={{ p: 3 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: index < 3 ? 'var(--primary-main)' : 'text.secondary' }}>
                                        #{index + 1}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar
                                            src={user.avatar_url}
                                            component={Link}
                                            to={`/profile/${user.id}`}
                                            sx={{ width: 48, height: 48, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', border: '2px solid white' }}
                                        >
                                            {user.username?.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography
                                                variant="subtitle1"
                                                component={Link}
                                                to={`/profile/${user.id}`}
                                                sx={{ fontWeight: 800, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 1 }}
                                            >
                                                {user.username}
                                                {index < 3 && <Chip label="SQUAD" size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900, bgcolor: 'var(--primary-main)', color: 'white' }} />}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Warrior since {new Date(user.created_at || Date.now()).getFullYear()}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--primary-main)' }}>
                                        {user.eco_points.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                        {user.carbon_saved_kg}kg CO2 Negated
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 4, display: { xs: 'none', sm: 'table-cell' } }}>
                                    <Chip
                                        label={index < 5 ? 'Elite Guardian' : index < 10 ? 'Veteran' : 'Warrior'}
                                        variant={index < 3 ? 'filled' : 'outlined'}
                                        sx={{
                                            fontWeight: 900,
                                            borderRadius: '12px',
                                            px: 1,
                                            bgcolor: index < 3 ? '#2e7d32' : index < 5 ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                            color: index < 3 ? 'white' : index < 5 ? '#2e7d32' : 'inherit',
                                            border: index < 5 ? 'none' : '1px solid rgba(0,0,0,0.1)'
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Leaderboard;
