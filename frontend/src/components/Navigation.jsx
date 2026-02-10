import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Badge, IconButton, Tooltip, Menu, MenuItem, Avatar, Divider, Drawer, List, ListItem, ListItemIcon, ListItemText, useTheme, useMediaQuery } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MessageIcon from '@mui/icons-material/Message';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import PublicIcon from '@mui/icons-material/Public';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import AirIcon from '@mui/icons-material/Air';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MenuIcon from '@mui/icons-material/Menu';
import ExploreIcon from '@mui/icons-material/Explore';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import GroupsIcon from '@mui/icons-material/Groups';
import MovieIcon from '@mui/icons-material/Movie';
import Groups2Icon from '@mui/icons-material/Groups2';
import EventIcon from '@mui/icons-material/Event';
import SearchIcon from '@mui/icons-material/Search';
import ThemeSwitcher from './ThemeSwitcher';

const Navigation = () => {
    const { user, logout, cartCount, wishlistCount, notificationCount, messageCount, updateCounts } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Poll for updates every 30 seconds
    useEffect(() => {
        if (user) {
            const interval = setInterval(() => {
                updateCounts();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [user, updateCounts]);

    const handleLogout = () => {
        logout();
        navigate('/');
        setAnchorEl(null);
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        if (path === '/products') return location.pathname.startsWith('/product');
        if (path === '/challenges') return location.pathname.startsWith('/challenge');
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { label: 'Search', path: '/search', icon: <SearchIcon /> },
        { label: 'Shop', path: '/products', icon: <ShoppingBagIcon /> },
        { label: 'Feed', path: '/feed', icon: <GroupsIcon /> },
        { label: 'Reels', path: '/reels', icon: <MovieIcon /> },
        { label: 'Groups', path: '/groups', icon: <Groups2Icon /> },
        { label: 'Events', path: '/events', icon: <EventIcon /> },
        { label: 'Challenges', path: '/challenges', icon: <EmojiEventsIcon /> },
        { label: 'Impact', path: '/impact', icon: <AirIcon /> },
        { label: 'Heroes', path: '/leaderboard', icon: <LeaderboardIcon /> },
        { label: 'Community', path: '/community', icon: <PublicIcon /> }
    ].filter(() => user || location.pathname !== '/');

    const drawer = (
        <Box sx={{ width: 280, p: 2 }}>
            <Typography variant="h6" sx={{ color: 'var(--primary-main)', fontWeight: 800, mb: 3, px: 2 }}>
                🌿 EcoSync Hub
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ px: 1 }}>
                {navItems.map((item) => (
                    <ListItem
                        key={item.path}
                        component={Link}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        sx={{
                            borderRadius: '12px',
                            mb: 1,
                            bgcolor: isActive(item.path) ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                            color: isActive(item.path) ? 'var(--primary-main)' : 'inherit',
                            '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.05)' }
                        }}
                    >
                        <ListItemIcon sx={{ color: isActive(item.path) ? 'var(--primary-main)' : 'inherit', minWidth: 40 }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontWeight: isActive(item.path) ? 800 : 500 }}
                        />
                    </ListItem>
                ))}
            </List>
            {!user && (
                <Box sx={{ p: 2, mt: 2 }}>
                    <Button fullWidth component={Link} to="/login" variant="outlined" sx={{ mb: 2, borderRadius: '12px' }} onClick={() => setMobileOpen(false)}>Login</Button>
                    <Button fullWidth component={Link} to="/register" variant="contained" sx={{ borderRadius: '12px' }} onClick={() => setMobileOpen(false)}>Join Hub</Button>
                </Box>
            )}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Theme Mode</Typography>
                <ThemeSwitcher />
            </Box>
        </Box>
    );

    return (
        <>
            <AppBar position="sticky" sx={{
                backgroundColor: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                color: 'var(--primary-dark)',
                boxShadow: '0 2px 15px rgba(0,0,0,0.05)',
                borderBottom: '1px solid var(--glass-border)',
                zIndex: theme.zIndex.appBar
            }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {isMobile && (
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={() => setMobileOpen(true)}
                                sx={{ mr: 1, color: 'var(--primary-main)' }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                        <Typography variant="h5" component={Link} to="/" sx={{
                            textDecoration: 'none',
                            color: 'var(--primary-main)',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            🌿 EcoSync
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {!isMobile && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {navItems.map((item) => (
                                    <Button
                                        key={item.path}
                                        color="inherit"
                                        component={Link}
                                        to={item.path}
                                        sx={{
                                            fontWeight: isActive(item.path) ? 800 : 500,
                                            color: isActive(item.path) ? 'var(--primary-main)' : 'inherit',
                                            position: 'relative',
                                            px: 2,
                                            '&:after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: 6,
                                                left: '20%',
                                                width: isActive(item.path) ? '60%' : '0%',
                                                height: '3px',
                                                bgcolor: 'var(--primary-main)',
                                                borderRadius: '4px',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            },
                                            '&:hover': {
                                                bgcolor: 'transparent',
                                                color: 'var(--primary-main)',
                                                '&:after': { width: '60%' }
                                            }
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </Box>
                        )}

                        {user ? (
                            <>
                                <Box sx={{ ml: { xs: 0, sm: 2 }, display: 'flex', gap: 0.5 }}>
                                    <Tooltip title="Cart">
                                        <IconButton color="inherit" component={Link} to="/cart">
                                            <Badge badgeContent={cartCount} color="error"><ShoppingCartIcon /></Badge>
                                        </IconButton>
                                    </Tooltip>

                                    {!isMobile && (
                                        <Tooltip title="Wishlist">
                                            <IconButton color="inherit" component={Link} to="/wishlist">
                                                <Badge badgeContent={wishlistCount} color="error"><FavoriteIcon /></Badge>
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {!isMobile && (
                                        <Tooltip title="Messages">
                                            <IconButton color="inherit" component={Link} to="/messages"><Badge badgeContent={messageCount} color="error"><MessageIcon /></Badge></IconButton>
                                        </Tooltip>
                                    )}

                                    <Tooltip title="Notifications">
                                        <IconButton color="inherit" component={Link} to="/notifications">
                                            <Badge badgeContent={notificationCount} color="error"><NotificationsIcon /></Badge>
                                        </IconButton>
                                    </Tooltip>

                                    {!isMobile && <ThemeSwitcher />}

                                    <IconButton
                                        onClick={(e) => setAnchorEl(e.currentTarget)}
                                        sx={{ ml: 1, p: 0.5 }}
                                    >
                                        <Avatar src={getImageUrl(user.avatar_url)} sx={{ width: 32, height: 32, bgcolor: 'var(--primary-main)' }}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </IconButton>
                                </Box>

                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={() => setAnchorEl(null)}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                    PaperProps={{
                                        sx: {
                                            mt: 1.5,
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '12px',
                                            minWidth: 180
                                        }
                                    }}
                                >
                                    <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)}><PersonIcon sx={{ mr: 1.5, fontSize: 20 }} /> My Profile</MenuItem>
                                    <MenuItem component={Link} to="/impact" onClick={() => setAnchorEl(null)}><AirIcon sx={{ mr: 1.5, fontSize: 20 }} /> My Impact</MenuItem>
                                    <MenuItem component={Link} to="/orders" onClick={() => setAnchorEl(null)}><ListAltIcon sx={{ mr: 1.5, fontSize: 20 }} /> My Orders</MenuItem>
                                    <MenuItem component={Link} to="/addresses" onClick={() => setAnchorEl(null)}><LocationOnIcon sx={{ mr: 1.5, fontSize: 20 }} /> Address Book</MenuItem>
                                    <MenuItem component={Link} to="/friends" onClick={() => setAnchorEl(null)}><PeopleIcon sx={{ mr: 1.5, fontSize: 20 }} /> Social & Friends</MenuItem>
                                    <MenuItem component={Link} to="/wishlist" onClick={() => setAnchorEl(null)}><FavoriteIcon sx={{ mr: 1.5, fontSize: 20 }} /> My Wishlist</MenuItem>
                                    <Divider />
                                    {user.role === 'seller' && <MenuItem component={Link} to="/seller" onClick={() => setAnchorEl(null)}>Seller Central</MenuItem>}
                                    {user.role === 'admin' && <MenuItem component={Link} to="/admin" onClick={() => setAnchorEl(null)}>Admin Panel</MenuItem>}
                                    <Divider />
                                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
                                </Menu>
                            </>
                        ) : (
                            !isMobile && (
                                <Box sx={{ ml: 2 }}>
                                    <Button component={Link} to="/login" sx={{ mr: 1 }}>Login</Button>
                                    <Button component={Link} to="/register" variant="contained">Join Hub</Button>
                                </Box>
                            )
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, borderRadius: '0 24px 24px 0' },
                }}
            >
                {drawer}
            </Drawer>
        </>
    );
};

export default Navigation;
