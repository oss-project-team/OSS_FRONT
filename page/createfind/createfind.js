// 게시물 작성 데이터
const postData = {
  images: [],
  title: '',
  description: '',
  category: '',
  location: '',
  foundDate: ''
};

const MAX_IMAGES = 5;

// DOM 요소 (나중에 초기화됨)
let backBtn, imageUpload, imageUploadContainer, uploadBtn;
let titleInput, titleCount, descriptionInput, descriptionCount;
let categoryButtons, locationInput, foundDateInput, submitBtn;
let confirmModal, cancelBtn, confirmBtn, modalPreview;
let imageViewerModal, viewerImage, imageViewerIndex;
let closeImageViewerBtn, prevImageBtn, nextImageBtn;
let completeModal, completeModalIcon, completeModalIconType, completeModalMessage, completeModalCloseBtn;
let currentImageIndex = 0;

// 이미지 업로드 이벤트 핸들러
function setupImageUpload() {
  imageUpload.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    // 파일이 없으면 리턴
    if (files.length === 0) {
      return;
    }
    
    const remainingSlots = MAX_IMAGES - postData.images.length;
    
    if (files.length > remainingSlots) {
      alert(`최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다. (현재 ${postData.images.length}장 업로드됨)`);
      files.splice(remainingSlots);
    }
    
    // 이미 5장이면 더 이상 추가하지 않음
    if (postData.images.length >= MAX_IMAGES) {
      alert(`최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
      e.target.value = '';
      return;
    }
    
    // 유효한 파일만 필터링
    const validFiles = files.filter(file => {
      // 파일 크기 확인 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} 파일 크기는 5MB 이하여야 합니다.`);
        return false;
      }
      return true;
    });
    
    // 모든 파일을 읽기 위한 Promise 배열
    const readPromises = validFiles.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          resolve({
            file: file,
            url: e.target.result
          });
        };
        reader.onerror = function() {
          reject(new Error(`파일 읽기 실패: ${file.name}`));
        };
        reader.readAsDataURL(file);
      });
    });
    
    // 모든 파일 읽기가 완료되면 미리보기 업데이트
    Promise.all(readPromises).then(images => {
      // 이미지 개수 제한 확인
      const availableSlots = MAX_IMAGES - postData.images.length;
      const imagesToAdd = images.slice(0, availableSlots);
      
      // 읽은 이미지들을 postData.images 배열에 추가
      postData.images.push(...imagesToAdd);
      
      // 이미지 미리보기 업데이트 (한 번만)
      updateImagePreview();
    }).catch(error => {
      console.error('이미지 읽기 오류:', error);
      alert('이미지를 읽는 중 오류가 발생했습니다.');
    });
    
    // 입력 필드 리셋
    e.target.value = '';
  });
}

// 이미지 미리보기 업데이트
function updateImagePreview() {
  // 컨테이너가 없으면 리턴
  if (!imageUploadContainer) {
    console.error('imageUploadContainer를 찾을 수 없습니다.');
    return;
  }
  
  // 기존 미리보기 아이템들 제거 (사진 추가 버튼과 input은 유지)
  const existingPreviews = imageUploadContainer.querySelectorAll('.image-preview-item');
  existingPreviews.forEach(item => item.remove());
  
  postData.images.forEach((image, index) => {
    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML = `
      <img src="${image.url}" alt="업로드된 이미지 ${index + 1}" data-index="${index}">
      <button type="button" class="remove-btn" data-index="${index}">
        <i class="material-icons">close</i>
      </button>
    `;
    // 컨테이너에 직접 추가 (사진 추가 버튼 옆에)
    imageUploadContainer.appendChild(item);
    
    // 이미지 클릭 이벤트 추가
    const imgElement = item.querySelector('img');
    imgElement.addEventListener('click', function(e) {
      // 삭제 버튼 클릭이 아닐 때만 이미지 뷰어 열기
      if (!e.target.closest('.remove-btn')) {
        openImageViewer(index);
      }
    });
    
    // 삭제 버튼 클릭 이벤트 추가
    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // 이벤트 전파 중지
      postData.images.splice(index, 1);
      updateImagePreview(); // 미리보기 다시 업데이트
    });
  });
  
  // 업로드 버튼 표시/숨김
  if (postData.images.length >= MAX_IMAGES) {
    uploadBtn.style.display = 'none';
  } else {
    uploadBtn.style.display = 'flex';
  }
}

// 이미지 뷰어 열기
function openImageViewer(index) {
  if (postData.images.length === 0) return;
  
  currentImageIndex = index;
  updateViewerImage();
  imageViewerModal.classList.add('show');
  document.body.style.overflow = 'hidden'; // 스크롤 방지
}

