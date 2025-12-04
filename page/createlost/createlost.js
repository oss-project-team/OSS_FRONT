/* ========================================
   게시물 작성 데이터 저장 객체
   ======================================== */
// 사용자가 입력한 모든 정보를 저장하는 객체
const postData = {
  images: [],      // 업로드한 이미지 파일들의 배열
  title: '',       // 게시물 제목
  description: '', // 게시물 설명
  category: '',    // 선택한 카테고리 (예: 의류, 지갑/카드 등)
  location: '',    // 분실한 장소
  lostDate: ''     // 분실한 날짜
};

// 최대 업로드 가능한 이미지 개수 (5장)
const MAX_IMAGES = 5;

/* ========================================
   HTML 요소들을 JavaScript 변수로 가져오기
   ======================================== */
// getElementById: HTML 요소에 지정된 id로 요소를 찾아서 가져옴
const backBtn = document.getElementById('backBtn');                    // 뒤로가기 버튼
const imageUpload = document.getElementById('imageUpload');            // 파일 선택 input (숨겨진 요소)
const imagePreviewList = document.getElementById('imagePreviewList');  // 이미지 미리보기를 표시할 영역
const uploadBtn = document.getElementById('uploadBtn');                // 사진 추가 버튼 (보이는 버튼)
const titleInput = document.getElementById('title');                   // 제목 입력 필드
const titleCount = document.getElementById('titleCount');              // 제목 글자 수 표시 영역
const descriptionInput = document.getElementById('description');       // 설명 입력 필드
const descriptionCount = document.getElementById('descriptionCount');  // 설명 글자 수 표시 영역
const categoryButtons = document.querySelectorAll('.category-btn');    // 모든 카테고리 버튼들
const locationInput = document.getElementById('location');             // 장소 입력 필드
const lostDateInput = document.getElementById('lostDate');             // 날짜 입력 필드
const submitBtn = document.getElementById('submitBtn');                // 작성 완료 버튼
const confirmModal = document.getElementById('confirmModal');          // 확인 팝업 창
const cancelBtn = document.getElementById('cancelBtn');                // 취소 버튼
const confirmBtn = document.getElementById('confirmBtn');              // 올리기 버튼
const modalPreview = document.getElementById('modalPreview');          // 팝업 내 미리보기 영역
const imageViewerModal = document.getElementById('imageViewerModal');  // 이미지 뷰어 모달
const viewerImage = document.getElementById('viewerImage');            // 뷰어에 표시할 이미지
const imageViewerIndex = document.getElementById('imageViewerIndex');  // 이미지 번호 표시 (예: 1/5)
const closeImageViewer = document.getElementById('closeImageViewer');  // 이미지 뷰어 닫기 버튼
const prevImageBtn = document.getElementById('prevImage');             // 이전 이미지 버튼
const nextImageBtn = document.getElementById('nextImage');             // 다음 이미지 버튼

// 현재 보고 있는 이미지의 인덱스 (배열에서의 위치, 0부터 시작)
let currentImageIndex = 0;

/* ========================================
   날짜 입력 필드 초기 설정
   ======================================== */
// 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
// new Date(): 현재 날짜/시간 정보 가져오기
// toISOString(): ISO 형식의 문자열로 변환 (예: "2024-01-15T12:30:00.000Z")
// split('T')[0]: T를 기준으로 나누고 첫 번째 부분만 가져오기 (날짜 부분만)
const today = new Date().toISOString().split('T')[0];
lostDateInput.value = today;        // 날짜 입력 필드에 오늘 날짜를 기본값으로 설정
lostDateInput.max = today;          // 오늘 이후 날짜는 선택할 수 없도록 제한

/* ========================================
   이미지 업로드 기능
   ======================================== */
