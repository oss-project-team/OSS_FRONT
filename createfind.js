/* =========================================================================
   createfind.js – 최종 통합 버전 (글쓰기 + 수정 + 모달 + 이미지 + 이동)
   ========================================================================= */

/* URL 파라미터 (edit 모드 확인) */
const params = new URLSearchParams(window.location.search);
const editId = params.get("edit");
const origin = params.get("origin");

/* 게시물 데이터 구조 */
let postData = {
    id: editId ? Number(editId) : Date.now(),
    images: [],
    title: "",
    description: "",
    category: "",
    location: "",
    foundDate: ""
};

/* DOM 요소 리스트 */
let backBtn, imageUpload, imagePreviewList, uploadBtn;
let titleInput, titleCount, descriptionInput, descriptionCount;
let categoryButtons, locationInput, foundDateInput, submitBtn;
let confirmModal, cancelBtn, confirmBtn, modalPreview;
let imageViewerModal, viewerImage, imageViewerIndex, closeImageViewer;
let uploadModal, uploadOkBtn;

let currentImageIndex = 0;
const MAX_IMAGES = 5;

/* =========================================================================
   이미지 업로드
=========================================================================== */
function setupImageUpload() {
    imageUpload.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                postData.images.push(ev.target.result);
                updatePreview();
            };
            reader.readAsDataURL(file);
        });

        e.target.value = "";
    });
}

function updatePreview() {
    imagePreviewList.innerHTML = "";

    postData.images.forEach((img, i) => {
        const box = document.createElement("div");
        box.className = "image-preview-item";
        box.innerHTML = `
            <img src="${img}" data-index="${i}">
            <button class="remove-btn" data-index="${i}">
                <i class="material-icons">close</i>
            </button>
        `;
        imagePreviewList.appendChild(box);
    });

    uploadBtn.style.display =
        postData.images.length >= MAX_IMAGES ? "none" : "flex";
}

/* =========================================================================
   확인 모달
=========================================================================== */
function showConfirmModal() {
    modalPreview.innerHTML = `
        <div class="preview-item">
            <div class="preview-item-label">제목</div>
            <div class="preview-item-value">${postData.title}</div>
        </div>
        <div class="preview-item">
            <div class="preview-item-label">카테고리</div>
            <div class="preview-item-value">${postData.category}</div>
        </div>
        <div class="preview-item">
            <div class="preview-item-label">설명</div>
            <div class="preview-item-value">${postData.description}</div>
        </div>
        <div class="preview-item">
            <div class="preview-item-label">장소</div>
            <div class="preview-item-value">${postData.location}</div>
        </div>
        <div class="preview-item">
            <div class="preview-item-label">날짜</div>
            <div class="preview-item-value">${postData.foundDate}</div>
        </div>
        <div class="preview-images">
            ${postData.images.map(i => `<img src="${i}">`).join("")}
        </div>
    `;
    confirmModal.classList.add("show");
}

