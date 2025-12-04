document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(location.search);
    const postId = Number(params.get("id"));

    let lostPosts = JSON.parse(localStorage.getItem("lostPosts")) || [];
    let post = lostPosts.find(p => p.id === postId);

    if (!post) return;

    // 데이터 넣기
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

    // 쪽지보내기 (나중에 쪽지페이지 생기면 연결)
    document.getElementById("msgBtn").addEventListener("click", () => {
        alert("쪽지 기능은 나중에 연결됩니다!");
    });

});