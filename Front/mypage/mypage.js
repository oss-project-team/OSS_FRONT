/* ================================
   아코디언 메뉴
================================ */
document.querySelectorAll(".menu-header").forEach(header => {
    header.addEventListener("click", () => {
        const content = header.nextElementSibling;

        if (content.style.display === "block") {
            content.style.display = "none";
            return;
        }

        document.querySelectorAll(".menu-content")
            .forEach(c => c.style.display = "none");

        content.style.display = "block";
    });
});


/* ================================
   🔥 내 게시글 목록 로드 (Found + Lost 모두)
================================ */
function loadMyPosts() {
    const list = document.getElementById("myPostList");
    if (!list) return;

    list.innerHTML = "";

    const lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];
    const foundPosts = JSON.parse(localStorage.getItem("foundPosts")) || [];

    const allPosts = [
        ...lostPosts.map(p => ({...p, type:"lost"})),
        ...foundPosts.map(p => ({...p, type:"found"}))
    ];

    if (allPosts.length === 0) {
        list.innerHTML = `<li style="color:#777;">작성한 게시글이 없습니다.</li>`;
        return;
    }

    allPosts.sort((a,b) => (b.id||0) - (a.id||0));

    allPosts.forEach(post => {
        const li = document.createElement("li");
        li.textContent = post.title + (post.type==="found" ? " (찾음)" : " (분실)");

        li.addEventListener("click", () => {
            if(post.type === "lost")
                window.location.href = `../detail_lost/detail_lost.html?id=${post.id}`;
            else
                window.location.href = `../detail/detail.html?id=${post.id}`;
        });

        list.appendChild(li);
    });
}



/* ================================
   🔥 프로필 저장 + localStorage 유지
================================ */
function saveProfile() {
    const nicknameInput = document.getElementById("nickInput").value.trim();
    const nickname = document.getElementById("nickname");
    const upload = document.getElementById("profileUpload");
    let profileImage = document.getElementById("profileImage");

    if(nicknameInput){
        nickname.textContent = nicknameInput;
        localStorage.setItem("nickname", nicknameInput);
    }

    if(upload.files && upload.files[0]){
        const reader = new FileReader();
        reader.onload = e =>{
            profileImage.src = e.target.result;
            localStorage.setItem("profileImage", e.target.result);
        }
        reader.readAsDataURL(upload.files[0]);
    }

    showPopup("프로필이 저장되었습니다.");
}



/* ================================
 🔥 팝업 함수
================================ */
function showPopup(msg){
    const popup = document.getElementById("popup");
    document.getElementById("popupMsg").textContent = msg;
    popup.style.display="flex";
}
function closePopup(){
    document.getElementById("popup").style.display="none";
}



/* ================================
   🔥 프로필 자동 불러오기
================================ */
function loadProfile(){
    const nickname = localStorage.getItem("nickname");
    const image = localStorage.getItem("profileImage");

    if(nickname) document.getElementById("nickname").textContent = nickname;
    if(image) document.getElementById("profileImage").src = image;
}



/* ================================
   ▣ 차단 계정 저장 & 유지
================================ */
function loadBlockedUsers(){
    let saved = JSON.parse(localStorage.getItem("blockedUsers")) || [];
    const list = document.getElementById("blockList");
    list.innerHTML = "";

    saved.forEach(name=>{
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${name}</span>
            <button class="block-del-btn" onclick="removeBlockedUser('${name}')">X</button>
        `;
        list.appendChild(li);
    });
}

function addBlock(){
    const input = document.getElementById("blockUser");
    let name = input.value.trim();
    if(!name) return;

    let saved = JSON.parse(localStorage.getItem("blockedUsers")) || [];

    if(saved.includes(name)){
        showPopup("이미 차단된 닉네임입니다.");
        input.value="";
        return;
    }

    saved.push(name);
    localStorage.setItem("blockedUsers", JSON.stringify(saved));
    input.value="";
    loadBlockedUsers();
}

function removeBlockedUser(name){
    let saved = JSON.parse(localStorage.getItem("blockedUsers")) || [];
    saved = saved.filter(item => item !== name);
    localStorage.setItem("blockedUsers", JSON.stringify(saved));
    loadBlockedUsers();
}



/* ================================
   상단 아이콘 이동
================================ */
function saveHistoryAndMove(path){
    let stack = JSON.parse(localStorage.getItem("historyStack"))||[];
    stack.push(location.pathname);
    localStorage.setItem("historyStack",JSON.stringify(stack));
    location.href=path;
}

document.getElementById("noticeBtn").onclick=()=>saveHistoryAndMove("../notice/notice.html");
document.getElementById("settingBtn").onclick=()=>saveHistoryAndMove("../settings/settings.html");



/* ================================
   하단 네비게이션
================================ */
document.querySelectorAll(".nav-item").forEach(item=>{
    item.addEventListener("click",()=>{
        const label=item.querySelector(".nav-label").textContent.trim();
        if(label==="홈")location.href="../home/home.html";
        if(label==="쪽지함")location.href="../contact/contact.html";
        if(label==="마이페이지")location.href="./mypage.html";
    })
});



/* ================================
   📌 개인정보 변경(저장하지 않고 입력 초기화)
================================ */
function savePersonalInfo(){
    const emailInput = document.getElementById("emailInput");
    const phoneInput = document.getElementById("phoneInput");

    showPopup("개인 정보가 변경되었습니다.");

    emailInput.value = "";
    phoneInput.value = "";
}



/* ================================
   🔥 페이지 로드시 실행
================================ */
document.addEventListener("DOMContentLoaded",()=>{
    loadMyPosts();
    loadProfile();
    loadBlockedUsers();
});
