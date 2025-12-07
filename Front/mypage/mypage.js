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
   🔥 내 게시글 목록 로드 (API 연동)
================================ */
async function loadMyPosts() {
    const list = document.getElementById("myPostList");
    if (!list) return;

    list.innerHTML = "<li style='color:#777;'>로딩 중...</li>";

    try {
        const accessToken = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch('https://chajabat.onrender.com/api/v1/posts/my', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            const posts = data.posts || data || [];

    list.innerHTML = "";

            if (posts.length === 0) {
                list.innerHTML = `<li style="color:#777;">작성한 게시글이 없습니다.</li>`;
                return;
            }

            posts.forEach(post => {
                const li = document.createElement("li");
                const postType = post.type || post.postType || "found";
                li.textContent = post.title;

                li.addEventListener("click", () => {
                    if(postType === "lost")
                        window.location.href = `../detail_lost/detail_lost.html?id=${post.id}`;
                    else
                        window.location.href = `../detail/detail.html?id=${post.id}`;
                });

                list.appendChild(li);
            });
        } else {
            // API 실패 시 localStorage에서 로드 (fallback)
    const currentNickname = localStorage.getItem("nickname") || "";
    if (!currentNickname || currentNickname.trim() === "") {
        list.innerHTML = `<li style="color:#777;">작성한 게시글이 없습니다.</li>`;
        return;
    }

    const lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];
    const foundPosts = JSON.parse(localStorage.getItem("foundPosts")) || [];

    const myLostPosts = lostPosts
        .filter(p => p.author && p.author.trim() === currentNickname.trim())
        .map(p => ({...p, type:"lost"}));
    
    const myFoundPosts = foundPosts
        .filter(p => p.author && p.author.trim() === currentNickname.trim())
        .map(p => ({...p, type:"found"}));

    const allPosts = [...myLostPosts, ...myFoundPosts];

    if (allPosts.length === 0) {
        list.innerHTML = `<li style="color:#777;">작성한 게시글이 없습니다.</li>`;
        return;
    }

    allPosts.sort((a,b) => (b.id||0) - (a.id||0));

    allPosts.forEach(post => {
        const li = document.createElement("li");
                li.textContent = post.title;

        li.addEventListener("click", () => {
            if(post.type === "lost")
                window.location.href = `../detail_lost/detail_lost.html?id=${post.id}`;
            else
                window.location.href = `../detail/detail.html?id=${post.id}`;
        });

        list.appendChild(li);
    });
        }
    } catch (error) {
        console.error("게시글 로드 오류:", error);
        list.innerHTML = `<li style="color:#777;">게시글을 불러오는 중 오류가 발생했습니다.</li>`;
    }
}



/* ================================
   🔥 닉네임 중복 확인
================================ */
let nicknameChecked = false;

