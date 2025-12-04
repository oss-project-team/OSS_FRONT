/* =========================================================================
   createfind.js – 최종 통합 버전 (글쓰기 + 수정 + 모달 + 이미지 + 이동)
   ========================================================================= */

/* ------------------------------ 
   URL 파라미터 (edit 모드 확인)
------------------------------ */
const params = new URLSearchParams(window.location.search);
const editId = params.get("edit"); // 있으면 수정 모드
const origin = params.get("origin"); // search → 뒤로가기 시 검색으로 돌아감

/* ------------------------------ 
   게시물 데이터 구조
------------------------------ */
let postData = {
    id: editId ? Number(editId) : Date.now(),
    images: [],
    title: "",
    description: "",
    category: "",
    location: "",
    foundDate: ""
};

/* ------------------------------ 
   DOM 요소
------------------------------ */
let backBtn, imageUpload, imagePreviewList, uploadBtn;
let titleInput, titleCount, descriptionInput, descriptionCount;
let categoryButtons, locationInput, foundDateInput, submitBtn;
let confirmModal, cancelBtn, confirmBtn, modalPreview;
let imageViewerModal, viewerImage, imageViewerIndex, closeImageViewer;

let currentImageIndex = 0;
const MAX_IMAGES = 5;

/* =========================================================================
   이미지 업로드 기능
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
   모달
=========================================================================== */
function showConfirmModal() {
    modalPreview.innerHTML = `
        <div class="preview-item">
            <div class="preview-item-label">제목</div>
            <div class="preview-item-value">${postData.title}</div>
        </div>
    `;
    confirmModal.classList.add("show");
}

/* =========================================================================
   게시물 저장 (신규 + 수정)
=========================================================================== */
function savePost() {
    let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];

    if (editId) {
        // 수정 모드
        posts = posts.map(p =>
            p.id == editId ? {
                ...p,
                title: postData.title,
                description: postData.description,
                category: postData.category,
                place: postData.location,
                date: postData.foundDate,
                img: postData.images[0] || null
            } :
            p
        );
    } else {
        // 새 글쓰기 모드
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

    /* 제목 */
    titleInput.addEventListener("input", () => {
        postData.title = titleInput.value;
        titleCount.textContent = titleInput.value.length;
    });

    /* 설명 */
    descriptionInput.addEventListener("input", () => {
        postData.description = descriptionInput.value;
        descriptionCount.textContent = descriptionInput.value.length;
    });

    /* 장소 */
    locationInput.addEventListener("input", () => {
        postData.location = locationInput.value;
    });

    /* 날짜 */
    foundDateInput.addEventListener("change", () => {
        postData.foundDate = foundDateInput.value;
    });

    /* 이미지 삭제/확대 */
    imagePreviewList.addEventListener("click", (e) => {
        // 이미지 삭제
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

    /* 작성 완료 → 모달 열기 */
    submitBtn.addEventListener("click", () => {
        if (!postData.title.trim()) return alert("제목을 입력하세요.");
        if (!postData.description.trim()) return alert("설명을 입력하세요.");
        if (!postData.category) return alert("카테고리를 선택하세요.");
        if (!postData.location.trim()) return alert("장소를 입력하세요.");
        if (!postData.foundDate) return alert("날짜를 선택하세요.");

        showConfirmModal();
    });

    /* 모달 취소 */
    cancelBtn.addEventListener("click", () => {
        confirmModal.classList.remove("show");
    });

    /* 모달 → 올리기 */
    confirmBtn.addEventListener("click", () => {
        savePost();

        confirmModal.classList.remove("show");
        alert("게시물이 저장되었습니다!");

        window.location.href = "../home/home.html";
    });
}

/* =========================================================================
   수정 모드일 경우 데이터 불러오기
=========================================================================== */
function loadEditData() {
    if (!editId) return;

    let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];
    const target = posts.find(p => p.id == editId);
    if (!target) return;

    // 입력창에 값 채우기
    titleInput.value = target.title;
    descriptionInput.value = target.description;
    locationInput.value = target.place;
    foundDateInput.value = target.date;

    postData.category = target.category;
    postData.images = target.img ? [target.img] : [];

    // 카테고리 활성화
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

    setupImageUpload();
    setupEvents();
    loadEditData();
    updatePreview();
});
