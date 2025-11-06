const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 모든 메모 라우트에 인증 필요
router.use(authenticateToken);

// 그룹의 메모 목록 조회
router.get('/group/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // 그룹 멤버 확인
        const memberCheck = await pool.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹의 메모에 접근할 권한이 없습니다.' });
        }
        
        const result = await pool.query(`
            SELECT 
                m.*,
                u.username AS author_name
            FROM memos m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.group_id = $1
            ORDER BY m.created_at DESC
        `, [groupId]);
        
        res.json({ memos: result.rows });
    } catch (error) {
        console.error('메모 조회 오류:', error);
        res.status(500).json({ error: '메모를 불러올 수 없습니다.' });
    }
});

// 메모 생성
router.post('/', async (req, res) => {
    try {
        const { content, groupId } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: '메모 내용을 입력해주세요.' });
        }
        
        if (!groupId) {
            return res.status(400).json({ error: '그룹을 선택해주세요.' });
        }
        
        // 그룹 멤버 확인
        const memberCheck = await pool.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹에 메모를 작성할 권한이 없습니다.' });
        }
        
        const result = await pool.query(
            'INSERT INTO memos (content, user_id, group_id) VALUES ($1, $2, $3) RETURNING *',
            [content.trim(), req.userId, groupId]
        );
        
        // 작성자 정보 포함
        const memoWithAuthor = await pool.query(`
            SELECT 
                m.*,
                u.username AS author_name
            FROM memos m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.id = $1
        `, [result.rows[0].id]);
        
        res.status(201).json({ 
            message: '메모가 생성되었습니다.',
            memo: memoWithAuthor.rows[0] 
        });
    } catch (error) {
        console.error('메모 생성 오류:', error);
        res.status(500).json({ error: '메모를 생성할 수 없습니다.' });
    }
});

// 메모 수정
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: '메모 내용을 입력해주세요.' });
        }
        
        // 메모 소유자 확인
        const memoCheck = await pool.query(
            'SELECT * FROM memos WHERE id = $1',
            [id]
        );
        
        if (memoCheck.rows.length === 0) {
            return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
        }
        
        const memo = memoCheck.rows[0];
        
        if (memo.user_id !== req.userId) {
            return res.status(403).json({ error: '메모를 수정할 권한이 없습니다.' });
        }
        
        const result = await pool.query(
            'UPDATE memos SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [content.trim(), id]
        );
        
        // 작성자 정보 포함
        const memoWithAuthor = await pool.query(`
            SELECT 
                m.*,
                u.username AS author_name
            FROM memos m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.id = $1
        `, [id]);
        
        res.json({ 
            message: '메모가 수정되었습니다.',
            memo: memoWithAuthor.rows[0] 
        });
    } catch (error) {
        console.error('메모 수정 오류:', error);
        res.status(500).json({ error: '메모를 수정할 수 없습니다.' });
    }
});

// 메모 삭제
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 메모 소유자 확인
        const memoCheck = await pool.query(
            'SELECT m.*, gm.role FROM memos m LEFT JOIN group_members gm ON m.group_id = gm.group_id AND gm.user_id = $2 WHERE m.id = $1',
            [id, req.userId]
        );
        
        if (memoCheck.rows.length === 0) {
            return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
        }
        
        const memo = memoCheck.rows[0];
        
        // 본인의 메모이거나, 그룹 owner인 경우 삭제 가능
        if (memo.user_id !== req.userId && memo.role !== 'owner') {
            return res.status(403).json({ error: '메모를 삭제할 권한이 없습니다.' });
        }
        
        await pool.query('DELETE FROM memos WHERE id = $1', [id]);
        
        res.json({ 
            message: '메모가 삭제되었습니다.',
            memoId: id
        });
    } catch (error) {
        console.error('메모 삭제 오류:', error);
        res.status(500).json({ error: '메모를 삭제할 수 없습니다.' });
    }
});

module.exports = router;

