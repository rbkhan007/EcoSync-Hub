import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Button, Chip, Alert, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AirIcon from '@mui/icons-material/Air';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { api, user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const [allRes, userRes] = await Promise.all([
        api.get('/challenges'),
        user ? api.get('/challenges/user/me') : Promise.resolve({ data: [] })
      ]);

      const sortedChallenges = (allRes.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setChallenges(sortedChallenges);
      setUserChallenges(userRes.data || []);
    } catch {
      setError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [api, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const joinChallenge = async (challengeId) => {
    try {
      await api.post(`/challenges/join/${challengeId}`, {});
      fetchData();
      alert('Mission accepted! Check your profile for progress.');
    } catch {
      alert('Failed to join mission');
    }
  };

  const completeChallenge = async (userChallengeId) => {
    try {
      await api.put(`/challenges/complete/${userChallengeId}`);
      fetchData();
      alert('Congratulations! Challenge completed and rewards credited.');
    } catch {
      alert('Failed to complete mission');
    }
  };

  if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box className="page-container fade-in">
      <Box sx={{ mb: 10, textAlign: 'center', position: 'relative' }}>
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
        <Typography variant="h1" sx={{ fontWeight: 950, mb: 1.5, background: 'linear-gradient(45deg, var(--primary-dark), var(--primary-main))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -2 }}>Eco-Missions</Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, maxWidth: 650, mx: 'auto', opacity: 0.8 }}>
          Join global efforts to combat climate change and earn impact rewards
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      <Card sx={{
        mb: 8,
        p: 4,
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)',
        border: '1px dashed var(--primary-main)',
        borderRadius: '24px',
        textAlign: 'center'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Eco-Quiz Center 🧠</Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>Want more points? Test your climate knowledge and earn instant rewards!</Typography>
        <Button
          component={Link}
          to="/quiz"
          variant="contained"
          size="large"
          sx={{ borderRadius: '30px', px: 6 }}
        >
          Check Available Quizzes
        </Button>
      </Card>

      <Grid container spacing={4}>
        {challenges.map((challenge) => {
          const userChallenge = userChallenges.find(uc => uc.challenge_id === challenge.id);
          const isJoined = !!userChallenge;
          const isCompleted = userChallenge?.status === 'completed';

          return (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={challenge.id}>
              <Card className="card hover-lift" sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl(challenge.image_url) || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600'}
                    alt={challenge.title}
                  />
                  <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
                    {isCompleted && (
                      <Chip label="Completed" color="success" sx={{ fontWeight: 800 }} />
                    )}
                    {!isCompleted && isJoined && (
                      <Chip label="In Progress" color="primary" sx={{ fontWeight: 800 }} />
                    )}
                    <Chip
                      label={challenge.category}
                      sx={{ bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', fontWeight: 800, color: 'var(--primary-main)' }}
                    />
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>{challenge.title}</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    {challenge.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: '12px', textAlign: 'center' }}>
                      <EmojiEventsIcon color="primary" sx={{ mb: 0.5 }} />
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{challenge.points_reward}</Typography>
                      <Typography variant="caption" color="text.secondary">Points</Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)', borderRadius: '12px', textAlign: 'center' }}>
                      <AirIcon color="secondary" sx={{ mb: 0.5 }} />
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{challenge.co2_saving_kg}</Typography>
                      <Typography variant="caption" color="text.secondary">kg CO2</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      component={Link}
                      to={`/challenges/${challenge.id}`}
                      variant="outlined"
                      fullWidth
                      startIcon={<TravelExploreIcon />}
                    >
                      Details
                    </Button>
                    {!isJoined ? (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => joinChallenge(challenge.id)}
                      >
                        Join Mission
                      </Button>
                    ) : (
                      !isCompleted && (
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          onClick={() => completeChallenge(userChallenge.id)}
                        >
                          Complete
                        </Button>
                      )
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Challenges;
