import React, { useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    Tooltip,
    Typography,
    Stack,
    Menu,
    MenuItem,
    CircularProgress
} from '@mui/material';
import {
    Favorite,
    FavoriteBorder,
    Mood,
    SentimentVerySatisfied,
    SentimentSatisfied,
    SentimentDissatisfied
} from '@mui/icons-material';
import axios from 'axios';

const reactionEmojis = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😲',
    sad: '😢',
    angry: '😠'
};

const ReactionButton = ({ postId, storyId, commentId, onReactionChange }) => {
    const [reactions, setReactions] = useState({});
    const [userReaction, setUserReaction] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReactions();
    }, [postId]);

    const fetchReactions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/reactions/post/${postId}`);
            const reactionMap = {};
            response.data.forEach(r => {
                reactionMap[r.reaction_type] = r.count;
            });
            setReactions(reactionMap);
        } catch (err) {
            console.error('Error fetching reactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReaction = async (reactionType) => {
        try {
            await axios.post('/api/reactions', {
                post_id: postId,
                story_id: storyId,
                comment_id: commentId,
                reaction_type: reactionType
            });

            setUserReaction(reactionType);
            setAnchorEl(null);
            fetchReactions();
            onReactionChange?.(reactionType);
        } catch (err) {
            console.error('Error adding reaction:', err);
        }
    };

    const handleRemoveReaction = async () => {
        try {
            await axios.delete('/api/reactions', {
                data: {
                    post_id: postId,
                    story_id: storyId,
                    comment_id: commentId
                }
            });
            setUserReaction(null);
            fetchReactions();
            onReactionChange?.(null);
        } catch (err) {
            console.error('Error removing reaction:', err);
        }
    };

    const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);
    const reactionList = Object.entries(reactions).map(([type, count]) => `${reactionEmojis[type]} ${count}`);

    return (
        <Box>
            <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Add reaction" arrow>
                    <IconButton
                        size="small"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{
                            color: userReaction ? 'primary.main' : 'inherit',
                            '&:hover': { backgroundColor: 'action.hover' }
                        }}
                    >
                        <Mood fontSize="small" />
                    </IconButton>
                </Tooltip>

                {totalReactions > 0 && (
                    <Tooltip title={reactionList.join(', ')} arrow>
                        <Typography variant="caption" sx={{ color: 'text.secondary', cursor: 'pointer' }}>
                            {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
                        </Typography>
                    </Tooltip>
                )}
            </Stack>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: {
                        display: 'flex',
                        gap: 1,
                        p: 1,
                        backgroundColor: 'background.paper',
                        boxShadow: 3
                    }
                }}
            >
                {Object.entries(reactionEmojis).map(([type, emoji]) => (
                    <Tooltip key={type} title={type.charAt(0).toUpperCase() + type.slice(1)} arrow>
                        <MenuItem
                            onClick={() => handleReaction(type)}
                            sx={{
                                fontSize: '1.5rem',
                                minWidth: 'auto',
                                p: 1,
                                '&:hover': { transform: 'scale(1.2)' }
                            }}
                        >
                            {emoji}
                        </MenuItem>
                    </Tooltip>
                ))}

                {userReaction && (
                    <>
                        <Box sx={{ mx: 'auto', borderRight: '1px solid', borderColor: 'divider' }} />
                        <MenuItem
                            onClick={handleRemoveReaction}
                            sx={{
                                fontSize: '0.85rem',
                                color: 'error.main'
                            }}
                        >
                            Remove
                        </MenuItem>
                    </>
                )}
            </Menu>
        </Box>
    );
};

// Reactions Summary Component
const ReactionsSummary = ({ reactions }) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;

    return (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {Object.entries(reactions).map(([type, count]) => (
                <Tooltip key={type} title={type.charAt(0).toUpperCase() + type.slice(1)} arrow>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            color: 'text.secondary',
                            backgroundColor: 'action.hover',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}
                    >
                        <span>{reactionEmojis[type]}</span>
                        <span>{count}</span>
                    </Box>
                </Tooltip>
            ))}
        </Box>
    );
};

export { ReactionButton, ReactionsSummary, reactionEmojis };
