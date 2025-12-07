/* ============================================
   📌 분실했어요 게시글 작성 JS 최종 통합본
   (모달 미리보기 + 저장 완료 모달 적용 완료)
============================================ */

/* URL 파라미터 (edit 모드 확인) */
const params = new URLSearchParams(window.location.search);
const editId = params.get("edit");
const origin = params.get("origin");

let postData = {
    id: editId ? Number(editId) : Date.now(),
    images: [],
    title: "",
    description: "",
    category: "",
    location: "",
    lostDate: ""
};

/* ------------------------------------
   🔙 뒤로가기
------------------------------------ */
document.getElementById("backBtn").addEventListener("click", () => {
    if (origin === "detail") {
        history.back();
    } else {
        history.back();
    }
});

/* ------------------------------------
   ✏ 제목 글자수 카운트
------------------------------------ */
const titleInput = document.getElementById("title");
const titleCount = document.getElementById("titleCount");

titleInput.addEventListener("input", () => {
    titleCount.textContent = titleInput.value.length;
    postData.title = titleInput.value.trim();
});

/* ------------------------------------
   ✏ 설명 글자수
------------------------------------ */
const descInput = document.getElementById("description");
const descCount = document.getElementById("descriptionCount");

descInput.addEventListener("input", () => {
    descCount.textContent = descInput.value.length;
    postData.description = descInput.value.trim();
});

/* ------------------------------------
   🟦 카테고리 선택
------------------------------------ */
document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        postData.category = btn.dataset.category;
    });
});

/* ------------------------------------
   📍 장소 입력
------------------------------------ */
document.getElementById("location").addEventListener("input", e => {
    postData.location = e.target.value.trim();
});

/* ------------------------------------
   📅 날짜 입력
------------------------------------ */
document.getElementById("lostDate").addEventListener("change", e => {
    postData.lostDate = e.target.value;
});

/* ------------------------------------
   🖼 이미지 업로드 & 미리보기
------------------------------------ */
const imageUpload = document.getElementById("imageUpload");
const previewList = document.getElementById("imagePreviewList");
const uploadBtn = document.getElementById("uploadBtn");

imageUpload.addEventListener("change", event => {
    const files = [...event.target.files];

    for (let file of files) {
        if (postData.images.length >= 5) break;

        const reader = new FileReader();
        reader.onload = () => {
            postData.images.push({ url: reader.result });
            renderPreview();
        };
        reader.readAsDataURL(file);
    }
    imageUpload.value = "";
});

let currentImageIndex = 0;

function renderPreview() {
    previewList.innerHTML = "";

    postData.images.forEach((imgObj, index) => {
        const div = document.createElement("div");
        div.className = "image-preview-item";
        div.innerHTML = `
            <img src="${imgObj.url || imgObj}" data-index="${index}">
            <button class="remove-btn"><i class="material-icons">close</i></button>
        `;
        previewList.appendChild(div);

        // 이미지 클릭 시 뷰어 열기
        div.querySelector("img").addEventListener("click", () => {
            currentImageIndex = index;
            openImageViewer(index);
        });

        // 삭제 버튼
        div.querySelector(".remove-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            postData.images.splice(index, 1);
            renderPreview();
        });
    });

    uploadBtn.classList.toggle("hidden", postData.images.length >= 5);
}

/* 이미지 뷰어 열기 */
function openImageViewer(index) {
    const viewerModal = document.getElementById("imageViewerModal");
    const viewerImage = document.getElementById("viewerImage");
    const viewerIndex = document.getElementById("imageViewerIndex");
    
    currentImageIndex = index;
    const img = postData.images[index];
    viewerImage.src = img.url || img;
    viewerIndex.textContent = `${index + 1} / ${postData.images.length}`;
    
    // 이전/다음 버튼 활성화 상태 업데이트
    const prevBtn = document.getElementById("prevImage");
    const nextBtn = document.getElementById("nextImage");
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === postData.images.length - 1;
    
    viewerModal.classList.add("show");
}

/* 이미지 뷰어 닫기 */
document.getElementById("closeImageViewer").addEventListener("click", () => {
    document.getElementById("imageViewerModal").classList.remove("show");
});

/* 이전 이미지 */
document.getElementById("prevImage").addEventListener("click", () => {
    if (currentImageIndex > 0) {
        openImageViewer(currentImageIndex - 1);
    }
});

