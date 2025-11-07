// 알림 관련 기능
const Reminders = {
    // 알림 권한 요청
    async requestPermission() {
        if (!('Notification' in window)) {
            alert('이 브라우저는 알림을 지원하지 않습니다.');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    },

    // 알림 표시
    showNotification(title, body, memoId) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '☁️',
                badge: '🔔',
                tag: `memo-${memoId}`,
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    },

    // 알림 시간 체크 및 스케줄링
    scheduleReminder(memo) {
        if (!memo.reminder_time) return;

        const reminderTime = new Date(memo.reminder_time);
        const now = new Date();
        const timeUntilReminder = reminderTime - now;

        // 이미 지난 시간이면 무시
        if (timeUntilReminder < 0) return;

        // 알림 예약
        setTimeout(() => {
            this.showNotification(
                '🔔 메모 알림',
                memo.content,
                memo.id
            );

            // 소리 재생 (선택사항)
            this.playNotificationSound();
        }, timeUntilReminder);
    },

    // 알림음 재생
    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIHnC78NqvZxwHPJfW8s18KwYnesbx3I4+ChRo';
        audio.volume = 0.3;
        audio.play().catch(() => {}); // 에러 무시
    },

    // 모든 메모의 알림 스케줄링
    scheduleAllReminders(memos) {
        memos.forEach(memo => {
            this.scheduleReminder(memo);
        });
    },

    // 알림 시간 포맷팅
    formatReminderTime(reminderTime) {
        if (!reminderTime) return null;

        const date = new Date(reminderTime);
        const now = new Date();

        if (date < now) {
            return {
                text: `알림: ${date.toLocaleString('ko-KR')}`,
                expired: true
            };
        }

        return {
            text: `🔔 알림: ${date.toLocaleString('ko-KR')}`,
            expired: false
        };
    }
};

// 알림 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) return;

    const setReminder = document.getElementById('setReminder');
    const reminderTime = document.getElementById('reminderTime');

    // 알림 체크박스
    if (setReminder) {
        setReminder.addEventListener('change', (e) => {
            reminderTime.disabled = !e.target.checked;
            
            if (e.target.checked) {
                // 현재 시간 + 1시간을 기본값으로
                const defaultTime = new Date();
                defaultTime.setHours(defaultTime.getHours() + 1);
                const formatted = defaultTime.toISOString().slice(0, 16);
                reminderTime.value = formatted;
                reminderTime.focus();

                // 알림 권한 요청
                Reminders.requestPermission();
            } else {
                reminderTime.value = '';
            }
        });
    }
});

