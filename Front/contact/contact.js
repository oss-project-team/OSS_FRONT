let currentChatUser=null;
let currentChatUserEmail=null; // 현재 채팅 상대의 이메일

// API에서 가져온 쪽지 데이터
let messagesData = {
    inbox: [], // 받은 쪽지
    sent: []   // 보낸 쪽지
};

// 닉네임 -> 이메일 매핑 (API에서 가져온 사용자 정보)
let nicknameToEmail = {};

let chatData={};
let chatMeta={};
let unreadStatus={};
let chatAlarmStatus={};

/* 🔥 detail에서 저장한 게시글 정보 불러오기 */
let chatInfo = JSON.parse(localStorage.getItem("chatInfo") || "{}");

function formatTime(t){
    const d = t instanceof Date ? t : new Date(t);
    return `${d.getHours()>=12?"오후":"오전"} ${(d.getHours()%12||12)}:${String(d.getMinutes()).padStart(2,"0")}`;
}

/* ================== API 연동 함수 ================== */

// 닉네임으로 이메일 찾기 (프로필 API 사용)
async function getEmailByNickname(nickname) {
    if (nicknameToEmail[nickname]) {
        return nicknameToEmail[nickname];
    }
    
    // 모든 사용자 프로필을 확인하여 닉네임으로 이메일 찾기
    // (실제로는 백엔드에 닉네임으로 이메일 조회 API가 필요하지만, 
    //  현재는 게시글에서 author_email을 통해 추론)
    return null;
}

