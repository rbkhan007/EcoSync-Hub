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
    Chip,
    CircularProgress,
    Grid,
    LinearProgress
} from '@mui/material';
import {
    Add,
    CalendarToday,
    LocationOn,
    People,
    Close,
    DateRange,
    AccessTime
} from '@mui/icons-material';
import axios from 'axios';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [userEvents, setUserEvents] = useState(new Set());
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        start_date: '',
        event_type: 'in-person'
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/events');
            setEvents(response.data);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        try {
            await axios.post('/api/events', formData);
            fetchEvents();
            setOpenDialog(false);
            setFormData({
                title: '',
                description: '',
                location: '',
                start_date: '',
                event_type: 'in-person'
            });
        } catch (err) {
            console.error('Error creating event:', err);
        }
    };

    const handleRSVP = async (eventId, status) => {
        try {
            await axios.post(`/api/events/${eventId}/rsvp`, {
                attendance_status: status
            });
            setUserEvents(prev => new Set([...prev, eventId]));
            fetchEvents();
        } catch (err) {
            console.error('Error RSVPing to event:', err);
        }
    };

    return (
        <Box sx={{ py: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Upcoming Events
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDialog(true)}
                >
                    Create Event
                </Button>
            </Stack>

            {loading ? (
                <CircularProgress />
            ) : (
                <Grid container spacing={3}>
                    {events.map(event => (
                        <Grid item xs={12} md={6} key={event.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    '&:hover': { boxShadow: 6 },
                                    transition: 'all 0.3s'
                                }}
                            >
                                <CardHeader
                                    avatar={<Avatar src={event.creator_picture} />}
                                    title={event.title}
                                    subheader={event.creator_name}
                                />
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Typography variant="body2" color="textSecondary">
                                            {event.description}
                                        </Typography>

                                        <Stack spacing={1}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <DateRange fontSize="small" color="primary" />
                                                <Typography variant="body2">
                                                    {new Date(event.start_date).toLocaleDateString()}
                                                </Typography>
                                            </Stack>

                                            {event.location && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <LocationOn fontSize="small" color="primary" />
                                                    <Typography variant="body2">{event.location}</Typography>
                                                </Stack>
                                            )}

                                            <Stack direction="row" spacing={1}>
                                                <Chip
                                                    icon={<People />}
                                                    label={`${event.total_going} Going`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={event.event_type}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        </Stack>

                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={() => handleRSVP(event.id, 'going')}
                                                fullWidth
                                            >
                                                Going
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleRSVP(event.id, 'interested')}
                                                fullWidth
                                            >
                                                Interested
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <CreateEventDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onCreate={handleCreateEvent}
                formData={formData}
                setFormData={setFormData}
            />
        </Box>
    );
};

const CreateEventDialog = ({ open, onClose, onCreate, formData, setFormData }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Create an Event</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Stack>

                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        label="Event Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                        label="Location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        type="datetime-local"
                        label="Start Date & Time"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        fullWidth
                        select
                        label="Event Type"
                        value={formData.event_type}
                        onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                        SelectProps={{ native: true }}
                    >
                        <option value="in-person">In-Person</option>
                        <option value="online">Online</option>
                        <option value="hybrid">Hybrid</option>
                    </TextField>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={onClose}>Cancel</Button>
                        <Button variant="contained" onClick={onCreate}>Create</Button>
                    </Stack>
                </Stack>
            </Box>
        </Dialog>
    );
};

export default Events;
