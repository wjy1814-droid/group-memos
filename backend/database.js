const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL 연결 풀 생성
// DATABASE_URL 환경 변수가 있으면 우선 사용 (Render 배포용)
const pool = process.env.DATABASE_URL 
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'memo_app',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    });

// 연결 테스트
pool.on('connect', () => {
    console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
    console.error('❌ 데이터베이스 연결 오류:', err);
});

// 테이블 초기화 함수
const initializeDatabase = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS memos (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('✅ 메모 테이블이 준비되었습니다.');
    } catch (error) {
        console.error('❌ 테이블 생성 오류:', error);
    }
};

// 데이터베이스 초기화 실행
initializeDatabase();

module.exports = pool;

