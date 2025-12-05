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
   게시물 저장 (신규/수정)
=========================================================================== */
function savePost() {
    let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];

    if (editId) {
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
    } else {
        posts.push({
            id: postData.id,
            title: postData.title,
            description: postData.description,
            category: postData.category,
            place: postData.location,
            date: postData.foundDate,
            img: postData.images[0] || null,
            solved: false
        });
    }

    localStorage.setItem("foundPosts", JSON.stringify(posts));
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
    confirmBtn.addEventListener("click", () => {
        savePost();
        confirmModal.classList.remove("show");
        showUploadModal();
    });

    /* 업로드 완료 → 홈 이동 */
    uploadOkBtn.addEventListener("click", () => {
        window.location.href = "../home/home.html";
    });
}

/* =========================================================================
   수정모드 데이터 로드
=========================================================================== */
function loadEditData() {
    if (!editId) return;

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
