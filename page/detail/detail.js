document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(location.search);
    const postId = Number(params.get("id"));

    let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];
    let post = posts.find(p => p.id === postId);

    if (!post) return;

    // --------------------------
    // 🔥 데이터 바인딩
    // --------------------------
    document.getElementById("detailTitle").textContent = post.title;
    document.getElementById("detailDesc").textContent = post.description;
    document.getElementById("detailPlace").textContent = post.place;
    document.getElementById("detailDate").textContent = post.date;

    if (post.img) {
        document.getElementById("detailImage").src = post.img;
    }

    // --------------------------
    // 🔙 뒤로가기
    // --------------------------
    document.getElementById("backBtn").addEventListener("click", () => {
        history.back();
    });

    // --------------------------
    // 🗑 삭제하기
    // --------------------------
    document.getElementById("deleteBtn").addEventListener("click", () => {
        posts = posts.filter(p => p.id !== postId);
        localStorage.setItem("foundPosts", JSON.stringify(posts));

        window.location.href = "../home/home.html";
    });

    // --------------------------
    // ✏ 수정하기
    // --------------------------
    document.getElementById("editBtn").addEventListener("click", () => {
        window.location.href = `../createfind/createfind.html?edit=${postId}`;
    });
});