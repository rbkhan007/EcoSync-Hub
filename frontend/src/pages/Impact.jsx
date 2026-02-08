import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, LinearProgress, Tabs, Tab, List, ListItem, ListItemText, ListItemIcon, CircularProgress, Chip, Button, Divider } from '@mui/material';
import ForestIcon from '@mui/icons-material/Forest';
import AirIcon from '@mui/icons-material/Air';
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import { useAuth } from '../contexts/AuthContext';

const Impact = () => {
    const [tab, setTab] = useState(0);
    const [globalStats, setGlobalStats] = useState({ users: 0, totalCO2: 0, products: 0 });
    const [personalLogs, setPersonalLogs] = useState([]);
    const [personalSummary, setPersonalSummary] = useState({ total_saved: 0, activities: 0 });
    const [loading, setLoading] = useState(true);
    const { api } = useAuth();

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [globalRes, logsRes, personalSummaryRes] = await Promise.all([
                    api.get('/stats'),
                    api.get('/carbon'),
                    api.get('/carbon/summary')
                ]);
                setGlobalStats({
                    users: globalRes.data.users,
                    totalCO2: globalRes.data.totalCO2Saved,
                    products: globalRes.data.products
                });
                setPersonalLogs(logsRes.data);
                setPersonalSummary(personalSummaryRes.data);
            } catch (err) {
                console.error('Failed to load impact data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [api]);

    if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

    const globalMetrics = [
        { label: 'Total Carbon Saved', value: `${globalStats.totalCO2} kg`, icon: <AirIcon sx={{ fontSize: 40 }} />, color: '#4caf50', progress: 85 },
        { label: 'Verified Eco-Products', value: globalStats.products, icon: <PublicIcon sx={{ fontSize: 40 }} />, color: '#2196f3', progress: 70 },
        { label: 'Active Community', value: globalStats.users, icon: <ForestIcon sx={{ fontSize: 40 }} />, color: '#8bc34a', progress: 95 },
    ];

    return (
        <Box className="page-container fade-in">
            <Box sx={{ mb: 6, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 950, mb: 1, letterSpacing: -1 }}>Impact Center</Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                    Monitoring global restoration and personal sequestration metrics
                </Typography>
            </Box>

            <Tabs
                value={tab}
                onChange={(e, v) => setTab(v)}
                centered
                sx={{
                    mb: 6,
                    '& .MuiTab-root': { fontWeight: 800, fontSize: '1rem', px: 4 },
                    '& .MuiTabs-indicator': { height: 4, borderRadius: 2 }
                }}
            >
                <Tab label="Global Status" />
                <Tab label="My Personal Journey" />
            </Tabs>

            {tab === 0 ? (
                <Box className="fade-in">
                    <Grid container spacing={4}>
                        {globalMetrics.map((m, i) => (
                            <Grid size={{ xs: 12, md: 4 }} key={i}>
                                <Card className="card hover-lift" sx={{ textAlign: 'center', p: 4, height: '100%' }}>
                                    <Box sx={{
                                        display: 'inline-flex', width: 80, height: 80, alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '24px', bgcolor: `${m.color}15`, color: m.color, mb: 3, mx: 'auto'
                                    }}>
                                        {m.icon}
                                    </Box>
                                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>{m.value}</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.secondary', mb: 4, textTransform: 'uppercase' }}>{m.label}</Typography>
                                    <LinearProgress variant="determinate" value={m.progress} sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { bgcolor: m.color, borderRadius: 5 } }} />
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Card className="card" sx={{ mt: 8, background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', color: 'white', p: { xs: 4, md: 8 }, position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Chip label="MISSION CRITICAL" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 900, mb: 3 }} />
                            <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, color: 'white' }}>The 2030 Sequestration Mandate</Typography>
                            <Typography variant="h6" sx={{ opacity: 0.85, lineHeight: 1.8, mb: 4, maxWidth: 800 }}>
                                Our primary objective is to neutralize 1,000,000 kg of atmospheric CO2 emissions by Year 2030. Every transaction, every challenge, and every user brings us closer to global climate stability.
                            </Typography>
                            <Button
                                component="a"
                                href="https://gedkp.gov.bd/wp-content/uploads/2025/10/Bangladesh-SDGs-Progress-Report-2025.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="contained"
                                sx={{ bgcolor: 'white', color: 'var(--primary-dark)', fontWeight: 900, px: 6, py: 2, borderRadius: '16px' }}
                            >
                                Full Impact Brief
                            </Button>
                        </Box>
                        <PublicIcon sx={{ position: 'absolute', right: -50, top: -50, fontSize: 300, opacity: 0.1 }} />
                    </Card>
                </Box>
            ) : (
                <Box className="fade-in">
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card className="card" sx={{ background: 'linear-gradient(135deg, var(--primary-main) 0%, var(--primary-dark) 100%)', color: 'white', p: 4, borderRadius: '32px' }}>
                                <Typography variant="overline" sx={{ fontWeight: 900, opacity: 0.8, letterSpacing: 2 }}>TOTAL SAVED</Typography>
                                <Typography variant="h1" sx={{ fontWeight: 900, my: 1, color: 'white' }}>
                                    {personalSummary.total_saved || 0}
                                    <Typography component="span" variant="h3" sx={{ fontWeight: 900, ml: 1, opacity: 0.8, color: 'white' }}>kg</Typography>
                                </Typography>
                                <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CheckCircleIcon />
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{personalSummary.activities || 0} Activities</Typography>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 8 }}>
                            <Card className="card" sx={{ p: 0, borderRadius: '32px', overflow: 'hidden' }}>
                                <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: 'rgba(0,0,0,0.01)' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Activity Log</Typography>
                                </Box>
                                <CardContent sx={{ p: 0 }}>
                                    {personalLogs.length === 0 ? (
                                        <Box sx={{ py: 10, textAlign: 'center' }}>
                                            <InfoIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                            <Typography color="text.secondary">No activities recorded yet.</Typography>
                                        </Box>
                                    ) : (
                                        <List disablePadding>
                                            {personalLogs.map((log, i) => (
                                                <ListItem key={log.id} sx={{ p: 3, borderBottom: i < personalLogs.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}>
                                                    <ListItemIcon sx={{ minWidth: 60 }}>
                                                        <Box sx={{ p: 1.5, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px', color: 'primary.main' }}>
                                                            <CheckCircleIcon />
                                                        </Box>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6" sx={{ fontWeight: 800 }}>{log.source}</Typography><Typography variant="h6" color="primary" sx={{ fontWeight: 900 }}>+{log.amount_kg}kg</Typography></Box>}
                                                        secondary={new Date(log.logged_at).toLocaleDateString() + ' ' + new Date(log.logged_at).toLocaleTimeString()}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default Impact;
