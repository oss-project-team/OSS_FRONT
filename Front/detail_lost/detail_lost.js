document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(location.search);
    const postId = Number(params.get("id"));

    let postList = JSON.parse(localStorage.getItem("lostPosts")) || [];
    let post = postList.find(p => p.id === postId);

    // ====================== 게시물 정보 세팅 ======================
    if(post){
        document.querySelector(".user-name").textContent = post.user || "닉네임";
        document.getElementById("detailCategory").textContent = post.category;
        document.getElementById("detailTitle").textContent = post.title;
        document.getElementById("detailDesc").textContent = post.description;
        document.getElementById("detailPlace").textContent = post.place;
        document.getElementById("detailDate").textContent = post.date;

        if(post.img) document.getElementById("detailImage").src = post.img;

        // 상태 표시 UI
        const dot = document.querySelector(".status-dot");
        const statusText = document.querySelector(".status-text");
        if(post.state === "complete"){
            statusText.textContent = "해결 완료";
            dot.style.background="#2ecc71";
        }
    } else {
        document.getElementById("detailTitle").textContent="게시물을 찾을 수 없습니다.";
    }


    // ====================== 📨 쪽지 보내기 ======================
    document.getElementById("msgBtn").onclick = () => {

        const nickname = post?.user || document.querySelector(".user-name").textContent.trim();
        const title = post?.title || document.getElementById("detailTitle").textContent.trim();
        const category = post?.category || document.getElementById("detailCategory").textContent.trim();

        if(!nickname){
            alert("닉네임 정보가 없습니다.");
            return;
        }

        // 🔥 contact에 보낼 게시글 정보 저장 (detail과 동일)
        let chatInfo = JSON.parse(localStorage.getItem("chatInfo") || "{}");
        chatInfo[nickname] = { title, category };
        localStorage.setItem("chatInfo", JSON.stringify(chatInfo));

        // 🔥 contact에 user+title+category 전달
        location.href = `../contact/contact.html?user=${encodeURIComponent(nickname)}&title=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}`;
    };


    // 뒤로가기
    document.getElementById("backBtn").onclick = () => history.back();

});
