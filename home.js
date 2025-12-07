// ===============================
// 🔥 홈 데이터 및 초기값
// ===============================
let boardType = "Found";
let selectedCategory = "전체";
let showOnlyInProgress = false;

// Found/Lost 각각 저장 구조
let foundPosts = JSON.parse(localStorage.getItem("foundPosts")) || [];
let lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];

// ===============================
// 📌 공통 함수 : 현재 페이지를 historyStack에 저장
// ===============================
function pushHistory() {
    let stack = JSON.parse(localStorage.getItem("historyStack")) || [];
    const now = window.location.pathname;

    if(stack[stack.length-1] !== now){
        stack.push(now);
        localStorage.setItem("historyStack", JSON.stringify(stack));
    }
}

// 첫 진입 시 스택에 push
pushHistory();


// ===============================
// 🔥 카드 렌더링 (API 연동)
// ===============================
async function renderCards() {
    const cardList = document.getElementById("cardList");
    if (!cardList) return;

    cardList.innerHTML = "<div style='text-align:center; padding:20px;'>로딩 중...</div>";

    try {
        // API에서 게시글 목록 가져오기
        const params = new URLSearchParams({
            type: boardType === "Found" ? "Found" : "Lost",
            sort: 'latest'
        });
        
        if (selectedCategory !== "전체") {
            params.append('category', selectedCategory);
        }
        
        if (showOnlyInProgress) {
            params.append('status', 'Waiting');
        }

        const response = await fetch(`https://chajabat.onrender.com/api/v1/posts?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        let targetPosts = [];

        if (response.ok) {
            const data = await response.json();
            targetPosts = data.items || data || [];
            
            // API 데이터를 localStorage 형식으로 변환하여 저장 (fallback)
            const convertedPosts = targetPosts.map(post => ({
                id: post.id,
                title: post.title,
                description: post.content || post.description,
                category: post.category,
                place: post.location,
                date: post.lost_date || post.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                img: post.images && post.images.length > 0 ? post.images[0] : null,
                solved: post.status === 'Completed',
                author: post.author_nickname || post.author || post.author_email || ''
            }));

            if (boardType === "Found") {
                localStorage.setItem("foundPosts", JSON.stringify(convertedPosts));
            } else {
                localStorage.setItem("lostPosts", JSON.stringify(convertedPosts));
            }
        } else {
            // API 실패 시 localStorage에서 로드 (fallback)
    foundPosts = JSON.parse(localStorage.getItem("foundPosts")) || [];
    lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];
            targetPosts = (boardType === "Found" ? foundPosts : lostPosts)
                .filter(post => !showOnlyInProgress || !post.solved)
                .filter(post => selectedCategory === "전체" || post.category === selectedCategory);
        }

    cardList.innerHTML = "";

        if (targetPosts.length === 0) {
            cardList.innerHTML = "<div style='text-align:center; padding:20px; color:#777;'>게시글이 없습니다.</div>";
            return;
        }

        targetPosts.sort((a, b) => {
            const aId = a.id || 0;
            const bId = b.id || 0;
            return bId - aId;
        });

        targetPosts.forEach(post => {
            const card = document.createElement("div");
            card.className = "card";

            const postDate = post.lost_date || post.date || post.created_at?.split('T')[0] || '';
            const postPlace = post.location || post.place || '';
            const postImage = (post.images && post.images.length > 0) ? post.images[0] : (post.img || null);

            card.innerHTML = `
                ${postImage ? `<img class="card-image" src="${postImage}">` : `<div class="card-placeholder">이미지 없음</div>`}
                <div class="card-content">
                    <div class="card-title">${post.title}</div>
                    <div class="card-date">${postDate}</div>
                    <div class="card-place">${postPlace}</div>
                </div>
            `;

            card.addEventListener("click", () => {
                if(boardType === "Lost") {
                    window.location.href = `../detail_lost/detail_lost.html?id=${post.id}`;
                } else {
                    window.location.href = `../detail/detail.html?id=${post.id}`;
                }
            });

            cardList.appendChild(card);
        });
    } catch (error) {
        console.error('게시글 목록 로드 오류:', error);
        // 에러 발생 시 localStorage에서 로드 (fallback)
        foundPosts = JSON.parse(localStorage.getItem("foundPosts")) || [];
        lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];

    let targetPosts = (boardType === "Found" ? foundPosts : lostPosts)
        .filter(post => !showOnlyInProgress || !post.solved)
        .filter(post => selectedCategory === "전체" || post.category === selectedCategory);

        cardList.innerHTML = "";

        if (targetPosts.length === 0) {
            cardList.innerHTML = "<div style='text-align:center; padding:20px; color:#777;'>게시글이 없습니다.</div>";
            return;
        }

    targetPosts.sort((a, b) => (b.id || 0) - (a.id || 0));

    targetPosts.forEach(post => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            ${post.img ? `<img class="card-image" src="${post.img}">` : `<div class="card-placeholder">이미지 없음</div>`}
            <div class="card-content">
                <div class="card-title">${post.title}</div>
                <div class="card-date">${post.date}</div>
                <div class="card-place">${post.place}</div>
            </div>
        `;

        card.addEventListener("click", () => {
    if(boardType === "Lost") {
        window.location.href = `../detail_lost/detail_lost.html?id=${post.id}`;
    } else {
        window.location.href = `../detail/detail.html?id=${post.id}`;
    }
});

        cardList.appendChild(card);
    });
    }
}