// 받은 쪽지함 + 보낸 쪽지함 로드
async function loadMessagesFromAPI() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        console.log('로그인이 필요합니다.');
        return;
    }

    try {
        // 받은 쪽지함
        const inboxResponse = await fetch('https://chajabat.onrender.com/api/v1/messages/inbox', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (inboxResponse.ok) {
            messagesData.inbox = await inboxResponse.json();
        }

        // 보낸 쪽지함
        const sentResponse = await fetch('https://chajabat.onrender.com/api/v1/messages/sent', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (sentResponse.ok) {
            messagesData.sent = await sentResponse.json();
        }

        // 쪽지 데이터를 chatData 형식으로 변환
        convertMessagesToChatData();
        renderChatList();
    } catch (error) {
        console.error('쪽지 로드 오류:', error);
        // 에러 발생 시 localStorage에서 로드 (fallback)
        loadFromLocalStorage();
    }
}

// API 쪽지 데이터를 chatData 형식으로 변환
function convertMessagesToChatData() {
    const allMessages = [...messagesData.inbox, ...messagesData.sent];
    const userEmail = localStorage.getItem('user_email');
    
    // 쪽지를 상대방별로 그룹화 (이메일을 키로 사용)
    const messagesByEmail = {};
    const emailToNickname = {}; // 이메일 -> 닉네임 매핑
    
    allMessages.forEach(msg => {
        // 상대방 이메일 결정
        const otherEmail = msg.sender_email === userEmail 
            ? msg.recipient_email 
            : msg.sender_email;
        
        // 이메일을 키로 사용하여 그룹화
        if (!messagesByEmail[otherEmail]) {
            messagesByEmail[otherEmail] = [];
        }
        
        // 메시지 형식 변환
        const isFromMe = msg.sender_email === userEmail;
        const messageTime = new Date(msg.created_at);
        
        messagesByEmail[otherEmail].push({
            from: isFromMe ? "right" : "left",
            text: msg.content,
            time: messageTime,
            messageId: msg.id,
            read_at: msg.read_at
        });
    });
    
    // 이메일 키를 닉네임 키로 변환
    chatData = {};
    Object.keys(messagesByEmail).forEach(email => {
        // chatInfo에서 닉네임 찾기 (detail 페이지에서 넘어온 경우)
        let nickname = null;
        Object.keys(chatInfo).forEach(key => {
            // chatInfo의 키가 닉네임일 수 있으므로, 이메일과 매칭 시도
            // 일단 이메일 앞부분을 닉네임으로 사용
        });
        
        // 닉네임을 찾지 못한 경우 이메일 앞부분 사용
        if (!nickname) {
            nickname = email.split('@')[0];
        }
        
        // 동일한 닉네임이 이미 있는 경우 이메일을 포함하여 구분
        let finalNickname = nickname;
        let counter = 1;
        while (chatData[finalNickname]) {
            finalNickname = `${nickname}${counter}`;
            counter++;
        }
        
        chatData[finalNickname] = messagesByEmail[email];
        nicknameToEmail[finalNickname] = email; // 닉네임 -> 이메일 매핑 저장
        
        // 메타데이터 초기화
        if (!chatMeta[finalNickname]) {
            chatMeta[finalNickname] = { lastTime: 0 };
            unreadStatus[finalNickname] = false;
            chatAlarmStatus[finalNickname] = true;
        }
        
        // 읽지 않은 메시지 체크 및 최신 시간 업데이트
        messagesByEmail[email].forEach(msg => {
            if (msg.from === "left" && !msg.read_at) {
                unreadStatus[finalNickname] = true;
            }
            const timestamp = msg.time.getTime();
            if (timestamp > (chatMeta[finalNickname].lastTime || 0)) {
                chatMeta[finalNickname].lastTime = timestamp;
            }
        });
    });
    
    // localStorage에도 저장 (fallback)
    localStorage.setItem("chatData", JSON.stringify(chatData));
    localStorage.setItem("chatMeta", JSON.stringify(chatMeta));
}

// localStorage에서 로드 (fallback)
function loadFromLocalStorage() {
    chatData = JSON.parse(localStorage.getItem("chatData")) || chatData;
    chatMeta = JSON.parse(localStorage.getItem("chatMeta")) || chatMeta;
    renderChatList();
}

/* ================== 🔥 쪽지 목록 렌더링 ================== */
function renderChatList(){
    const wrap=document.querySelector(".contact-wrapper");
    if (!wrap) return;
    
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
        const last=chatData[n]?.at(-1);
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
    if (!wrap) return;
    
    [...wrap.children].sort((a,b)=>{
        const aName=a.querySelector(".name").textContent.trim().split(" ")[0];
        const bName=b.querySelector(".name").textContent.trim().split(" ")[0];
        return (chatMeta[bName]?.lastTime||0)-(chatMeta[aName]?.lastTime||0);
    }).forEach(el=>wrap.appendChild(el));
}

/* ================== 채팅 열기 ================== */
function openChat(name){
    currentChatUser=name;
    unreadStatus[name]=false; 
    renderUnreadDots();
    
    // 상대방 이메일 찾기 (임시로 닉네임 사용, 실제로는 프로필 API 필요)
    currentChatUserEmail = nicknameToEmail[name] || null;
    
    document.getElementById("contactList").style.display="none";
    document.getElementById("chatWindow").style.display="flex";
    document.getElementById("chatName").textContent=name;
    loadMessages(); 
    updateChatBellIcon();
}

/* ================== 닫기 ================== */
function closeChat(){
    document.getElementById("chatWindow").style.display="none";
    document.getElementById("contactList").style.display="block";
    document.getElementById("imgModal").style.display="none";
    refreshPreviews();
    renderUnreadDots();
    sortChatList();
    renderChatList();
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
    delete chatInfo[name];
    localStorage.setItem("chatInfo",JSON.stringify(chatInfo));
    localStorage.setItem("chatData",JSON.stringify(chatData));
    localStorage.setItem("chatMeta",JSON.stringify(chatMeta));
    renderChatList();
}

/* ================== 메시지 전송 (API 연동) ================== */
async function sendMessage(){
    const input=document.getElementById("chatInput");
    if(!input.value.trim()) return;
    
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    // 상대방 이메일 찾기
    // detail 페이지에서 넘어온 경우 chatInfo에 저장된 정보 사용
    // 또는 닉네임으로 이메일 찾기
    let recipientEmail = currentChatUserEmail;
    
    // 이메일을 찾지 못한 경우, 게시글 작성자의 이메일을 사용
    // (실제로는 프로필 API로 닉네임->이메일 변환이 필요)
    if (!recipientEmail) {
        // 임시: 닉네임을 이메일로 변환 (실제로는 API 필요)
        // 게시글에서 넘어온 경우를 위해 detail 페이지에서 이메일도 저장하도록 수정 필요
        alert('상대방 정보를 찾을 수 없습니다.');
        return;
    }
    
    const messageContent = input.value.trim();
    
    try {
        const response = await fetch('https://chajabat.onrender.com/api/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                recipient_email: recipientEmail,
                content: messageContent
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 성공 시 로컬에도 추가
            if(!chatData[currentChatUser]) chatData[currentChatUser] = [];
            chatData[currentChatUser].push({
                from: "right",
                text: messageContent,
                time: new Date(),
                messageId: data.id
            });
            chatMeta[currentChatUser].lastTime = Date.now();
            input.value = "";
            loadMessages();
            sortChatList();
            
            // localStorage에도 저장
            localStorage.setItem("chatData", JSON.stringify(chatData));
            localStorage.setItem("chatMeta", JSON.stringify(chatMeta));
            
            // API에서 다시 로드하여 동기화
            setTimeout(() => loadMessagesFromAPI(), 500);
        } else {
            alert(data.error || '쪽지 전송에 실패했습니다.');
        }
    } catch (error) {
        console.error('쪽지 전송 오류:', error);
        alert('쪽지 전송 중 오류가 발생했습니다.');
        
        // 에러 발생 시 localStorage에만 저장 (fallback)
        if(!chatData[currentChatUser]) chatData[currentChatUser] = [];
        chatData[currentChatUser].push({from:"right",text:messageContent,time:new Date()});
        chatMeta[currentChatUser].lastTime=Date.now();
        input.value=""; 
        loadMessages(); 
        sortChatList();
        localStorage.setItem("chatData",JSON.stringify(chatData));
        localStorage.setItem("chatMeta",JSON.stringify(chatMeta));
    }
}

/* ================== 메시지 로드 ================== */
function loadMessages(){
    const chat=document.getElementById("chatContent"); 
    if (!chat) return;
    
    chat.innerHTML="";
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
            img.src=msg.image; 
            img.classList.add("chat-image");
            img.onclick=()=>openImgModal(msg.image);
            bubble.appendChild(img);
        } else {
            bubble.textContent=msg.text;
        }

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

/* ================== 이미지 ================== */
function sendImage(e){
    const file=e.target.files[0]; 
    if(!file) return;
    
    // 이미지 전송은 현재 localStorage만 사용 (API 미지원)
    const reader=new FileReader();
    reader.onload=()=>{
        if(!chatData[currentChatUser]) chatData[currentChatUser] = [];
        chatData[currentChatUser].push({from:"right",image:reader.result,time:new Date()});
        chatMeta[currentChatUser].lastTime=Date.now();
        loadMessages(); 
        sortChatList();
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
document.querySelector(".close-modal")?.addEventListener("click", () => {
    document.getElementById("imgModal").style.display="none";
});
document.getElementById("imgModal")?.addEventListener("click", e => {
    if(e.target===e.currentTarget) e.currentTarget.style.display="none";
});

/* ================== 알림 ================== */
function toggleChatAlarm(){
    chatAlarmStatus[currentChatUser]=!chatAlarmStatus[currentChatUser];
    updateChatBellIcon();
}
function updateChatBellIcon(){
    const icon=document.getElementById("chatBellIcon");
    if (!icon) return;
    icon.textContent= chatAlarmStatus[currentChatUser]?"notifications":"notifications_off";
    icon.classList.toggle("off",!chatAlarmStatus[currentChatUser]);
}

/* ================== 네비 ================== */
function saveHistoryAndMove(path){
    let stack = JSON.parse(localStorage.getItem("historyStack")) || [];
    stack.push(location.pathname);
    localStorage.setItem("historyStack", JSON.stringify(stack));
    location.href = path;
}

document.getElementById("noticeBtn")?.addEventListener("click", () => saveHistoryAndMove("../notice/notice.html"));
document.getElementById("settingBtn")?.addEventListener("click", () => saveHistoryAndMove("../settings/settings.html"));

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
    chatInfo=JSON.parse(localStorage.getItem("chatInfo"))||{};

    // API에서 쪽지 로드
    loadMessagesFromAPI();

    const params=new URLSearchParams(location.search);
    const user=params.get("user");
    const title=params.get("title");
    const category=params.get("category");
    const email=params.get("email"); // detail 페이지에서 이메일도 전달받기

    if(user){
        if(title && category){
            chatInfo[user]={title,category};
            localStorage.setItem("chatInfo",JSON.stringify(chatInfo));
        }

        // 이메일 저장
        if (email) {
            nicknameToEmail[user] = email;
            currentChatUserEmail = email;
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

    refreshPreviews(); 
    renderUnreadDots(); 
    sortChatList();
};
