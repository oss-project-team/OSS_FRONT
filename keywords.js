// 키워드 목록
let keywords = [];

// DOM 요소
const keywordInput = document.getElementById('keywordInput');
const addBtn = document.getElementById('addBtn');
const keywordsList = document.getElementById('keywordsList');
const emptyState = document.getElementById('emptyState');
const keywordCount = document.getElementById('keywordCount');
const backBtn = document.getElementById('backBtn');

// 뒤로가기
backBtn.addEventListener('click', () => {
    window.location.href = '../mypage/mypage.html';
});

// 입력 필드 변경 시 추가 버튼 활성화
keywordInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (value.length > 0 && keywords.length < 5) {
        addBtn.classList.add('active');
    } else {
        addBtn.classList.remove('active');
    }
});

// Enter 키로 추가
keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addBtn.click();
    }
});

// 키워드 추가
addBtn.addEventListener('click', async () => {
    const keyword = keywordInput.value.trim();
    
    if (!keyword) {
        alert('키워드를 입력해주세요.');
        return;
    }
    
    if (keywords.length >= 5) {
        alert('키워드는 최대 5개까지 등록할 수 있습니다.');
        return;
    }
    
    if (keywords.some(k => k.keyword === keyword)) {
        alert('이미 등록된 키워드입니다.');
        return;
    }
    
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        alert('로그인이 필요합니다.');
        window.location.href = '../login/login.html';
        return;
    }
    
    addBtn.disabled = true;
    addBtn.textContent = '추가 중...';
    
    try {
        const response = await fetch('https://chajabat.onrender.com/api/v1/keywords', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ keyword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            keywords.push(data);
            keywordInput.value = '';
            addBtn.classList.remove('active');
            renderKeywords();
            updateCount();
        } else {
            alert(data.error || '키워드 추가에 실패했습니다.');
        }
    } catch (error) {
        console.error('키워드 추가 오류:', error);
        alert('키워드 추가 중 오류가 발생했습니다.');
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = '추가';
    }
});

// 키워드 삭제
async function deleteKeyword(keywordId) {
    if (!confirm('이 키워드를 삭제하시겠습니까?')) {
        return;
    }
    
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    try {
        const response = await fetch(`https://chajabat.onrender.com/api/v1/keywords/${keywordId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            keywords = keywords.filter(k => k.id !== keywordId);
            renderKeywords();
            updateCount();
        } else {
            const data = await response.json();
            alert(data.error || '키워드 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('키워드 삭제 오류:', error);
        alert('키워드 삭제 중 오류가 발생했습니다.');
    }
}

// 키워드 목록 렌더링
function renderKeywords() {
    if (keywords.length === 0) {
        emptyState.classList.remove('hidden');
        keywordsList.innerHTML = '';
        keywordsList.appendChild(emptyState);
    } else {
        emptyState.classList.add('hidden');
        keywordsList.innerHTML = '';
        
        keywords.forEach(keyword => {
            const item = document.createElement('div');
            item.className = 'keyword-item';
            item.innerHTML = `
                <span class="keyword-text">${keyword.keyword}</span>
                <button class="delete-btn" onclick="deleteKeyword(${keyword.id})">
                    <i class="material-icons">close</i>
                </button>
            `;
            keywordsList.appendChild(item);
        });
    }
}

// 카운트 업데이트
function updateCount() {
    keywordCount.textContent = keywords.length;
    
    // 5개 도달 시 입력 필드 비활성화
    if (keywords.length >= 5) {
        keywordInput.disabled = true;
        keywordInput.placeholder = '최대 5개까지 등록 가능합니다.';
        addBtn.classList.remove('active');
    } else {
        keywordInput.disabled = false;
        keywordInput.placeholder = '알림 받을 키워드 입력';
    }
}

// 키워드 목록 로드
async function loadKeywords() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        alert('로그인이 필요합니다.');
        window.location.href = '../login/login.html';
        return;
    }
    
    try {
        const response = await fetch('https://chajabat.onrender.com/api/v1/keywords', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            keywords = await response.json();
            renderKeywords();
            updateCount();
        } else {
            console.error('키워드 로드 실패:', response.status);
        }
    } catch (error) {
        console.error('키워드 로드 오류:', error);
    }
}

// 페이지 로드 시 키워드 목록 불러오기
document.addEventListener('DOMContentLoaded', () => {
    loadKeywords();
});

