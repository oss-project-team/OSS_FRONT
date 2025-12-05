document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("searchInput");
    const recentBox = document.getElementById("recentKeywords");
    const relatedBox = document.getElementById("relatedKeywords");
    const resultBox = document.getElementById("searchResults");
    const backBtn = document.getElementById("backBtn");

    // 🔙 뒤로가기
    backBtn.addEventListener("click", () => {
        window.location.href = "../home/home.html";
    });

    // 저장된 데이터
    let recent = JSON.parse(localStorage.getItem("recentSearch")) || [];
    let posts = JSON.parse(localStorage.getItem("foundPosts")) || [];

    // 🔥 최근 검색 렌더링
    function renderRecent() {
        recentBox.innerHTML = "";

        recent.forEach(keyword => {
            const chip = document.createElement("div");
            chip.className = "keyword-chip";
            chip.textContent = keyword;

            chip.addEventListener("click", () => {
                searchInput.value = keyword;
                runSearch(keyword);
            });

            recentBox.appendChild(chip);
        });
    }

    // 🔥 연관 검색어
    function renderRelated(keyword) {
        relatedBox.innerHTML = "";
        if (!keyword.trim()) return;

        const lower = keyword.toLowerCase();

        const matched = posts
            .map(p => p.title)
            .filter(t => t && t.toLowerCase().includes(lower))
            .slice(0, 6);

        matched.forEach(text => {
            const chip = document.createElement("div");
            chip.className = "keyword-chip";
            chip.textContent = text;

            chip.addEventListener("click", () => {
                searchInput.value = text;
                runSearch(text);
            });

            relatedBox.appendChild(chip);
        });
    }

    // 🔥 검색 실행
    function runSearch(keyword) {
        resultBox.innerHTML = "";

        const lower = keyword.toLowerCase();

        const filtered = posts.filter(p =>
            (p.title && p.title.toLowerCase().includes(lower)) ||
            (p.place && p.place.toLowerCase().includes(lower))
        );

        filtered.forEach(post => {
            const item = document.createElement("div");
            item.className = "search-result-item";
            item.textContent = post.title;
            item.style.padding = "12px 0";
            item.style.borderBottom = "1px solid #eee";
            item.style.cursor = "pointer";

            item.addEventListener("click", () => {
                window.location.href = `../detail/detail.html?id=${post.id}`;
            });

            resultBox.appendChild(item);
        });

        if (filtered.length === 0) {
            resultBox.innerHTML = "<div style='padding:16px;color:#888;'>검색 결과가 없습니다.</div>";
        }
    }

    // 🔥 엔터 입력
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const word = searchInput.value.trim();
            if (!word) return;

            // 최근 검색 저장
            recent = recent.filter(k => k !== word);
            recent.unshift(word);
            recent = recent.slice(0, 10);
            localStorage.setItem("recentSearch", JSON.stringify(recent));

            renderRecent();
            renderRelated(word);
            runSearch(word);
        }
    });

    // 실시간 연관검색
    searchInput.addEventListener("input", () => {
        renderRelated(searchInput.value.trim());
    });

    renderRecent();
});