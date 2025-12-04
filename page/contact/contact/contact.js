let currentChatUser=null;

let chatData={
    "친구A":[{from:"left",text:"안녕, 잘 지내?",time:new Date()}],
    "친구B":[{from:"left",text:"이거 아직 안 읽은 쪽지야.",time:new Date()}],
    "친구C":[],
    "친구D":[]
};

let chatMeta={"친구A":{lastTime:0},"친구B":{lastTime:0},"친구C":{lastTime:0},"친구D":{lastTime:0}};
let unreadStatus={"친구A":false,"친구B":true,"친구C":false,"친구D":false};
let chatAlarmStatus={"친구A":true,"친구B":true,"친구C":true,"친구D":true};

function formatTime(t){
    const d=new Date(t);
    return `${d.getHours()>=12?"오후":"오전"} ${(d.getHours()%12||12)}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function refreshPreviews(){
    Object.keys(chatData).forEach(n=>{
        const last=chatData[n].at(-1);
        document.getElementById("preview-"+n).textContent= last?(last.image?"사진":last.text):"최근 대화 없음";
    });
}

function renderUnreadDots(){
    Object.keys(unreadStatus).forEach(n=>{
        document.getElementById("dot-"+n).style.display= unreadStatus[n]?"inline-block":"none";
    });
}

function sortChatList(){
    const wrap=document.querySelector(".contact-wrapper");
    [...wrap.children].sort((a,b)=>{
        const aName=a.querySelector(".name").textContent.trim().split(" ")[0];
        const bName=b.querySelector(".name").textContent.trim().split(" ")[0];
        return (chatMeta[bName].lastTime||0)-(chatMeta[aName].lastTime||0);
    }).forEach(el=>wrap.appendChild(el));
}

/* 채팅 열기 */
function openChat(n){
    currentChatUser=n;
    unreadStatus[n]=false;renderUnreadDots();
    document.getElementById("contactList").style.display="none";
    document.getElementById("chatWindow").style.display="flex";
    document.getElementById("chatName").textContent=n;
    loadMessages();
    updateChatBellIcon();
}

/* 닫기 */
function closeChat(){
    document.getElementById("chatWindow").style.display="none";
    document.getElementById("contactList").style.display="block";
    refreshPreviews();sortChatList();
}

/* 메시지 로딩 */
function loadMessages(){
    const chat=document.getElementById("chatContent");
    chat.innerHTML="";
    const list=chatData[currentChatUser];

    list.forEach((msg,i)=>{
        const row=document.createElement("div");
        row.classList.add("msg-row", msg.from==="right"?"right":"left");

        const wrap=document.createElement("div");
        wrap.classList.add("msg-wrapper");

        const bubble=document.createElement("div");
        bubble.classList.add("msg-bubble",msg.from==="right"?"right-bubble":"left-bubble");

        if(msg.image){
            const img=document.createElement("img");
            img.src=msg.image;
            img.classList.add("chat-image");
            img.onclick=()=>openImgModal(msg.image);
            bubble.appendChild(img);
        }else bubble.textContent=msg.text;

        const next=list[i+1];
        const showTime=!next || new Date(msg.time).getMinutes()!==new Date(next?.time).getMinutes() || next.from!==msg.from;

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

/* 메시지 전송 */
function sendMessage(){
    const input=document.getElementById("chatInput");
    if(!input.value.trim())return;

    chatData[currentChatUser].push({from:"right",text:input.value,time:new Date()});
    chatMeta[currentChatUser].lastTime=Date.now();
    input.value="";
    loadMessages();sortChatList();
}

function handleEnter(e){if(e.key==="Enter")sendMessage();}

/* 이미지 전송 */
function sendImage(e){
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
        chatData[currentChatUser].push({from:"right",image:reader.result,time:new Date()});
        chatMeta[currentChatUser].lastTime=Date.now();
        loadMessages();sortChatList();
    }
    reader.readAsDataURL(file);
}

/* 팝업 */
function openImgModal(src){
    document.getElementById("modalImg").src=src;
    document.getElementById("imgModal").style.display="flex";
}
document.querySelector(".close-modal").onclick=()=> document.getElementById("imgModal").style.display="none";
document.getElementById("imgModal").onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.style.display="none";}

/* 🔔 채팅 종 토글 */
function toggleChatAlarm(){
    chatAlarmStatus[currentChatUser]=!chatAlarmStatus[currentChatUser];
    updateChatBellIcon();
}
function updateChatBellIcon(){
    const icon=document.getElementById("chatBellIcon");
    if(chatAlarmStatus[currentChatUser]){ icon.textContent="notifications";icon.classList.remove("off"); }
    else{ icon.textContent="notifications_off";icon.classList.add("off"); }
}

/* ================== 상단 이동 기능 ================== */
document.querySelector(".right-icons i:nth-child(1)").addEventListener("click", ()=>{
    let historyStack = JSON.parse(localStorage.getItem("historyStack")) || [];
    historyStack.push(window.location.pathname);   // 📌 현재 contact 저장
    localStorage.setItem("historyStack", JSON.stringify(historyStack));

    window.location.href="../notice/notice.html";   // 알림함
});


/* 🔥 수정된 settings 이동 코드 (뒤로가기가 홈으로 가던 문제 해결) */
document.querySelector(".right-icons i:nth-child(2)").addEventListener("click", ()=>{
    let historyStack = JSON.parse(localStorage.getItem("historyStack")) || [];
    historyStack.push(window.location.pathname);   // 📌 현재 페이지 저장
    localStorage.setItem("historyStack", JSON.stringify(historyStack));

    window.location.href="../settings/settings.html"; // 설정 페이지 이동
});

/* ================== 하단 네비 이동 ================== */
document.querySelectorAll(".bottom-nav .nav-item").forEach(item=>{
    item.addEventListener("click",()=>{
        const label=item.querySelector(".nav-label").textContent;

        if(label==="홈"){
            window.location.href="../home/home.html";
        }
        else if(label==="쪽지함"){
            /* 현재 페이지라 이동 없음 */
        }
    });
});

/* 초기 실행 */
window.onload=()=>{refreshPreviews();renderUnreadDots();sortChatList();}
