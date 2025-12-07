let currentChatUser=null;
let currentChatUserEmail=null; // 현재 채팅 상대의 이메일

// API에서 가져온 쪽지 데이터
let messagesData = {
    inbox: [], // 받은 쪽지
    sent: []   // 보낸 쪽지
};

// 닉네임 -> 이메일 매핑 (API에서 가져온 사용자 정보)
let nicknameToEmail = {};
// 이메일 -> 닉네임/프로필 이미지 매핑
let emailToUserInfo = {};

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

/* ================== Enter 키 처리 ================== */
function handleEnter(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// 전역 함수로 등록
window.handleEnter = handleEnter;

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
        await convertMessagesToChatData();
        renderChatList();
    } catch (error) {
        console.error('쪽지 로드 오류:', error);
        // 에러 발생 시 localStorage에서 로드 (fallback)
        loadFromLocalStorage();
    }
}

// API 쪽지 데이터를 chatData 형식으로 변환
async function convertMessagesToChatData() {
    const allMessages = [...messagesData.inbox, ...messagesData.sent];
    const userEmail = localStorage.getItem('user_email');
    
    if (!userEmail) {
        console.error('user_email이 localStorage에 없습니다.');
        return;
    }
    
    // 쪽지를 상대방별로 그룹화 (이메일을 키로 사용)
    const messagesByEmail = {};
    const uniqueEmails = new Set(); // 고유한 이메일 수집
    
    allMessages.forEach(msg => {
        // 상대방 이메일 결정
        const otherEmail = msg.sender_email === userEmail 
            ? msg.recipient_email 
            : msg.sender_email;
        
        // 고유한 이메일 수집
        if (otherEmail) {
            uniqueEmails.add(otherEmail);
        }
        
        // 이메일을 키로 사용하여 그룹화
        if (!messagesByEmail[otherEmail]) {
            messagesByEmail[otherEmail] = [];
        }
        
        // 메시지 형식 변환
        const isFromMe = msg.sender_email === userEmail;
        const messageTime = new Date(msg.created_at);
        
        // 디버깅: from 필드 확인
        const fromValue = isFromMe ? "right" : "left";
        console.log('메시지 변환:', {
            sender: msg.sender_email,
            recipient: msg.recipient_email,
            userEmail: userEmail,
            isFromMe: isFromMe,
            from: fromValue
        });
        
        messagesByEmail[otherEmail].push({
            from: fromValue,
            text: msg.content,
            time: messageTime,
            messageId: msg.id,
            read_at: msg.read_at,
            sender_email: msg.sender_email, // 나중에 from 필드 확인용으로 저장
            recipient_email: msg.recipient_email
        });
    });
    
    // 각 이메일의 사용자 정보 가져오기 (프로필 API에서)
    console.log('사용자 정보 로드 시작, 이메일 목록:', Array.from(uniqueEmails));
    await loadUserInfoFromPosts(Array.from(uniqueEmails));
    console.log('사용자 정보 로드 완료, emailToUserInfo:', emailToUserInfo);
    
    // 이메일 키를 닉네임 키로 변환
    chatData = {};
    Object.keys(messagesByEmail).forEach(email => {
        // emailToUserInfo에서 닉네임 찾기
        let nickname = null;
        if (emailToUserInfo[email]) {
            nickname = emailToUserInfo[email].nickname;
        }
        
        // chatInfo에서 닉네임 찾기 (detail 페이지에서 넘어온 경우)
        if (!nickname) {
            Object.keys(chatInfo).forEach(key => {
                // chatInfo의 키가 닉네임일 수 있으므로, 이메일과 매칭 시도
                if (nicknameToEmail[key] === email) {
                    nickname = key;
                }
            });
        }
        
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
            chatAlarmStatus[finalNickname] = true;
        }
        
        // unreadStatus 초기화 (없으면 false로 설정)
        if (!(finalNickname in unreadStatus)) {
            unreadStatus[finalNickname] = false;
        }
        
        // 메시지 시간순 정렬 (오래된 것부터)
        messagesByEmail[email].sort((a, b) => {
            const timeA = a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime();
            const timeB = b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime();
            return timeA - timeB; // 오래된 것부터 (오름차순)
        });
        
        // 읽지 않은 메시지 체크 및 최신 시간 업데이트
        messagesByEmail[email].forEach(msg => {
            // from 필드 확인 및 수정
            if (!msg.from || (msg.from !== "right" && msg.from !== "left")) {
                // from 필드가 없거나 잘못된 경우, sender_email로 판단
                const isFromMe = msg.sender_email === userEmail;
                msg.from = isFromMe ? "right" : "left";
            }
            
            // 상대방이 보낸 메시지이고 읽지 않았으면 unreadStatus를 true로 설정
            if (msg.from === "left" && !msg.read_at) {
                unreadStatus[finalNickname] = true;
            }
            const timestamp = msg.time instanceof Date ? msg.time.getTime() : new Date(msg.time).getTime();
            if (timestamp > (chatMeta[finalNickname].lastTime || 0)) {
                chatMeta[finalNickname].lastTime = timestamp;
            }
        });
    });
    
    // localStorage에도 저장 (fallback)
    localStorage.setItem("chatData", JSON.stringify(chatData));
    localStorage.setItem("chatMeta", JSON.stringify(chatMeta));
}

