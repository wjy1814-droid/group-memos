// API 엔드포인트 설정
const API_URL = '/api/memos';

// 전역 변수
let editingMemoId = null;

// DOM 요소
const memoInput = document.getElementById('memoInput');
const addMemoBtn = document.getElementById('addMemoBtn');
const cancelBtn = document.getElementById('cancelBtn');
const memoContainer = document.getElementById('memoContainer');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadMemos();
    
    // 이벤트 리스너
    addMemoBtn.addEventListener('click', handleAddOrUpdateMemo);
    cancelBtn.addEventListener('click', handleCancelEdit);
    
    // Enter 키로 메모 추가 (Shift+Enter는 줄바꿈)
    memoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddOrUpdateMemo();
        }
    });
});

// 메모 불러오기
async function loadMemos() {
    try {
        const response = await fetch(API_URL);
        const memos = await response.json();
        
        displayMemos(memos);
    } catch (error) {
        console.error('메모 불러오기 실패:', error);
        // 서버 연결 실패 시 로컬 모드로 전환
        displayEmptyState();
    }
}

// 메모 표시
function displayMemos(memos) {
    memoContainer.innerHTML = '';
    
    if (memos.length === 0) {
        displayEmptyState();
        return;
    }
    
    memos.forEach(memo => {
        const memoElement = createMemoElement(memo);
        memoContainer.appendChild(memoElement);
    });
}

// 빈 상태 표시
function displayEmptyState() {
    memoContainer.innerHTML = `
        <div class="empty-state">
            ☁️ 첫 메모를 작성해보세요! ☁️
        </div>
    `;
}

// 메모 요소 생성
function createMemoElement(memo) {
    const memoDiv = document.createElement('div');
    memoDiv.className = 'memo-cloud';
    memoDiv.dataset.id = memo.id;
    
    const formattedDate = formatDate(memo.created_at || new Date());
    
    memoDiv.innerHTML = `
        <div class="memo-content" id="content-${memo.id}">${escapeHtml(memo.content)}</div>
        <textarea class="memo-edit-input" id="edit-${memo.id}" style="display: none;">${memo.content}</textarea>
        <div class="memo-date">${formattedDate}</div>
        <div class="memo-actions" id="actions-${memo.id}">
            <button class="memo-btn btn-edit" onclick="startEdit(${memo.id})">수정</button>
            <button class="memo-btn btn-delete" onclick="deleteMemo(${memo.id})">삭제</button>
        </div>
        <div class="memo-actions" id="edit-actions-${memo.id}" style="display: none;">
            <button class="memo-btn btn-save" onclick="saveEdit(${memo.id})">저장</button>
            <button class="memo-btn btn-cancel-edit" onclick="cancelEdit(${memo.id})">취소</button>
        </div>
    `;
    
    return memoDiv;
}

// 메모 추가 또는 수정
async function handleAddOrUpdateMemo() {
    const content = memoInput.value.trim();
    
    if (!content) {
        alert('메모 내용을 입력해주세요!');
        return;
    }
    
    if (editingMemoId) {
        // 수정 모드
        await updateMemo(editingMemoId, content);
        editingMemoId = null;
        addMemoBtn.textContent = '메모 추가';
        cancelBtn.style.display = 'none';
    } else {
        // 추가 모드
        await createMemo(content);
    }
    
    memoInput.value = '';
    memoInput.focus();
}

// 메모 생성
async function createMemo(content) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            await loadMemos();
        } else {
            throw new Error('메모 생성 실패');
        }
    } catch (error) {
        console.error('메모 생성 에러:', error);
        alert('메모 생성에 실패했습니다. 서버 연결을 확인해주세요.');
    }
}

// 메모 수정 시작
function startEdit(id) {
    const contentDiv = document.getElementById(`content-${id}`);
    const editInput = document.getElementById(`edit-${id}`);
    const actions = document.getElementById(`actions-${id}`);
    const editActions = document.getElementById(`edit-actions-${id}`);
    
    contentDiv.style.display = 'none';
    editInput.style.display = 'block';
    actions.style.display = 'none';
    editActions.style.display = 'flex';
    
    editInput.focus();
}

// 메모 수정 취소
function cancelEdit(id) {
    const contentDiv = document.getElementById(`content-${id}`);
    const editInput = document.getElementById(`edit-${id}`);
    const actions = document.getElementById(`actions-${id}`);
    const editActions = document.getElementById(`edit-actions-${id}`);
    
    contentDiv.style.display = 'block';
    editInput.style.display = 'none';
    actions.style.display = 'flex';
    editActions.style.display = 'none';
}

// 메모 수정 저장
async function saveEdit(id) {
    const editInput = document.getElementById(`edit-${id}`);
    const newContent = editInput.value.trim();
    
    if (!newContent) {
        alert('메모 내용을 입력해주세요!');
        return;
    }
    
    await updateMemo(id, newContent);
}

// 메모 업데이트
async function updateMemo(id, content) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            await loadMemos();
        } else {
            throw new Error('메모 수정 실패');
        }
    } catch (error) {
        console.error('메모 수정 에러:', error);
        alert('메모 수정에 실패했습니다.');
    }
}

// 메모 삭제
async function deleteMemo(id) {
    if (!confirm('이 메모를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadMemos();
        } else {
            throw new Error('메모 삭제 실패');
        }
    } catch (error) {
        console.error('메모 삭제 에러:', error);
        alert('메모 삭제에 실패했습니다.');
    }
}

// 수정 취소 (상단 입력칸)
function handleCancelEdit() {
    editingMemoId = null;
    memoInput.value = '';
    addMemoBtn.textContent = '메모 추가';
    cancelBtn.style.display = 'none';
}

// 날짜 포맷팅
function formatDate(dateString) {
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

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

