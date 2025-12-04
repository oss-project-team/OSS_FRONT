document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(location.search);
    const postId = Number(params.get("id"));
    const type = params.get("type");

    // Found 데이터만 불러오기
    let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];
    let post = posts.find(p => p.id === postId);

    if (!post) return;

    // 데이터 바인딩
    document.getElementById("detailTitle").textContent = post.title;
    document.getElementById("detailDesc").textContent = post.description;
    document.getElementById("detailPlace").textContent = post.place;
    document.getElementById("detailDate").textContent = post.date;
    document.getElementById("detailCategory").textContent = post.category;

    if (post.img) {
        document.getElementById("detailImage").src = post.img;
    }

    // 뒤로가기
    document.getElementById("backBtn").addEventListener("click", () => {
        history.back();
    });

    // 쪽지 보내기 버튼
    document.getElementById("msgBtn").addEventListener("click", () => {
        alert("쪽지 기능은 아직 준비 중입니다!");
    });
});
