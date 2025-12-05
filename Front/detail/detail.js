document.addEventListener("DOMContentLoaded", () => {

    // 🔥 쪽지 보내기 (게시글 정보 저장 → contact에 표시될 제목/카테고리 전달)
    document.getElementById("msgBtn").addEventListener("click", () => {

        const user = document.querySelector(".user-name").textContent.trim();  // 상대 닉네임
        const title = document.getElementById("detailTitle").textContent.trim();
        const category = document.getElementById("detailCategory").textContent.trim();

        // 🔥 기존 chatInfo 불러오기
        let chatInfo = JSON.parse(localStorage.getItem("chatInfo") || "{}");

        // 🔥 user 기준으로 제목/카테고리 저장
        chatInfo[user] = { title, category };
        localStorage.setItem("chatInfo", JSON.stringify(chatInfo));

        // contact로 이동 (user만 넘기면 contact.js가 자동 적용)
        window.location.href = "../contact/contact.html?user=" + encodeURIComponent(user);
    });


    // ================= 게시글 상세 데이터 표시 =================
    const params = new URLSearchParams(location.search);
    const postId = Number(params.get("id"));
    let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];
    let post = posts.find(p => p.id === postId);

    if (!post) return;

    document.getElementById("detailTitle").textContent = post.title;
    document.getElementById("detailDesc").textContent = post.description;
    document.getElementById("detailPlace").textContent = post.place;
    document.getElementById("detailDate").textContent = post.date;
    document.getElementById("detailCategory").textContent = post.category;
    if(post.img) document.getElementById("detailImage").src = post.img;

    document.getElementById("backBtn").onclick = ()=>history.back();
});
