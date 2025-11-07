// API 엔드포인트 설정
// 로컬 개발 환경에서는 포트 3000, 프로덕션에서는 상대 경로 사용
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

// 인증 관련 함수들
const Auth = {
    // 토큰 저장
    setToken(token) {
        localStorage.setItem('token', token);
    },

    // 토큰 가져오기
    getToken() {
        return localStorage.getItem('token');
    },

    // 사용자 정보 저장
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    // 사용자 정보 가져오기
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // 로그아웃
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    },

    // 인증 확인
    isAuthenticated() {
        return !!this.getToken();
    },

    // API 요청 헤더
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
        };
    },

    // 회원가입
    async register(username, email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '회원가입에 실패했습니다.');
        }

        this.setToken(data.token);
        this.setUser(data.user);

        return data;
    },

    // 로그인
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '로그인에 실패했습니다.');
        }

        this.setToken(data.token);
        this.setUser(data.user);

        return data;
    }
};

// 인증 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 초대 링크로 접속했는지 확인
    const path = window.location.pathname;
    if (path.startsWith('/invite/')) {
        return; // 초대 페이지는 별도로 처리
    }

    const authScreen = document.getElementById('authScreen');
    const appScreen = document.getElementById('appScreen');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authMessage = document.getElementById('authMessage');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');

    // 인증 상태 확인
    if (Auth.isAuthenticated()) {
        authScreen.style.display = 'none';
        appScreen.style.display = 'block';
        const user = Auth.getUser();
        if (user) {
            usernameDisplay.textContent = `${user.username}님`;
        }
    } else {
        authScreen.style.display = 'flex';
        appScreen.style.display = 'none';
    }

    // 탭 전환
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        authMessage.textContent = '';
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'flex';
        loginForm.style.display = 'none';
        authMessage.textContent = '';
    });

    // 로그인 폼 제출
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authMessage.textContent = '';

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await Auth.login(email, password);
            
            // 초대 코드가 저장되어 있으면 초대 페이지로 리다이렉트
            const pendingInviteCode = localStorage.getItem('pendingInviteCode');
            if (pendingInviteCode) {
                window.location.href = `/invite/${pendingInviteCode}`;
            } else {
                window.location.reload();
            }
        } catch (error) {
            authMessage.textContent = error.message;
        }
    });

    // 회원가입 폼 제출
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authMessage.textContent = '';

        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            await Auth.register(username, email, password);
            
            // 초대 코드가 저장되어 있으면 초대 페이지로 리다이렉트
            const pendingInviteCode = localStorage.getItem('pendingInviteCode');
            if (pendingInviteCode) {
                window.location.href = `/invite/${pendingInviteCode}`;
            } else {
                window.location.reload();
            }
        } catch (error) {
            authMessage.textContent = error.message;
        }
    });

    // 로그아웃
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('로그아웃하시겠습니까?')) {
                Auth.logout();
            }
        });
    }
});

