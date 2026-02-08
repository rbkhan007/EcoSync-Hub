const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all quizzes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [quizzes] = await db.promise().query('SELECT * FROM quizzes ORDER BY created_at DESC');

        // Check which quizzes the user has completed
        const [completed] = await db.promise().query(
            'SELECT quiz_id FROM user_quizzes WHERE user_id = ?',
            [req.user.id]
        );

        const completedIds = completed.map(c => c.quiz_id);

        const quizzesWithStatus = quizzes.map(q => ({
            ...q,
            is_completed: completedIds.includes(q.id)
        }));

        res.json(quizzesWithStatus);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get quiz questions
router.get('/:id/questions', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [questions] = await db.promise().query(
            'SELECT id, question, option_a, option_b, option_c, option_d FROM quiz_questions WHERE quiz_id = ?',
            [id]
        );
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Submit quiz answers
router.post('/:id/submit', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { answers } = req.body; // Map of question_id -> selected_option
    const userId = req.user.id;

    try {
        // Check if already completed
        const [existing] = await db.promise().query(
            'SELECT id FROM user_quizzes WHERE user_id = ? AND quiz_id = ?',
            [userId, id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Quiz already completed' });
        }

        // Fetch correct answers
        const [questions] = await db.promise().query(
            'SELECT id, correct_option FROM quiz_questions WHERE quiz_id = ?',
            [id]
        );

        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct_option) {
                score++;
            }
        });

        const totalQuestions = questions.length;
        const passScore = Math.ceil(totalQuestions * 0.7); // 70% to pass
        const passed = score >= passScore;

        if (passed) {
            // Fetch quiz reward
            const [quiz] = await db.promise().query('SELECT points_reward FROM quizzes WHERE id = ?', [id]);
            const points = quiz[0].points_reward;

            // Credit user
            await db.promise().query(
                'UPDATE users SET eco_points = eco_points + ? WHERE id = ?',
                [points, userId]
            );

            // Record completion
            await db.promise().query(
                'INSERT INTO user_quizzes (user_id, quiz_id, score, points_earned) VALUES (?, ?, ?, ?)',
                [userId, id, score, points]
            );

            res.json({
                message: 'Quiz completed successfully!',
                score,
                total: totalQuestions,
                passed: true,
                points_earned: points
            });
        } else {
            res.json({
                message: 'You did not pass the quiz. Try again later!',
                score,
                total: totalQuestions,
                passed: false,
                points_earned: 0
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create manual quiz (Admin only)
router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can create quizzes' });
    }

    const { title, description, points_reward, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Quiz title and at least one question are required' });
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert Quiz
        const [quizResult] = await connection.query(
            'INSERT INTO quizzes (title, description, points_reward) VALUES (?, ?, ?)',
            [title, description, points_reward || 50]
        );
        const quizId = quizResult.insertId;

        // 2. Insert Questions
        const questionPromises = questions.map(q => {
            return connection.query(
                'INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [quizId, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option]
            );
        });

        await Promise.all(questionPromises);
        await connection.commit();

        res.status(201).json({
            message: 'Quiz created successfully',
            quizId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Quiz Creation Error:', error);
        res.status(500).json({ message: 'Failed to create quiz', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
