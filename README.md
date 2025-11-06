# ☁️ 구름 메모장 - 그룹 메모 공유 앱

그룹별로 메모를 공유하고 관리할 수 있는 웹 애플리케이션입니다. 초대 링크를 통해 쉽게 그룹에 참여할 수 있습니다.

## 주요 기능

- 🔐 **사용자 인증**: 회원가입 및 로그인
- 👥 **그룹 관리**: 그룹 생성, 수정, 삭제
- 📝 **메모 공유**: 그룹 내에서 메모 작성 및 공유
- 🔗 **초대 링크**: 초대 링크 생성 및 관리
- ⏰ **만료 설정**: 초대 링크 만료 시간 및 사용 횟수 제한
- ☁️ **아름다운 UI**: 구름 모양의 메모 디자인

## 기술 스택

### 백엔드
- Node.js
- Express.js
- PostgreSQL
- JWT 인증
- bcrypt

### 프론트엔드
- HTML5
- CSS3 (반응형 디자인)
- Vanilla JavaScript
- Fetch API

## 🚀 Render에 배포하기

### 1. Render 계정 생성
[Render.com](https://render.com)에서 계정을 만듭니다 (GitHub 계정으로 로그인 가능)

### 2. GitHub 저장소 연결
1. Render 대시보드에서 "New +" 클릭
2. "Web Service" 선택
3. GitHub 저장소 연결: `wjy1814-droid/group-memos`
4. 다음 설정 사용:
   - **Name**: group-memos
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Root Directory**: (비워두기)
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free

### 3. 환경 변수 설정
Render 대시보드의 "Environment" 탭에서 다음 환경 변수를 추가:

- `DATABASE_URL`: Render PostgreSQL 데이터베이스 URL (자동 설정)
- `JWT_SECRET`: 랜덤한 문자열 (예: `your-super-secret-jwt-key-change-this`)
- `NODE_ENV`: `production`

### 4. PostgreSQL 데이터베이스 생성
1. Render 대시보드에서 "New +" → "PostgreSQL" 선택
2. 다음 설정 사용:
   - **Name**: group-memos-db
   - **Database**: group_memos
   - **User**: group_memos_user
   - **Region**: Oregon (US West)
   - **Plan**: Free
3. 생성 후 Internal Database URL을 복사
4. Web Service의 환경 변수 `DATABASE_URL`에 붙여넣기

### 5. 배포
"Manual Deploy" → "Deploy latest commit" 클릭하여 배포 시작

배포가 완료되면 Render가 제공하는 URL로 접속할 수 있습니다!
예: `https://group-memos.onrender.com`

## 로컬 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/wjy1814-droid/group-memos.git
cd group-memos
```

### 2. 의존성 설치

```bash
cd backend
npm install
```

### 3. 환경 변수 설정

`backend/.env` 파일을 생성하고 다음 내용 입력:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=group_memos
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_key
PORT=3001
```

### 4. PostgreSQL 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE group_memos;
```

### 5. 서버 실행

```bash
# 백엔드 폴더에서
npm start

# 또는 개발 모드로 실행 (nodemon)
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 그룹
- `GET /api/groups` - 내 그룹 목록
- `GET /api/groups/:groupId` - 그룹 상세 정보
- `POST /api/groups` - 그룹 생성
- `PUT /api/groups/:groupId` - 그룹 수정
- `DELETE /api/groups/:groupId` - 그룹 삭제
- `POST /api/groups/:groupId/leave` - 그룹 탈퇴

### 메모
- `GET /api/memos/group/:groupId` - 그룹의 메모 목록
- `POST /api/memos` - 메모 생성
- `PUT /api/memos/:id` - 메모 수정
- `DELETE /api/memos/:id` - 메모 삭제

### 초대 링크
- `POST /api/invites/:groupId` - 초대 링크 생성
- `GET /api/invites/:groupId` - 그룹의 초대 링크 목록
- `GET /api/invites/code/:inviteCode` - 초대 코드로 그룹 정보 조회
- `POST /api/invites/join/:inviteCode` - 초대 링크로 그룹 가입
- `DELETE /api/invites/:groupId/:inviteId` - 초대 링크 비활성화

## 데이터베이스 스키마

### users
- id (SERIAL PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- username (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### groups
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- description (TEXT)
- owner_id (INTEGER, FK to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### group_members
- id (SERIAL PRIMARY KEY)
- group_id (INTEGER, FK to groups)
- user_id (INTEGER, FK to users)
- role (VARCHAR: 'owner', 'admin', 'member')
- joined_at (TIMESTAMP)

### invite_links
- id (SERIAL PRIMARY KEY)
- group_id (INTEGER, FK to groups)
- invite_code (VARCHAR, UNIQUE)
- created_by (INTEGER, FK to users)
- expires_at (TIMESTAMP, nullable)
- max_uses (INTEGER, nullable)
- current_uses (INTEGER)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)

### memos
- id (SERIAL PRIMARY KEY)
- content (TEXT)
- user_id (INTEGER, FK to users)
- group_id (INTEGER, FK to groups)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 라이선스

MIT License

## 기여

PR과 이슈는 언제든지 환영합니다!

## 문의

문제가 있거나 질문이 있으시면 이슈를 등록해주세요.
