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

    // 프로필 이미지 (마이페이지에서 저장된 값 사용)
    const myProfileImg = localStorage.getItem("myProfileImg");
    const profileBox = document.querySelector(".user-profile");
    if (post.profileImg || myProfileImg) {
        profileBox.style.backgroundImage = `url(${post.profileImg || myProfileImg})`;
        profileBox.style.backgroundSize = "cover";
        profileBox.style.backgroundPosition = "center";
    }

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
    const ownerBtns = document.getElementById("ownerBtns");
    if (isAuthor) {
        ownerBtns.style.display = "flex";
    } else {
        ownerBtns.style.display = "none";
    }

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
                alert("게시물이 삭제되었습니다.");
                location.replace("../home/home.html?type=Lost");
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
