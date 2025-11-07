// 친구 찾기 관련 함수들
const Friends = {
    // 사용자 검색
    async searchUsers(query) {
        const response = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
            headers: Auth.getAuthHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '사용자 검색에 실패했습니다.');
        }

        const data = await response.json();
        return data.users;
    },

    // 사용자를 그룹에 초대
    async inviteUserToGroup(groupId, userId) {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invite-user`, {
            method: 'POST',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '사용자 초대에 실패했습니다.');
        }

        const data = await response.json();
        return data;
    },

    // 검색 결과 표시
    displaySearchResults(users, groupId) {
        const resultsContainer = document.getElementById('friendSearchResults');
        
        if (users.length === 0) {
            resultsContainer.innerHTML = '<div class="search-empty">검색 결과가 없습니다.</div>';
            return;
        }

        resultsContainer.innerHTML = '';

        users.forEach(user => {
            const resultItem = document.createElement('div');
            resultItem.className = 'friend-search-result';
            resultItem.innerHTML = `
                <div class="friend-info">
                    <div class="friend-name">${escapeHtml(user.username)}</div>
                    <div class="friend-email">${escapeHtml(user.email)}</div>
                </div>
                <button class="btn-invite-friend" data-user-id="${user.id}">초대하기</button>
            `;

            const inviteBtn = resultItem.querySelector('.btn-invite-friend');
            inviteBtn.addEventListener('click', async () => {
                inviteBtn.disabled = true;
                inviteBtn.textContent = '초대 중...';

                try {
                    await this.inviteUserToGroup(groupId, user.id);
                    inviteBtn.textContent = '초대 완료!';
                    inviteBtn.style.background = '#95a5a6';
                    
                    setTimeout(() => {
                        alert(`${user.username}님을 그룹에 초대했습니다!`);
                    }, 300);
                } catch (error) {
                    alert(error.message);
                    inviteBtn.disabled = false;
                    inviteBtn.textContent = '초대하기';
                }
            });

            resultsContainer.appendChild(resultItem);
        });
    }
};

// 친구 찾기 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) return;

    const findFriendBtn = document.getElementById('findFriendBtn');
    const findFriendModal = document.getElementById('findFriendModal');
    const friendSearchInput = document.getElementById('friendSearchInput');
    const searchFriendBtn = document.getElementById('searchFriendBtn');
    const friendSearchResults = document.getElementById('friendSearchResults');

    // 친구 찾기 버튼
    if (findFriendBtn) {
        findFriendBtn.addEventListener('click', () => {
            if (!Groups.currentGroupId) return;
            
            findFriendModal.style.display = 'flex';
            friendSearchInput.value = '';
            friendSearchResults.innerHTML = '<div class="search-empty">이메일 또는 사용자명을 입력하고 검색하세요.</div>';
            friendSearchInput.focus();
        });
    }

    // 검색 버튼
    if (searchFriendBtn) {
        searchFriendBtn.addEventListener('click', async () => {
            await performSearch();
        });
    }

    // Enter 키로 검색
    if (friendSearchInput) {
        friendSearchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await performSearch();
            }
        });
    }

    // 검색 실행 함수
    async function performSearch() {
        const query = friendSearchInput.value.trim();
        
        if (query.length < 2) {
            alert('최소 2자 이상 입력해주세요.');
            return;
        }

        friendSearchResults.innerHTML = '<div class="search-empty">검색 중...</div>';

        try {
            const users = await Friends.searchUsers(query);
            Friends.displaySearchResults(users, Groups.currentGroupId);
        } catch (error) {
            friendSearchResults.innerHTML = `<div class="search-empty" style="color: #e74c3c;">${error.message}</div>`;
        }
    }
});