// 이미지 뷰어 닫기
function closeImageViewer() {
  imageViewerModal.classList.remove('show');
  document.body.style.overflow = ''; // 스크롤 복원
}

// 뷰어 이미지 업데이트
function updateViewerImage() {
  if (postData.images.length === 0) {
    closeImageViewer();
    return;
  }
  
  const currentImage = postData.images[currentImageIndex];
  viewerImage.src = currentImage.url;
  imageViewerIndex.textContent = `${currentImageIndex + 1} / ${postData.images.length}`;
  
  // 이전/다음 버튼 활성화/비활성화
  prevImageBtn.disabled = currentImageIndex === 0;
  nextImageBtn.disabled = currentImageIndex === postData.images.length - 1;
}

// 이전 이미지
function showPrevImage() {
  if (currentImageIndex > 0) {
    currentImageIndex--;
    updateViewerImage();
  }
}

// 다음 이미지
function showNextImage() {
  if (currentImageIndex < postData.images.length - 1) {
    currentImageIndex++;
    updateViewerImage();
  }
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 이미지 삭제는 각 이미지 아이템에 직접 이벤트 리스너를 추가하므로 여기서는 제거

  // 제목 글자 수 카운트
  titleInput.addEventListener('input', function() {
    const length = this.value.length;
    titleCount.textContent = length;
    postData.title = this.value;
  });

  // 설명 글자 수 카운트
  descriptionInput.addEventListener('input', function() {
    const length = this.value.length;
    descriptionCount.textContent = length;
    postData.description = this.value;
  });

  // 카테고리 선택
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      categoryButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      postData.category = this.dataset.category;
    });
  });

  // 찾은 장소 입력
  locationInput.addEventListener('input', function() {
    postData.location = this.value;
  });

  // 찾은 날짜 입력
  foundDateInput.addEventListener('change', function() {
    postData.foundDate = this.value;
  });

  // 뒤로가기
  backBtn.addEventListener('click', function() {
    window.location.href = '../home/home.html';
  });

  // 작성 완료 버튼
  submitBtn.addEventListener('click', function() {
  // 유효성 검사
  if (!postData.title.trim()) {
    showCompleteModal('제목을 입력해주세요.', 'error');
    titleInput.focus();
    return;
  }
  
  if (!postData.description.trim()) {
    showCompleteModal('자세한 설명을 입력해주세요.', 'error');
    descriptionInput.focus();
    return;
  }
  
  if (!postData.category) {
    showCompleteModal('찾은 물건 카테고리를 선택해주세요.', 'error');
    return;
  }
  
  if (!postData.location.trim()) {
    showCompleteModal('찾은 장소를 입력해주세요.', 'error');
    locationInput.focus();
    return;
  }
  
  if (!postData.foundDate) {
    showCompleteModal('찾은 날짜를 선택해주세요.', 'error');
    foundDateInput.focus();
    return;
  }
  
    // 확인 팝업 표시
    showConfirmModal();
  });

  // 모달 취소
  cancelBtn.addEventListener('click', function() {
    confirmModal.classList.remove('show');
  });

  // 모달 외부 클릭 시 닫기
  confirmModal.addEventListener('click', function(e) {
    if (e.target === confirmModal) {
      confirmModal.classList.remove('show');
    }
  });

  // 완료 팝업 표시 함수
  function showCompleteModal(message, type = 'success', onClose = null) {
    completeModalMessage.textContent = message;
    
    if (type === 'success') {
      completeModalIcon.className = 'modal-icon success';
      completeModalIconType.textContent = 'check_circle';
    } else {
      completeModalIcon.className = 'modal-icon error';
      completeModalIconType.textContent = 'error';
    }
    
    // 팝업 닫기 콜백 저장
    if (onClose) {
      completeModalCloseBtn.onclick = function() {
        closeCompleteModal();
        onClose();
      };
    } else {
      completeModalCloseBtn.onclick = closeCompleteModal;
    }
    
    completeModal.classList.add('show');
  }

  // 완료 팝업 닫기 함수
  function closeCompleteModal() {
    completeModal.classList.remove('show');
  }

  // 완료 팝업 닫기 이벤트
  completeModalCloseBtn.addEventListener('click', closeCompleteModal);
  completeModal.addEventListener('click', function(e) {
    if (e.target === completeModal) {
      closeCompleteModal();
    }
  });

  // 이미지 뷰어 이벤트 리스너
  closeImageViewerBtn.addEventListener('click', closeImageViewer);

  imageViewerModal.addEventListener('click', function(e) {
    if (e.target === imageViewerModal) {
      closeImageViewer();
    }
  });

  prevImageBtn.addEventListener('click', showPrevImage);
  nextImageBtn.addEventListener('click', showNextImage);

  // 키보드 이벤트 (좌우 화살표로 이미지 이동, ESC로 닫기)
  document.addEventListener('keydown', function(e) {
    if (imageViewerModal.classList.contains('show')) {
      if (e.key === 'Escape') {
        closeImageViewer();
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      }
    }
  });

  // 확인 버튼 - 게시물 업로드
  confirmBtn.addEventListener('click', async function() {
    confirmBtn.disabled = true;
    confirmBtn.textContent = '업로드 중...';
    
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('type', 'Found'); // 찾았어요
      formData.append('title', postData.title);
      formData.append('content', postData.description);
      formData.append('category', postData.category);
      formData.append('location', postData.location);
      formData.append('lost_date', postData.foundDate);
      
      // 이미지 추가
      postData.images.forEach((image, index) => {
        formData.append('images', image.file);
      });
      
      // JWT 토큰 가져오기
      const token = localStorage.getItem('access_token');
      
      // 백엔드 API 호출
      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // 확인 팝업 닫기
        confirmModal.classList.remove('show');
        // 완료 팝업 표시 후 홈 페이지로 이동
        showCompleteModal('게시물이 성공적으로 등록되었습니다!', 'success', function() {
          window.location.href = '../home/home.html';
        });
      } else {
        // 실패 시 에러 메시지 표시
        showCompleteModal(data.error || '게시물 등록에 실패했습니다.', 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = '올리기';
      }
    } catch (error) {
      console.error('게시물 업로드 오류:', error);
      // 확인 팝업 닫기
      confirmModal.classList.remove('show');
      // 임시 처리: 서버 없을 때
      showCompleteModal('게시물이 성공적으로 등록되었습니다! (임시)', 'success', function() {
        window.location.href = '../home/home.html';
      });
    }
  });
}

