/* ============================================
   📌 분실했어요 게시글 작성 JS 최종 통합본
   (모달 미리보기 + 저장 완료 모달 적용 완료)
============================================ */

let postData = {
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
    history.back();
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

function renderPreview() {
    previewList.innerHTML = "";

    postData.images.forEach((imgObj, index) => {
        const div = document.createElement("div");
        div.className = "image-preview-item";
        div.innerHTML = `
            <img src="${imgObj.url}" data-index="${index}">
            <button class="remove-btn"><i class="material-icons">close</i></button>
        `;
        previewList.appendChild(div);

        div.querySelector(".remove-btn").addEventListener("click", () => {
            postData.images.splice(index, 1);
            renderPreview();
        });
    });

    uploadBtn.classList.toggle("hidden", postData.images.length >= 5);
}

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
   🔥 "올리기" → 저장 → 완료 팝업 표시
------------------------------------ */
document.getElementById("confirmBtn").addEventListener("click", () => {

    let lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];

    lostPosts.push({
        id: Date.now(),
        img: postData.images[0] ? postData.images[0].url : null,
        title: postData.title,
        description: postData.description,
        place: postData.location,
        date: postData.lostDate,
        solved: false,
        category: postData.category
    });

    localStorage.setItem("lostPosts", JSON.stringify(lostPosts));

    confirmModal.classList.remove("show");
    document.getElementById("uploadModal").classList.add("show");  // ← 저장 완료 모달 실행
});

/* 저장 완료 모달 확인 → 홈 이동 */
document.getElementById("uploadOkBtn").addEventListener("click", () => {
    document.getElementById("uploadModal").classList.remove("show");
    window.location.href = "../home/home.html?type=Lost";
});
