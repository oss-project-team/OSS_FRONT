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
let alarm=true;

noticeBell.onclick=()=>{
    alarm = !alarm;
    noticeBell.textContent = alarm ? "notifications" : "notifications_off";
    noticeBell.classList.toggle("off", !alarm);
};


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


/* 🔙 기존 back-btn 로직은 위에서 대체됨 */