/* 다음 이미지 */
document.getElementById("nextImage").addEventListener("click", () => {
    if (currentImageIndex < postData.images.length - 1) {
        openImageViewer(currentImageIndex + 1);
    }
});

/* ------------------------------------
   🟦 "작성 완료" → 미리보기 모달 실행
------------------------------------ */
const submitBtn = document.getElementById("submitBtn");
const confirmModal = document.getElementById("confirmModal");
const modalPreview = document.getElementById("modalPreview");

submitBtn.addEventListener("click", () => {

    if (!postData.title || !postData.description ||
        !postData.category || !postData.location || !postData.lostDate) {
        alert("모든 항목을 입력해주세요.");
        return;
    }

    confirmModal.classList.add("show");

    modalPreview.innerHTML = `
        <div class="preview-item"><div class="preview-item-label">제목</div><div class="preview-item-value">${postData.title}</div></div>
        <div class="preview-item"><div class="preview-item-label">카테고리</div><div class="preview-item-value">${postData.category}</div></div>
        <div class="preview-item"><div class="preview-item-label">설명</div><div class="preview-item-value">${postData.description}</div></div>
        <div class="preview-item"><div class="preview-item-label">장소</div><div class="preview-item-value">${postData.location}</div></div>
        <div class="preview-item"><div class="preview-item-label">날짜</div><div class="preview-item-value">${postData.lostDate}</div></div>
        <div class="preview-images">
            ${postData.images.map(i => `<img src="${i.url}">`).join("")}
        </div>
    `;
});

/* 취소 버튼 */
document.getElementById("cancelBtn").addEventListener("click", () => {
    confirmModal.classList.remove("show");
});

