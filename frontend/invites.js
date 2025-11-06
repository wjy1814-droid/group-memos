// 초대 링크 관련 함수들
const Invites = {
    // 초대 링크 생성
    async createInviteLink(groupId, expiresIn, maxUses) {
        const body = {};
        if (expiresIn) body.expiresIn = expiresIn;
        if (maxUses) body.maxUses = maxUses;

        const response = await fetch(`${API_BASE_URL}/invites/${groupId}`, {
            method: 'POST',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '초대 링크 생성에 실패했습니다.');
        }

        const data = await response.json();
        return data.inviteLink;
    },

    // 초대 링크 목록 조회
    async getInviteLinks(groupId) {
        const response = await fetch(`${API_BASE_URL}/invites/${groupId}`, {
            headers: Auth.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('초대 링크를 불러올 수 없습니다.');
        }

        const data = await response.json();
        return data.inviteLinks;
    },

    // 초대 코드로 그룹 정보 조회
    async getGroupByInviteCode(inviteCode) {
        const response = await fetch(`${API_BASE_URL}/invites/code/${inviteCode}`);

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '유효하지 않은 초대 링크입니다.');
        }

        return await response.json();
    },

    // 초대 링크로 그룹 가입
    async joinGroupByInvite(inviteCode) {
        const response = await fetch(`${API_BASE_URL}/invites/join/${inviteCode}`, {
            method: 'POST',
            headers: Auth.getAuthHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '그룹 가입에 실패했습니다.');
        }

        const data = await response.json();
        return data.group;
    },

    // 초대 링크 비활성화
    async deactivateInviteLink(groupId, inviteId) {
        const response = await fetch(`${API_BASE_URL}/invites/${groupId}/${inviteId}`, {
            method: 'DELETE',
            headers: Auth.getAuthHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '초대 링크 삭제에 실패했습니다.');
        }

        return true;
    },

    // 초대 링크 목록 표시
    async displayInviteLinks(groupId) {
        const inviteLinksList = document.getElementById('inviteLinksList');
        inviteLinksList.innerHTML = '<p>로딩 중...</p>';

        try {
            const inviteLinks = await this.getInviteLinks(groupId);

            if (inviteLinks.length === 0) {
                inviteLinksList.innerHTML = '<p style="color: #888;">아직 생성된 초대 링크가 없습니다.</p>';
                return;
            }

            inviteLinksList.innerHTML = '';

            inviteLinks.forEach(link => {
                const linkItem = document.createElement('div');
                linkItem.className = 'invite-link-item';

                const expiresText = link.expires_at 
                    ? `만료: ${new Date(link.expires_at).toLocaleString('ko-KR')}`
                    : '무제한';

                const usesText = link.max_uses
                    ? `사용: ${link.current_uses}/${link.max_uses}`
                    : `사용: ${link.current_uses}회`;

                linkItem.innerHTML = `
                    <strong>초대 링크</strong>
                    <div class="invite-link-code">${link.url}</div>
                    <div class="invite-link-info">
                        <p>생성자: ${escapeHtml(link.created_by_name || '알 수 없음')}</p>
                        <p>${expiresText} | ${usesText}</p>
                        <p>생성일: ${new Date(link.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                    <div class="invite-link-actions">
                        <button class="btn-copy" data-url="${link.url}">복사</button>
                        <button class="btn-deactivate" data-link-id="${link.id}">비활성화</button>
                    </div>
                `;

                inviteLinksList.appendChild(linkItem);
            });

            // 복사 버튼 이벤트
            inviteLinksList.querySelectorAll('.btn-copy').forEach(btn => {
                btn.addEventListener('click', () => {
                    const url = btn.dataset.url;
                    navigator.clipboard.writeText(url).then(() => {
                        alert('초대 링크가 복사되었습니다!');
                    }).catch(() => {
                        alert('복사에 실패했습니다. 링크를 수동으로 복사해주세요.');
                    });
                });
            });

            // 비활성화 버튼 이벤트
            inviteLinksList.querySelectorAll('.btn-deactivate').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('이 초대 링크를 비활성화하시겠습니까?')) return;

                    try {
                        await this.deactivateInviteLink(groupId, btn.dataset.linkId);
                        this.displayInviteLinks(groupId);
                        alert('초대 링크가 비활성화되었습니다.');
                    } catch (error) {
                        alert(error.message);
                    }
                });
            });
        } catch (error) {
            inviteLinksList.innerHTML = `<p style="color: red;">오류: ${error.message}</p>`;
        }
    }
};

