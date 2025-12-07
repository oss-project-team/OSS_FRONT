document.addEventListener("DOMContentLoaded", async () => {
    // ================= 게시글 상세 데이터 표시 (API 연동) =================
    const params = new URLSearchParams(location.search);
    const postId = Number(params.get("id"));
    
    const accessToken = localStorage.getItem('access_token');
    let post = null;

    // API에서 게시글 상세 정보 가져오기
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`https://chajabat.onrender.com/api/v1/posts/${postId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            post = await response.json();
        } else {
            // API 실패 시 localStorage에서 로드 (fallback)
            let posts = JSON.parse(localStorage.getItem("lostPosts")) || [];
            post = posts.find(p => p.id === postId);
        }
    } catch (error) {
        console.error('게시글 로드 오류:', error);
        // 에러 발생 시 localStorage에서 로드 (fallback)
    let posts = JSON.parse(localStorage.getItem("lostPosts")) || [];
        post = posts.find(p => p.id === postId);
    }

    if (!post) {
        document.getElementById("detailTitle").textContent = "게시물을 찾을 수 없습니다.";
        document.getElementById("ownerBtns").style.display = "none";
        return;
    }

    // 데이터 표시
    document.getElementById("detailTitle").textContent = post.title;
    document.getElementById("detailDesc").textContent = post.content || post.description;
    document.getElementById("detailPlace").textContent = post.location || post.place;
    document.getElementById("detailDate").textContent = post.lost_date || post.date || post.created_at?.split('T')[0];
    document.getElementById("detailCategory").textContent = post.category;
    
    const postImage = (post.images && post.images.length > 0) ? post.images[0] : (post.img || null);
    if(postImage) {
        document.getElementById("detailImage").src = postImage;
    }

    // 작성자 정보 표시 (author_nickname 우선, 없으면 author_email 사용)
    let authorName = post.author_nickname || post.author || post.author_email || "닉네임";
    if (!authorName || authorName.trim() === "" || authorName.includes('@')) {
        // 이메일인 경우 닉네임으로 표시하지 않음
        authorName = post.author_nickname || "닉네임";
    }
    document.querySelector(".user-name").textContent = authorName;

    // 프로필 이미지 로드
    console.log('게시글 데이터:', {
        author_email: post.author_email,
        author_profile_image: post.author_profile_image,
        author_nickname: post.author_nickname
    });
    await loadAuthorProfileImage(post.author_email, post.author_profile_image);

    // 해결 상태 표시
    const statusText = document.querySelector(".status-text");
    const statusDot = document.querySelector(".status-dot");
    const isSolved = post.status === 'Completed' || post.solved;
    
    if (isSolved) {
        statusText.textContent = "해결 완료";
        statusDot.style.background = "#2ecc71";
    } else {
        statusText.textContent = "해결 중";
        statusDot.style.background = "#ff9800";
    }

    // 현재 로그인한 사용자 확인 (이메일로 비교)
    const currentUserEmail = localStorage.getItem('user_email') || '';
    const postAuthorEmail = post.author_email || '';
    const isAuthor = currentUserEmail && postAuthorEmail && currentUserEmail === postAuthorEmail;
    
    // 작성자일 경우에만 수정/삭제 버튼 표시
    const msgBtn = document.getElementById("msgBtn");
    const ownerBtns = document.getElementById("ownerBtns");
    const statusToggleBtn = document.getElementById("statusToggleBtn");
    if (isAuthor) {
        ownerBtns.style.display = "flex";
        statusToggleBtn.style.display = "flex";
        if (msgBtn) msgBtn.style.display = "none";
    } else {
        ownerBtns.style.display = "none";
        statusToggleBtn.style.display = "none";
        if (msgBtn) msgBtn.style.display = "block";
    }
    
    // 🔥 쪽지 보내기 (게시글 정보 저장 → contact에 표시될 제목/카테고리 전달)
    if (msgBtn) {
        msgBtn.addEventListener("click", () => {
            const user = document.querySelector(".user-name").textContent.trim();  // 상대 닉네임
            const title = document.getElementById("detailTitle").textContent.trim();
            const category = document.getElementById("detailCategory").textContent.trim();
            const recipientEmail = post.author_email || post.author || '';  // 상대방 이메일

            // 🔥 기존 chatInfo 불러오기
            let chatInfo = JSON.parse(localStorage.getItem("chatInfo") || "{}");

            // 🔥 user 기준으로 제목/카테고리 저장
            chatInfo[user] = { title, category };
            localStorage.setItem("chatInfo", JSON.stringify(chatInfo));

            // contact로 이동 (user와 email 전달)
            const params = new URLSearchParams({
                user: user,
                title: title,
                category: category
            });
            if (recipientEmail) {
                params.append('email', recipientEmail);
            }
            window.location.href = "../contact/contact.html?" + params.toString();
        });
    }
    
    // 해결 상태 전환 버튼 (상단 토글 아이콘) - API 연동
    statusToggleBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        
        if (!accessToken) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        // 회전 애니메이션
        const icon = statusToggleBtn.querySelector(".material-icons");
        icon.style.transform = "rotate(360deg)";
        icon.style.transition = "transform 0.3s";
        
        setTimeout(() => {
            icon.style.transform = "rotate(0deg)";
        }, 300);
        
        const newStatus = post.status === 'Completed' ? 'Waiting' : 'Completed';
        
        try {
            const response = await fetch(`https://chajabat.onrender.com/api/v1/posts/${postId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                post.status = newStatus;
        
                // 상태 업데이트
                if (post.status === 'Completed') {
                    statusText.textContent = "해결 완료";
                    statusDot.style.background = "#2ecc71";
                } else {
                    statusText.textContent = "해결 중";
                    statusDot.style.background = "#ff9800";
                }

                // localStorage에도 업데이트 (fallback)
                let posts = JSON.parse(localStorage.getItem("lostPosts")) || [];
                posts = posts.map(p => p.id === postId ? { ...p, solved: post.status === 'Completed' } : p);
                localStorage.setItem("lostPosts", JSON.stringify(posts));
            } else {
                const data = await response.json();
                alert(data.error || '상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('상태 변경 오류:', error);
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    });

    /* ================== ✏ 수정하기 ================== */
    document.getElementById("editBtn").onclick = () => {
        window.location.href = `../createlost/createlost.html?edit=${postId}&origin=detail`;
    };

    /* ================== 🗑 삭제하기 ================== */
    const deleteModal = document.getElementById("deleteConfirmModal");

    document.getElementById("deleteBtn").onclick = () => {
        deleteModal.classList.add("show");
    };

    document.getElementById("deleteCancelBtn").onclick = () => {
        deleteModal.classList.remove("show");
    };

    document.getElementById("deleteConfirmBtn").onclick = async () => {
        if (!accessToken) {
            alert('로그인이 필요합니다.');
            deleteModal.classList.remove("show");
            return;
        }

        try {
            const response = await fetch(`https://chajabat.onrender.com/api/v1/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                // localStorage에서도 삭제 (fallback)
                let posts = JSON.parse(localStorage.getItem("lostPosts")) || [];
            posts = posts.filter(p => p.id !== postId);
            localStorage.setItem("lostPosts", JSON.stringify(posts));
                
                deleteModal.classList.remove("show");
                // 삭제 성공 팝업 표시
                showDeleteSuccessPopup();
            } else {
                const data = await response.json();
                alert(data.error || '게시물 삭제에 실패했습니다.');
                deleteModal.classList.remove("show");
            }
        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            alert('게시물 삭제 중 오류가 발생했습니다.');
            deleteModal.classList.remove("show");
        }
    };
    
    // 삭제 성공 팝업 표시 함수
    function showDeleteSuccessPopup() {
        const popup = document.getElementById('successPopup');
        const popupCloseBtn = document.getElementById('popupCloseBtn');
        
        popup.classList.add('show');
        
        const closePopup = () => {
            popup.classList.remove('show');
            location.replace("../home/home.html?type=Lost");
        };
        
        popupCloseBtn.onclick = closePopup;
        popup.onclick = (e) => {
            if (e.target === popup) {
                closePopup();
            }
        };
    }

    /* ================== 🔙 뒤로가기 ================== */
    document.getElementById("backBtn").onclick = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const origin = urlParams.get("origin");
        
        if (origin === "search") {
            window.location.href = "../search/search.html";
        } else {
            window.location.href = "../home/home.html?type=Lost";
        }
    };
});

/* ================== 작성자 프로필 이미지 로드 ================== */
async function loadAuthorProfileImage(authorEmail, authorProfileImage) {
    const profileBox = document.querySelector(".user-profile");
    if (!profileBox) return;
    
    console.log('프로필 이미지 로드 시작:', {
        authorEmail,
        authorProfileImage,
        hasImage: !!authorProfileImage
    });
    
    // 백엔드에서 프로필 이미지가 함께 반환된 경우
    if (authorProfileImage && authorProfileImage.trim() !== '') {
        console.log('백엔드에서 받은 프로필 이미지 사용:', authorProfileImage);
        profileBox.style.backgroundImage = `url(${authorProfileImage})`;
        profileBox.style.backgroundSize = "cover";
        profileBox.style.backgroundPosition = "center";
        return;
    }
    
    // 작성자 이메일이 없으면 기본 이미지 사용
    if (!authorEmail) {
        return;
    }
    
    // 현재 로그인한 사용자와 작성자가 같은 경우 localStorage에서 가져오기
    const currentUserEmail = localStorage.getItem('user_email');
    if (currentUserEmail === authorEmail) {
        const myProfileImg = localStorage.getItem("profileImage");
        if (myProfileImg) {
            profileBox.style.backgroundImage = `url(${myProfileImg})`;
            profileBox.style.backgroundSize = "cover";
            profileBox.style.backgroundPosition = "center";
            return;
        }
    }
    
    // 작성자의 프로필 이미지를 가져오기 위해 사용자 프로필 API 호출
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
        try {
            const profileResponse = await fetch(`https://chajabat.onrender.com/api/v1/users/${encodeURIComponent(authorEmail)}/profile`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log('프로필 API 응답:', profileData);
                if (profileData.profileImage && profileData.profileImage.trim() !== '') {
                    console.log('프로필 API에서 받은 이미지 사용:', profileData.profileImage);
                    profileBox.style.backgroundImage = `url(${profileData.profileImage})`;
                    profileBox.style.backgroundSize = "cover";
                    profileBox.style.backgroundPosition = "center";
                    return;
                }
            } else {
                console.error('프로필 API 호출 실패:', profileResponse.status, await profileResponse.text());
            }
        } catch (error) {
            console.error('프로필 이미지 로드 오류:', error);
        }
    }
    
    // 모든 방법이 실패하면 기본 스타일 유지
}