/* ------------------------------------
   🔥 "올리기" → 저장 → 완료 팝업 표시 (API 연동)
------------------------------------ */
document.getElementById("confirmBtn").addEventListener("click", async () => {
    const confirmBtn = document.getElementById("confirmBtn");
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
        alert('로그인이 필요합니다.');
        window.location.href = '../login/login.html';
        return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = '저장 중...';

    try {
        // 수정 모드인 경우
    if (editId) {
            const response = await fetch(`https://chajabat.onrender.com/api/v1/posts/${editId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    title: postData.title,
                    content: postData.description,
                    category: postData.category,
                    location: postData.location,
                    lost_date: postData.lostDate,
                    images: postData.images.map(img => {
                        // base64 문자열이면 그대로 사용
                        if (typeof img === 'string') {
                            if (img.startsWith('data:image')) {
                                return img;
                            }
                            return img;
                        }
                        return img.url || img.data || img;
                    })
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                alert(data.error || '게시글 수정에 실패했습니다.');
                return;
            }
            
            // 성공 시 localStorage에도 업데이트 (fallback)
            let lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];
        lostPosts = lostPosts.map(p =>
            p.id == editId
                ? {
                    ...p,
                    title: postData.title,
                    description: postData.description,
                    category: postData.category,
                    place: postData.location,
                    date: postData.lostDate,
                    img: postData.images[0] ? postData.images[0].url : null
                }
                : p
        );
            localStorage.setItem("lostPosts", JSON.stringify(lostPosts));
    } else {
        // 신규 작성
            const response = await fetch('https://chajabat.onrender.com/api/v1/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    type: 'Lost',
                    title: postData.title,
                    content: postData.description,
                    category: postData.category,
                    location: postData.location,
                    lost_date: postData.lostDate,
                    images: postData.images.map(img => {
                        // base64 문자열이면 그대로 사용
                        if (typeof img === 'string') {
                            if (img.startsWith('data:image')) {
                                return img;
                            }
                            return img;
                        }
                        // 객체인 경우 url 속성 확인
                        return img.url || img.data || img;
                    })
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                alert(data.error || '게시글 작성에 실패했습니다.');
                return;
            }
            
            // 성공 시 localStorage에도 저장 (fallback)
            let lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];
            let nickname = localStorage.getItem("nickname") || "사용자";
        lostPosts.push({
                id: data.id || postData.id,
            img: postData.images[0] ? postData.images[0].url : null,
            title: postData.title,
            description: postData.description,
            place: postData.location,
            date: postData.lostDate,
            solved: false,
            category: postData.category,
            author: nickname.trim()
        });
            localStorage.setItem("lostPosts", JSON.stringify(lostPosts));
    }

    confirmModal.classList.remove("show");
        document.getElementById("uploadModal").classList.add("show");
    } catch (error) {
        console.error('게시글 저장 오류:', error);
        alert('게시글 저장 중 오류가 발생했습니다.');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '올리기';
    }
});

/* 저장 완료 모달 확인 → 홈 또는 detail 이동 */
document.getElementById("uploadOkBtn").addEventListener("click", () => {
    document.getElementById("uploadModal").classList.remove("show");
    if (editId && origin === "detail") {
        window.location.href = `../detail_lost/detail_lost.html?id=${editId}`;
    } else {
        window.location.href = "../home/home.html?type=Lost";
    }
});

/* 수정모드 데이터 로드 (API 연동) */
async function loadEditData() {
    if (!editId) return;

    const accessToken = localStorage.getItem('access_token');
    
    try {
        // API에서 게시글 상세 정보 가져오기
        const headers = {
            'Content-Type': 'application/json'
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`https://chajabat.onrender.com/api/v1/posts/${editId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const target = await response.json();
            
            // 입력 필드에 기존 값 채우기
            titleInput.value = target.title || '';
            descInput.value = target.content || target.description || '';
            document.getElementById("location").value = target.location || '';
            document.getElementById("lostDate").value = target.lost_date || target.date || '';
            titleCount.textContent = (target.title || '').length;
            descCount.textContent = (target.content || target.description || '').length;

            // postData 객체도 업데이트
            postData.title = target.title || '';
            postData.description = target.content || target.description || '';
            postData.location = target.location || '';
            postData.lostDate = target.lost_date || target.date || '';
            postData.category = target.category || '';
            postData.images = target.images && target.images.length > 0 
                ? target.images.map(img => ({ url: img }))
                : (target.img ? [{ url: target.img }] : []);

            // 카테고리 버튼 활성화
            document.querySelectorAll(".category-btn").forEach(btn => {
                if (btn.dataset.category === target.category) {
                    btn.classList.add("active");
                }
            });

            renderPreview();
        } else {
            // API 실패 시 localStorage에서 로드 (fallback)
            let posts = JSON.parse(localStorage.getItem("lostPosts")) || [];
            const target = posts.find(p => p.id == editId);
            if (!target) return;

            // 입력 필드에 기존 값 채우기
            titleInput.value = target.title || '';
            descInput.value = target.description || '';
            document.getElementById("location").value = target.place || '';
            document.getElementById("lostDate").value = target.date || '';
            titleCount.textContent = (target.title || '').length;
            descCount.textContent = (target.description || '').length;

            // postData 객체도 업데이트
            postData.title = target.title || '';
            postData.description = target.description || '';
            postData.location = target.place || '';
            postData.lostDate = target.date || '';
            postData.category = target.category || '';
            postData.images = target.img ? [{ url: target.img }] : [];

            // 카테고리 버튼 활성화
            document.querySelectorAll(".category-btn").forEach(btn => {
                if (btn.dataset.category === target.category) {
                    btn.classList.add("active");
                }
            });

            renderPreview();
        }
    } catch (error) {
        console.error('게시글 로드 오류:', error);
        // 에러 발생 시 localStorage에서 로드 (fallback)
    let posts = JSON.parse(localStorage.getItem("lostPosts")) || [];
    const target = posts.find(p => p.id == editId);
    if (!target) return;

    titleInput.value = target.title;
    descInput.value = target.description;
    document.getElementById("location").value = target.place;
    document.getElementById("lostDate").value = target.date;
    titleCount.textContent = target.title.length;
    descCount.textContent = target.description.length;

    postData.category = target.category;
    postData.images = target.img ? [{ url: target.img }] : [];

    document.querySelectorAll(".category-btn").forEach(btn => {
        if (btn.dataset.category === target.category) {
            btn.classList.add("active");
        }
    });

    renderPreview();
    }
}

// 페이지 로드 시 수정 모드 데이터 로드
document.addEventListener("DOMContentLoaded", () => {
    // 수정 모드인 경우 버튼 텍스트 변경
    if (editId) {
        document.getElementById("submitBtn").textContent = "수정 완료";
    }
    loadEditData();
});
