import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, TextField, IconButton, List, ListItem, ListItemText, ListItemAvatar, ListItemButton, Avatar, Paper, Badge, InputBase, Tooltip, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import MessageIcon from '@mui/icons-material/QuestionAnswer';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { getImageUrl } from '../utils/imageUtils';

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [globalResults, setGlobalResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const urlProcessedRef = useRef(null);
    const { api, user, socket, updateCounts } = useAuth();
    const [searchParams] = useSearchParams();
    const userIdFromUrl = searchParams.get('user');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const selectConversation = useCallback((conversation) => {
        setSelectedUser(conversation);
    }, []);

    const fetchConversations = useCallback(async () => {
        try {
            const response = await api.get('/messages/conversations');
            // Deduplicate by other_user_id to prevent key errors
            const uniqueConversations = response.data.filter((conv, index, self) =>
                index === self.findIndex((c) => c.other_user_id === conv.other_user_id)
            );
            setConversations(uniqueConversations);
        } catch {
            console.error('Failed to load conversations');
        }
    }, [api]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Handle URL parameter selection
    useEffect(() => {
        if (!userIdFromUrl || urlProcessedRef.current === userIdFromUrl) return;



        // If conversations are empty, we might still want to try direct fetch if it's taking too long?
        // But for simplicity, let's run logic.

        // Slight issue: if conversations is empty initially, we might skip.
        // But fetchConversations is called on mount.

        // Let's make it robust:

        const findUser = async () => {
            // Try to find in conversations first if available
            let targetConv = conversations.find(c => c.other_user_id == userIdFromUrl);

            if (targetConv) {
                selectConversation(targetConv);
                urlProcessedRef.current = userIdFromUrl;
                return;
            }

            // If not found in conversations (or conversations empty), try direct fetch
            try {
                const userRes = await api.get('/auth/users');
                const target = userRes.data.find(u => u.id == userIdFromUrl);
                if (target) {
                    selectConversation({ other_user_id: target.id, username: target.username, avatar_url: target.avatar_url });
                    urlProcessedRef.current = userIdFromUrl;
                }
            } catch (e) { console.error(e); }
        };

        findUser();

    }, [userIdFromUrl, conversations, api, selectConversation]);

    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                setLoading(true);
                try {
                    const response = await api.get(`/messages?with=${selectedUser.other_user_id}`);
                    setMessages(response.data);
                    // Mark as read when opening conversation
                    await api.post('/messages/mark-read', { with: selectedUser.other_user_id });
                    fetchConversations(); // Update sidebar badges
                    updateCounts(); // Update global counts including messageCount
                } catch {
                    console.error('Failed to load messages');
                } finally {
                    setLoading(false);
                }
            };
            fetchMessages();
        }
    }, [selectedUser, api, fetchConversations]);

    useEffect(() => {
        if (socket) {
            const handleIncoming = async (message) => {
                const isFromSelected = selectedUser && message.sender_id == selectedUser.other_user_id;
                if (isFromSelected || message.receiver_id == selectedUser.other_user_id) {
                    setMessages(prev => [...prev, message]);
                    if (isFromSelected) {
                        try {
                            await api.post('/messages/mark-read', { with: selectedUser.other_user_id });
                            updateCounts();
                        } catch (e) {
                            console.error('Failed to mark as read', e);
                        }
                    }
                }
                fetchConversations();
                updateCounts();
            };

            const handleOutgoing = (msg) => {
                if (selectedUser && (msg.receiver_id == selectedUser.other_user_id)) {
                    // Avoid duplicate if already added via optimistic update
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                }
                fetchConversations();
                updateCounts();
            };

            socket.on('new_message', handleIncoming);
            socket.on('message_sent', handleOutgoing);
            return () => {
                socket.off('new_message', handleIncoming);
                socket.off('message_sent', handleOutgoing);
            };
        }
    }, [socket, selectedUser, fetchConversations, api]);

    useEffect(scrollToBottom, [messages]);

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const tempMsg = {
            id: Date.now(),
            sender_id: user.id,
            receiver_id: selectedUser.other_user_id,
            content: newMessage,
            created_at: new Date().toISOString(),
            is_optimistic: true
        };

        setMessages(prev => [...prev, tempMsg]);
        const msgContent = newMessage;
        setNewMessage('');

        try {
            await api.post('/messages', { receiver_id: selectedUser.other_user_id, content: msgContent });
            // Conversation fetch will happen via socket 'message_sent'
        } catch {
            console.error('Failed to send message');
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            setNewMessage(msgContent); // Restore message on failure
        }
    };

    useEffect(() => {
        const searchGlobal = async () => {
            if (!searchTerm.trim()) {
                setGlobalResults([]);
                return;
            }
            try {
                const response = await api.get(`/auth/users?search=${searchTerm}`);
                // Filter out self and users already in conversations
                const convUserIds = conversations.map(c => c.other_user_id);
                const filtered = response.data.filter(u =>
                    u.id !== user.id && !convUserIds.includes(u.id)
                );
                setGlobalResults(filtered);
            } catch {
                console.error('Global search failed');
            }
        };

        const timer = setTimeout(searchGlobal, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, api, user.id, conversations]);

    const filteredConversations = conversations.filter(conv =>
        conv.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.last_message && conv.last_message.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groupMessagesByDate = (msgs) => {
        const groups = {};
        msgs.forEach(msg => {
            const date = new Date(msg.created_at).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    return (
        <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', bgcolor: 'white', m: -3, overflow: 'hidden' }}>
            {/* Sidebar */}
            <Box sx={{ width: 350, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', bgcolor: '#fcfcfc' }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: 'var(--primary-dark)' }}>Messages</Typography>
                    <Paper
                        elevation={0}
                        sx={{
                            p: '4px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: '#f0f2f5',
                            borderRadius: '12px'
                        }}
                    >
                        <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        <InputBase
                            placeholder="Search chats..."
                            fullWidth
                            sx={{ fontSize: '0.9rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Paper>
                </Box>

                <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                    {filteredConversations.length > 0 && (
                        <>
                            <Typography variant="overline" sx={{ px: 3, py: 1, display: 'block', color: 'text.secondary', fontWeight: 700 }}>Recent Chats</Typography>
                            {filteredConversations.map((conv) => (
                                <ListItem
                                    disablePadding
                                    key={conv.other_user_id}
                                    sx={{
                                        borderLeft: selectedUser?.other_user_id === conv.other_user_id ? '4px solid var(--primary-main)' : '4px solid transparent',
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                                    }}
                                >
                                    <ListItemButton
                                        onClick={() => selectConversation(conv)}
                                        sx={{
                                            py: 2,
                                            px: 3,
                                            bgcolor: selectedUser?.other_user_id === conv.other_user_id ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Badge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                variant="dot"
                                                color={conv.is_read === 0 && conv.last_message_sender_id !== user.id ? "error" : "success"}
                                            >
                                                <Avatar src={getImageUrl(conv.avatar_url)} sx={{ width: 48, height: 48 }}>{conv.username?.charAt(0)}</Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography sx={{ fontWeight: 700, noWrap: true }}>{conv.username}</Typography>
                                                    {conv.is_read === 0 && conv.last_message_sender_id !== user.id && (
                                                        <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%' }} />
                                                    )}
                                                </Box>
                                            }
                                            secondary={conv.last_message}
                                            primaryTypographyProps={{ component: 'div' }}
                                            secondaryTypographyProps={{
                                                noWrap: true,
                                                variant: 'caption',
                                                sx: { fontWeight: conv.is_read === 0 && conv.last_message_sender_id !== user.id ? 800 : 400, color: conv.is_read === 0 && conv.last_message_sender_id !== user.id ? 'text.primary' : 'text.secondary' }
                                            }}
                                            sx={{ ml: 1 }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </>
                    )}

                    {globalResults.length > 0 && (
                        <>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="overline" sx={{ px: 3, py: 1, display: 'block', color: 'text.secondary', fontWeight: 700 }}>Find People</Typography>
                            {globalResults.map((u) => (
                                <ListItem
                                    disablePadding
                                    key={u.id}
                                    sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                                >
                                    <ListItemButton
                                        onClick={() => {
                                            selectConversation({ other_user_id: u.id, username: u.username, avatar_url: u.avatar_url });
                                            setSearchTerm('');
                                        }}
                                        sx={{ py: 2, px: 3 }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={getImageUrl(u.avatar_url)} sx={{ width: 48, height: 48, bgcolor: 'var(--primary-main)' }}>{u.username?.charAt(0)}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography sx={{ fontWeight: 700 }}>{u.username}</Typography>}
                                            secondary="Start a new chat"
                                            sx={{ ml: 1 }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </>
                    )}

                    {filteredConversations.length === 0 && globalResults.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                            <Typography variant="body2">{searchTerm ? "No users found" : "No recent chats"}</Typography>
                        </Box>
                    )}
                </List>
            </Box>

            {/* Chat Content */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <Avatar src={getImageUrl(selectedUser.avatar_url)}>{selectedUser.username.charAt(0)}</Avatar>
                            <Box>
                                <Typography sx={{ fontWeight: 800 }}>{selectedUser.username}</Typography>
                                <Typography variant="caption" color="success.main">Active Now</Typography>
                            </Box>
                        </Box>

                        {/* Messages Area */}
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {loading && messages.length === 0 ? (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="text.secondary">Loading messages...</Typography>
                                </Box>
                            ) : Object.keys(groupMessagesByDate(messages)).length > 0 ? (
                                Object.entries(groupMessagesByDate(messages)).map(([date, dateMsgs]) => (
                                    <React.Fragment key={date}>
                                        <Box sx={{ textAlign: 'center', my: 2 }}>
                                            <Typography variant="caption" sx={{ bgcolor: 'rgba(0,0,0,0.05)', px: 1.5, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>
                                                {date === new Date().toLocaleDateString() ? 'Today' : date === new Date(Date.now() - 86400000).toLocaleDateString() ? 'Yesterday' : date}
                                            </Typography>
                                        </Box>
                                        {dateMsgs.map((msg, i) => {
                                            const isMe = msg.sender_id === user.id;
                                            return (
                                                <Box key={i} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                                    <Tooltip title={new Date(msg.created_at).toLocaleString()} placement={isMe ? 'left' : 'right'}>
                                                        <Box sx={{
                                                            maxWidth: '65%',
                                                            p: '10px 16px',
                                                            borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                                            bgcolor: isMe ? 'var(--primary-main)' : 'white',
                                                            color: isMe ? 'white' : 'inherit',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                            wordBreak: 'break-word',
                                                            opacity: msg.is_optimistic ? 0.7 : 1
                                                        }}>
                                                            <Typography variant="body1" sx={{ fontSize: '0.95rem' }}>{msg.content}</Typography>
                                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5, fontSize: '0.7rem', opacity: 0.8 }}>
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                {isMe && !msg.is_optimistic && (
                                                                    <Box component="span" sx={{ fontSize: '0.9rem', color: msg.is_read ? 'info.main' : 'inherit' }}>
                                                                        {msg.is_read ? '✓✓' : '✓'}
                                                                    </Box>
                                                                )}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                </Box>
                                            );
                                        })}
                                    </React.Fragment>
                                ))
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                    <Typography variant="body2">No messages yet. Say hello!</Typography>
                                </Box>
                            )}
                            <div ref={messagesEndRef} />
                        </Box>

                        {/* Input Area */}
                        <Box component="form" onSubmit={sendMessage} sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee' }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    fullWidth
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    size="medium"
                                    autoComplete="off"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '24px',
                                            bgcolor: '#f0f2f5',
                                            '& fieldset': { border: 'none' }
                                        }
                                    }}
                                />
                                <IconButton
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    sx={{
                                        bgcolor: 'var(--primary-main)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'var(--primary-dark)' },
                                        '&.Mui-disabled': { bgcolor: '#eee' }
                                    }}
                                >
                                    <SendIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    </>
                ) : (
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary',
                        p: 4,
                        textAlign: 'center'
                    }}>
                        <Box
                            component="img"
                            src="/assets/empty-chat.png"
                            sx={{
                                width: '100%',
                                maxWidth: 400,
                                height: 'auto',
                                mb: 4,
                                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.08))'
                            }}
                        />
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'var(--primary-dark)' }}>
                            Your Inbox
                        </Typography>
                        <Typography variant="body1" sx={{ maxWidth: 400, opacity: 0.7 }}>
                            Select a conversation from the left to start chatting with your friends and community members.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Messages;
