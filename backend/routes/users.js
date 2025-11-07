const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 사용자 검색 (이메일 또는 사용자명)
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({ error: '최소 2자 이상 입력해주세요.' });
        }
        
        const searchQuery = `%${query.trim()}%`;
        
        const result = await pool.query(`
            SELECT id, username, email
            FROM users
            WHERE (email ILIKE $1 OR username ILIKE $1)
            AND id != $2
            LIMIT 10
        `, [searchQuery, req.userId]);
        
        res.json({ users: result.rows });
    } catch (error) {
        console.error('사용자 검색 오류:', error);
        res.status(500).json({ error: '사용자 검색에 실패했습니다.' });
    }
});

module.exports = router;

