// memos 테이블 생성 스크립트
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'memo_app',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function createTable() {
    console.log('===== memos 테이블 생성 =====\n');
    
    try {
        const client = await pool.connect();
        
        console.log('1. memos 테이블 생성 중...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS memos (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ memos 테이블 생성 완료!\n');
        
        // 테이블 확인
        console.log('2. 테이블 구조 확인...');
        const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'memos'
            ORDER BY ordinal_position;
        `);
        
        console.log('✅ 테이블 컬럼:');
        columnsResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
            if (col.column_default) {
                console.log(`     (기본값: ${col.column_default})`);
            }
        });
        
        client.release();
        
        console.log('\n====================================');
        console.log('🎉 테이블 생성 완료!');
        console.log('이제 백엔드 서버를 시작할 수 있습니다.');
        console.log('====================================');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 오류 발생:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createTable();