// 파일 선택 input의 값이 변경되었을 때 실행되는 함수
imageUpload.addEventListener('change', function(e) {
  // Array.from(): 배열로 변환 (파일 목록을 배열로 만들기)
  const files = Array.from(e.target.files);
  
  // 아직 업로드할 수 있는 이미지 개수 계산
  const remainingSlots = MAX_IMAGES - postData.images.length;
  
  // 선택한 파일이 남은 슬롯보다 많으면
  if (files.length > remainingSlots) {
    alert(`최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다. (현재 ${postData.images.length}장 업로드됨)`);
    // 남은 슬롯만큼만 파일 배열에 남기고 나머지는 제거
    files.splice(remainingSlots);
  }
  
  // 선택한 각 파일에 대해 처리
  files.forEach(file => {
    // 이미 5장이면 더 이상 추가하지 않음
    if (postData.images.length >= MAX_IMAGES) {
      return; // 이번 반복 종료 (다음 파일로)
    }
    
    // 파일 크기 확인 (5MB = 5 * 1024 * 1024 바이트)
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} 파일 크기는 5MB 이하여야 합니다.`);
      return; // 크기가 너무 크면 이 파일은 건너뜀
    }
    
    // FileReader: 파일을 읽기 위한 객체
    const reader = new FileReader();
    
    // 파일 읽기가 완료되었을 때 실행되는 함수
    reader.onload = function(e) {
      // 읽은 파일을 postData.images 배열에 추가
      postData.images.push({
        file: file,              // 원본 파일 객체 (나중에 서버에 전송하기 위해)
        url: e.target.result     // 이미지를 표시하기 위한 URL (base64 형식)
      });
      // 이미지 미리보기 업데이트
      updateImagePreview();
    };
    
    // readAsDataURL: 파일을 base64 형식의 데이터 URL로 읽기 (이미지 표시에 사용)
    reader.readAsDataURL(file);
  });
  
  // 파일 선택 input을 초기화 (같은 파일을 다시 선택할 수 있도록)
  e.target.value = '';
});

/* ========================================
   이미지 미리보기 업데이트 함수
   ======================================== */
function updateImagePreview() {
  // 기존 미리보기 모두 제거
  imagePreviewList.innerHTML = '';
  
  // 이미지가 5장 미만이면 업로드 버튼 표시, 5장이면 숨김
  if (postData.images.length < MAX_IMAGES) {
    uploadBtn.style.display = 'flex'; // 버튼 표시
  } else {
    uploadBtn.style.display = 'none'; // 5장 도달 시 숨김
  }

  // postData.images 배열의 각 이미지에 대해 HTML 요소 생성
  postData.images.forEach((image, index) => {
    // div 요소 생성 (각 이미지의 컨테이너)
    const item = document.createElement('div');
    item.className = 'image-preview-item'; // CSS 클래스 추가
    
    // HTML 내용 설정 (템플릿 리터럴 사용: 백틱 ` 사용)
    item.innerHTML = `
      <img src="${image.url}" alt="업로드된 이미지 ${index + 1}" data-index="${index}">
      <button type="button" class="remove-btn" data-index="${index}">
        <i class="material-icons">close</i>
      </button>
    `;
    
    // 생성한 요소를 미리보기 영역에 추가
    imagePreviewList.appendChild(item);
    
    // 이미지 클릭 이벤트 추가 (이미지 뷰어 열기)
    const imgElement = item.querySelector('img');
    imgElement.addEventListener('click', function(e) {
      // 삭제 버튼을 클릭한 것이 아닐 때만 이미지 뷰어 열기
      // closest(): 가장 가까운 부모 요소 중 해당 선택자와 일치하는 요소 찾기
      if (!e.target.closest('.remove-btn')) {
        openImageViewer(index);
      }
    });
    
    // 삭제 버튼 클릭 이벤트 추가
    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // 이벤트 전파 중지 (이미지 클릭 이벤트와 충돌 방지)
      // splice(index, 1): 배열에서 index 위치의 요소 1개 삭제
      postData.images.splice(index, 1);
      // 미리보기 다시 업데이트
      updateImagePreview();
    });
  });
}

/* ========================================
   이미지 뷰어 관련 함수들
   ======================================== */
