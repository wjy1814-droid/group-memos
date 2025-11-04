const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 제공 (프론트엔드)
app.use(express.static(path.join(__dirname, '../frontend')));

// 데이터베이스 연결
const db = require('./database');

// API 라우트
const memoRoutes = require('./routes/memos');
app.use('/api/memos', memoRoutes);

// 프론트엔드 라우트 (모든 경로를 index.html로)
app.get('*', (req, res) => {
    // API 경로가 아닌 경우에만 index.html 제공
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

// 에러 핸들링
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: '서버 오류가 발생했습니다.',
        message: err.message 
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📝 API 주소: http://localhost:${PORT}/api/memos`);
});

module.exports = app;