// 확인 팝업 표시
function showConfirmModal() {
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
      <div class="preview-item-label">찾은 물건 카테고리</div>
      <div class="preview-item-value">${postData.category}</div>
    </div>
    <div class="preview-item">
      <div class="preview-item-label">찾은 장소</div>
      <div class="preview-item-value">${postData.location}</div>
    </div>
    <div class="preview-item">
      <div class="preview-item-label">찾은 날짜</div>
      <div class="preview-item-value">${formatDate(postData.foundDate)}</div>
    </div>
  `;
  
  confirmModal.classList.add('show');
}

// 날짜 포맷팅
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소 가져오기
  backBtn = document.getElementById('backBtn');
  imageUpload = document.getElementById('imageUpload');
  imageUploadContainer = document.getElementById('imageUploadContainer');
  uploadBtn = document.getElementById('uploadBtn');
  titleInput = document.getElementById('title');
  titleCount = document.getElementById('titleCount');
  descriptionInput = document.getElementById('description');
  descriptionCount = document.getElementById('descriptionCount');
  categoryButtons = document.querySelectorAll('.category-btn');
  locationInput = document.getElementById('location');
  foundDateInput = document.getElementById('foundDate');
  submitBtn = document.getElementById('submitBtn');
  confirmModal = document.getElementById('confirmModal');
  cancelBtn = document.getElementById('cancelBtn');
  confirmBtn = document.getElementById('confirmBtn');
  modalPreview = document.getElementById('modalPreview');
  imageViewerModal = document.getElementById('imageViewerModal');
  viewerImage = document.getElementById('viewerImage');
  imageViewerIndex = document.getElementById('imageViewerIndex');
  closeImageViewerBtn = document.getElementById('closeImageViewer');
  prevImageBtn = document.getElementById('prevImage');
  nextImageBtn = document.getElementById('nextImage');
  completeModal = document.getElementById('completeModal');
  completeModalIcon = document.getElementById('completeModalIcon');
  completeModalIconType = document.getElementById('completeModalIconType');
  completeModalMessage = document.getElementById('completeModalMessage');
  completeModalCloseBtn = document.getElementById('completeModalCloseBtn');

  // 오늘 날짜를 기본값으로 설정
  const today = new Date().toISOString().split('T')[0];
  foundDateInput.value = today;
  foundDateInput.max = today; // 오늘 이후 날짜 선택 불가

  // 변수가 제대로 로드되었는지 확인
  if (!imageUploadContainer) {
    console.error('imageUploadContainer를 찾을 수 없습니다. HTML을 확인해주세요.');
    return;
  }
  
  // 이벤트 리스너 설정
  setupImageUpload();
  setupEventListeners();

  // 업로드 버튼 클릭 이벤트
  uploadBtn.addEventListener('click', () => {
    imageUpload.click();
  });
  
  // 초기 이미지 미리보기 업데이트
  updateImagePreview();
});

