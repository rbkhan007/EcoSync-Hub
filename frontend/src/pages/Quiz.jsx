import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent, Radio, RadioGroup, FormControlLabel, FormControl, CircularProgress, Alert, Paper, Divider, Stepper, Step, StepLabel, Grid, Chip } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TimerIcon from '@mui/icons-material/Timer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const Quiz = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const { api } = useAuth();

    const fetchQuizzes = useCallback(async () => {
        try {
            const response = await api.get('/quizzes');
            setQuizzes(response.data || []);
        } catch {
            setError('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const startQuiz = async (quiz) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/quizzes/${quiz.id}/questions`);
            setQuestions(response.data || []);
            setSelectedQuiz(quiz);
            setCurrentQuestionIndex(0);
            setAnswers({});
            setResult(null);
        } catch {
            setError('Failed to load quiz questions');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionChange = (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await api.post(`/quizzes/${selectedQuiz.id}/submit`, { answers });
            setResult(response.data);
            fetchQuizzes(); // Refresh quiz list status
        } catch {
            setError('Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && quizzes.length === 0) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

    if (!selectedQuiz) {
        return (
            <Box className="page-container fade-in">
                <Box sx={{ mb: 8, textAlign: 'center', position: 'relative' }}>
                    <Box sx={{
                        position: 'absolute',
                        top: -100,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 500,
                        height: 500,
                        background: 'radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, transparent 70%)',
                        zIndex: -1
                    }} />
                    <Typography variant="h1" sx={{ fontWeight: 950, mb: 1.5, background: 'linear-gradient(45deg, var(--primary-dark), var(--primary-main))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -2 }}>Eco-Quiz Center</Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, maxWidth: 600, mx: 'auto', opacity: 0.8 }}>
                        Test your climate knowledge, discover eco-facts, and earn impact rewards
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '16px' }}>{error}</Alert>}

                <Grid container spacing={4}>
                    {quizzes.length === 0 && !loading && (
                        <Grid size={12}>
                            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '32px', bgcolor: 'rgba(0,0,0,0.02)', border: '2px dashed rgba(0,0,0,0.05)' }}>
                                <QuizIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.3, mb: 2 }} />
                                <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700 }}>No quizzes available yet</Typography>
                                <Typography color="text.secondary">Check back soon for AI-generated climate challenges!</Typography>
                            </Paper>
                        </Grid>
                    )}
                    {quizzes.map((quiz) => (
                        <Grid size={{ xs: 12, md: 6 }} key={quiz.id}>
                            <Card className="card hover-lift" sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                                <Box sx={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    p: 2,
                                    background: 'linear-gradient(135deg, var(--primary-main) 0%, var(--primary-dark) 100%)',
                                    color: 'white',
                                    borderBottomLeftRadius: '24px',
                                    fontWeight: 900,
                                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                }}>
                                    +{quiz.points_reward} EP
                                </Box>
                                <CardContent sx={{ p: 4, pt: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                        <Box sx={{ p: 1.5, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: '16px', color: 'primary.main' }}>
                                            <AutoAwesomeIcon />
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>{quiz.title}</Typography>
                                    </Box>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, minHeight: 60, opacity: 0.8 }}>
                                        {quiz.description}
                                    </Typography>
                                    <Divider sx={{ mb: 4, opacity: 0.5 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                            <TimerIcon fontSize="small" />
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>~5 mins</Typography>
                                        </Box>
                                        {quiz.is_completed ? (
                                            <Button variant="outlined" color="success" disabled startIcon={<CheckCircleIcon />} sx={{ borderRadius: '14px', borderWeight: 2 }}>
                                                Claimed
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                onClick={() => startQuiz(quiz)}
                                                startIcon={<QuizIcon />}
                                                sx={{ borderRadius: '14px', px: 4, fontWeight: 800 }}
                                            >
                                                Launch Quiz
                                            </Button>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (result) {
        return (
            <Box className="page-container fade-in" sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
                <Paper sx={{ p: 6, borderRadius: '24px', boxShadow: 'var(--shadow-lg)' }}>
                    {result.passed ? (
                        <>
                            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>Challenge Passed!</Typography>
                            <Typography variant="h5" sx={{ mb: 4 }}>You scored {result.score} out of {result.total}</Typography>
                            <Alert severity="success" sx={{ mb: 4, borderRadius: '12px' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>+{result.points_earned} Eco-Points Earned!</Typography>
                            </Alert>
                        </>
                    ) : (
                        <>
                            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
                            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>Not Quite There</Typography>
                            <Typography variant="h5" sx={{ mb: 4 }}>You scored {result.score} out of {result.total}</Typography>
                            <Typography color="text.secondary" sx={{ mb: 4 }}>You need at least 70% to earn points. Don't worry, you can try again later!</Typography>
                        </>
                    )}
                    <Button variant="contained" size="large" fullWidth onClick={() => setSelectedQuiz(null)} sx={{ borderRadius: '30px', h: 56 }}>
                        Back to Quiz Center
                    </Button>
                </Paper>
            </Box>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
        <Box className="page-container fade-in" sx={{ maxWidth: 900, mx: 'auto' }}>
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: '12px', color: 'white' }}>
                        <QuizIcon />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -1 }}>{selectedQuiz.title}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={`Question ${currentQuestionIndex + 1}/${questions.length}`} size="small" variant="outlined" sx={{ fontWeight: 800, borderColor: 'primary.main', color: 'primary.main' }} />
                            {currentQuestion && <Chip icon={<TimerIcon />} label="No time limit" size="small" sx={{ fontWeight: 700 }} />}
                        </Box>
                    </Box>
                </Box>
                <Button onClick={() => setSelectedQuiz(null)} color="error" sx={{ fontWeight: 800, borderRadius: '12px' }}>Quit Explorer</Button>
            </Box>

            <Stepper activeStep={currentQuestionIndex} sx={{ mb: 6, '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' }, '& .MuiStepIcon-root.Mui-completed': { color: 'success.main' } }}>
                {questions.map((_, index) => (
                    <Step key={index}>
                        <StepLabel></StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Card className="card glass-card fade-in" sx={{ p: { xs: 3, md: 6 }, borderRadius: '32px', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 3, mb: 8 }}>
                        <HelpOutlineIcon color="primary" sx={{ fontSize: 40, mt: 0.5 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.3 }}>{currentQuestion?.question}</Typography>
                    </Box>

                    <FormControl component="fieldset" fullWidth>
                        <Grid container spacing={3}>
                            {['a', 'b', 'c', 'd'].map((key) => {
                                const optionText = currentQuestion[`option_${key}`];
                                const isSelected = answers[currentQuestion?.id] === key.toUpperCase();
                                return (
                                    <Grid size={{ xs: 12, md: 6 }} key={key}>
                                        <Paper
                                            elevation={0}
                                            onClick={() => handleOptionChange(currentQuestion.id, key.toUpperCase())}
                                            sx={{
                                                p: 3,
                                                borderRadius: '24px',
                                                border: '3px solid',
                                                borderColor: isSelected ? 'primary.main' : 'rgba(0,0,0,0.03)',
                                                bgcolor: isSelected ? 'rgba(76, 175, 80, 0.08)' : 'rgba(0,0,0,0.01)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                '&:hover': {
                                                    borderColor: isSelected ? 'primary.main' : 'primary.light',
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.15)'
                                                }
                                            }}
                                        >
                                            <Box sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: isSelected ? 'primary.main' : 'white',
                                                color: isSelected ? 'white' : 'text.secondary',
                                                fontWeight: 900,
                                                border: '2px solid',
                                                borderColor: isSelected ? 'primary.main' : 'rgba(0,0,0,0.1)',
                                                transition: 'all 0.2s'
                                            }}>
                                                {key.toUpperCase()}
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>{optionText}</Typography>
                                            <Radio
                                                checked={isSelected}
                                                sx={{ pointerEvents: 'none', color: 'rgba(0,0,0,0.1)' }}
                                            />
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </FormControl>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 8 }}>
                        <Button
                            disabled={currentQuestionIndex === 0}
                            onClick={handleBack}
                            variant="outlined"
                            size="large"
                            sx={{ borderRadius: '18px', px: 5, fontWeight: 900, height: 56, borderWeight: 2 }}
                        >
                            Previous
                        </Button>
                        {isLastQuestion ? (
                            <Button
                                disabled={!answers[currentQuestion?.id] || submitting}
                                onClick={handleSubmit}
                                variant="contained"
                                size="large"
                                sx={{ borderRadius: '18px', px: 8, fontWeight: 950, height: 56, boxShadow: '0 8px 20px rgba(76, 175, 80, 0.4)' }}
                            >
                                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Claim Rewards'}
                            </Button>
                        ) : (
                            <Button
                                disabled={!answers[currentQuestion?.id]}
                                onClick={handleNext}
                                variant="contained"
                                size="large"
                                sx={{ borderRadius: '18px', px: 8, fontWeight: 950, height: 56, boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)' }}
                            >
                                Continue
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Quiz;
