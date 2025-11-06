// 메인 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 초대 링크로 접속한 경우 별도 처리
    const path = window.location.pathname;
    if (path.startsWith('/invite/')) {
        return; // invites.js에서 처리
    }

    // 인증되지 않은 경우 auth.js에서 처리
    if (!Auth.isAuthenticated()) {
        return;
    }

    // 인증된 사용자: 그룹 화면 표시
    const groupsScreen = document.getElementById('groupsScreen');
    if (groupsScreen) {
        groupsScreen.style.display = 'block';
    }

    // 기타 전역 이벤트 리스너 설정
    setupGlobalEventListeners();
});

// 전역 이벤트 리스너 설정
function setupGlobalEventListeners() {
    // 그룹 설정 버튼
    const groupSettingsBtn = document.getElementById('groupSettingsBtn');
    if (groupSettingsBtn) {
        groupSettingsBtn.addEventListener('click', () => {
            if (!Groups.currentGroupId) return;
            alert('그룹 설정 기능은 추후 추가될 예정입니다.');
        });
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });

    // 페이지 로드시 스크롤 위치 복원 방지
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
}

// 전역 유틸리티 함수
window.showNotification = function(message, type = 'info') {
    // 간단한 알림 표시 (추후 토스트 알림으로 개선 가능)
    console.log(`[${type.toUpperCase()}]`, message);
};

window.confirmAction = function(message) {
    return confirm(message);
};

// 에러 핸들링
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // 프로덕션에서는 에러 로깅 서비스로 전송
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // 프로덕션에서는 에러 로깅 서비스로 전송
});

// 서비스 워커 등록 (오프라인 지원 - 선택사항)
if ('serviceWorker' in navigator) {
    // window.addEventListener('load', () => {
    //     navigator.serviceWorker.register('/sw.js')
    //         .then(registration => console.log('SW registered'))
    //         .catch(err => console.log('SW registration failed'));
    // });
}

console.log('☁️ 구름 메모장 앱이 로드되었습니다!');

