const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// 초대 링크 생성
router.post('/:groupId', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { expiresIn, maxUses } = req.body; // expiresIn: hours, maxUses: number
        
        // 그룹 멤버 확인 (owner나 admin만 초대 링크 생성 가능)
        const memberCheck = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹의 멤버가 아닙니다.' });
        }
        
        const role = memberCheck.rows[0].role;
        if (role !== 'owner' && role !== 'admin') {
            return res.status(403).json({ error: '초대 링크를 생성할 권한이 없습니다.' });
        }
        
        // 고유한 초대 코드 생성
        const inviteCode = uuidv4();
        
        // 만료 시간 계산
        let expiresAt = null;
        if (expiresIn && expiresIn > 0) {
            expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expiresIn);
        }
        
        // 초대 링크 저장
        const result = await pool.query(
            `INSERT INTO invite_links (group_id, invite_code, created_by, expires_at, max_uses) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [groupId, inviteCode, req.userId, expiresAt, maxUses || null]
        );
        
        const inviteLink = result.rows[0];
        
        res.status(201).json({
            message: '초대 링크가 생성되었습니다.',
            inviteLink: {
                id: inviteLink.id,
                inviteCode: inviteLink.invite_code,
                url: `${req.protocol}://${req.get('host')}/invite/${inviteLink.invite_code}`,
                expiresAt: inviteLink.expires_at,
                maxUses: inviteLink.max_uses,
                currentUses: inviteLink.current_uses
            }
        });
    } catch (error) {
        console.error('초대 링크 생성 오류:', error);
        res.status(500).json({ error: '초대 링크 생성에 실패했습니다.' });
    }
});

// 그룹의 초대 링크 목록 조회
router.get('/:groupId', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // 그룹 멤버 확인
        const memberCheck = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹의 멤버가 아닙니다.' });
        }
        
        const result = await pool.query(`
            SELECT 
                il.id,
                il.invite_code,
                il.expires_at,
                il.max_uses,
                il.current_uses,
                il.is_active,
                il.created_at,
                u.username AS created_by_name
            FROM invite_links il
            LEFT JOIN users u ON il.created_by = u.id
            WHERE il.group_id = $1 AND il.is_active = true
            ORDER BY il.created_at DESC
        `, [groupId]);
        
        const inviteLinks = result.rows.map(link => ({
            ...link,
            url: `${req.protocol}://${req.get('host')}/invite/${link.invite_code}`
        }));
        
        res.json({ inviteLinks });
    } catch (error) {
        console.error('초대 링크 조회 오류:', error);
        res.status(500).json({ error: '초대 링크를 불러올 수 없습니다.' });
    }
});

// 초대 코드로 그룹 정보 조회 (인증 불필요)
router.get('/code/:inviteCode', async (req, res) => {
    try {
        const { inviteCode } = req.params;
        
        const result = await pool.query(`
            SELECT 
                il.id,
                il.group_id,
                il.expires_at,
                il.max_uses,
                il.current_uses,
                il.is_active,
                g.name AS group_name,
                g.description AS group_description,
                u.username AS owner_name,
                (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
            FROM invite_links il
            JOIN groups g ON il.group_id = g.id
            JOIN users u ON g.owner_id = u.id
            WHERE il.invite_code = $1 AND il.is_active = true
        `, [inviteCode]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '유효하지 않은 초대 링크입니다.' });
        }
        
        const invite = result.rows[0];
        
        // 만료 확인
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return res.status(410).json({ error: '만료된 초대 링크입니다.' });
        }
        
        // 사용 횟수 확인
        if (invite.max_uses && invite.current_uses >= invite.max_uses) {
            return res.status(410).json({ error: '초대 링크의 사용 횟수가 초과되었습니다.' });
        }
        
        res.json({
            groupId: invite.group_id,
            groupName: invite.group_name,
            groupDescription: invite.group_description,
            ownerName: invite.owner_name,
            memberCount: invite.member_count
        });
    } catch (error) {
        console.error('초대 코드 조회 오류:', error);
        res.status(500).json({ error: '초대 링크를 확인할 수 없습니다.' });
    }
});

// 초대 링크로 그룹 가입
router.post('/join/:inviteCode', authenticateToken, async (req, res) => {
    try {
        const { inviteCode } = req.params;
        
        const inviteResult = await pool.query(`
            SELECT * FROM invite_links 
            WHERE invite_code = $1 AND is_active = true
        `, [inviteCode]);
        
        if (inviteResult.rows.length === 0) {
            return res.status(404).json({ error: '유효하지 않은 초대 링크입니다.' });
        }
        
        const invite = inviteResult.rows[0];
        
        // 만료 확인
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return res.status(410).json({ error: '만료된 초대 링크입니다.' });
        }
        
        // 사용 횟수 확인
        if (invite.max_uses && invite.current_uses >= invite.max_uses) {
            return res.status(410).json({ error: '초대 링크의 사용 횟수가 초과되었습니다.' });
        }
        
        // 이미 그룹 멤버인지 확인
        const memberCheck = await pool.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
            [invite.group_id, req.userId]
        );
        
        if (memberCheck.rows.length > 0) {
            return res.status(400).json({ error: '이미 이 그룹의 멤버입니다.' });
        }
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 그룹 멤버 추가
            await client.query(
                'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
                [invite.group_id, req.userId, 'member']
            );
            
            // 초대 링크 사용 횟수 증가
            await client.query(
                'UPDATE invite_links SET current_uses = current_uses + 1 WHERE id = $1',
                [invite.id]
            );
            
            await client.query('COMMIT');
            
            // 그룹 정보 조회
            const groupResult = await pool.query(
                'SELECT * FROM groups WHERE id = $1',
                [invite.group_id]
            );
            
            res.json({
                message: '그룹에 성공적으로 가입했습니다.',
                group: groupResult.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('그룹 가입 오류:', error);
        
        if (error.code === '23505') { // 중복 키 오류
            return res.status(400).json({ error: '이미 이 그룹의 멤버입니다.' });
        }
        
        res.status(500).json({ error: '그룹 가입에 실패했습니다.' });
    }
});

// 초대 링크 비활성화
router.delete('/:groupId/:inviteId', authenticateToken, async (req, res) => {
    try {
        const { groupId, inviteId } = req.params;
        
        // 권한 확인
        const memberCheck = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹의 멤버가 아닙니다.' });
        }
        
        const role = memberCheck.rows[0].role;
        if (role !== 'owner' && role !== 'admin') {
            return res.status(403).json({ error: '초대 링크를 삭제할 권한이 없습니다.' });
        }
        
        await pool.query(
            'UPDATE invite_links SET is_active = false WHERE id = $1 AND group_id = $2',
            [inviteId, groupId]
        );
        
        res.json({ message: '초대 링크가 비활성화되었습니다.' });
    } catch (error) {
        console.error('초대 링크 삭제 오류:', error);
        res.status(500).json({ error: '초대 링크 삭제에 실패했습니다.' });
    }
});

module.exports = router;

