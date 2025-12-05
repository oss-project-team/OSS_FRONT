let currentChatUser=null;

let chatData={
    "친구A":[{from:"left",text:"게시물보고 연락드려요!",time:new Date()}],
    "친구B":[{from:"left",text:"찾으시는 물건이 이게 맞나요?",time:new Date()}],
    "친구C":[],
    "친구D":[]
};

let chatMeta={"친구A":{lastTime:0},"친구B":{lastTime:0},"친구C":{lastTime:0},"친구D":{lastTime:0}};
let unreadStatus={"친구A":false,"친구B":true,"친구C":false,"친구D":false};
let chatAlarmStatus={"친구A":true,"친구B":true,"친구C":true,"친구D":true};

/* 🔥 detail에서 저장한 게시글 정보 불러오기 */
let chatInfo = JSON.parse(localStorage.getItem("chatInfo") || "{}");

function formatTime(t){
    const d=new Date(t);
    return `${d.getHours()>=12?"오후":"오전"} ${(d.getHours()%12||12)}:${String(d.getMinutes()).padStart(2,"0")}`;
}

/* ================== 🔥 쪽지 목록 렌더링 ================== */
function renderChatList(){
    const wrap=document.querySelector(".contact-wrapper");
    wrap.innerHTML="";

    Object.keys(chatData).forEach(name=>{
        let info = chatInfo[name]; // ← detail에서 넘긴 title/category

        const card=document.createElement("div");
        card.className="msg-card";
        card.onclick=()=>openChat(name);

        card.innerHTML=`
            <div class="avatar"></div>
            <div class="text-box">
                <p class="name">${name} <span id="dot-${name}" class="unread-dot"></span></p>
                ${ info ? `<p class="sub-info">[${info.category}] ${info.title}</p>` : `<p class="sub-info"></p>` }
                <p id="preview-${name}" class="preview">최근 대화 없음</p>
            </div>
            <button class="delete-btn" onclick="openDeleteModal('${name}',event)">삭제</button>
        `;

        wrap.appendChild(card);
    });

    refreshPreviews();
    renderUnreadDots();
    sortChatList();
}

/* ================== 최근 대화 표시 ================== */
function refreshPreviews(){
    Object.keys(chatData).forEach(n=>{
        const last=chatData[n].at(-1);
        const el=document.getElementById("preview-"+n);
        if(el) el.textContent= last?(last.image?"사진":last.text):"최근 대화 없음";
    });
}
function renderUnreadDots(){
    Object.keys(unreadStatus).forEach(n=>{
        const el=document.getElementById("dot-"+n);
        if(el) el.style.display= unreadStatus[n]?"inline-block":"none";
    });
}
function sortChatList(){
    const wrap=document.querySelector(".contact-wrapper");
    [...wrap.children].sort((a,b)=>{
        const aName=a.querySelector(".name").textContent.trim().split(" ")[0];
        const bName=b.querySelector(".name").textContent.trim().split(" ")[0];
        return (chatMeta[bName]?.lastTime||0)-(chatMeta[aName]?.lastTime||0);
    }).forEach(el=>wrap.appendChild(el));
}

/* ================== 채팅 열기 ================== */
function openChat(name){
    currentChatUser=name;
    unreadStatus[name]=false; renderUnreadDots();
    document.getElementById("contactList").style.display="none";
    document.getElementById("chatWindow").style.display="flex";
    document.getElementById("chatName").textContent=name;
    loadMessages(); updateChatBellIcon();
}

/* ================== 닫기 ================== */
function closeChat(){
    document.getElementById("chatWindow").style.display="none";
    document.getElementById("contactList").style.display="block";
    document.getElementById("imgModal").style.display="none";
    refreshPreviews();renderUnreadDots();sortChatList();renderChatList();
}