/* =========================================================================
   게시물 저장 (신규/수정) - API 연동
=========================================================================== */
async function savePost() {
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
        alert('로그인이 필요합니다.');
        window.location.href = '../login/login.html';
        return;
    }

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
                    lost_date: postData.foundDate,
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
            let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];
        posts = posts.map(p =>
            p.id == editId
                ? {
                    ...p,
                    title: postData.title,
                    description: postData.description,
                    category: postData.category,
                    place: postData.location,
                    date: postData.foundDate,
                    img: postData.images[0] || null
                }
                : p
        );
            localStorage.setItem("foundPosts", JSON.stringify(posts));
    } else {
            // 신규 작성
            // 이미지 배열 처리 - base64 문자열을 그대로 전송 (백엔드에서 처리)
            const imageUrls = postData.images.map(img => {
                // base64 문자열이면 그대로 사용, 아니면 url 속성 확인
                if (typeof img === 'string') {
                    // base64 데이터 URL인지 확인
                    if (img.startsWith('data:image')) {
                        return img;
                    }
                    return img;
                }
                // 객체인 경우 url 속성 또는 base64 데이터 확인
                return img.url || img.data || img;
            });
            
            const requestBody = {
                type: 'Found',
                title: postData.title,
                content: postData.description,
                category: postData.category,
                location: postData.location,
                lost_date: postData.foundDate,
                images: imageUrls
            };
            
            console.log('게시글 작성 요청:', {
                ...requestBody,
                images: imageUrls.map((img, idx) => `이미지${idx + 1}: ${img ? img.substring(0, 50) + '...' : '없음'}`)
            });
            
            const response = await fetch('https://chajabat.onrender.com/api/v1/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(requestBody)
            });

            // 응답 처리
            if (!response.ok) {
                let errorMessage = `게시글 작성에 실패했습니다. (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    const errorText = await response.text();
                    if (errorText) {
                        try {
                            const errorData = JSON.parse(errorText);
                            errorMessage = errorData.error || errorMessage;
                        } catch (e2) {
                            errorMessage = errorText || errorMessage;
                        }
                    }
                }
                alert(errorMessage);
                return;
            }
            
            let data;
            try {
                const responseText = await response.text();
                if (responseText) {
                    data = JSON.parse(responseText);
                } else {
                    data = {};
                }
            } catch (jsonError) {
                console.error('JSON 파싱 오류:', jsonError);
                alert('서버 응답을 처리하는 중 오류가 발생했습니다.');
                return;
            }
            
            // 성공 시 localStorage에도 저장 (fallback)
            let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];
            let nickname = localStorage.getItem("nickname") || "사용자";
        posts.push({
                id: data.id || postData.id,
            title: postData.title,
            description: postData.description,
            category: postData.category,
            place: postData.location,
            date: postData.foundDate,
            img: postData.images[0] || null,
            solved: false,
            author: nickname.trim()
        });
    localStorage.setItem("foundPosts", JSON.stringify(posts));
        }
    } catch (error) {
        console.error('게시글 저장 오류:', error);
        alert('게시글 저장 중 오류가 발생했습니다.');
        throw error;
    }
}

/* =========================================================================
   업로드 완료 팝업
=========================================================================== */
function showUploadModal() {
    uploadModal.classList.add("show");
}

/* =========================================================================
   이벤트 바인딩
=========================================================================== */
function setupEvents() {

    /* 뒤로가기 */
    backBtn.addEventListener("click", () => {
        if (origin === "search") {
            window.location.href = "../search/search.html";
        } else if (origin === "detail") {
            history.back();
        } else {
            window.location.href = "../home/home.html";
        }
    });

    /* 카테고리 선택 */
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            categoryButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            postData.category = btn.dataset.category;
        });
    });

    /* 입력 반영 */
    titleInput.addEventListener("input", () => {
        postData.title = titleInput.value;
        titleCount.textContent = postData.title.length;
    });

    descriptionInput.addEventListener("input", () => {
        postData.description = descriptionInput.value;
        descriptionCount.textContent = postData.description.length;
    });

    locationInput.addEventListener("input", () => {
        postData.location = locationInput.value;
    });

    foundDateInput.addEventListener("change", () => {
        postData.foundDate = foundDateInput.value;
    });

    /* 이미지 삭제/확대 */
    imagePreviewList.addEventListener("click", (e) => {
        const btn = e.target.closest(".remove-btn");
        if (btn) {
            const index = Number(btn.dataset.index);
            postData.images.splice(index, 1);
            updatePreview();
            return;
        }

        if (e.target.tagName === "IMG") {
            currentImageIndex = Number(e.target.dataset.index);
            viewerImage.src = postData.images[currentImageIndex];
            imageViewerIndex.textContent = `${currentImageIndex + 1} / ${postData.images.length}`;
            imageViewerModal.classList.add("show");
        }
    });

    closeImageViewer.addEventListener("click", () => {
        imageViewerModal.classList.remove("show");
    });

    /* 작성 완료 클릭 */
    submitBtn.addEventListener("click", () => {
        if (!postData.title.trim()) return alert("제목을 입력하세요.");
        if (!postData.description.trim()) return alert("설명을 입력하세요.");
        if (!postData.category) return alert("카테고리를 선택하세요.");
        if (!postData.location.trim()) return alert("장소를 입력하세요.");
        if (!postData.foundDate) return alert("날짜를 선택하세요.");

        showConfirmModal();
    });

    /* 확인 모달 취소 */
    cancelBtn.addEventListener("click", () => {
        confirmModal.classList.remove("show");
    });

    /* 올리기 */
    confirmBtn.addEventListener("click", async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = '저장 중...';
        
        try {
            await savePost();
        confirmModal.classList.remove("show");
        showUploadModal();
        } catch (error) {
            // 에러는 savePost에서 이미 처리됨
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = '올리기';
        }
    });

    /* 업로드 완료 → 홈 또는 detail 이동 */
    uploadOkBtn.addEventListener("click", () => {
        if (editId && origin === "detail") {
            window.location.href = `../detail/detail.html?id=${editId}`;
        } else {
            window.location.href = "../home/home.html";
        }
    });
}

/* =========================================================================
   수정모드 데이터 로드 (API 연동)
=========================================================================== */
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
            descriptionInput.value = target.content || target.description || '';
            locationInput.value = target.location || '';
            foundDateInput.value = target.lost_date || target.date || '';

            // postData 객체도 업데이트
            postData.title = target.title || '';
            postData.description = target.content || target.description || '';
            postData.location = target.location || '';
            postData.foundDate = target.lost_date || target.date || '';
            postData.category = target.category || '';
            postData.images = target.images && target.images.length > 0 
                ? target.images 
                : (target.img ? [target.img] : []);

            // 글자 수 카운트 업데이트
            titleCount.textContent = (target.title || '').length;
            descriptionCount.textContent = (target.content || target.description || '').length;

            // 카테고리 버튼 활성화
            categoryButtons.forEach(btn => {
                if (btn.dataset.category === target.category) {
                    btn.classList.add("active");
                }
            });

            updatePreview();
        } else {
            // API 실패 시 localStorage에서 로드 (fallback)
            let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];
            const target = posts.find(p => p.id == editId);
            if (!target) return;

            // 입력 필드에 기존 값 채우기
            titleInput.value = target.title || '';
            descriptionInput.value = target.description || '';
            locationInput.value = target.place || '';
            foundDateInput.value = target.date || '';

            // postData 객체도 업데이트
            postData.title = target.title || '';
            postData.description = target.description || '';
            postData.location = target.place || '';
            postData.foundDate = target.date || '';
            postData.category = target.category || '';
            postData.images = target.img ? [target.img] : [];

            // 글자 수 카운트 업데이트
            titleCount.textContent = (target.title || '').length;
            descriptionCount.textContent = (target.description || '').length;

            // 카테고리 버튼 활성화
            categoryButtons.forEach(btn => {
                if (btn.dataset.category === target.category) {
                    btn.classList.add("active");
                }
            });

            updatePreview();
        }
    } catch (error) {
        console.error('게시글 로드 오류:', error);
        // 에러 발생 시 localStorage에서 로드 (fallback)
    let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];
    const target = posts.find(p => p.id == editId);
    if (!target) return;

    titleInput.value = target.title;
    descriptionInput.value = target.description;
    locationInput.value = target.place;
    foundDateInput.value = target.date;

    postData.category = target.category;
    postData.images = target.img ? [target.img] : [];

    categoryButtons.forEach(btn => {
        if (btn.dataset.category === target.category) {
            btn.classList.add("active");
        }
    });

    updatePreview();
    }
}

/* =========================================================================
   초기 실행
=========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    backBtn = document.getElementById("backBtn");
    imageUpload = document.getElementById("imageUpload");
    imagePreviewList = document.getElementById("imagePreviewList");
    uploadBtn = document.getElementById("uploadBtn");

    titleInput = document.getElementById("title");
    titleCount = document.getElementById("titleCount");
    descriptionInput = document.getElementById("description");
    descriptionCount = document.getElementById("descriptionCount");

    categoryButtons = document.querySelectorAll(".category-btn");
    locationInput = document.getElementById("location");
    foundDateInput = document.getElementById("foundDate");
    submitBtn = document.getElementById("submitBtn");

    confirmModal = document.getElementById("confirmModal");
    cancelBtn = document.getElementById("cancelBtn");
    confirmBtn = document.getElementById("confirmBtn");
    modalPreview = document.getElementById("modalPreview");

    imageViewerModal = document.getElementById("imageViewerModal");
    viewerImage = document.getElementById("viewerImage");
    imageViewerIndex = document.getElementById("imageViewerIndex");
    closeImageViewer = document.getElementById("closeImageViewer");

    uploadModal = document.getElementById("uploadModal");
    uploadOkBtn = document.getElementById("uploadOkBtn");

    setupImageUpload();
    setupEvents();
    loadEditData();
    updatePreview();
});
