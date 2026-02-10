import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Avatar,
    Button,
    Stack,
    Dialog,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Chip,
    CircularProgress,
    Tab,
    Tabs
} from '@mui/material';
import {
    Add,
    People,
    Settings,
    Close,
    EmojiEmotions
} from '@mui/icons-material';
import axios from 'axios';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        privacy_level: 'public'
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/groups');
            setGroups(response.data);
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        try {
            await axios.post('/api/groups', formData);
            fetchGroups();
            setOpenDialog(false);
            setFormData({ name: '', description: '', privacy_level: 'public' });
        } catch (err) {
            console.error('Error creating group:', err);
        }
    };

    const handleJoinGroup = async (groupId) => {
        try {
            await axios.post(`/api/groups/${groupId}/join`);
            fetchGroups();
        } catch (err) {
            console.error('Error joining group:', err);
        }
    };

    return (
        <Box sx={{ py: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Community Groups
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDialog(true)}
                >
                    Create Group
                </Button>
            </Stack>

            {loading ? (
                <CircularProgress />
            ) : (
                <Stack spacing={2}>
                    {groups.map(group => (
                        <Card key={group.id}>
                            <CardHeader
                                avatar={<Avatar alt={group.name} src={group.cover_image_url} />}
                                title={group.name}
                                subheader={`${group.member_count} members • ${group.privacy_level}`}
                                action={
                                    !group.is_member && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleJoinGroup(group.id)}
                                        >
                                            Join
                                        </Button>
                                    )
                                }
                            />
                            <CardContent>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                    {group.description}
                                </Typography>
                                {group.category && (
                                    <Chip label={group.category} size="small" variant="outlined" />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}

            <CreateGroupDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onCreate={handleCreateGroup}
                formData={formData}
                setFormData={setFormData}
            />
        </Box>
    );
};

const CreateGroupDialog = ({ open, onClose, onCreateGroup, formData, setFormData }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Create a New Group</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Stack>

                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        label="Group Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        select
                        label="Privacy Level"
                        value={formData.privacy_level}
                        onChange={(e) => setFormData({ ...formData, privacy_level: e.target.value })}
                        SelectProps={{ native: true }}
                    >
                        <option value="public">Public</option>
                        <option value="closed">Closed</option>
                        <option value="secret">Secret</option>
                    </TextField>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={onClose}>Cancel</Button>
                        <Button variant="contained" onClick={onCreateGroup}>Create</Button>
                    </Stack>
                </Stack>
            </Box>
        </Dialog>
    );
};

export default Groups;
