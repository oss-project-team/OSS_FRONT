/* ============================================================
   📌 페이지 기록 스택 저장
============================================================ */
let historyStack = JSON.parse(localStorage.getItem("historyStack")) || [];

let current = window.location.pathname;

// 중복 push 방지
if(historyStack[historyStack.length-1] !== current){
    historyStack.push(current);
    localStorage.setItem("historyStack", JSON.stringify(historyStack));
}

/* ============================================================
   🔥 알림 목록 API에서 불러오기
============================================================ */
async function loadAlerts() {
    const noticeList = document.querySelector(".notice-list");
    if (!noticeList) return;

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        console.log('로그인이 필요합니다.');
        return;
    }

    try {
        const response = await fetch('https://chajabat.onrender.com/api/v1/alerts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const alerts = await response.json();
            renderAlerts(alerts);
        } else if (response.status === 404) {
            // 백엔드에 알림 API가 없는 경우 빈 목록 표시
            console.log('알림 API가 아직 구현되지 않았습니다.');
            renderAlerts([]);
        } else {
            console.error('알림 로드 실패:', response.status);
            // API 실패 시 빈 목록 표시
            renderAlerts([]);
        }
    } catch (error) {
        console.error('알림 로드 오류:', error);
        // 에러 발생 시 빈 목록 표시
        renderAlerts([]);
    }
}

/* ============================================================
   알림 목록 렌더링
============================================================ */
async function renderAlerts(alerts) {
    const noticeList = document.querySelector(".notice-list");
    if (!noticeList) return;

    // 게시글 정보를 가져오기 위해 각 알림의 post_id로 게시글 조회
    const alertsWithPostInfo = await Promise.all(
        alerts.map(async (alert) => {
            try {
                const postResponse = await fetch(`https://chajabat.onrender.com/api/v1/posts/${alert.post_id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (postResponse.ok) {
                    const post = await postResponse.json();
                    return { ...alert, post };
                }
            } catch (error) {
                console.error('게시글 로드 오류:', error);
            }
            return alert;
        })
    );

    if (alertsWithPostInfo.length === 0) {
        noticeList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                알림이 없습니다.
            </div>
        `;
        return;
    }

    noticeList.innerHTML = alertsWithPostInfo.map(alert => {
        const post = alert.post;
        const isRead = alert.seen;
        const date = new Date(alert.created_at).toLocaleDateString('ko-KR');
        
        return `
            <div class="notice-card notice-item" data-type="keyword" data-read="${isRead}" data-post-id="${alert.post_id}">
                <div class="notice-header">
                    ${!isRead ? '<span class="unread-dot"></span>' : ''}
                    <span class="tag keyword">키워드</span>
                    <div class="notice-title">${post ? post.title : '게시글'}</div>
                    <div class="notice-date">${date}</div>
                </div>
                <div class="notice-content">
                    관심 키워드와 관련된 게시글이 등록되었습니다.<br><br>
                    <button class="msg-btn" onclick="viewPost(${alert.post_id}, '${post ? post.type : 'Found'}')">게시글 보기</button>
                </div>
            </div>
        `;
    }).join('');
    
    // 동적으로 생성된 요소에 아코디언 이벤트 바인딩
    document.querySelectorAll(".notice-item").forEach(item=>{
        const header = item.querySelector(".notice-header");
        if (header && !header.hasAttribute('data-bound')) {
            header.setAttribute('data-bound', 'true');
            header.addEventListener("click",()=>{
                item.classList.toggle("open");
                if(item.dataset.read==="false") {
                    item.dataset.read="true";
                    // 읽음 처리 API 호출
                    markAlertAsRead(item.dataset.postId);
                }
            });
        }
    });
}

/* ============================================================
   알림 읽음 처리
============================================================ */
async function markAlertAsRead(postId) {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;

    try {
        const response = await fetch(`https://chajabat.onrender.com/api/v1/alerts/${postId}/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            // 읽음 처리 후 모든 알림이 읽었는지 확인
            checkAllAlertsRead();
        }
    } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
    }
}

/* ============================================================
   모든 알림 읽음 확인 및 홈 페이지 배지 업데이트
============================================================ */
async function checkAllAlertsRead() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;
    
    try {
        const response = await fetch('https://chajabat.onrender.com/api/v1/alerts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const alerts = await response.json();
            const unreadCount = alerts.filter(alert => !alert.seen).length;
            
            // 모든 알림을 읽었으면 localStorage에 플래그 설정
            if (unreadCount === 0) {
                localStorage.setItem('allAlertsRead', 'true');
            } else {
                localStorage.setItem('allAlertsRead', 'false');
            }
        }
    } catch (error) {
        console.error('알림 읽음 확인 오류:', error);
    }
}

/* ============================================================
   게시글 보기
============================================================ */
function viewPost(postId, postType) {
    if (postType === 'Lost') {
        window.location.href = `../detail_lost/detail_lost.html?id=${postId}`;
    } else {
        window.location.href = `../detail/detail.html?id=${postId}`;
    }
}

// 전역 함수로 등록
window.viewPost = viewPost;


/* ============================================================
   📌 🔙 뒤로가기 버튼
   (pop()을 1번만 사용하여 prev 유지)
============================================================ */
document.querySelector(".back-btn").addEventListener("click",()=>{

    let stack = JSON.parse(localStorage.getItem("historyStack")) || [];

    stack.pop();                              // 현재 페이지 제거
    const prev = stack[stack.length-1];        // pop 없이 마지막 요소 확인

    localStorage.setItem("historyStack", JSON.stringify(stack));

    if(prev) window.location.href = prev;      
    else window.location.href = "../home/home.html"; // fallback
});


/* ============================================================
   📌 아코디언 + 읽음 처리
============================================================ */
document.querySelectorAll(".notice-item").forEach(item=>{
    item.querySelector(".notice-header").addEventListener("click",()=>{
        item.classList.toggle("open");
        if(item.dataset.read==="false") item.dataset.read="true";
    });
});


/* ============================================================
   ⭐ 종 아이콘 ON/OFF (contact와 동일)
============================================================ */
const noticeBell=document.getElementById("noticeBell");
if (noticeBell) {
let alarm=true;
noticeBell.onclick=()=>{
    alarm = !alarm;
    noticeBell.textContent = alarm ? "notifications" : "notifications_off";
    noticeBell.classList.toggle("off", !alarm);
};
}


/* ============================================================
   🔥 공지 타입이 message인 경우 → contact로 이동
============================================================ */
document.querySelectorAll(".notice-item[data-type='message'] .msg-btn")
.forEach(btn=>{
    btn.addEventListener("click",()=>{
        let stack = JSON.parse(localStorage.getItem("historyStack")) || [];
        stack.push(window.location.pathname);       // notice 저장후 이동
        localStorage.setItem("historyStack", JSON.stringify(stack));

        window.location.href="../contact/contact.html";
    });
});


/* ============================================================
   ⚙️ 설정 페이지 이동
============================================================ */
document.querySelector(".settings-icon").addEventListener("click", () => {
    let stack = JSON.parse(localStorage.getItem("historyStack")) || [];
    stack.push(window.location.pathname);
    localStorage.setItem("historyStack", JSON.stringify(stack));

    window.location.href = "../settings/settings.html";
});


/* ============================================================
   페이지 로드 시 알림 불러오기
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    loadAlerts();
    
    // 아코디언 이벤트는 동적으로 생성된 요소에도 적용되도록 수정
    // renderAlerts 후에 다시 바인딩
});