/* ================== 사용자 정보 가져오기 (프로필 API 사용) ================== */
async function loadUserInfoFromPosts(emails) {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;
    
    // 각 이메일에 대해 사용자 프로필 API로 직접 조회
    for (const email of emails) {
        if (emailToUserInfo[email]) {
            continue; // 이미 정보가 있으면 스킵
        }
        
        try {
            // 사용자 프로필 API 호출 (회원가입 시 저장한 프로필 이미지 가져오기)
            const profileResponse = await fetch(`https://chajabat.onrender.com/api/v1/users/${encodeURIComponent(email)}/profile`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log(`프로필 정보 로드 성공 (${email}):`, profileData);
                emailToUserInfo[email] = {
                    nickname: profileData.nickname || email.split('@')[0],
                    profileImage: profileData.profileImage || ''
                };
            } else {
                console.warn(`프로필 정보 로드 실패 (${email}):`, profileResponse.status);
                // API가 없거나 실패한 경우 기본값
                emailToUserInfo[email] = {
                    nickname: email.split('@')[0],
                    profileImage: ''
                };
            }
        } catch (error) {
            console.error(`사용자 정보 로드 오류 (${email}):`, error);
            // 에러 발생 시 기본값
            emailToUserInfo[email] = {
                nickname: email.split('@')[0],
                profileImage: ''
            };
        }
    }
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

        // 상대방 이메일과 사용자 정보 가져오기
        const otherEmail = nicknameToEmail[name];
        const userInfo = otherEmail ? emailToUserInfo[otherEmail] : null;
        const profileImage = userInfo?.profileImage || '';
        const displayName = name; // 이미 닉네임으로 변환되어 있음
        
        console.log(`채팅 목록 렌더링 (${name}):`, {
            otherEmail,
            userInfo,
            profileImage,
            hasImage: !!profileImage
        });
        
        // 프로필 이미지 스타일 설정
        const avatarStyle = profileImage && profileImage.trim() !== ''
            ? `style="background-image: url('${profileImage}'); background-size: cover; background-position: center;"`
            : '';
        
        card.innerHTML=`
            <div class="avatar" ${avatarStyle}></div>
            <div class="text-box">
                <p class="name">${displayName} <span id="dot-${name}" class="unread-dot"></span></p>
                ${ info ? `<p class="sub-info">[${info.category}] ${info.title}</p>` : `<p class="sub-info"></p>` }
                <p id="preview-${name}" class="preview">최근 대화 없음</p>
            </div>
            <button class="delete-btn" onclick="openDeleteModal('${name}',event)">삭제</button>
        `;

        // 스와이프 제스처 추가
        addSwipeGesture(card, name);
        
        wrap.appendChild(card);
    });

    refreshPreviews();
    renderUnreadDots();
    sortChatList();
}

