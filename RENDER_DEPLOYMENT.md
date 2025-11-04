# 🚀 Render 배포 가이드

## 사전 준비

1. ✅ GitHub 계정
2. ✅ Render 계정 (https://render.com)
3. ✅ PostgreSQL 데이터베이스 (Render에서 자동 생성 가능)

## 📋 배포 단계

### 1단계: GitHub에 코드 푸시

```bash
# 변경사항 추가
git add .

# 커밋
git commit -m "Render 배포 준비 완료"

# GitHub에 푸시
git push origin master
```

### 2단계: Render에서 PostgreSQL 데이터베이스 생성

1. Render 대시보드 접속 (https://dashboard.render.com/)
2. **New +** 버튼 클릭
3. **PostgreSQL** 선택
4. 데이터베이스 설정:
   - **Name**: `memo-app-db`
   - **Database**: `memo_app`
   - **User**: `memo_app_user`
   - **Region**: Singapore (또는 가까운 지역)
   - **Plan**: Free
5. **Create Database** 클릭
6. 생성 완료 후 **Internal Database URL** 복사 (나중에 사용)

### 3단계: Render에서 Web Service 생성

1. Render 대시보드에서 **New +** → **Web Service** 선택
2. GitHub 저장소 연결:
   - **Connect Repository** 클릭
   - GitHub 계정 연결 (처음이라면)
   - 저장소 선택: `wjy1814-droid/woops` (또는 본인의 저장소)
3. 서비스 설정:
   - **Name**: `memo-sharing-app` (원하는 이름)
   - **Region**: Singapore (데이터베이스와 같은 지역)
   - **Branch**: `master`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 4단계: 환경 변수 설정

**Environment Variables** 섹션에서 다음 환경 변수 추가:

```
DB_HOST=<PostgreSQL 호스트>
DB_PORT=5432
DB_NAME=memo_app
DB_USER=memo_app_user
DB_PASSWORD=<PostgreSQL 비밀번호>
PORT=3000
```

**💡 팁**: PostgreSQL의 **Internal Database URL**을 복사했다면:
- URL 형식: `postgresql://user:password@host:port/database`
- 각 값을 추출하여 위 환경 변수에 입력

또는 **DATABASE_URL** 환경 변수 하나로 설정 가능:
```
DATABASE_URL=<Internal Database URL>
```

이 경우 `backend/database.js` 파일 수정 필요.

### 5단계: 배포 시작

1. **Create Web Service** 버튼 클릭
2. Render가 자동으로 빌드 및 배포 시작
3. 로그에서 배포 진행 상황 확인
4. 배포 완료 시 URL 생성: `https://your-app-name.onrender.com`

### 6단계: 데이터베이스 테이블 생성

배포 완료 후, Render 대시보드에서:

1. PostgreSQL 데이터베이스 선택
2. **Connect** 탭에서 **PSQL Command** 복사
3. 로컬 터미널에서 실행:
```bash
psql <복사한 명령어>
```

4. SQL 쿼리 실행:
```sql
CREATE TABLE IF NOT EXISTS memos (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

5. 확인:
```sql
\dt
```

## ✅ 배포 완료!

앱 URL: `https://your-app-name.onrender.com`

## 🐛 문제 해결

### 1. 데이터베이스 연결 오류
- 환경 변수가 정확한지 확인
- PostgreSQL 데이터베이스가 실행 중인지 확인
- Render 로그에서 오류 메시지 확인

### 2. 빌드 실패
- `package.json`이 루트 디렉토리에 있는지 확인
- Node 버전 확인 (최소 14.0.0)

### 3. 앱이 시작되지 않음
- Start Command가 `npm start`인지 확인
- 로그에서 오류 확인

## 📝 참고사항

- **무료 플랜**: 15분 동안 활동이 없으면 자동으로 슬립 모드
- **첫 접속**: 슬립 모드에서 깨어나는데 약 30초 소요
- **데이터베이스**: Free 플랜은 90일 후 삭제될 수 있음

## 🔄 업데이트 배포

코드 수정 후:
```bash
git add .
git commit -m "업데이트 내용"
git push origin master
```

Render가 자동으로 감지하고 재배포합니다!

