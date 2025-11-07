// 그룹 관련 함수들
const Groups = {
    currentGroupId: null,

    // 내 그룹 목록 조회
    async getMyGroups() {
        const response = await fetch(`${API_BASE_URL}/groups`, {
            headers: Auth.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('그룹 목록을 불러올 수 없습니다.');
        }

        const data = await response.json();
        return data.groups;
    },

    // 그룹 상세 조회
    async getGroup(groupId) {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            headers: Auth.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('그룹 정보를 불러올 수 없습니다.');
        }

        const data = await response.json();
        return data.group;
    },

    // 그룹 생성
    async createGroup(name, description) {
        const response = await fetch(`${API_BASE_URL}/groups`, {
            method: 'POST',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({ name, description })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '그룹 생성에 실패했습니다.');
        }

        const data = await response.json();
        return data.group;
    },

    // 그룹 삭제
    async deleteGroup(groupId) {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            method: 'DELETE',
            headers: Auth.getAuthHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '그룹 삭제에 실패했습니다.');
        }

        return true;
    },

    // 그룹 목록 표시
    async displayGroups() {
        const groupsList = document.getElementById('groupsList');
        groupsList.innerHTML = '<p>로딩 중...</p>';

        try {
            const groups = await this.getMyGroups();

            if (groups.length === 0) {
                groupsList.innerHTML = '<p style="text-align: center; color: #888;">아직 가입한 그룹이 없습니다. 새 그룹을 만들거나 초대 링크로 그룹에 가입해보세요!</p>';
                return;
            }

            groupsList.innerHTML = '';

            groups.forEach(group => {
                const groupCard = document.createElement('div');
                groupCard.className = 'group-card';
                groupCard.innerHTML = `
                    <h3>${escapeHtml(group.name)}</h3>
                    <p>${escapeHtml(group.description || '설명 없음')}</p>
                    <div class="group-card-info">
                        <span>👥 ${group.member_count}명</span>
                        <span>📝 ${group.memo_count || 0}개 메모</span>
                    </div>
                    <div class="group-card-info">
                        <span>관리자: ${escapeHtml(group.owner_name)}</span>
                        <span style="color: #667eea;">${group.my_role === 'owner' ? '소유자' : '멤버'}</span>
                    </div>
                `;

                groupCard.addEventListener('click', () => {
                    this.openGroup(group.id, group.name);
                });

                groupsList.appendChild(groupCard);
            });
        } catch (error) {
            groupsList.innerHTML = `<p style="color: red;">오류: ${error.message}</p>`;
        }
    },

    // 그룹 열기
    openGroup(groupId, groupName) {
        this.currentGroupId = groupId;
        document.getElementById('groupsScreen').style.display = 'none';
        document.getElementById('memosScreen').style.display = 'block';
        document.getElementById('currentGroupName').textContent = groupName;

        // 메모 불러오기
        Memos.loadMemos(groupId);
    },

    // 그룹 목록으로 돌아가기
    backToGroups() {
        this.currentGroupId = null;
        document.getElementById('memosScreen').style.display = 'none';
        document.getElementById('groupsScreen').style.display = 'block';
        this.displayGroups();
    }
};

// 그룹 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) return;

    const myGroupsBtn = document.getElementById('myGroupsBtn');
    const backToGroupsBtn = document.getElementById('backToGroupsBtn');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const createGroupModal = document.getElementById('createGroupModal');
    const createGroupForm = document.getElementById('createGroupForm');
    const groupMembersBtn = document.getElementById('groupMembersBtn');
    const groupMembersModal = document.getElementById('groupMembersModal');

    // 내 그룹 버튼
    if (myGroupsBtn) {
        myGroupsBtn.addEventListener('click', () => {
            Groups.backToGroups();
        });
    }

    // 그룹 목록으로 돌아가기
    if (backToGroupsBtn) {
        backToGroupsBtn.addEventListener('click', () => {
            Groups.backToGroups();
        });
    }

    // 그룹 생성 버튼
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', () => {
            createGroupModal.style.display = 'flex';
        });
    }

    // 그룹 생성 폼
    if (createGroupForm) {
        createGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('groupName').value;
            const description = document.getElementById('groupDescription').value;

            try {
                await Groups.createGroup(name, description);
                createGroupModal.style.display = 'none';
                createGroupForm.reset();
                Groups.displayGroups();
                alert('그룹이 생성되었습니다!');
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // 그룹 멤버 보기
    if (groupMembersBtn) {
        groupMembersBtn.addEventListener('click', async () => {
            if (!Groups.currentGroupId) return;

            try {
                const group = await Groups.getGroup(Groups.currentGroupId);
                const membersList = document.getElementById('membersList');
                membersList.innerHTML = '';

                if (group.members && group.members.length > 0) {
                    group.members.forEach(member => {
                        const memberItem = document.createElement('div');
                        memberItem.className = 'member-item';
                        memberItem.innerHTML = `
                            <div class="member-info">
                                <div class="member-name">${escapeHtml(member.username)}</div>
                                <div class="member-email">${escapeHtml(member.email)}</div>
                            </div>
                            <span class="member-role ${member.role}">${member.role === 'owner' ? '소유자' : '멤버'}</span>
                        `;
                        membersList.appendChild(memberItem);
                    });
                }

                groupMembersModal.style.display = 'flex';
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // 모달 닫기
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').style.display = 'none';
        });
    });

    // 모달 외부 클릭시 닫기
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // 초기 화면: 첫 번째 그룹의 메모 화면 자동 표시
    loadFirstGroup();
});

// HTML 이스케이프 함수
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 첫 번째 그룹 자동 로드
async function loadFirstGroup() {
    try {
        const groups = await Groups.getMyGroups();
        
        if (groups.length === 0) {
            // 그룹이 없으면 그룹 목록 화면 표시
            Groups.backToGroups();
            return;
        }
        
        // 첫 번째 그룹을 자동으로 열기
        const firstGroup = groups[0];
        Groups.openGroup(firstGroup.id, firstGroup.name);
    } catch (error) {
        console.error('그룹 로드 오류:', error);
        // 에러 발생 시 그룹 목록 화면으로
        Groups.backToGroups();
    }
}

