/* ================================
   저장 데이터
================================ */
let CURRENT_PASSWORD = "123456";
let SAVED_PATTERN = null;
let tempPattern = [];
let inquiryList = [];
let inquiryEditingIndex = null;

/* ================================
   페이지 캐싱
================================ */
const pages = {
    main: document.getElementById("settingsMain"),
    pw: document.getElementById("passwordCheckPage"),
    method: document.getElementById("loginMethodPage"),
    pwChange: document.getElementById("passwordChangePage"),
    pattern1: document.getElementById("patternSetPage"),
    pattern2: document.getElementById("patternConfirmPage"),
    withdraw: document.getElementById("withdrawPage"),
    supportMain: document.getElementById("supportMainPage"),
    inquiryWrite: document.getElementById("inquiryWritePage"),
    inquiryList: document.getElementById("inquiryListPage"),
    terms: document.getElementById("termsPage"),
    privacy: document.getElementById("privacyPage")
};

/* ================================
   공용 함수
================================ */
function hideAll() {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
}

function clearInputs() {
    document.querySelectorAll("input").forEach(i => {
        if (i.type === "password" || i.type === "text") i.value = "";
        if (i.type === "checkbox" || i.type === "radio") i.checked = false;
    });

    document.querySelectorAll("textarea").forEach(t => t.value = "");
    document.querySelectorAll(".error-msg").forEach(e => e.textContent = "");
}

/* ================================
   메인 페이지
================================ */
function showMain() {
    hideAll();
    pages.main.classList.add("active");

    document.querySelectorAll(".noti-toggle").forEach(t => t.checked = true);

    clearInputs();
}

function goBackFromSettings() {
    history.back();
}

/* ================================
   팝업
================================ */
function showPopup(msg, callback = null) {
    const modal = document.getElementById("popupModal");
    const msgBox = document.getElementById("popupMsg");

    msgBox.innerHTML = `
        ${msg}
        <br><br>
        <button class="modal-btn" id="popupConfirm">확인</button>
    `;

    modal.classList.remove("hidden");

    document.getElementById("popupConfirm").onclick = () => {
        modal.classList.add("hidden");
        if (callback) callback();
    };
}

/* ================================
   로그인 방식 변경
================================ */
function openPwCheckPage() {
    hideAll();
    pages.pw.classList.add("active");
}

function showPwCheck() {
    hideAll();
    pages.pw.classList.add("active");
}

function goLoginMethod() {
    const inputPw = document.getElementById("pwInput").value;
    const err = document.getElementById("pwErrorBox");

    if (inputPw !== CURRENT_PASSWORD) {
        err.textContent = "비밀번호가 일치하지 않습니다.";
        return;
    }
    hideAll();
    pages.method.classList.add("active");
}

/* ================================
   비밀번호 변경
================================ */
function openPwChangePage() {
    hideAll();
    pages.pwChange.classList.add("active");
}

function goBackToMethodPage() {
    hideAll();
    pages.method.classList.add("active");
}

function changePassword() {
    const pw1 = document.getElementById("newPw").value;
    const pw2 = document.getElementById("newPwCheck").value;
    const err = document.getElementById("pwChangeError");

    if (pw1.length < 6) {
        err.textContent = "비밀번호는 6자 이상이어야 합니다.";
        return;
    }
    if (pw1 !== pw2) {
        err.textContent = "비밀번호가 일치하지 않습니다.";
        return;
    }

    CURRENT_PASSWORD = pw1;
    showPopup("비밀번호가 변경되었습니다.", showMain);
}

/* ========================================================= */
/*         🔥 패턴 설정 + 드래그 + 선 따라가는 기능          */
/* ========================================================= */

/* 패턴 페이지 이동 */
function openPatternSetPage() {
    hideAll();
    pages.pattern1.classList.add("active");
    initPatternPage("patternGrid1", "patternCanvas1", handlePatternFirstInput);
}

function handlePatternFirstInput(pattern) {
    tempPattern = pattern;

    hideAll();
    pages.pattern2.classList.add("active");

    initPatternPage("patternGrid2", "patternCanvas2", handlePatternSecondInput);
}

function handlePatternSecondInput(pattern) {
    if (JSON.stringify(pattern) !== JSON.stringify(tempPattern)) {
        document.getElementById("patternError2").textContent = "패턴이 일치하지 않습니다.";
        return;
    }

    SAVED_PATTERN = pattern;
    tempPattern = [];

    /* 🔥 패턴 완료 시 패턴 화면 감추고 메인으로 */
    hideAll();
    pages.main.classList.add("active");

    showPopup("패턴이 설정되었습니다.", showMain);
}