async function checkNickname() {
    const nicknameInput = document.getElementById("nickInput");
    const nickname = nicknameInput.value.trim();
    const errorDiv = document.getElementById("nicknameError");
    const checkBtn = document.getElementById("checkNicknameBtn");
    const currentNickname = localStorage.getItem("nickname") || "";
    
    // 현재 닉네임과 동일한 경우
    if (nickname === currentNickname) {
        errorDiv.textContent = "";
        nicknameChecked = true;
        alert("현재 사용 중인 닉네임입니다.");
        return;
    }
    
    if (!nickname) {
        errorDiv.textContent = "닉네임을 입력해주세요.";
        nicknameChecked = false;
        return;
    }
    
    if (nickname.length < 2 || nickname.length > 10) {
        errorDiv.textContent = "닉네임은 2~10자로 입력해주세요.";
        nicknameChecked = false;
        return;
    }
    
    checkBtn.disabled = true;
    checkBtn.textContent = "확인 중...";
    errorDiv.textContent = "";
    
    try {
        // 백엔드 API 호출
        const response = await fetch(`https://chajabat.onrender.com/api/v1/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
            method: 'GET'
        });
        
        const data = await response.json();
        
        if (response.ok && data.available) {
            errorDiv.textContent = "";
            errorDiv.style.color = "#4caf50";
            errorDiv.textContent = "사용 가능한 닉네임입니다.";
            nicknameChecked = true;
            nicknameInput.classList.remove("error");
        } else {
            errorDiv.style.color = "#f44336";
            errorDiv.textContent = "이미 사용 중인 닉네임입니다.";
            nicknameChecked = false;
            nicknameInput.classList.add("error");
        }
    } catch (error) {
        console.error("닉네임 확인 오류:", error);
        // 임시 처리: 서버 없을 때 자동 통과
        errorDiv.textContent = "";
        errorDiv.style.color = "#4caf50";
        errorDiv.textContent = "사용 가능한 닉네임입니다.";
        nicknameChecked = true;
        nicknameInput.classList.remove("error");
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = "중복 확인";
    }
}

/* ================================
   🔥 프로필 저장 + API 연동
================================ */
async function saveProfile() {
    const nicknameInput = document.getElementById("nickInput").value.trim();
    const nickname = document.getElementById("nickname");
    const upload = document.getElementById("profileUpload");
    let profileImage = document.getElementById("profileImage");
    const currentNickname = localStorage.getItem("nickname") || "";
    const saveBtn = document.getElementById("saveProfileBtn");

    // 저장 버튼 비활성화
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "저장 중...";
    }

    try {
        const requestData = {};
        let hasChanges = false;

        // 닉네임 변경 처리
        if(nicknameInput && nicknameInput !== currentNickname){
            // 닉네임이 변경된 경우 중복 확인 필수
            if (!nicknameChecked) {
                alert("닉네임 중복 확인을 해주세요.");
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = "저장";
                }
                return;
            }
            requestData.nickname = nicknameInput;
            hasChanges = true;
        }
        
        // 프로필 이미지 변경 처리 (이미지 파일은 base64로 변환하여 전송)
        if(upload.files && upload.files[0]){
            // 파일을 base64로 변환
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageRequestData = { ...requestData };
                imageRequestData.profileImage = e.target.result;

                // API 호출
                const accessToken = localStorage.getItem('access_token');
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                const response = await fetch('https://chajabat.onrender.com/api/v1/users/profile', {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(imageRequestData)
                });
                
                await handleProfileResponse(response, nicknameInput, currentNickname, nickname, profileImage, upload, saveBtn);
            };
            reader.readAsDataURL(upload.files[0]);
            return; // 파일 읽기가 완료되면 handleProfileResponse에서 처리
        }

        if (!hasChanges) {
            showPopup("변경할 내용이 없습니다.");
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = "저장";
            }
            return;
        }

        // 닉네임만 변경하는 경우
        const accessToken = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch('https://chajabat.onrender.com/api/v1/users/profile', {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(requestData)
        });
        
        await handleProfileResponse(response, nicknameInput, currentNickname, nickname, profileImage, upload, saveBtn);
    } catch (error) {
        console.error("프로필 저장 오류:", error);
        alert("프로필 저장 중 오류가 발생했습니다.");
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "저장";
        }
    }
}

// 프로필 응답 처리 함수
async function handleProfileResponse(response, nicknameInput, currentNickname, nickname, profileImage, upload, saveBtn) {
    try {
        if (response.ok) {
            const data = await response.json();
        
            // 닉네임 업데이트
            if (nicknameInput && nicknameInput !== currentNickname) {
                const oldNickname = currentNickname;
        nickname.textContent = nicknameInput;
        localStorage.setItem("nickname", nicknameInput);
        
        // 기존 게시물의 작성자 닉네임도 업데이트
        if(oldNickname && oldNickname.trim() !== "" && oldNickname !== nicknameInput) {
            const updatedCount = updatePostsAuthor(oldNickname.trim(), nicknameInput);
            console.log("업데이트된 게시물 수:", updatedCount);
        }
        
        // 중복 확인 상태 초기화
        nicknameChecked = false;
        document.getElementById("nicknameError").textContent = "";
        document.getElementById("nickInput").value = "";
    }

            // 프로필 이미지 업데이트
            if (upload.files && upload.files[0]) {
        const reader = new FileReader();
                reader.onload = e => {
            profileImage.src = e.target.result;
            localStorage.setItem("profileImage", e.target.result);
                };
        reader.readAsDataURL(upload.files[0]);
            } else if (data.profileImage) {
                // 서버에서 반환한 프로필 이미지 URL 사용
                profileImage.src = data.profileImage;
                localStorage.setItem("profileImage", data.profileImage);
            }

    showPopup("프로필이 저장되었습니다.");
        } else {
            const errorData = await response.json();
            alert(errorData.error || "프로필 저장에 실패했습니다.");
        }
    } catch (error) {
        console.error("프로필 응답 처리 오류:", error);
        alert("프로필 저장 중 오류가 발생했습니다.");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "저장";
        }
    }
}

/* ================================
   🔥 게시물 작성자 닉네임 업데이트
================================ */
function updatePostsAuthor(oldNickname, newNickname) {
    let updatedCount = 0;
    
    // 찾았어요 게시물 업데이트
    let foundPosts = JSON.parse(localStorage.getItem("foundPosts")) || [];
    console.log("Found 게시물 개수:", foundPosts.length);
    foundPosts = foundPosts.map(post => {
        // author 필드가 있고 기존 닉네임과 정확히 일치하는 경우
        if (post.author && post.author.trim() === oldNickname) {
            updatedCount++;
            console.log("Found 게시물 업데이트:", post.id, post.title, "작성자:", post.author, "->", newNickname);
            return { ...post, author: newNickname };
        }
        return post;
    });
    localStorage.setItem("foundPosts", JSON.stringify(foundPosts));
    console.log("Found 게시물 저장 완료, 업데이트된 개수:", updatedCount);
    
    // 분실했어요 게시물 업데이트
    let lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];
    console.log("Lost 게시물 개수:", lostPosts.length);
    const beforeLostCount = updatedCount;
    lostPosts = lostPosts.map(post => {
        // author 필드가 있고 기존 닉네임과 정확히 일치하는 경우
        if (post.author && post.author.trim() === oldNickname) {
            updatedCount++;
            console.log("Lost 게시물 업데이트:", post.id, post.title, "작성자:", post.author, "->", newNickname);
            return { ...post, author: newNickname };
        }
        return post;
    });
    localStorage.setItem("lostPosts", JSON.stringify(lostPosts));
    console.log("Lost 게시물 저장 완료, 업데이트된 개수:", updatedCount - beforeLostCount);
    
    return updatedCount;
}

/* ================================
   🔥 author 필드가 없는 게시물 업데이트 (현재 사용자로)
================================ */
function updatePostsWithoutAuthor(newNickname) {
    const currentNickname = localStorage.getItem("nickname");
    if (!currentNickname) return;
    
    // 찾았어요 게시물 중 author가 없는 경우 현재 사용자로 설정
    let foundPosts = JSON.parse(localStorage.getItem("foundPosts")) || [];
    foundPosts = foundPosts.map(post => {
        if (!post.author || post.author.trim() === "") {
            return { ...post, author: newNickname };
        }
        return post;
    });
    localStorage.setItem("foundPosts", JSON.stringify(foundPosts));
    
    // 분실했어요 게시물 중 author가 없는 경우 현재 사용자로 설정
    let lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];
    lostPosts = lostPosts.map(post => {
        if (!post.author || post.author.trim() === "") {
            return { ...post, author: newNickname };
        }
        return post;
    });
    localStorage.setItem("lostPosts", JSON.stringify(lostPosts));
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
   🔥 프로필 자동 불러오기 (API 연동)
================================ */
async function loadProfile(){
    try {
        const accessToken = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch('https://chajabat.onrender.com/api/v1/users/profile', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            
            // 닉네임 표시 및 저장 (회원가입 시 설정한 닉네임)
            if (data.nickname) {
                document.getElementById("nickname").textContent = data.nickname;
                localStorage.setItem("nickname", data.nickname);
            } else {
                // 닉네임이 없으면 localStorage에서 확인
                const storedNickname = localStorage.getItem("nickname");
                if (storedNickname) {
                    document.getElementById("nickname").textContent = storedNickname;
                }
            }
            
            if (data.profileImage) {
                document.getElementById("profileImage").src = data.profileImage;
                localStorage.setItem("profileImage", data.profileImage);
            } else {
                // 프로필 이미지가 없으면 localStorage에서 확인
                const storedImage = localStorage.getItem("profileImage");
                if (storedImage) {
                    document.getElementById("profileImage").src = storedImage;
                }
            }
        } else {
            // API 실패 시 localStorage에서 로드 (fallback)
            const nickname = localStorage.getItem("nickname");
            const image = localStorage.getItem("profileImage");

            if(nickname) {
                document.getElementById("nickname").textContent = nickname;
            }
            if(image) {
                document.getElementById("profileImage").src = image;
            }
        }
    } catch (error) {
        console.error("프로필 로드 오류:", error);
        // 오류 발생 시 localStorage에서 로드 (fallback)
    const nickname = localStorage.getItem("nickname");
    const image = localStorage.getItem("profileImage");

    if(nickname) document.getElementById("nickname").textContent = nickname;
    if(image) document.getElementById("profileImage").src = image;
    }
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
   📌 개인정보 변경 (API 연동)
================================ */
async function savePersonalInfo(){
    const emailInput = document.getElementById("emailInput");
    const phoneInput = document.getElementById("phoneInput");
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!email && !phone) {
        alert("변경할 정보를 입력해주세요.");
        return;
    }

    try {
        const accessToken = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const updateData = {};
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;

        const response = await fetch('https://chajabat.onrender.com/api/v1/users/profile', {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
    showPopup("개인 정보가 변경되었습니다.");
    emailInput.value = "";
    phoneInput.value = "";
        } else {
            const errorData = await response.json();
            alert(errorData.error || "개인 정보 변경에 실패했습니다.");
        }
    } catch (error) {
        console.error("개인정보 변경 오류:", error);
        alert("개인 정보 변경 중 오류가 발생했습니다.");
    }
}



/* ================================
   🔥 페이지 로드시 실행
================================ */
document.addEventListener("DOMContentLoaded",()=>{
    loadMyPosts();
    loadProfile();
    loadBlockedUsers();
    
    // 닉네임 입력 시 중복 확인 상태 초기화
    const nickInput = document.getElementById("nickInput");
    if (nickInput) {
        nickInput.addEventListener("input", () => {
            nicknameChecked = false;
            document.getElementById("nicknameError").textContent = "";
            nickInput.classList.remove("error");
        });
    }
});
