// 메모 관련 함수들
const Memos = {
    // 그룹의 메모 목록 조회
    async getMemos(groupId) {
        const response = await fetch(`${API_BASE_URL}/memos/group/${groupId}`, {
            headers: Auth.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('메모를 불러올 수 없습니다.');
        }

        const data = await response.json();
        return data.memos;
    },

    // 메모 생성
    async createMemo(content, groupId, reminderTime = null) {
        const response = await fetch(`${API_BASE_URL}/memos`, {
            method: 'POST',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({ content, groupId, reminderTime })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '메모 생성에 실패했습니다.');
        }

        const data = await response.json();
        return data.memo;
    },

    // 메모 수정
    async updateMemo(memoId, content) {
        const response = await fetch(`${API_BASE_URL}/memos/${memoId}`, {
            method: 'PUT',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '메모 수정에 실패했습니다.');
        }

        const data = await response.json();
        return data.memo;
    },

    // 메모 삭제
    async deleteMemo(memoId) {
        const response = await fetch(`${API_BASE_URL}/memos/${memoId}`, {
            method: 'DELETE',
            headers: Auth.getAuthHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '메모 삭제에 실패했습니다.');
        }

        return true;
    },

    // 메모 불러오기 및 표시
    async loadMemos(groupId) {
        const memoContainer = document.getElementById('memoContainer');
        memoContainer.innerHTML = '<div class="empty-state">메모를 불러오는 중...</div>';

        try {
            const memos = await this.getMemos(groupId);

            if (memos.length === 0) {
                memoContainer.innerHTML = '<div class="empty-state">☁️ 첫 메모를 작성해보세요! ☁️</div>';
                return;
            }

            memoContainer.innerHTML = '';

            memos.forEach(memo => {
                const memoElement = this.createMemoElement(memo);
                memoContainer.appendChild(memoElement);
            });

            // 알림 스케줄링
            if (typeof Reminders !== 'undefined') {
                Reminders.scheduleAllReminders(memos);
            }
        } catch (error) {
            memoContainer.innerHTML = `<div class="empty-state">오류: ${error.message}</div>`;
        }
    },

    // 메모 요소 생성
    createMemoElement(memo) {
        const memoDiv = document.createElement('div');
        memoDiv.className = 'memo-cloud';
        memoDiv.dataset.id = memo.id;

        const currentUser = Auth.getUser();
        const isOwner = currentUser && memo.user_id === currentUser.id;

        const formattedDate = this.formatDate(memo.created_at);
        
        // 알림 시간 포맷팅
        let reminderHtml = '';
        if (memo.reminder_time) {
            const reminderInfo = Reminders.formatReminderTime(memo.reminder_time);
            if (reminderInfo) {
                reminderHtml = `<div class="memo-reminder ${reminderInfo.expired ? 'expired' : ''}">${reminderInfo.text}</div>`;
            }
        }

        memoDiv.innerHTML = `
            <div class="memo-author">작성자: ${escapeHtml(memo.author_name || '알 수 없음')}</div>
            <div class="memo-content">${escapeHtml(memo.content).replace(/\n/g, '<br>')}</div>
            <div class="memo-date">${formattedDate}</div>
            ${reminderHtml}
            ${isOwner ? `
                <div class="memo-actions">
                    <button class="memo-btn btn-edit" onclick="Memos.startEdit(${memo.id})">수정</button>
                    <button class="memo-btn btn-delete" onclick="Memos.handleDeleteMemo(${memo.id})">삭제</button>
                </div>
            ` : ''}
        `;

        return memoDiv;
    },

    // 메모 추가 처리
    async handleAddMemo() {
        const memoInput = document.getElementById('memoInput');
        const content = memoInput.value.trim();
        const setReminder = document.getElementById('setReminder');
        const reminderTime = document.getElementById('reminderTime');

        if (!content) {
            alert('메모 내용을 입력해주세요!');
            return;
        }

        if (!Groups.currentGroupId) {
            alert('그룹을 선택해주세요!');
            return;
        }

        // 알림 시간 가져오기
        let reminderTimeValue = null;
        if (setReminder && setReminder.checked && reminderTime.value) {
            reminderTimeValue = new Date(reminderTime.value).toISOString();
        }

        try {
            await this.createMemo(content, Groups.currentGroupId, reminderTimeValue);
            memoInput.value = '';
            setReminder.checked = false;
            reminderTime.disabled = true;
            reminderTime.value = '';
            this.loadMemos(Groups.currentGroupId);
        } catch (error) {
            alert(error.message);
        }
    },

    // 메모 수정 시작
    startEdit(memoId) {
        const memoElement = document.querySelector(`.memo-cloud[data-id="${memoId}"]`);
        if (!memoElement) return;

        const contentDiv = memoElement.querySelector('.memo-content');
        const currentContent = contentDiv.textContent;

        const textarea = document.createElement('textarea');
        textarea.value = currentContent;
        textarea.className = 'memo-edit-input';
        textarea.style.width = '100%';
        textarea.style.minHeight = '100px';
        textarea.style.padding = '10px';
        textarea.style.border = '2px solid #667eea';
        textarea.style.borderRadius = '10px';
        textarea.style.fontSize = '1rem';
        textarea.style.marginBottom = '10px';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '저장';
        saveBtn.className = 'memo-btn btn-edit';
        saveBtn.style.marginRight = '10px';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '취소';
        cancelBtn.className = 'memo-btn btn-delete';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'memo-actions';
        actionsDiv.appendChild(saveBtn);
        actionsDiv.appendChild(cancelBtn);

        // 기존 내용 숨기기
        const oldActions = memoElement.querySelector('.memo-actions');
        contentDiv.style.display = 'none';
        if (oldActions) oldActions.style.display = 'none';

        // 편집 UI 추가
        contentDiv.parentNode.insertBefore(textarea, contentDiv.nextSibling);
        contentDiv.parentNode.insertBefore(actionsDiv, textarea.nextSibling);

        // 이벤트 리스너
        saveBtn.addEventListener('click', async () => {
            const newContent = textarea.value.trim();
            if (!newContent) {
                alert('메모 내용을 입력해주세요!');
                return;
            }

            try {
                await this.updateMemo(memoId, newContent);
                this.loadMemos(Groups.currentGroupId);
            } catch (error) {
                alert(error.message);
            }
        });

        cancelBtn.addEventListener('click', () => {
            contentDiv.style.display = 'block';
            if (oldActions) oldActions.style.display = 'flex';
            textarea.remove();
            actionsDiv.remove();
        });
    },

    // 메모 삭제 처리
    async handleDeleteMemo(memoId) {
        if (!confirm('이 메모를 삭제하시겠습니까?')) {
            return;
        }

        try {
            await this.deleteMemo(memoId);
            this.loadMemos(Groups.currentGroupId);
        } catch (error) {
            alert(error.message);
        }
    },

    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;

        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
};

// 메모 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) return;

    const addMemoBtn = document.getElementById('addMemoBtn');
    const memoInput = document.getElementById('memoInput');

    if (addMemoBtn) {
        addMemoBtn.addEventListener('click', () => {
            Memos.handleAddMemo();
        });
    }

    if (memoInput) {
        // Enter 키로 메모 추가 (Shift+Enter는 줄바꿈)
        memoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                Memos.handleAddMemo();
            }
        });
    }
});

