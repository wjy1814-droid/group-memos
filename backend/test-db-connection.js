// 데이터베이스 연결 테스트 스크립트
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'memo_app',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function testConnection() {
    console.log('===== 데이터베이스 연결 테스트 =====');
    console.log(`호스트: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`포트: ${process.env.DB_PORT || 5432}`);
    console.log(`데이터베이스: ${process.env.DB_NAME || 'memo_app'}`);
    console.log(`사용자: ${process.env.DB_USER || 'postgres'}`);
    console.log('====================================\n');

    try {
        // 연결 테스트
        console.log('1. PostgreSQL 서버 연결 시도...');
        const client = await pool.connect();
        console.log('✅ PostgreSQL 서버 연결 성공!\n');

        // 데이터베이스 버전 확인
        console.log('2. PostgreSQL 버전 확인...');
        const versionResult = await client.query('SELECT version()');
        console.log('✅ 버전:', versionResult.rows[0].version.split('\n')[0], '\n');

        // 현재 데이터베이스 확인
        console.log('3. 현재 데이터베이스 확인...');
        const dbResult = await client.query('SELECT current_database()');
        console.log('✅ 현재 데이터베이스:', dbResult.rows[0].current_database, '\n');

        // 테이블 존재 여부 확인
        console.log('4. memos 테이블 존재 여부 확인...');
        const tableResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'memos'
            );
        `);
        
        if (tableResult.rows[0].exists) {
            console.log('✅ memos 테이블이 존재합니다.\n');
            
            // 테이블 구조 확인
            console.log('5. memos 테이블 구조 확인...');
            const columnsResult = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'memos'
                ORDER BY ordinal_position;
            `);
            console.log('✅ 테이블 컬럼:');
            columnsResult.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
            console.log();
            
            // 데이터 개수 확인
            console.log('6. 저장된 메모 개수 확인...');
            const countResult = await client.query('SELECT COUNT(*) FROM memos');
            console.log(`✅ 현재 저장된 메모: ${countResult.rows[0].count}개\n`);
        } else {
            console.log('❌ memos 테이블이 존재하지 않습니다.');
            console.log('   테이블을 생성해야 합니다.\n');
        }

        client.release();
        console.log('====================================');
        console.log('🎉 모든 테스트 완료!');
        console.log('====================================');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 오류 발생:');
        console.error('코드:', error.code);
        console.error('메시지:', error.message);
        console.error('\n상세 정보:', error);
        
        console.log('\n====================================');
        console.log('💡 해결 방법:');
        if (error.code === '3D000') {
            console.log('   - memo_app 데이터베이스가 존재하지 않습니다.');
            console.log('   - SQL Shell에서 "CREATE DATABASE memo_app;" 실행');
        } else if (error.code === '28P01') {
            console.log('   - 비밀번호가 올바르지 않습니다.');
            console.log('   - .env 파일의 DB_PASSWORD를 확인하세요.');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('   - PostgreSQL 서버가 실행되지 않았습니다.');
            console.log('   - PostgreSQL 서비스를 시작하세요.');
        }
        console.log('====================================');
        
        process.exit(1);
    }
}

testConnection();

