// 게시판 타입 (Found: 찾았어요, Lost: 분실했어요)
let boardType = "Found"; // 기본값: 찾았어요

// 임시 데이터 (API 연동 전)
const foundPosts = [
  {
    id: 1,
    img: null,
    title: "물건 제목",
    date: "습득 날짜",
    place: "습득 장소",
    solved: false
  },
  {
    id: 2,
    img: null,
    title: "물건 제목",
    date: "습득 날짜",
    place: "습득 장소",
    solved: false
  },
  {
    id: 3,
    img: null,
    title: "물건 제목",
    date: "습득 날짜",
    place: "습득 장소",
    solved: false
  },
  {
    id: 4,
    img: null,
    title: "물건 제목",
    date: "습득 날짜",
    place: "습득 장소",
    solved: false
  }
];

const lostPosts = [
  {
    id: 1,
    img: null,
    title: "분실 물건 제목",
    date: "분실 날짜",
    place: "분실 장소",
    solved: false
  },
  {
    id: 2,
    img: null,
    title: "분실 물건 제목",
    date: "분실 날짜",
    place: "분실 장소",
    solved: false
  },
  {
    id: 3,
    img: null,
    title: "분실 물건 제목",
    date: "분실 날짜",
    place: "분실 장소",
    solved: false
  },
  {
    id: 4,
    img: null,
    title: "분실 물건 제목",
    date: "분실 날짜",
    place: "분실 장소",
    solved: false
  }
];

// 카테고리 필터
let selectedCategory = "전체";
let showOnlyInProgress = false;

// 카드 렌더링
function renderCards() {
  const cardList = document.getElementById("cardList");
  cardList.innerHTML = "";

  // 현재 게시판 타입에 맞는 게시물 가져오기
  let currentPosts = boardType === "Found" ? foundPosts : lostPosts;

  // 필터링된 게시물
  let filteredPosts = currentPosts;

  if (selectedCategory !== "전체") {
    // 카테고리 필터링 (추후 API 연동 시 사용)
  }

  if (showOnlyInProgress) {
    filteredPosts = filteredPosts.filter(post => post.solved === false);
  }

  filteredPosts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card";
    
    if (post.img) {
      card.innerHTML = `
        <img src="${post.img}" alt="${post.title}" class="card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="card-placeholder" style="display: none;">이미지 없음</div>
        <div class="card-content">
          <div class="card-title">${post.title}</div>
          <div class="card-date">${post.date}</div>
          <div class="card-place">${post.place}</div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="card-placeholder">이미지 없음</div>
        <div class="card-content">
          <div class="card-title">${post.title}</div>
          <div class="card-date">${post.date}</div>
          <div class="card-place">${post.place}</div>
        </div>
      `;
    }
    
    cardList.appendChild(card);
  });
}

// 카테고리 버튼 클릭 이벤트
document.addEventListener("DOMContentLoaded", function() {
  const categoryButtons = document.querySelectorAll(".category");
  
  categoryButtons.forEach(btn => {
    btn.addEventListener("click", function() {
      categoryButtons.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      selectedCategory = this.textContent;
      renderCards();
    });
  });

  // 토글 스위치 이벤트
  const toggleSolved = document.getElementById("toggleSolved");
  toggleSolved.addEventListener("change", function() {
    showOnlyInProgress = this.checked;
    renderCards();
  });

  // 초기 렌더링
  renderCards();

  // "찾았어요" / "분실했어요" 탭 전환 이벤트
  const foundTab = document.getElementById("foundTab");
  const expandIcon = foundTab.querySelector(".expand-icon");
  
  foundTab.addEventListener("click", function() {
    // 게시판 타입 전환
    if (boardType === "Found") {
      boardType = "Lost";
      foundTab.innerHTML = '분실했어요! <i class="material-icons expand-icon">expand_less</i>';
    } else {
      boardType = "Found";
      foundTab.innerHTML = '찾았어요! <i class="material-icons expand-icon">expand_more</i>';
    }
    
    // expandIcon 참조 갱신
    const newExpandIcon = foundTab.querySelector(".expand-icon");
    if (newExpandIcon) {
      newExpandIcon.style.fontSize = "20px";
      newExpandIcon.style.verticalAlign = "middle";
      newExpandIcon.style.transition = "transform 0.2s";
    }
    
    // 카테고리 초기화
    selectedCategory = "전체";
    const categoryButtons = document.querySelectorAll(".category");
    categoryButtons.forEach((btn, index) => {
      if (index === 0) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    
    // 게시물 다시 렌더링
    renderCards();
  });

  // 글쓰기 버튼 클릭 이벤트
  const writeBtn = document.querySelector(".write-btn");
  writeBtn.addEventListener("click", function() {
    // 찾았어요 게시물 작성 페이지로 이동
    if (boardType === "Found") {
      window.location.href = "../createfind/createfind.html";
    } else {
      // 분실했어요 게시물 작성 페이지로 이동
      window.location.href = "../createlost/createlost.html";
    }
  });

  // 하단 네비게이션 클릭 이벤트
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", function() {
      navItems.forEach(nav => nav.classList.remove("active"));
      this.classList.add("active");
      
      const label = this.querySelector(".nav-label").textContent;
      if (label === "쪽지함") {
        // 쪽지함 페이지로 이동 (추후 구현)
        console.log("쪽지함 클릭됨");
      } else if (label === "마이페이지") {
        // 마이페이지로 이동 (추후 구현)
        console.log("마이페이지 클릭됨");
      }
    });
  });

  // 검색 버튼 클릭 이벤트
  const searchBtn = document.querySelector(".search-btn");
  searchBtn.addEventListener("click", function() {
    // 검색 기능 (추후 구현)
    console.log("검색 클릭됨");
  });

  // 알림 버튼 클릭 이벤트
  const notificationBtn = document.querySelector(".notification-btn");
  notificationBtn.addEventListener("click", function() {
    // 알림 페이지로 이동 (추후 구현)
    console.log("알림 클릭됨");
  });
});