// ===============================
// 🔥 DOM 로드 및 이벤트 등록
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get("type");
    if (typeParam === "Lost") {
        boardType = "Lost";
        const foundTab = document.getElementById("foundTab");
        if (foundTab) foundTab.innerHTML = `분실했어요! <i class="material-icons expand-icon">expand_less</i>`;
    }

    const searchBtn = document.querySelector(".search-btn");
    if (searchBtn) searchBtn.addEventListener("click", () => { pushHistory(); window.location.href = "../search/search.html"; });

    document.querySelectorAll(".category").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".category").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedCategory = btn.textContent.trim();
            renderCards();
        });
    });

    const toggle = document.getElementById("toggleSolved");
    if (toggle) toggle.addEventListener("change", () => { showOnlyInProgress = toggle.checked; renderCards(); });

    const foundTab = document.getElementById("foundTab");
    if (foundTab) foundTab.addEventListener("click", () => {

        boardType = (boardType === "Found" ? "Lost" : "Found");
        foundTab.innerHTML = boardType === "Found" ? `찾았어요! <i class="material-icons expand-icon">expand_more</i>` : `분실했어요! <i class="material-icons expand-icon">expand_less</i>`;

        selectedCategory = "전체";
        document.querySelectorAll(".category").forEach((c,i)=>{ if(i===0)c.classList.add("active"); else c.classList.remove("active"); });
        renderCards();
    });

    const writeBtn = document.querySelector(".write-btn");
    if (writeBtn) writeBtn.addEventListener("click", () => { pushHistory(); window.location.href = boardType==="Found" ? "../createfind/createfind.html" : "../createlost/createlost.html"; });

    renderCards();
    
    // 알림 배지 업데이트
    updateNotificationBadge();
});



/* ================== 🔔 알림 배지 업데이트 ================== */
async function updateNotificationBadge() {
    const badge = document.querySelector(".notification-badge");
    if (!badge) return;
    
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        badge.style.display = 'none';
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
            // 읽지 않은 알림 개수 확인
            const unreadCount = alerts.filter(alert => !alert.seen).length;
            
            if (unreadCount > 0) {
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        } else if (response.status === 404) {
            // 알림 API가 없는 경우 배지 숨김
            badge.style.display = 'none';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('알림 배지 업데이트 오류:', error);
        badge.style.display = 'none';
    }
}

/* ================== 🔔 notice 이동 ================== */
const noticeBtn = document.querySelector(".notification-btn");
if(noticeBtn){
    noticeBtn.addEventListener("click", ()=>{
        pushHistory();    // ← 추가됨
        window.location.href = "../notice/notice.html";
    });
}

/* ================== 🔔 페이지 포커스 시 알림 배지 업데이트 ================== */
// 다른 페이지에서 돌아왔을 때 알림 배지 업데이트
window.addEventListener('focus', () => {
    updateNotificationBadge();
});

// 페이지가 보일 때마다 알림 배지 업데이트
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateNotificationBadge();
    }
});

/* ================== ⚙ settings 이동 ================== */
document.querySelectorAll(".icon-btn.settings-btn")?.forEach(btn=>{
    btn.addEventListener("click", ()=>{
        pushHistory();    // ← contact처럼 동일 적용
        window.location.href = "../settings/settings.html";
    });
});

/* ================== 하단 네비 이동 ================== */
document.querySelectorAll(".bottom-nav .nav-item").forEach(item=>{
    item.onclick=()=>{
        const label=item.querySelector(".nav-label").textContent;

        pushHistory(); // 이동 전 기록 필수

        if(label==="홈") window.location.href="home.html";
        if(label==="쪽지함") window.location.href="../contact/contact.html";
        if(label==="마이페이지") window.location.href="../mypage/mypage.html";
    };
});
