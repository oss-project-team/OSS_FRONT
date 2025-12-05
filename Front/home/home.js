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
// 🔥 카드 렌더링
// ===============================
function renderCards() {

    const cardList = document.getElementById("cardList");
    if (!cardList) return;

    // 최신 데이터 불러오기
    foundPosts = JSON.parse(localStorage.getItem("foundPosts")) || [];
    lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];

    cardList.innerHTML = "";

    let targetPosts = (boardType === "Found" ? foundPosts : lostPosts)
        .filter(post => !showOnlyInProgress || !post.solved)
        .filter(post => selectedCategory === "전체" || post.category === selectedCategory);

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
        // 🔥 Lost는 detail_lost로 이동
        window.location.href = `../detail_lost/detail_lost.html?id=${post.id}`;
    } else {
        // 🔥 Found는 기존 detail로 이동
        window.location.href = `../detail/detail.html?id=${post.id}`;
    }
});


        cardList.appendChild(card);
    });
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
});



/* ================== 🔔 notice 이동 ================== */
const noticeBtn = document.querySelector(".notification-btn");
if(noticeBtn){
    noticeBtn.addEventListener("click", ()=>{
        pushHistory();    // ← 추가됨
        window.location.href = "../notice/notice.html";
    });
}

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