// 이미지 뷰어 열기 함수
function openImageViewer(index) {
  // 이미지가 없으면 실행하지 않음
  if (postData.images.length === 0) return;
  
  // 현재 보고 있는 이미지 인덱스 저장
  currentImageIndex = index;
  // 뷰어에 이미지 표시
  updateViewerImage();
  // 모달에 'show' 클래스 추가하여 표시
  imageViewerModal.classList.add('show');
  // body 스크롤 막기 (모달이 열렸을 때 배경 스크롤 방지)
  document.body.style.overflow = 'hidden';
}

// 이미지 뷰어 닫기 함수
function closeImageViewer() {
  // 모달에서 'show' 클래스 제거하여 숨김
  imageViewerModal.classList.remove('show');
  // body 스크롤 복원
  document.body.style.overflow = '';
}

// 뷰어에 표시할 이미지 업데이트 함수
function updateViewerImage() {
  // 이미지가 없으면 뷰어 닫기
  if (postData.images.length === 0) {
    closeImageViewer();
    return;
  }
  
  // 현재 인덱스에 해당하는 이미지 가져오기
  const currentImage = postData.images[currentImageIndex];
  // 뷰어 이미지 요소의 src 속성 설정
  viewerImage.src = currentImage.url;
  // 이미지 번호 표시 업데이트 (예: "1 / 5")
  imageViewerIndex.textContent = `${currentImageIndex + 1} / ${postData.images.length}`;
  
  // 이전/다음 버튼 활성화/비활성화
  // 첫 번째 이미지면 이전 버튼 비활성화
  prevImageBtn.disabled = currentImageIndex === 0;
  // 마지막 이미지면 다음 버튼 비활성화
  nextImageBtn.disabled = currentImageIndex === postData.images.length - 1;
}

// 이전 이미지 보기 함수
function showPrevImage() {
  // 첫 번째 이미지가 아니면
  if (currentImageIndex > 0) {
    currentImageIndex--; // 인덱스 감소
    updateViewerImage(); // 뷰어 업데이트
  }
}

// 다음 이미지 보기 함수
function showNextImage() {
  // 마지막 이미지가 아니면
  if (currentImageIndex < postData.images.length - 1) {
    currentImageIndex++; // 인덱스 증가
    updateViewerImage(); // 뷰어 업데이트
  }
}

/* ========================================
   입력 필드 이벤트 처리
   ======================================== */
// 제목 입력 시 글자 수 카운트
titleInput.addEventListener('input', function() {
  const length = this.value.length; // 입력된 텍스트의 길이
  titleCount.textContent = length;  // 글자 수 표시 영역에 업데이트
  postData.title = this.value;      // postData 객체에도 저장
});

// 설명 입력 시 글자 수 카운트
descriptionInput.addEventListener('input', function() {
  const length = this.value.length;
  descriptionCount.textContent = length;
  postData.description = this.value;
});

// 카테고리 버튼 클릭 이벤트
// forEach: 배열의 각 요소에 대해 함수 실행
categoryButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    // 모든 카테고리 버튼에서 'active' 클래스 제거
    categoryButtons.forEach(b => b.classList.remove('active'));
    // 클릭한 버튼에만 'active' 클래스 추가 (선택된 것처럼 보이게)
    this.classList.add('active');
    // dataset: HTML data-* 속성에 접근 (예: data-category="의류")
    postData.category = this.dataset.category;
  });
});

// 분실한 장소 입력 이벤트
locationInput.addEventListener('input', function() {
  postData.location = this.value; // 입력값을 postData에 저장
});

// 분실한 날짜 입력 이벤트
lostDateInput.addEventListener('change', function() {
  postData.lostDate = this.value; // 선택한 날짜를 postData에 저장
});

/* ========================================
   네비게이션 및 버튼 이벤트
   ======================================== */
// 뒤로가기 버튼 클릭 시 홈 페이지로 이동
backBtn.addEventListener('click', function() {
  window.location.href = '../home/home.html';
});

