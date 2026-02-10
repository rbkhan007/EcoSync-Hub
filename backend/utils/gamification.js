const db = require('../db');

/**
 * Updates user streak and awards eco-points
 * @param {number} userId 
 * @param {Object} options { points: number, activity: string }
 */
async function recordActivity(userId, options = { points: 0 }) {
    try {
        const [users] = await db.query('SELECT current_streak, max_streak, last_active_date, eco_points FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return;

        const user = users[0];
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastActive = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;

        let newStreak = user.current_streak;
        let newMaxStreak = user.max_streak;
        let pointsToAward = options.points || 0;

        // Green Monday Logic (2x points)
        if (now.getDay() === 1) { // 1 is Monday
            pointsToAward *= 2;
        }

        if (today !== lastActive) {
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActive === yesterdayStr) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }

            if (newStreak > newMaxStreak) {
                newMaxStreak = newStreak;
            }

            await db.query(
                'UPDATE users SET current_streak = ?, max_streak = ?, last_active_date = ?, eco_points = eco_points + ? WHERE id = ?',
                [newStreak, newMaxStreak, today, pointsToAward, userId]
            );

            return { streak: newStreak, pointsAwarded: pointsToAward, streakUpdated: true };
        } else {
            // Already active today, just award points if any
            if (pointsToAward > 0) {
                await db.query('UPDATE users SET eco_points = eco_points + ? WHERE id = ?', [pointsToAward, userId]);
            }
            return { streak: newStreak, pointsAwarded: pointsToAward, streakUpdated: false };
        }
    } catch (error) {
        console.error('Error recording gamification activity:', error);
        return null;
    }
}

module.exports = { recordActivity };