// 초대 링크 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 초대 페이지 처리
    const path = window.location.pathname;
    if (path.startsWith('/invite/')) {
        const inviteCode = path.split('/invite/')[1];
        handleInvitePage(inviteCode);
        return;
    }

    if (!Auth.isAuthenticated()) return;

    const inviteLinkBtn = document.getElementById('inviteLinkBtn');
    const inviteLinkModal = document.getElementById('inviteLinkModal');
    const createInviteLinkBtn = document.getElementById('createInviteLinkBtn');
    const createInviteLinkModal = document.getElementById('createInviteLinkModal');
    const createInviteLinkForm = document.getElementById('createInviteLinkForm');
    const setExpiration = document.getElementById('setExpiration');
    const expirationHours = document.getElementById('expirationHours');
    const setMaxUses = document.getElementById('setMaxUses');
    const maxUses = document.getElementById('maxUses');

    // 초대 링크 버튼
    if (inviteLinkBtn) {
        inviteLinkBtn.addEventListener('click', () => {
            if (!Groups.currentGroupId) return;
            Invites.displayInviteLinks(Groups.currentGroupId);
            inviteLinkModal.style.display = 'flex';
        });
    }

    // 새 초대 링크 생성 버튼
    if (createInviteLinkBtn) {
        createInviteLinkBtn.addEventListener('click', () => {
            inviteLinkModal.style.display = 'none';
            createInviteLinkModal.style.display = 'flex';
        });
    }

    // 만료 시간 체크박스
    if (setExpiration) {
        setExpiration.addEventListener('change', (e) => {
            expirationHours.disabled = !e.target.checked;
        });
    }

    // 최대 사용 횟수 체크박스
    if (setMaxUses) {
        setMaxUses.addEventListener('change', (e) => {
            maxUses.disabled = !e.target.checked;
        });
    }

    // 초대 링크 생성 폼
    if (createInviteLinkForm) {
        createInviteLinkForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!Groups.currentGroupId) return;

            const expiresIn = setExpiration.checked ? parseInt(expirationHours.value) : null;
            const maxUsesValue = setMaxUses.checked ? parseInt(maxUses.value) : null;

            try {
                const inviteLink = await Invites.createInviteLink(Groups.currentGroupId, expiresIn, maxUsesValue);
                createInviteLinkModal.style.display = 'none';
                createInviteLinkForm.reset();
                setExpiration.checked = false;
                setMaxUses.checked = false;
                expirationHours.disabled = true;
                maxUses.disabled = true;

                alert('초대 링크가 생성되었습니다!\n\n' + inviteLink.url);

                Invites.displayInviteLinks(Groups.currentGroupId);
                inviteLinkModal.style.display = 'flex';
            } catch (error) {
                alert(error.message);
            }
        });
    }
});

// 초대 페이지 처리
async function handleInvitePage(inviteCode) {
    const authScreen = document.getElementById('authScreen');
    const appScreen = document.getElementById('appScreen');
    const inviteScreen = document.getElementById('inviteScreen');
    const inviteInfo = document.getElementById('inviteInfo');
    const acceptInviteBtn = document.getElementById('acceptInviteBtn');
    const inviteMessage = document.getElementById('inviteMessage');

    authScreen.style.display = 'none';
    appScreen.style.display = 'none';
    inviteScreen.style.display = 'flex';

    try {
        const groupInfo = await Invites.getGroupByInviteCode(inviteCode);

        inviteInfo.innerHTML = `
            <h3>${escapeHtml(groupInfo.groupName)}</h3>
            <p><strong>설명:</strong> ${escapeHtml(groupInfo.groupDescription || '설명 없음')}</p>
            <p><strong>관리자:</strong> ${escapeHtml(groupInfo.ownerName)}</p>
            <p><strong>멤버 수:</strong> ${groupInfo.memberCount}명</p>
        `;

        acceptInviteBtn.addEventListener('click', async () => {
            if (!Auth.isAuthenticated()) {
                inviteMessage.textContent = '로그인이 필요합니다.';
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
                return;
            }

            try {
                await Invites.joinGroupByInvite(inviteCode);
                alert('그룹에 가입했습니다!');
                window.location.href = '/';
            } catch (error) {
                inviteMessage.textContent = error.message;
            }
        });
    } catch (error) {
        inviteInfo.innerHTML = `<p style="color: red;">${error.message}</p>`;
        acceptInviteBtn.style.display = 'none';
    }
}

