const { Pool } = require('pg');
require('dotenv').config();

// 환경 변수 확인 로그
console.log('🔍 데이터베이스 환경 변수 확인:');
console.log('DATABASE_URL 존재:', !!process.env.DATABASE_URL);
console.log('DB_HOST:', process.env.DB_HOST || '설정되지 않음');
console.log('DB_NAME:', process.env.DB_NAME || '설정되지 않음');
console.log('DB_USER:', process.env.DB_USER || '설정되지 않음');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '설정됨' : '설정되지 않음');

// PostgreSQL 연결 풀 생성
const pool = process.env.DATABASE_URL 
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('postgresql:5432') ? false : {
            rejectUnauthorized: false
        }
    })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'group_memos',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && !process.env.DB_HOST.includes('postgresql') ? {
            rejectUnauthorized: false
        } : false
    });

// 연결 테스트
pool.on('connect', () => {
    console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
    console.error('❌ 데이터베이스 연결 오류:', err);
    console.error('오류 상세:', err.message);
});

// 테이블 초기화 함수
const initializeDatabase = async () => {
    try {
        // 먼저 연결 테스트
        await pool.query('SELECT NOW()');
        console.log('✅ 데이터베이스 연결 테스트 성공!');
        
        // users 테이블 생성
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                username VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ 사용자 테이블이 준비되었습니다.');
        
        // groups 테이블 생성
        await pool.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ 그룹 테이블이 준비되었습니다.');
        
        // group_members 테이블 생성
        await pool.query(`
            CREATE TABLE IF NOT EXISTS group_members (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(20) DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(group_id, user_id)
            );
        `);
        console.log('✅ 그룹 멤버 테이블이 준비되었습니다.');
        
        // invite_links 테이블 생성 (새로운 기능!)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS invite_links (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
                invite_code VARCHAR(255) UNIQUE NOT NULL,
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                expires_at TIMESTAMP,
                max_uses INTEGER,
                current_uses INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ 초대 링크 테이블이 준비되었습니다.');
        
        // memos 테이블 생성 (user_id와 group_id 추가)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS memos (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // 기존 테이블에 컬럼이 없으면 추가 (마이그레이션)
        try {
            await pool.query(`
                ALTER TABLE memos 
                ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE;
            `);
            console.log('✅ 메모 테이블 마이그레이션 완료');
        } catch (migrationError) {
            console.log('ℹ️ 메모 테이블은 이미 최신 버전입니다.');
        }
        
        console.log('✅ 메모 테이블이 준비되었습니다.');
    } catch (error) {
        console.error('❌ 데이터베이스 초기화 오류:', error);
        console.error('오류 메시지:', error.message);
        console.error('오류 코드:', error.code);
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error('💡 해결 방법:');
            console.error('1. PostgreSQL 데이터베이스가 실행 중인지 확인하세요.');
            console.error('2. 환경 변수가 올바르게 설정되었는지 확인하세요.');
            console.error('3. DATABASE_URL 또는 DB_HOST, DB_NAME 등이 설정되어 있어야 합니다.');
        }
    }
};

// 데이터베이스 초기화 실행
initializeDatabase();

module.exports = pool;