/* 패턴 드래그 처리 함수 */
function initPatternPage(gridId, canvasId, onComplete) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = "";

    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");

    let dots = [];
    let pattern = [];
    let dragging = false;

    for (let i = 1; i <= 9; i++) {
        const dot = document.createElement("div");
        dot.classList.add("pattern-dot");
        dot.dataset.value = i;

        grid.appendChild(dot);
        dots.push(dot);
    }

    function getDotCenter(dot) {
        const r = dot.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    grid.addEventListener("touchstart", e => startDrag(e.touches[0]));
    grid.addEventListener("mousedown", startDrag);

    function startDrag(e) {
        dragging = true;
        pattern = [];

        dots.forEach(d => d.classList.remove("selected"));
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        handleMove(e);
    }

    window.addEventListener("touchmove", e => dragging && handleMove(e.touches[0]));
    window.addEventListener("mousemove", e => dragging && handleMove(e));

    function handleMove(e) {
        dots.forEach(dot => {
            const box = dot.getBoundingClientRect();
            if (e.clientX > box.left && e.clientX < box.right && e.clientY > box.top && e.clientY < box.bottom) {
                const val = parseInt(dot.dataset.value);
                if (!pattern.includes(val)) {
                    pattern.push(val);
                    dot.classList.add("selected");
                }
            }
        });

        drawLines(e);
    }

    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (pattern.length >= 4) onComplete(pattern);
    }

    function drawLines(e) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#4b8caf";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";

        ctx.beginPath();
        pattern.forEach((val, i) => {
            const center = getDotCenter(dots[val - 1]);
            if (i === 0) ctx.moveTo(center.x, center.y);
            else ctx.lineTo(center.x, center.y);
        });

        if (dragging && pattern.length > 0) ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
    }
}

/* ================================
   로그아웃
================================ */
function openLogoutConfirm() {
    const modal = document.getElementById("popupModal");
    const msg = document.getElementById("popupMsg");

    msg.innerHTML = `
        정말로 로그아웃 하시겠습니까?<br><br>
        <button class="modal-btn" id="logoutYes" style="margin-bottom:10px;">확인</button>
        <button class="modal-btn" id="logoutNo" style="background:#aaa;">취소</button>
    `;

    modal.classList.remove("hidden");

    // 🔥 1단계: 로그아웃 확인 클릭 시
    document.getElementById("logoutYes").onclick = () => {
        modal.classList.add("hidden");
        
        // ⭐ 2단계 팝업 실행 (확인 후 login으로 이동)
        showPopup("로그아웃 되었습니다.", () => {
            localStorage.clear(); // 로그인 정보 삭제(선택)
            window.location.href = "../login/login.html"; // 최종 이동
        });
    };

    document.getElementById("logoutNo").onclick = () => {
        modal.classList.add("hidden");
    };
}



/* ================================
   회원탈퇴
================================ */
function openWithdrawPage() {
    hideAll();
    clearInputs();
    document.getElementById("etcInput").style.display = "none";
    pages.withdraw.classList.add("active");
}

function tryWithdraw() {
    const agree = document.getElementById("withdrawAgree");
    const selected = document.querySelector("input[name='reason']:checked");
    const etcBox = document.getElementById("etcInput");

    const err1 = document.getElementById("withdrawError");
    const err2 = document.getElementById("reasonError");

    err1.textContent = "";
    err2.textContent = "";

    if (!agree.checked) {
        err1.textContent = "약관에 동의해야 합니다.";
        return;
    }
    if (!selected) {
        err2.textContent = "탈퇴 이유를 선택하세요.";
        return;
    }
    if (selected.value === "기타" && etcBox.value.trim() === "") {
        err2.textContent = "기타 이유를 입력해주세요.";
        return;
    }

    const modal = document.getElementById("popupModal");
    const msg = document.getElementById("popupMsg");

    msg.innerHTML = `
        정말로 탈퇴하시겠습니까?<br><br>
        <button class="modal-btn" id="withdrawYes" style="margin-bottom:10px;">확인</button>
        <button class="modal-btn" id="withdrawNo" style="background:#aaa;">취소</button>
    `;

    modal.classList.remove("hidden");

    document.getElementById("withdrawYes").onclick = () => {
        modal.classList.add("hidden");
        showPopup("회원탈퇴가 완료되었습니다.", showMain);
    };

    document.getElementById("withdrawYes").onclick = () => {
    modal.classList.add("hidden");
    localStorage.clear(); // 🔥 로그인 정보 제거해도 좋음

    // 회원탈퇴 완료 메시지 띄우고 로그인 화면으로 이동
    showPopup("회원탈퇴가 완료되었습니다.", () => {
        window.location.href = "../login/login.html";  // ⭐ 로그인 페이지로 이동
    });
};
}

/* 🔥 기타 선택 시 직접 작성칸 표시 */
document.addEventListener("change", (e) => {
    if (e.target.name === "reason") {
        const etcInput = document.getElementById("etcInput");
        if (e.target.id === "reasonEtc" || e.target.id === "etcRadio") {
            etcInput.style.display = "block";
        } else {
            etcInput.style.display = "none";
        }
    }
});

/* ================================
   문의하기
================================ */
function openSupportMainPage() {
    hideAll();
    pages.supportMain.classList.add("active");
}