/* ================== 스와이프 제스처 추가 ================== */
function addSwipeGesture(card, name) {
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    const SWIPE_THRESHOLD = 50; // 스와이프 최소 거리 (px)
    const DELETE_BUTTON_WIDTH = 80; // 삭제 버튼 너비
    
    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwiping = false;
        card.style.transition = 'none'; // 스와이프 중에는 transition 제거
    }, { passive: true });
    
    card.addEventListener('touchmove', (e) => {
        if (!startX) return;
        
        currentX = e.touches[0].clientX;
        const diffX = startX - currentX;
        
        // 이미 스와이프된 상태에서 오른쪽으로 스와이프하면 원위치
        if (card.classList.contains('swiped') && diffX < 0) {
            isSwiping = true;
            const moveX = Math.max(diffX, -DELETE_BUTTON_WIDTH);
            card.style.transform = `translateX(${moveX - DELETE_BUTTON_WIDTH}px)`;
            
            if (moveX > -SWIPE_THRESHOLD) {
                card.querySelector('.delete-btn').style.opacity = '0.5';
            }
        }
        // 왼쪽으로 스와이프만 허용 (diffX > 0)
        else if (diffX > 0) {
            isSwiping = true;
            // 최대 이동 거리 제한
            const moveX = Math.min(diffX, DELETE_BUTTON_WIDTH);
            card.style.transform = `translateX(-${moveX}px)`;
            
            // 삭제 버튼 표시
            if (moveX >= SWIPE_THRESHOLD) {
                card.querySelector('.delete-btn').style.opacity = '1';
                card.querySelector('.delete-btn').style.pointerEvents = 'auto';
            }
        }
    }, { passive: true });
    
    card.addEventListener('touchend', (e) => {
        if (!startX) {
            startX = 0;
            return;
        }
        
        const diffX = startX - currentX;
        card.style.transition = 'transform 0.3s ease';
        
        // 이미 스와이프된 상태에서 오른쪽으로 스와이프하면 원위치
        if (card.classList.contains('swiped') && diffX < 0 && Math.abs(diffX) >= SWIPE_THRESHOLD) {
            card.classList.remove('swiped');
            card.style.transform = 'translateX(0)';
            card.querySelector('.delete-btn').style.opacity = '0';
            card.querySelector('.delete-btn').style.pointerEvents = 'none';
        }
        // 스와이프 거리가 임계값 이상이면 삭제 버튼 표시
        else if (diffX >= SWIPE_THRESHOLD) {
            card.classList.add('swiped');
            card.style.transform = `translateX(-${DELETE_BUTTON_WIDTH}px)`;
        } else {
            // 원위치로 복귀
            card.classList.remove('swiped');
            card.style.transform = 'translateX(0)';
            card.querySelector('.delete-btn').style.opacity = '0';
            card.querySelector('.delete-btn').style.pointerEvents = 'none';
        }
        
        startX = 0;
        isSwiping = false;
    }, { passive: true });
    
    // 다른 카드 클릭 시 스와이프 해제
    card.addEventListener('click', (e) => {
        // 삭제 버튼 클릭이 아닌 경우에만
        if (!e.target.closest('.delete-btn')) {
            // 다른 모든 카드의 스와이프 해제
            document.querySelectorAll('.msg-card').forEach(otherCard => {
                if (otherCard !== card) {
                    otherCard.classList.remove('swiped');
                    otherCard.style.transform = 'translateX(0)';
                    otherCard.style.transition = 'transform 0.3s ease';
                    const deleteBtn = otherCard.querySelector('.delete-btn');
                    if (deleteBtn) {
                        deleteBtn.style.opacity = '0';
                        deleteBtn.style.pointerEvents = 'none';
                    }
                }
            });
        }
    });
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
    // 모든 채팅 사용자에 대해 빨간 점 표시/숨김 처리
    Object.keys(chatData).forEach(n=>{
        const el=document.getElementById("dot-"+n);
        if(el) {
            // unreadStatus가 true이면 표시, false이거나 없으면 숨김
            el.style.display = (unreadStatus[n] === true) ? "inline-block" : "none";
        }
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

/* ================== 읽지 않은 메시지 읽음 처리 ================== */
async function markMessagesAsRead(nickname) {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;
    
    // 해당 사용자로부터 받은 읽지 않은 메시지 찾기
    const userEmail = localStorage.getItem('user_email');
    const otherEmail = nicknameToEmail[nickname];
    
    if (!otherEmail) return;
    
    // 받은 쪽지 중에서 해당 사용자로부터 받은 읽지 않은 메시지 찾기
    const unreadMessages = messagesData.inbox.filter(msg => 
        msg.sender_email === otherEmail && 
        msg.recipient_email === userEmail && 
        !msg.read_at
    );
    
    // 각 메시지를 읽음 처리 (상세 조회 API 호출로 읽음 처리)
    for (const msg of unreadMessages) {
        try {
            await fetch(`https://chajabat.onrender.com/api/v1/messages/${msg.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
        } catch (error) {
            console.error('메시지 읽음 처리 실패:', error);
        }
    }
    
    // 메시지 데이터 다시 로드하여 읽음 상태 반영
    if (unreadMessages.length > 0) {
        await loadMessagesFromAPI();
    }
}

/* ================== 채팅 열기 ================== */
async function openChat(name){
    // 스와이프된 카드가 있으면 해제
    document.querySelectorAll('.msg-card.swiped').forEach(card => {
        card.classList.remove('swiped');
        card.style.transform = 'translateX(0)';
        card.style.transition = 'transform 0.3s ease';
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.style.opacity = '0';
            deleteBtn.style.pointerEvents = 'none';
        }
    });
    
    currentChatUser=name;
    
    // 상대방 이메일 찾기 (임시로 닉네임 사용, 실제로는 프로필 API 필요)
    currentChatUserEmail = nicknameToEmail[name] || null;
    
    // 읽지 않은 메시지들을 읽음 처리
    await markMessagesAsRead(name);
    
    unreadStatus[name]=false; 
    renderUnreadDots();
    
    document.getElementById("contactList").style.display="none";
    document.getElementById("chatWindow").style.display="flex";
    document.getElementById("chatName").textContent=name;
    
    // 채팅방이 열려있을 때 하단 헤더 숨기기
    const bottomNav = document.getElementById("bottomNav");
    if (bottomNav) {
        bottomNav.classList.add("hidden");
    }
    
    loadMessages(); 
    updateChatBellIcon();
}

/* ================== 닫기 ================== */
function closeChat(){
    document.getElementById("chatWindow").style.display="none";
    document.getElementById("contactList").style.display="block";
    
    // 쪽지함으로 돌아올 때 하단 헤더 다시 표시
    const bottomNav = document.getElementById("bottomNav");
    if (bottomNav) {
        bottomNav.classList.remove("hidden");
    }
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

/* ================== Enter 키 처리 ================== */
function handleEnter(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// 전역 함수로 등록
window.handleEnter = handleEnter;

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
    let list=chatData[currentChatUser]||[];
    
    // 메시지를 시간순으로 정렬 (오래된 것부터)
    list = [...list].sort((a, b) => {
        const timeA = a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime();
        const timeB = b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime();
        return timeA - timeB; // 오래된 것부터 (오름차순)
    });

    list.forEach((msg,i)=>{
        const row=document.createElement("div");
        // from 필드 확인 및 올바른 클래스 적용
        // from 필드가 없거나 잘못된 경우, sender_email로 판단
        let isRight = false;
        if (msg.from === "right") {
            isRight = true;
        } else if (msg.from === "left") {
            isRight = false;
        } else {
            // from 필드가 없는 경우 (localStorage에서 로드한 경우)
            // sender_email이 있으면 사용, 없으면 기본값 "left"
            const userEmail = localStorage.getItem('user_email');
            if (msg.sender_email && msg.sender_email === userEmail) {
                isRight = true;
                msg.from = "right";
            } else {
                isRight = false;
                msg.from = "left";
            }
        }
        
        row.classList.add("msg-row", isRight ? "right" : "left");

        const wrap=document.createElement("div");
        wrap.classList.add("msg-wrapper");

        const bubble=document.createElement("div");
        bubble.classList.add("msg-bubble", isRight ? "right-bubble" : "left-bubble");

        if(msg.image){
            const img=document.createElement("img");
            img.src=msg.image; 
            img.classList.add("chat-image");
            img.onclick=()=>openImgModal(msg.image);
            bubble.appendChild(img);
        } else {
            bubble.textContent=msg.text || "";
        }

        const next=list[i+1];
        const msgTime = msg.time instanceof Date ? msg.time : new Date(msg.time);
        const nextTime = next ? (next.time instanceof Date ? next.time : new Date(next.time)) : null;
        const showTime=!next || msgTime.getMinutes() !== nextTime.getMinutes() || next.from !== msg.from;
        if(showTime){
            const t=document.createElement("div");
            t.classList.add("msg-time");
            t.textContent=formatTime(msgTime);
            wrap.appendChild(t);
        }

        wrap.appendChild(bubble);
        row.appendChild(wrap);
        chat.appendChild(row);
    });
    
    // 스크롤을 맨 아래로 (최신 메시지)
    setTimeout(() => {
        chat.scrollTop = chat.scrollHeight;
    }, 100);
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

// 하단 네비 이벤트 리스너
document.querySelectorAll(".bottom-nav .nav-item").forEach(item=>{
    item.onclick=()=>{
        const label=item.querySelector(".nav-label").textContent.trim();
        if(label==="홈") location.href="../home/home.html";
        if(label==="쪽지함") location.href="contact.html";
        if(label==="마이페이지") location.href="../mypage/mypage.html";
    };
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

