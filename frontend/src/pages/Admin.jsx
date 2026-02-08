import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import ImageWithFallback from '../components/ImageWithFallback';
import {
    Box, Typography, Button, Card, CardContent, Grid, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Avatar,
    Chip, IconButton, Tooltip, MenuItem, TextField, Dialog,
    DialogTitle, DialogContent, DialogActions, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, Divider, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Co2Icon from '@mui/icons-material/Co2';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DeleteIcon from '@mui/icons-material/Delete';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LogoutIcon from '@mui/icons-material/Logout';
import StarIcon from '@mui/icons-material/Star';
import StorageIcon from '@mui/icons-material/Storage';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import TableChartIcon from '@mui/icons-material/TableChart';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import QuizIcon from '@mui/icons-material/Quiz';

const SidebarItem = ({ active, icon, label, onClick }) => (
    <ListItem disablePadding sx={{ mb: 1 }}>
        <ListItemButton
            onClick={onClick}
            sx={{
                borderRadius: '12px',
                bgcolor: active ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                color: active ? 'primary.main' : 'text.secondary',
                '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.05)' },
                transition: 'all 0.2s'
            }}
        >
            <ListItemIcon sx={{ color: active ? 'primary.main' : 'inherit', minWidth: 40 }}>
                {icon}
            </ListItemIcon>
            <ListItemText primary={label} primaryTypographyProps={{ fontWeight: active ? 800 : 600, fontSize: '0.9rem' }} />
        </ListItemButton>
    </ListItem>
);

const StatCard = ({ title, value, icon, color, trend }) => (
    <Card className="card hover-lift" sx={{ height: '100%', p: 3, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: `${color}15`, color: color }}>
                    {icon}
                </Box>
                {trend && (
                    <Chip
                        label={trend}
                        size="small"
                        sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: 'var(--primary-main)', fontWeight: 800, height: 24 }}
                    />
                )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{value}</Typography>
        </Box>
        <Box sx={{
            position: 'absolute',
            right: -20,
            bottom: -20,
            opacity: 0.03,
            transform: 'rotate(-15deg)'
        }}>
            {React.cloneElement(icon, { sx: { fontSize: 120 } })}
        </Box>
    </Card>
);