// 작성 완료 버튼 클릭 시 유효성 검사 및 확인 팝업 표시
submitBtn.addEventListener('click', function() {
  // ===== 유효성 검사 (필수 항목 확인) =====
  
  // 제목이 비어있으면
  if (!postData.title.trim()) { // trim(): 앞뒤 공백 제거
    alert('제목을 입력해주세요.');
    titleInput.focus(); // 제목 입력 필드에 포커스 이동
    return; // 함수 종료
  }
  
  // 설명이 비어있으면
  if (!postData.description.trim()) {
    alert('자세한 설명을 입력해주세요.');
    descriptionInput.focus();
    return;
  }
  
  // 카테고리를 선택하지 않았으면
  if (!postData.category) {
    alert('분실한 물건 카테고리를 선택해주세요.');
    return;
  }
  
  // 장소가 비어있으면
  if (!postData.location.trim()) {
    alert('분실한 장소를 입력해주세요.');
    locationInput.focus();
    return;
  }
  
  // 날짜를 선택하지 않았으면
  if (!postData.lostDate) {
    alert('분실한 날짜를 선택해주세요.');
    lostDateInput.focus();
    return;
  }
  
  // 모든 유효성 검사를 통과하면 확인 팝업 표시
  showConfirmModal();
});

/* ========================================
   확인 팝업 관련 함수
   ======================================== */
// 확인 팝업 표시 함수
function showConfirmModal() {
  // modalPreview의 HTML 내용을 동적으로 생성
  // 템플릿 리터럴을 사용하여 HTML 문자열 생성
  modalPreview.innerHTML = `
    ${postData.images.length > 0 ? `
      <div class="preview-item">
        <div class="preview-item-label">사진</div>
        <div class="preview-images">
          ${postData.images.map(img => `<img src="${img.url}" alt="미리보기">`).join('')}
        </div>
      </div>
    ` : ''}
    <div class="preview-item">
      <div class="preview-item-label">제목</div>
      <div class="preview-item-value">${postData.title}</div>
    </div>
    <div class="preview-item">
      <div class="preview-item-label">자세한 설명</div>
      <div class="preview-item-value">${postData.description}</div>
    </div>
    <div class="preview-item">
      <div class="preview-item-label">분실한 물건 카테고리</div>
      <div class="preview-item-value">${postData.category}</div>
    </div>
    <div class="preview-item">
      <div class="preview-item-label">분실한 장소</div>
      <div class="preview-item-value">${postData.location}</div>
    </div>
    <div class="preview-item">
      <div class="preview-item-label">분실한 날짜</div>
      <div class="preview-item-value">${formatDate(postData.lostDate)}</div>
    </div>
  `;
  
  // 모달에 'show' 클래스 추가하여 표시
  confirmModal.classList.add('show');
}

// 날짜 포맷팅 함수 (YYYY-MM-DD 형식을 "2024년 01월 15일" 형식으로 변환)
function formatDate(dateString) {
  const date = new Date(dateString); // 문자열을 Date 객체로 변환
  const year = date.getFullYear();   // 연도 (예: 2024)
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 월 (0부터 시작하므로 +1, 2자리로 만들기)
  const day = String(date.getDate()).padStart(2, '0');        // 일 (2자리로 만들기)
  return `${year}년 ${month}월 ${day}일`; // 한국어 형식으로 반환
}

// 모달 취소 버튼 클릭 시 팝업 닫기
cancelBtn.addEventListener('click', function() {
  confirmModal.classList.remove('show'); // 'show' 클래스 제거하여 숨김
});

// 모달 배경(오버레이) 클릭 시 팝업 닫기
confirmModal.addEventListener('click', function(e) {
  // e.target: 실제로 클릭한 요소
  // e.target === confirmModal: 모달 배경을 직접 클릭한 경우만
  if (e.target === confirmModal) {
    confirmModal.classList.remove('show');
  }
});

/* ========================================
   이미지 뷰어 이벤트 리스너
   ======================================== */
// 이미지 뷰어 닫기 버튼 클릭
closeImageViewer.addEventListener('click', closeImageViewer);

// 이미지 뷰어 배경 클릭 시 닫기
imageViewerModal.addEventListener('click', function(e) {
  if (e.target === imageViewerModal) {
    closeImageViewer();
  }
});