function openInquiryWritePage() {
    hideAll();
    clearInputs();
    inquiryEditingIndex = null;

    document.getElementById("customCategory").style.display = "none";
    pages.inquiryWrite.classList.add("active");
}

function onCategoryChange() {
    const cat = document.getElementById("inqCategory").value;
    const etcInput = document.getElementById("customCategory");
    etcInput.style.display = (cat === "기타") ? "block" : "none";
}

function submitInquiry() {
    const title = document.getElementById("inqTitle").value.trim();
    let category = document.getElementById("inqCategory").value;
    const etc = document.getElementById("customCategory").value.trim();
    const content = document.getElementById("inqContent").value.trim();

    if (category === "") {
        showPopup("카테고리를 선택해주세요.");
        return;
    }
    if (category === "기타" && etc === "") {
        showPopup("기타 카테고리를 입력해주세요.");
        return;
    }
    if (!title || !content) {
        showPopup("제목과 내용을 모두 입력해주세요.");
        return;
    }

    if (category === "기타") category = etc;

    const now = new Date();
    const timestamp =
        `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} ` +
        `${now.getHours()}:${now.getMinutes()}`;

    const data = { title, category, content, timestamp };

    if (inquiryEditingIndex !== null) {
        inquiryList[inquiryEditingIndex] = data;
        inquiryEditingIndex = null;
        showPopup("문의가 수정되었습니다.", openInquiryListPage);
        return;
    }

    inquiryList.push(data);
    showPopup("문의가 등록되었습니다.", openInquiryListPage);
}

function openInquiryListPage() {
    hideAll();
    pages.inquiryList.classList.add("active");

    const box = document.getElementById("inquiryListContainer");
    box.innerHTML = "";

    if (inquiryList.length === 0) {
        box.innerHTML = `<div class="empty-box">문의 내역이 없습니다.</div>`;
        return;
    }

    inquiryList.forEach((q, i) => {
        const card = document.createElement("div");
        card.className = "inquiry-card";

        card.innerHTML = `
            <div class="inquiry-title">${q.title}</div>
            <div class="inquiry-meta">카테고리: ${q.category}</div>
            <div>${q.content}</div>
            <div class="inquiry-meta">${q.timestamp}</div>

            <div class="inquiry-btn-wrap">
                <button class="inquiry-btn edit-btn" onclick="editInquiry(${i})">수정</button>
                <button class="inquiry-btn delete-btn" onclick="deleteInquiryConfirm(${i})">삭제</button>
            </div>
        `;

        box.appendChild(card);
    });
}

function editInquiry(index) {
    inquiryEditingIndex = index;
    const q = inquiryList[index];

    hideAll();
    pages.inquiryWrite.classList.add("active");

    document.getElementById("inqTitle").value = q.title;
    document.getElementById("inqContent").value = q.content;

    const catSelect = document.getElementById("inqCategory");

    if (["서비스 이용", "로그인/계정", "오류 신고", "기능 요청"].includes(q.category)) {
        catSelect.value = q.category;
        document.getElementById("customCategory").style.display = "none";
    } else {
        catSelect.value = "기타";
        document.getElementById("customCategory").style.display = "block";
        document.getElementById("customCategory").value = q.category;
    }
}

function deleteInquiryConfirm(index) {
    const modal = document.getElementById("popupModal");
    const msg = document.getElementById("popupMsg");

    msg.innerHTML = `
        정말 삭제하시겠습니까?<br><br>
        <button class="modal-btn" id="delYes" style="margin-bottom:10px;">확인</button>
        <button class="modal-btn" id="delNo" style="background:#aaa;">취소</button>
    `;

    modal.classList.remove("hidden");

    document.getElementById("delYes").onclick = () => {
        modal.classList.add("hidden");
        inquiryList.splice(index, 1);
        showPopup("삭제되었습니다.", openInquiryListPage);
    };

    document.getElementById("delNo").onclick = () => {
        modal.classList.add("hidden");
    };
}

/* ================================
   약관 / 개인정보
================================ */
function openTermsPage() {
    hideAll();
    pages.terms.classList.add("active");
}

function openPrivacyPage() {
    hideAll();
    pages.privacy.classList.add("active");
}

function toggleAccordion(item) {
    item.classList.toggle("active");
}

function closeAllAccordions() {
    document.querySelectorAll(".accordion-item").forEach(a => a.classList.remove("active"));
}

/* ================================
   버전 정보
================================ */
function openVersionInfo() {
    showPopup("현재 앱 버전: v1.0.0");
}

function goBackFromSettings(){
    let historyStack = JSON.parse(localStorage.getItem("historyStack")) || [];

    const prev = historyStack.pop();   // 현재 페이지만 제거하고 이전 페이지를 꺼냄

    localStorage.setItem("historyStack", JSON.stringify(historyStack));

    if(prev){
        window.location.href = prev;   // 바로 이전 페이지로 이동
    }else{
        window.location.href = "../home/home.html"; // 안전 fallback
    }
}