/* ================== 삭제 ================== */
function openDeleteModal(name,event){
    event.stopPropagation();
    const modal=document.createElement("div");
    modal.className="modal-bg";
    modal.innerHTML=`
        <div class="modal-box">
        <div>'${name}'과의 채팅을 삭제할까요?</div>
            <div class="btn-area">
                <button class="ok-btn" onclick="deleteChat('${name}',this)">삭제</button>
                <button class="cancel-btn" onclick="this.closest('.modal-bg').remove()">취소</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.style.display="flex";
}

function deleteChat(name,btn){
    btn.closest(".modal-bg").remove();
    delete chatData[name];
    delete chatMeta[name];
    delete unreadStatus[name];
    delete chatAlarmStatus[name];
    delete chatInfo[name]; // ⭐ 게시글 정보도 삭제
    localStorage.setItem("chatInfo",JSON.stringify(chatInfo));
    localStorage.setItem("chatData",JSON.stringify(chatData));
    localStorage.setItem("chatMeta",JSON.stringify(chatMeta));
    renderChatList();
}

/* ================== 메시지 전송 ================== */
function loadMessages(){
    const chat=document.getElementById("chatContent"); chat.innerHTML="";
    const list=chatData[currentChatUser]||[];

    list.forEach((msg,i)=>{
        const row=document.createElement("div");
        row.classList.add("msg-row",msg.from==="right"?"right":"left");

        const wrap=document.createElement("div");
        wrap.classList.add("msg-wrapper");

        const bubble=document.createElement("div");
        bubble.classList.add("msg-bubble",msg.from==="right"?"right-bubble":"left-bubble");

        if(msg.image){
            const img=document.createElement("img");
            img.src=msg.image; img.classList.add("chat-image");
            img.onclick=()=>openImgModal(msg.image);
            bubble.appendChild(img);
        }else bubble.textContent=msg.text;

        const next=list[i+1];
        const showTime=!next|| new Date(msg.time).getMinutes()!==new Date(next?.time).getMinutes() || next.from!==msg.from;
        if(showTime){
            const t=document.createElement("div");
            t.classList.add("msg-time");
            t.textContent=formatTime(msg.time);
            wrap.appendChild(t);
        }

        wrap.appendChild(bubble);
        row.appendChild(wrap);
        chat.appendChild(row);
    });
    chat.scrollTop=chat.scrollHeight;
}

function sendMessage(){
    const input=document.getElementById("chatInput");
    if(!input.value.trim())return;
    chatData[currentChatUser].push({from:"right",text:input.value,time:new Date()});
    chatMeta[currentChatUser].lastTime=Date.now();
    input.value=""; loadMessages(); sortChatList();
    localStorage.setItem("chatData",JSON.stringify(chatData));
    localStorage.setItem("chatMeta",JSON.stringify(chatMeta));
}

/* ================== 이미지 ================== */
function sendImage(e){
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
        chatData[currentChatUser].push({from:"right",image:reader.result,time:new Date()});
        chatMeta[currentChatUser].lastTime=Date.now();
        loadMessages(); sortChatList();
        localStorage.setItem("chatData",JSON.stringify(chatData));
        localStorage.setItem("chatMeta",JSON.stringify(chatMeta));
    }
    reader.readAsDataURL(file);
}

/* ================== 이미지 팝업 ================== */
function openImgModal(src){
    document.getElementById("modalImg").src=src;
    document.getElementById("imgModal").style.display="flex";
}
document.querySelector(".close-modal").onclick=()=>document.getElementById("imgModal").style.display="none";
document.getElementById("imgModal").onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.style.display="none";}

/* ================== 알림 ================== */
function toggleChatAlarm(){
    chatAlarmStatus[currentChatUser]=!chatAlarmStatus[currentChatUser];
    updateChatBellIcon();
}
function updateChatBellIcon(){
    const icon=document.getElementById("chatBellIcon");
    icon.textContent= chatAlarmStatus[currentChatUser]?"notifications":"notifications_off";
    icon.classList.toggle("off",!chatAlarmStatus[currentChatUser]);
}

/* ================== 네비 ================== */
// 📌 이전 경로 저장 + 페이지 이동 함수
function saveHistoryAndMove(path){
    let stack = JSON.parse(localStorage.getItem("historyStack")) || [];
    stack.push(location.pathname);
    localStorage.setItem("historyStack", JSON.stringify(stack));
    location.href = path;
}

// 📌 아이콘 클릭 시 이동처리
document.getElementById("noticeBtn").onclick=()=>saveHistoryAndMove("../notice/notice.html");
document.getElementById("settingBtn").onclick=()=>saveHistoryAndMove("../settings/settings.html");

document.querySelectorAll(".bottom-nav .nav-item").forEach(item=>{
    item.onclick=()=>{
        const label=item.querySelector(".nav-label").textContent.trim();
        if(label==="홈") location.href="../home/home.html";
        if(label==="쪽지함") location.href="contact.html";
        if(label==="마이페이지") location.href="../mypage/mypage.html";
    }
});

/* ================== 🔥 페이지 실행 ================== */
window.onload=()=>{
    chatData=JSON.parse(localStorage.getItem("chatData"))||chatData;
    chatMeta=JSON.parse(localStorage.getItem("chatMeta"))||chatMeta;
    chatInfo=JSON.parse(localStorage.getItem("chatInfo"))||{};  // 중요

    renderChatList();

    const params=new URLSearchParams(location.search);
    const user=params.get("user");
    const title=params.get("title");
    const category=params.get("category");

    if(user){
        if(title && category){
            chatInfo[user]={title,category};
            localStorage.setItem("chatInfo",JSON.stringify(chatInfo));
        }

        if(!chatData[user]) chatData[user]=[];
        chatMeta[user]={lastTime:Date.now()};
        unreadStatus[user]=false;
        chatAlarmStatus[user]=true;

        localStorage.setItem("chatData",JSON.stringify(chatData));
        localStorage.setItem("chatMeta",JSON.stringify(chatMeta));

        setTimeout(()=>openChat(user),350);
        history.replaceState({}, "", "contact.html");
        return;
    }

    refreshPreviews(); renderUnreadDots(); sortChatList();
};