// 이전 이미지 버튼 클릭
prevImageBtn.addEventListener('click', showPrevImage);

// 다음 이미지 버튼 클릭
nextImageBtn.addEventListener('click', showNextImage);

// 키보드 이벤트 처리 (좌우 화살표로 이미지 이동, ESC로 닫기)
document.addEventListener('keydown', function(e) {
  // 이미지 뷰어가 열려있을 때만 동작
  if (imageViewerModal.classList.contains('show')) {
    if (e.key === 'Escape') {          // ESC 키: 뷰어 닫기
      closeImageViewer();
    } else if (e.key === 'ArrowLeft') { // 왼쪽 화살표: 이전 이미지
      showPrevImage();
    } else if (e.key === 'ArrowRight') { // 오른쪽 화살표: 다음 이미지
      showNextImage();
    }
  }
});

/* ========================================
   게시물 업로드 (서버에 전송)
   ======================================== */
// 확인 버튼 클릭 시 게시물을 서버에 업로드
// async: 비동기 함수 (서버 요청을 기다려야 하므로)
confirmBtn.addEventListener('click', async function() {
  // 버튼 비활성화 및 텍스트 변경 (중복 클릭 방지)
  confirmBtn.disabled = true;
  confirmBtn.textContent = '업로드 중...';
  
  // try-catch: 에러 처리를 위한 구문
  try {
    // ===== FormData 생성 (서버에 파일과 데이터를 함께 보내기 위한 객체) =====
    const formData = new FormData();
    
    // append(): FormData에 데이터 추가
    formData.append('type', 'Lost');              // 게시물 타입: "Lost" (분실했어요)
    formData.append('title', postData.title);     // 제목
    formData.append('content', postData.description); // 내용
    formData.append('category', postData.category);   // 카테고리
    formData.append('location', postData.location);   // 장소
    formData.append('lost_date', postData.lostDate);  // 날짜
    
    // 이미지 파일들 추가
    postData.images.forEach((image, index) => {
      formData.append('images', image.file); // 원본 파일 객체 추가
    });
    
    // ===== JWT 토큰 가져오기 =====
    // localStorage: 브라우저에 저장된 데이터 (로그인 시 저장한 토큰)
    const token = localStorage.getItem('access_token');
    
    // ===== 백엔드 API 호출 =====
    // fetch(): 서버에 HTTP 요청을 보내는 함수
    // await: 비동기 작업이 완료될 때까지 기다림
    const response = await fetch('/api/v1/posts', {
      method: 'POST', // POST 요청 (데이터 생성)
      headers: {
        'Authorization': `Bearer ${token}` // 인증 토큰을 헤더에 포함
      },
      body: formData // 전송할 데이터
    });
    
    // 응답을 JSON 형식으로 변환
    const data = await response.json();
    
    // 응답이 성공적이면 (status 200-299)
    if (response.ok) {
      alert('게시물이 성공적으로 등록되었습니다!');
      // 홈 페이지로 이동
      window.location.href = '../home/home.html';
    } else {
      // 실패 시 에러 메시지 표시
      alert(data.error || '게시물 등록에 실패했습니다.');
      // 버튼 다시 활성화
      confirmBtn.disabled = false;
      confirmBtn.textContent = '올리기';
    }
  } catch (error) {
    // 네트워크 오류 등 예외 상황 처리
    console.error('게시물 업로드 오류:', error);
    // 임시 처리: 서버가 없을 때
    alert('게시물이 성공적으로 등록되었습니다! (임시)');
    window.location.href = '../home/home.html';
  }
});

/* ========================================
   페이지 로드 시 초기화
   ======================================== */
// DOMContentLoaded: HTML 문서가 완전히 로드되었을 때 실행
document.addEventListener('DOMContentLoaded', function() {
  // 업로드 버튼 클릭 시 파일 선택 창 열기
  uploadBtn.addEventListener('click', () => {
    imageUpload.click(); // 숨겨진 파일 input 클릭
  });
  
  // 초기 이미지 미리보기 업데이트 (이미지가 있을 경우를 대비)
  updateImagePreview();
});