const Admin = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sellers, setSellers] = useState([]);
    const [pendingProducts, setPendingProducts] = useState([]); // Renamed from products
    const [approvedProducts, setApprovedProducts] = useState([]); // New state
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [stats, setStats] = useState({});
    const [challengeForm, setChallengeForm] = useState({
        title: '', description: '', points_reward: '', co2_saving_kg: '', duration_days: '', category: 'Week', image_url: ''
    });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemType, setItemType] = useState(null); // 'product' or 'challenge'
    const [editForm, setEditForm] = useState({});
    const { api, user: currentUser } = useAuth();
    const challengeImageRef = useRef(null);
    const editImageRef = useRef(null);

    // Database Management State
    const [dbTables, setDbTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [tableData, setTableData] = useState({ columns: [], data: [], pagination: {} });
    const [dbSearch, setDbSearch] = useState('');
    const [dbPage, setDbPage] = useState(1);
    const [dbEditDialog, setDbEditDialog] = useState(false);
    const [dbEditRecord, setDbEditRecord] = useState(null);
    const [dbAddDialog, setDbAddDialog] = useState(false);
    const [dbNewRecord, setDbNewRecord] = useState({});
    const [selectedRows, setSelectedRows] = useState([]);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const refreshIntervalRef = useRef(null);

    // Manual Quiz Builder State
    const [quizForm, setQuizForm] = useState({
        title: '',
        description: '',
        points_reward: 50,
        questions: [{ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }]
    });
    const [submittingQuiz, setSubmittingQuiz] = useState(false);

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (type === 'challenge') {
                setChallengeForm(prev => ({ ...prev, image_url: res.data.url }));
            } else if (type === 'edit') {
                setEditForm(prev => ({ ...prev, image_url: res.data.url }));
            }
        } catch {
            alert('Failed to upload image');
        }
    };

    const handleEditOpen = (item, type) => {
        setEditingItem(item);
        setItemType(type);
        setEditForm({ ...item });
        setEditDialogOpen(true);
    };

    const handleUpdateSubmit = async () => {
        try {
            if (itemType === 'product') {
                await api.put(`/products/${editingItem.id}`, editForm);
                fetchProducts();
            } else if (itemType === 'challenge') {
                await api.put(`/challenges/${editingItem.id}`, editForm);
                fetchChallenges();
            }
            alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} updated successfully.`);
            setEditDialogOpen(false);
        } catch {
            alert('Failed to update item.');
        }
    };

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data);
        } catch { console.error('Failed to fetch stats'); }
    }, [api]);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data);
        } catch { console.error('Failed to fetch users'); }
    }, [api]);

    const fetchProducts = useCallback(async () => {
        try {
            const pendingRes = await api.get('/admin/products/pending');
            const approvedRes = await api.get('/products'); // Use the public route to get approved products
            setPendingProducts(Array.isArray(pendingRes.data) ? pendingRes.data : []);
            setApprovedProducts(Array.isArray(approvedRes.data) ? approvedRes.data : []);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
    }, [api]);

    const fetchOrders = useCallback(async () => {
        try {
            const response = await api.get('/orders');
            setOrders(response.data);
        } catch { console.error('Failed to fetch orders'); }
    }, [api]);

    const fetchChallenges = useCallback(async () => {
        try {
            const response = await api.get('/challenges');
            setChallenges(response.data);
        } catch { console.error('Failed to fetch challenges'); }
    }, [api]);

    const fetchSellers = useCallback(async () => {
        try {
            const response = await api.get('/admin/sellers/pending');
            setSellers(response.data);
        } catch { console.error('Failed to fetch sellers'); }
    }, [api]);

    const fetchData = useCallback(async (tab) => {
        try {
            switch (tab) {
                case 'dashboard': await fetchStats(); break;
                case 'users': await fetchUsers(); break;
                case 'approval': await fetchProducts(); break;
                case 'orders': await fetchOrders(); break;
                case 'challenges': await fetchChallenges(); break;
                case 'sellers': await fetchSellers(); break;
                default: break;
            }
        } catch (err) { console.error('Fetch error:', err); }
    }, [fetchStats, fetchUsers, fetchProducts, fetchOrders, fetchChallenges, fetchSellers]);

    useEffect(() => {
        const load = async () => {
            await fetchData(activeTab);
        };
        load();
    }, [activeTab, fetchData]);

    const handleAction = async (action, id, type = 'product') => {
        try {
            if (type === 'product') {
                if (action === 'approve') await api.post(`/admin/products/${id}/approve`);
                else if (action === 'reject') await api.post(`/admin/products/${id}/reject`);
                fetchProducts();
            } else if (type === 'seller') {
                await api.post(`/admin/sellers/${id}/approve`);
                fetchSellers();
            }
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
        } catch {
            alert('Action failed. Hub connection issue.');
        }
    };

    const changeUserRole = async (id, newRole) => {
        try {
            await api.put(`/admin/users/${id}/role`, { role: newRole });
            alert(`User role updated to ${newRole} successfully.`);
            fetchUsers();
        } catch { alert('Failed to update user role.'); }
    };

    const deleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            alert('User profile has been purged from the system.');
            fetchUsers();
        } catch { alert('Failed to delete user.'); }
    };

    const handleChallengeSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/challenges', challengeForm);
            alert('Challenge created!');
            setChallengeForm({
                title: '', description: '', points_reward: '', co2_saving_kg: '', duration_days: '', category: 'Week', image_url: ''
            });
            fetchChallenges();
        } catch { console.error('Failed to create challenge'); }
    };

    // Database Management Functions
    const fetchDbTables = useCallback(async () => {
        try {
            const response = await api.get('/admin/database/tables');
            setDbTables(response.data);
        } catch (error) {
            console.error('Failed to fetch database tables', error);
        }
    }, [api]);

    const fetchTableData = useCallback(async (tableName, page = 1, search = '') => {
        if (!tableName) return;
        try {
            const response = await api.get(`/admin/database/tables/${tableName}`, {
                params: { page, limit: 20, search }
            });
            setTableData(response.data);
        } catch (error) {
            console.error('Failed to fetch table data', error);
        }
    }, [api]);

    const handleDbAdd = async () => {
        try {
            await api.post(`/admin/database/tables/${selectedTable}`, dbNewRecord);
            alert('Record added successfully!');
            setDbAddDialog(false);
            setDbNewRecord({});
            fetchTableData(selectedTable, dbPage, dbSearch);
        } catch (error) {
            alert('Failed to add record: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDbEdit = async () => {
        try {
            const primaryKey = tableData.columns.find(col => col.key === 'PRI');
            if (!primaryKey) {
                alert('Cannot edit: table has no primary key');
                return;
            }
            const id = dbEditRecord[primaryKey.field];
            await api.put(`/admin/database/tables/${selectedTable}/${id}`, dbEditRecord);
            alert('Record updated successfully!');
            setDbEditDialog(false);
            setDbEditRecord(null);
            fetchTableData(selectedTable, dbPage, dbSearch);
        } catch (error) {
            alert('Failed to update record: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDbDelete = async (record) => {
        const primaryKey = tableData.columns.find(col => col.key === 'PRI');
        if (!primaryKey) {
            alert('Cannot delete: table has no primary key');
            return;
        }
        const id = record[primaryKey.field];
        if (!confirm(`Are you sure you want to delete this record (ID: ${id})?`)) return;

        try {
            await api.delete(`/admin/database/tables/${selectedTable}/${id}`);
            alert('Record deleted successfully!');
            fetchTableData(selectedTable, dbPage, dbSearch);
        } catch (error) {
            alert('Failed to delete record: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return;
        if (!confirm(`Delete ${selectedRows.length} selected record(s)?`)) return;

        try {
            await api.post(`/admin/database/tables/${selectedTable}/bulk-delete`, { ids: selectedRows });
            alert(`${selectedRows.length} record(s) deleted successfully!`);
            setSelectedRows([]);
            fetchTableData(selectedTable, dbPage, dbSearch);
        } catch (error) {
            alert('Failed to delete records: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleManualQuizSubmit = async (e) => {
        e.preventDefault();
        setSubmittingQuiz(true);
        try {
            await api.post('/quizzes', quizForm);
            alert('Quiz created successfully!');
            setQuizForm({
                title: '',
                description: '',
                points_reward: 50,
                questions: [{ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }]
            });
            fetchChallenges(); // Refresh lists if needed
        } catch (error) {
            alert('Failed to create quiz: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmittingQuiz(false);
        }
    };

    const handleQuizQuestionChange = (index, field, value) => {
        const newQuestions = [...quizForm.questions];
        newQuestions[index][field] = value;
        setQuizForm({ ...quizForm, questions: newQuestions });
    };

    const addQuizQuestion = () => {
        setQuizForm({
            ...quizForm,
            questions: [...quizForm.questions, { question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }]
        });
    };

    const removeQuizQuestion = (index) => {
        if (quizForm.questions.length <= 1) return;
        const newQuestions = quizForm.questions.filter((_, i) => i !== index);
        setQuizForm({ ...quizForm, questions: newQuestions });
    };

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh && selectedTable && activeTab === 'database') {
            refreshIntervalRef.current = setInterval(() => {
                fetchTableData(selectedTable, dbPage, dbSearch);
            }, 5000); // Refresh every 5 seconds
        } else {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        }
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [autoRefresh, selectedTable, activeTab, dbPage, dbSearch, fetchTableData]);

    // Load tables when database tab is opened
    useEffect(() => {
        if (activeTab === 'database') {
            fetchDbTables();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Load table data when table is selected
    useEffect(() => {
        if (selectedTable) {
            fetchTableData(selectedTable, dbPage, dbSearch);
        }
    }, [selectedTable, dbPage, dbSearch, fetchTableData]);

    const sidebarContent = [
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { id: 'users', label: 'User Directory', icon: <PeopleIcon /> },
        { id: 'approval', label: 'Product Management', icon: <InventoryIcon /> },
        { id: 'orders', label: 'Order History', icon: <ShoppingCartIcon /> },
        { id: 'challenges', label: 'Challenge Hub', icon: <AssignmentIcon /> },
        { id: 'sellers', label: 'Seller Approvals', icon: <StorefrontIcon /> },
        { id: 'add-challenge', label: 'Create Mission', icon: <AddCircleIcon /> },
        { id: 'quiz-builder', label: 'Manual Quiz Builder', icon: <QuizIcon /> },
        { id: 'database', label: 'Database Manager', icon: <StorageIcon /> },
    ];

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
            {/* Professional Sidebar */}
            <Box sx={{
                width: 280,
                flexShrink: 0,
                bgcolor: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid var(--glass-border)',
                p: 3,
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                height: '100vh'
            }}>
                <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'var(--primary-main)', width: 45, height: 45, fontSize: '1.2rem', fontWeight: 900 }}>EE</Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>Eagle Eye</Typography>
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Control Center</Typography>
                    </Box>
                </Box>

                <List sx={{ flexGrow: 1 }}>
                    {sidebarContent.map((item) => (
                        <SidebarItem
                            key={item.id}
                            active={activeTab === item.id}
                            icon={item.icon}
                            label={item.label}
                            onClick={() => setActiveTab(item.id)}
                        />
                    ))}
                </List>

                <Divider sx={{ my: 2 }} />

                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<LogoutIcon />}
                    component={Link}
                    to="/"
                    sx={{ borderRadius: '12px', fontWeight: 700 }}
                >
                    Exit Control
                </Button>
            </Box>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: 6 }}>
                <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
                            {sidebarContent.find(s => s.id === activeTab)?.label}
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Managing the future of sustainability
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip label="System Online" color="success" icon={<CheckCircleIcon />} sx={{ fontWeight: 800, px: 2 }} />
                        <Avatar src={getImageUrl(currentUser?.avatar_url)}>{(currentUser?.username || 'A').charAt(0)}</Avatar>
                    </Box>
                </Box>

                {activeTab === 'dashboard' && (
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard title="Total Users" value={stats.users || '0'} icon={<PeopleIcon />} color="#2e7d32" trend="+12% this week" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard title="Active Goods" value={stats.products || '0'} icon={<InventoryIcon />} color="#1976d2" trend="+5 new" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard title="Processed Orders" value={stats.orders || '0'} icon={<ShoppingCartIcon />} color="#ed6c02" trend="stable" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard title="CO2 Impact Managed" value={`${stats.totalCO2Saved || '0'} kg`} icon={<Co2Icon />} color="#9c27b0" trend="record high" />
                        </Grid>

                        <Grid size={12}>
                            <Card className="card" sx={{ p: 4, bgcolor: 'var(--primary-main)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                                <Box sx={{ position: 'relative', zIndex: 1 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: 'white' }}>System Integrity Status</Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
                                        All background processes are running smoothly. Database synchronization completed 4 minutes ago.
                                        There are currently {pendingProducts.length} products and {sellers.length} sellers awaiting your review.
                                    </Typography>
                                </Box>
                                <DashboardIcon sx={{ position: 'absolute', right: -40, bottom: -40, fontSize: 300, opacity: 0.1 }} />
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 'users' && (
                    <TableContainer component={Paper} className="card" sx={{ p: 0, borderRadius: '24px', overflow: 'hidden' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, p: 3 }}>WARRIOR</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>AUTHORITY</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>EP SCORE</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="right">MODERATION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar src={getImageUrl(u.avatar_url)}>{(u.username || 'U').charAt(0)}</Avatar>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 800 }}>{u.username || 'Anonymous'}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{u.email || 'No email'}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={(u.role || 'user').toUpperCase()} size="small" color={u.role === 'admin' ? 'secondary' : u.role === 'seller' ? 'primary' : 'default'} sx={{ fontWeight: 900, fontSize: '0.7rem' }} />
                                        </TableCell>
                                        <TableCell><Typography variant="body2" sx={{ fontWeight: 900 }}>{u.eco_points} EP</Typography></TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Switch Role">
                                                <span>
                                                    <IconButton onClick={() => changeUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')} color="primary" disabled={u.id === currentUser.id}><AdminPanelSettingsIcon /></IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title="Purge Profile">
                                                <IconButton onClick={() => deleteUser(u.id)} color="error"><DeleteIcon /></IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {activeTab === 'approval' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                        {/* Section 1: Pending Approvals */}
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 32, bgcolor: 'warning.main', borderRadius: 4 }} />
                                Pending Approvals
                                <Chip label={pendingProducts.length} color="warning" size="small" sx={{ fontWeight: 800, ml: 1 }} />
                            </Typography>

                            {pendingProducts.length === 0 ? (
                                <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(0,0,0,0.1)' }}>
                                    <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3, mb: 1 }} />
                                    <Typography color="text.secondary">No pending products to review.</Typography>
                                </Card>
                            ) : (
                                <Grid container spacing={4}>
                                    {pendingProducts.map((p) => (
                                        <Grid size={{ xs: 12, lg: 6 }} key={p.id}>
                                            <Card className="card hover-lift" sx={{ p: 0, overflow: 'hidden', display: 'flex' }}>
                                                <ImageWithFallback src={getImageUrl(p.image_url)} sx={{ width: 180, height: 180, objectFit: 'cover' }} />
                                                <Box sx={{ p: 3, flexGrow: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>{p.name}</Typography>
                                                        <Typography variant="h6" color="primary" sx={{ fontWeight: 900 }}>৳{p.price}</Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{p.description}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} fullWidth onClick={() => handleAction('approve', p.id)} sx={{ borderRadius: '12px', fontWeight: 800 }}>Approve</Button>
                                                        <Button variant="outlined" color="primary" fullWidth onClick={() => handleEditOpen(p, 'product')} sx={{ borderRadius: '12px', fontWeight: 800 }}>Refine</Button>
                                                        <Button variant="outlined" color="error" startIcon={<CancelIcon />} fullWidth onClick={() => handleAction('reject', p.id)} sx={{ borderRadius: '12px', fontWeight: 800 }}>Reject</Button>
                                                    </Box>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>

                        <Divider />

                        {/* Section 2: Approved Products */}
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 32, bgcolor: 'success.main', borderRadius: 4 }} />
                                Approved Inventory
                                <Chip label={approvedProducts.length} color="success" size="small" sx={{ fontWeight: 800, ml: 1 }} />
                            </Typography>

                            {approvedProducts.length === 0 ? (
                                <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(0,0,0,0.1)' }}>
                                    <StorefrontIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3, mb: 1 }} />
                                    <Typography color="text.secondary">No approved products found.</Typography>
                                </Card>
                            ) : (
                                <Grid container spacing={4}>
                                    {approvedProducts.map((p) => (
                                        <Grid size={{ xs: 12, lg: 6 }} key={p.id}>
                                            <Card className="card" sx={{ p: 0, overflow: 'hidden', display: 'flex', opacity: 0.9 }}>
                                                <ImageWithFallback src={getImageUrl(p.image_url)} sx={{ width: 140, height: 140, objectFit: 'cover' }} />
                                                <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{p.name}</Typography>
                                                        <Chip label="ACTIVE" color="success" size="small" sx={{ fontWeight: 900, fontSize: '0.65rem' }} />
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        Price: ৳{p.price} • Stock: {p.stock || 'N/A'} • Eco: {p.eco_rating}/5
                                                    </Typography>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => handleEditOpen(p, 'product')}
                                                        sx={{ borderRadius: '8px', alignSelf: 'flex-start', fontWeight: 700 }}
                                                    >
                                                        Edit Details & Price
                                                    </Button>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    </Box>
                )}

                {activeTab === 'orders' && (
                    <TableContainer component={Paper} className="card" sx={{ p: 0, borderRadius: '24px', overflow: 'hidden' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, p: 3 }}>ORDER #</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>AMOUNT</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((o) => (
                                    <TableRow key={o.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ p: 3 }}><strong>#{o.id}</strong></TableCell>
                                        <TableCell>৳{parseFloat(o.total_amount).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Chip label={o.status || 'pending'} size="small" color={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'error' : 'warning'} sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }} />
                                        </TableCell>
                                        <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {activeTab === 'challenges' && (
                    <TableContainer component={Paper} className="card" sx={{ p: 0, borderRadius: '24px', overflow: 'hidden' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, p: 3 }}>CHALLENGE</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>REWARD</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>CO2 SAVING</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>DURATION</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="right">ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {challenges.map((c) => (
                                    <TableRow key={c.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ p: 3 }}><strong>{c.title}</strong></TableCell>
                                        <TableCell>{c.points_reward} EP</TableCell>
                                        <TableCell>{c.co2_saving_kg} kg</TableCell>
                                        <TableCell>{c.duration_days} Days</TableCell>
                                        <TableCell align="right">
                                            <Button size="small" variant="outlined" onClick={() => handleEditOpen(c, 'challenge')} sx={{ borderRadius: '8px' }}>Refine</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {activeTab === 'sellers' && (
                    <Grid container spacing={4}>
                        {sellers.length === 0 ? (
                            <Grid size={12}>
                                <Box sx={{ textAlign: 'center', py: 10 }}>
                                    <StorefrontIcon sx={{ fontSize: 100, color: 'text.disabled', mb: 2, opacity: 0.2 }} />
                                    <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700 }}>No Pending Hubs</Typography>
                                </Box>
                            </Grid>
                        ) : sellers.map((s) => (
                            <Grid size={{ xs: 12, md: 4 }} key={s.id}>
                                <Card className="card hover-lift" sx={{ textAlign: 'center', p: 4 }}>
                                    <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} src={getImageUrl(s.avatar_url)}>{(s.username || 'S').charAt(0)}</Avatar>
                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>{s.username || 'Anonymous Seller'}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{s.email || 'No email provided'}</Typography>
                                    <Button fullWidth variant="contained" onClick={() => handleAction('approve', s.id, 'seller')} sx={{ borderRadius: '14px', fontWeight: 800, py: 1.5 }}>Grant Seller Access</Button>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {activeTab === 'add-challenge' && (
                    <Card className="card">
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Create New Mission</Typography>
                            <form onSubmit={handleChallengeSubmit}>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Mission Title" value={challengeForm.title} onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })} required /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="EP Reward" type="number" value={challengeForm.points_reward} onChange={(e) => setChallengeForm({ ...challengeForm, points_reward: e.target.value })} required /></Grid>
                                    <Grid size={12}><TextField fullWidth label="Description" multiline rows={3} value={challengeForm.description} onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })} required /></Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="CO2 Goal (kg)" type="number" value={challengeForm.co2_saving_kg} onChange={(e) => setChallengeForm({ ...challengeForm, co2_saving_kg: e.target.value })} required /></Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Duration (days)" type="number" value={challengeForm.duration_days} onChange={(e) => setChallengeForm({ ...challengeForm, duration_days: e.target.value })} required /></Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth select label="Recurrence" value={challengeForm.category} onChange={(e) => setChallengeForm({ ...challengeForm, category: e.target.value })} SelectProps={{ native: false }}><MenuItem value="Day">Daily</MenuItem><MenuItem value="Week">Weekly</MenuItem><MenuItem value="Month">Monthly</MenuItem></TextField></Grid>
                                    <Grid size={12}>
                                        <input type="file" ref={challengeImageRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'challenge')} />
                                        <Button variant="outlined" startIcon={<AddCircleIcon />} onClick={() => challengeImageRef.current.click()}>Upload Key Visual</Button>
                                        {challengeForm.image_url && <ImageWithFallback src={getImageUrl(challengeForm.image_url)} sx={{ mt: 2, width: 150, borderRadius: '12px', display: 'block' }} />}
                                    </Grid>
                                    <Grid size={12}><Button type="submit" variant="contained" size="large" sx={{ borderRadius: '12px', px: 4, fontWeight: 900 }}>Launch Mission</Button></Grid>
                                </Grid>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'quiz-builder' && (
                    <Box sx={{ maxWidth: 900 }}>
                        <Card className="card" sx={{ mb: 4 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}><QuizIcon /></Avatar>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>Manual Quiz Builder</Typography>
                                        <Typography color="text.secondary">Create custom educational quizzes for your community</Typography>
                                    </Box>
                                </Box>

                                <form onSubmit={handleManualQuizSubmit}>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, md: 8 }}>
                                            <TextField
                                                fullWidth
                                                label="Quiz Title"
                                                variant="outlined"
                                                value={quizForm.title}
                                                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                                                required
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                fullWidth
                                                label="EP Reward"
                                                type="number"
                                                variant="outlined"
                                                value={quizForm.points_reward}
                                                onChange={(e) => setQuizForm({ ...quizForm, points_reward: e.target.value })}
                                                required
                                            />
                                        </Grid>
                                        <Grid size={12}>
                                            <TextField
                                                fullWidth
                                                label="Description"
                                                multiline
                                                rows={2}
                                                variant="outlined"
                                                value={quizForm.description}
                                                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                                            />
                                        </Grid>

                                        <Grid size={12}>
                                            <Divider sx={{ my: 2 }}>
                                                <Chip label="QUESTIONS" sx={{ fontWeight: 900, px: 2 }} />
                                            </Divider>
                                        </Grid>

                                        {quizForm.questions.map((q, index) => (
                                            <Grid size={12} key={index}>
                                                <Card sx={{ p: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', position: 'relative' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                                            Question #{index + 1}
                                                        </Typography>
                                                        {quizForm.questions.length > 1 && (
                                                            <IconButton color="error" size="small" onClick={() => removeQuizQuestion(index)}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        )}
                                                    </Box>

                                                    <TextField
                                                        fullWidth
                                                        label="Question Text"
                                                        value={q.question}
                                                        onChange={(e) => handleQuizQuestionChange(index, 'question', e.target.value)}
                                                        required
                                                        sx={{ mb: 2 }}
                                                    />

                                                    <Grid container spacing={2}>
                                                        {['a', 'b', 'c', 'd'].map((opt) => (
                                                            <Grid size={{ xs: 12, sm: 6 }} key={opt}>
                                                                <TextField
                                                                    fullWidth
                                                                    label={`Option ${opt.toUpperCase()}`}
                                                                    value={q[`option_${opt}`]}
                                                                    onChange={(e) => handleQuizQuestionChange(index, `option_${opt}`, e.target.value)}
                                                                    required
                                                                />
                                                            </Grid>
                                                        ))}
                                                        <Grid size={12}>
                                                            <TextField
                                                                fullWidth
                                                                select
                                                                label="Correct Answer"
                                                                value={q.correct_option}
                                                                onChange={(e) => handleQuizQuestionChange(index, 'correct_option', e.target.value)}
                                                                SelectProps={{ native: false }}
                                                            >
                                                                <MenuItem value="A">Option A</MenuItem>
                                                                <MenuItem value="B">Option B</MenuItem>
                                                                <MenuItem value="C">Option C</MenuItem>
                                                                <MenuItem value="D">Option D</MenuItem>
                                                            </TextField>
                                                        </Grid>
                                                    </Grid>
                                                </Card>
                                            </Grid>
                                        ))}

                                        <Grid size={12} sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<AddCircleIcon />}
                                                onClick={addQuizQuestion}
                                                sx={{ borderRadius: '12px', fontWeight: 800 }}
                                            >
                                                Add Another Question
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                disabled={submittingQuiz}
                                                startIcon={submittingQuiz ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                                                sx={{ borderRadius: '12px', px: 4, fontWeight: 900, flexGrow: 1 }}
                                            >
                                                {submittingQuiz ? 'Forging Quiz...' : 'Finalize & Create Quiz'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {
                    activeTab === 'database' && (
                        <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
                            {/* Table Browser Sidebar */}
                            <Card className="card" sx={{ width: 280, p: 2, overflowY: 'auto' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <TableChartIcon color="primary" />
                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Tables</Typography>
                                    <Chip label={dbTables.length} size="small" color="primary" sx={{ ml: 'auto', fontWeight: 800 }} />
                                </Box>
                                <List sx={{ p: 0 }}>
                                    {dbTables.map((table) => (
                                        <ListItemButton
                                            key={table.name}
                                            selected={selectedTable === table.name}
                                            onClick={() => { setSelectedTable(table.name); setDbPage(1); setDbSearch(''); }}
                                            sx={{
                                                borderRadius: '12px',
                                                mb: 1,
                                                bgcolor: selectedTable === table.name ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                                '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.05)' }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <StorageIcon fontSize="small" color={selectedTable === table.name ? 'primary' : 'inherit'} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={table.name}
                                                secondary={`${table.count} rows`}
                                                primaryTypographyProps={{ fontWeight: selectedTable === table.name ? 800 : 600, fontSize: '0.9rem' }}
                                                secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                            />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Card>

                            {/* Data Grid */}
                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                {selectedTable ? (
                                    <>
                                        {/* Toolbar */}
                                        <Card className="card" sx={{ p: 2, mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                <Typography variant="h6" sx={{ fontWeight: 900, flexGrow: 1 }}>
                                                    {selectedTable}
                                                    <Chip label={`${tableData.pagination.total || 0} records`} size="small" sx={{ ml: 2, fontWeight: 700 }} />
                                                </Typography>
                                                <TextField
                                                    size="small"
                                                    placeholder="Search..."
                                                    value={dbSearch}
                                                    onChange={(e) => { setDbSearch(e.target.value); setDbPage(1); }}
                                                    InputProps={{
                                                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                    }}
                                                    sx={{ width: 250 }}
                                                />
                                                <Tooltip title={autoRefresh ? 'Auto-refresh ON (5s)' : 'Auto-refresh OFF'}>
                                                    <IconButton
                                                        onClick={() => setAutoRefresh(!autoRefresh)}
                                                        color={autoRefresh ? 'primary' : 'default'}
                                                        sx={{ border: autoRefresh ? '2px solid' : 'none' }}
                                                    >
                                                        <RefreshIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<AddCircleIcon />}
                                                    onClick={() => { setDbAddDialog(true); setDbNewRecord({}); }}
                                                    sx={{ borderRadius: '12px', fontWeight: 800 }}
                                                >
                                                    Add Record
                                                </Button>
                                                {selectedRows.length > 0 && (
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={handleBulkDelete}
                                                        sx={{ borderRadius: '12px', fontWeight: 700 }}
                                                    >
                                                        Delete ({selectedRows.length})
                                                    </Button>
                                                )}
                                            </Box>
                                        </Card>

                                        {/* Data Table */}
                                        <TableContainer component={Paper} className="card" sx={{ flexGrow: 1, overflow: 'auto' }}>
                                            <Table stickyHeader size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell padding="checkbox">
                                                            <input
                                                                type="checkbox"
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        const primaryKey = tableData.columns.find(col => col.key === 'PRI');
                                                                        if (primaryKey) {
                                                                            setSelectedRows(tableData.data.map(row => row[primaryKey.field]));
                                                                        }
                                                                    } else {
                                                                        setSelectedRows([]);
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        {tableData.columns.map((col) => (
                                                            <TableCell key={col.field} sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.02)', whiteSpace: 'nowrap' }}>
                                                                {col.field}
                                                                {col.key === 'PRI' && <Chip label="PK" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                                                            </TableCell>
                                                        ))}
                                                        <TableCell sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.02)' }}>Actions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {tableData.data.map((row, idx) => {
                                                        const primaryKey = tableData.columns.find(col => col.key === 'PRI');
                                                        const rowId = primaryKey ? row[primaryKey.field] : idx;
                                                        return (
                                                            <TableRow key={rowId} hover>
                                                                <TableCell padding="checkbox">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedRows.includes(rowId)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedRows([...selectedRows, rowId]);
                                                                            } else {
                                                                                setSelectedRows(selectedRows.filter(id => id !== rowId));
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                {tableData.columns.map((col) => (
                                                                    <TableCell key={col.field} sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {row[col.field] !== null ? String(row[col.field]) : <em style={{ color: '#999' }}>NULL</em>}
                                                                    </TableCell>
                                                                ))}
                                                                <TableCell>
                                                                    <IconButton size="small" onClick={() => { setDbEditRecord({ ...row }); setDbEditDialog(true); }} color="primary">
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton size="small" onClick={() => handleDbDelete(row)} color="error">
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        {/* Pagination */}
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
                                            <Button
                                                disabled={dbPage === 1}
                                                onClick={() => setDbPage(dbPage - 1)}
                                                size="small"
                                            >
                                                Previous
                                            </Button>
                                            <Typography variant="body2">
                                                Page {dbPage} of {tableData.pagination.totalPages || 1}
                                            </Typography>
                                            <Button
                                                disabled={dbPage >= (tableData.pagination.totalPages || 1)}
                                                onClick={() => setDbPage(dbPage + 1)}
                                                size="small"
                                            >
                                                Next
                                            </Button>
                                        </Box>
                                    </>
                                ) : (
                                    <Card className="card" sx={{ p: 8, textAlign: 'center' }}>
                                        <StorageIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.3, mb: 2 }} />
                                        <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700 }}>
                                            Select a table to view data
                                        </Typography>
                                    </Card>
                                )}
                            </Box>
                        </Box>
                    )
                }
            </Box >

            {/* Database Add Dialog */}
            < Dialog open={dbAddDialog} onClose={() => setDbAddDialog(false)} maxWidth="md" fullWidth >
                <DialogTitle sx={{ fontWeight: 900 }}>Add New Record to {selectedTable}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {tableData.columns
                            .filter(col => !col.extra.includes('auto_increment'))
                            .map((col) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={col.field}>
                                    <TextField
                                        fullWidth
                                        label={col.field}
                                        type={col.type.includes('int') || col.type.includes('decimal') || col.type.includes('float') ? 'number' : 'text'}
                                        value={dbNewRecord[col.field] || ''}
                                        onChange={(e) => setDbNewRecord({ ...dbNewRecord, [col.field]: e.target.value })}
                                        required={!col.null && col.default === null}
                                        helperText={`${col.type}${!col.null ? ' (Required)' : ''}`}
                                    />
                                </Grid>
                            ))}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDbAddDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleDbAdd} sx={{ borderRadius: '12px', fontWeight: 900, px: 4 }}>Add Record</Button>
                </DialogActions>
            </Dialog >

            {/* Database Edit Dialog */}
            < Dialog open={dbEditDialog} onClose={() => setDbEditDialog(false)} maxWidth="md" fullWidth >
                <DialogTitle sx={{ fontWeight: 900 }}>Edit Record in {selectedTable}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {tableData.columns.map((col) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={col.field}>
                                <TextField
                                    fullWidth
                                    label={col.field}
                                    type={col.type.includes('int') || col.type.includes('decimal') || col.type.includes('float') ? 'number' : 'text'}
                                    value={dbEditRecord?.[col.field] ?? ''}
                                    onChange={(e) => setDbEditRecord({ ...dbEditRecord, [col.field]: e.target.value })}
                                    disabled={col.key === 'PRI' || col.extra.includes('auto_increment')}
                                    helperText={`${col.type}${col.key === 'PRI' ? ' (Primary Key)' : ''}`}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDbEditDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleDbEdit} sx={{ borderRadius: '12px', fontWeight: 900, px: 4 }}>Save Changes</Button>
                </DialogActions>
            </Dialog >

            {/* Universal Edit Dialog */}
            < Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth >
                <DialogTitle sx={{ fontWeight: 900 }}>Refine {itemType === 'product' ? 'Product' : 'Mission'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Title/Name"
                            value={editForm.name || editForm.title || ''}
                            onChange={(e) => setEditForm({ ...editForm, [itemType === 'product' ? 'name' : 'title']: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={3}
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    label={itemType === 'product' ? 'Price (৳)' : 'EP Reward'}
                                    type="number"
                                    value={editForm.price || editForm.points_reward || ''}
                                    onChange={(e) => setEditForm({ ...editForm, [itemType === 'product' ? 'price' : 'points_reward']: e.target.value })}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    label={itemType === 'product' ? 'Eco Rating (1-5)' : 'CO2 Goal (kg)'}
                                    type="number"
                                    value={editForm.eco_rating || editForm.co2_saving_kg || ''}
                                    onChange={(e) => setEditForm({ ...editForm, [itemType === 'product' ? 'eco_rating' : 'co2_saving_kg']: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                        <Box>
                            <input type="file" ref={editImageRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'edit')} />
                            <Button variant="outlined" fullWidth onClick={() => editImageRef.current.click()}>Change Visual Asset</Button>
                            {editForm.image_url && (
                                <ImageWithFallback src={getImageUrl(editForm.image_url)} sx={{ mt: 2, width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: '12px' }} />
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setEditDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateSubmit} sx={{ borderRadius: '12px', fontWeight: 900, px: 4 }}>Save Refinements</Button>
                </DialogActions>
            </Dialog >
        </Box >
    );
};

export default Admin;
