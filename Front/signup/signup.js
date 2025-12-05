// 회원가입 데이터 저장
const signupData = {
  email: '',
  password: '',
  nickname: '',
  profileImage: null,
  agreedTerms: {
    service: false,
    privacy: false,
    marketing: false
  }
};

let currentStep = 1;
const totalSteps = 3;
let nicknameChecked = false;

// DOM 요소
const backBtn = document.getElementById('backBtn');
const nextBtn1 = document.getElementById('nextBtn1');
const nextBtn2 = document.getElementById('nextBtn2');
const completeBtn = document.getElementById('completeBtn');
const agreeAllCheckbox = document.getElementById('agreeAll');
const agreeCheckboxes = document.querySelectorAll('.agree-checkbox');
const profileImageInput = document.getElementById('profileImage');
const profilePreview = document.getElementById('profilePreview');
const profilePlaceholder = document.getElementById('profilePlaceholder');
const checkNicknameBtn = document.getElementById('checkNicknameBtn');

// 단계 표시 함수
function showStep(step) {
  // 모든 단계 숨기기
  document.querySelectorAll('.signup-step').forEach(s => {
    s.classList.remove('active');
  });
  
  // 현재 단계 표시
  document.getElementById(`step${step}`).classList.add('active');
  
  // 단계 인디케이터 업데이트
  document.querySelectorAll('.step-dot').forEach((dot, index) => {
    if (index + 1 <= step) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
  
  document.querySelectorAll('.step-line').forEach((line, index) => {
    if (index + 1 < step) {
      line.classList.add('active');
    } else {
      line.classList.remove('active');
    }
  });
  
  currentStep = step;
}

// 이전 단계로
function goToPreviousStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  } else {
    // 첫 번째 단계에서 뒤로가기 시 로그인 페이지로
    window.location.href = '../login/login.html';
  }
}

// 다음 단계로
function goToNextStep() {
  if (currentStep < totalSteps) {
    showStep(currentStep + 1);
  }
}

// 1단계 검증
function validateStep1() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  
  let isValid = true;
  
  // 이메일 검증
  const emailPattern = /^[^\s@]+@edu\.hanbat\.ac\.kr$/;
  if (!email) {
    showError('emailError', '학교메일을 입력해주세요.');
    isValid = false;
  } else if (!emailPattern.test(email)) {
    showError('emailError', '학교메일 형식이 올바르지 않습니다.');
    isValid = false;
  } else {
    clearError('emailError');
    document.getElementById('email').classList.remove('error');
  }
  
  // 비밀번호 검증
  if (!password) {
    showError('passwordError', '비밀번호를 입력해주세요.');
    isValid = false;
  } else if (password.length < 6) {
    showError('passwordError', '비밀번호는 6자 이상이어야 합니다.');
    isValid = false;
  } else {
    clearError('passwordError');
    document.getElementById('password').classList.remove('error');
  }
  
  // 비밀번호 확인 검증
  if (!passwordConfirm) {
    showError('passwordConfirmError', '비밀번호 확인을 입력해주세요.');
    isValid = false;
  } else if (password !== passwordConfirm) {
    showError('passwordConfirmError', '비밀번호가 일치하지 않습니다.');
    isValid = false;
  } else {
    clearError('passwordConfirmError');
    document.getElementById('passwordConfirm').classList.remove('error');
  }
  
  if (isValid) {
    signupData.email = email;
    signupData.password = password;
  }
  
  return isValid;
}

// 에러 메시지 표시
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  const inputElement = errorElement.previousElementSibling.previousElementSibling;
  if (inputElement) {
    inputElement.classList.add('error');
  }
}

// 에러 메시지 제거
function clearError(elementId) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = '';
  const inputElement = errorElement.previousElementSibling.previousElementSibling;
  if (inputElement) {
    inputElement.classList.remove('error');
  }
}

// 약관 동의 검증
function validateStep2() {
  const serviceAgreed = document.querySelector('[data-term="service"]').checked;
  const privacyAgreed = document.querySelector('[data-term="privacy"]').checked;
  
  if (serviceAgreed && privacyAgreed) {
    signupData.agreedTerms.service = serviceAgreed;
    signupData.agreedTerms.privacy = privacyAgreed;
    signupData.agreedTerms.marketing = document.querySelector('[data-term="marketing"]').checked;
    return true;
  }
  
  return false;
}

// 약관 동의 상태 업데이트
function updateAgreeButton() {
  const isValid = validateStep2();
  nextBtn2.disabled = !isValid;
}

// 전체 동의 체크박스
agreeAllCheckbox.addEventListener('change', function() {
  agreeCheckboxes.forEach(checkbox => {
    checkbox.checked = this.checked;
  });
  updateAgreeButton();
});

// 개별 약관 체크박스
agreeCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    // 전체 동의 체크박스 상태 업데이트
    const allChecked = Array.from(agreeCheckboxes).every(cb => cb.checked);
    agreeAllCheckbox.checked = allChecked;
    
    updateAgreeButton();
  });
});

// 프로필 이미지 업로드
profileImageInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      profilePreview.src = e.target.result;
      profilePreview.style.display = 'block';
      profilePlaceholder.style.display = 'none';
      signupData.profileImage = file;
    };
    reader.readAsDataURL(file);
  }
});

// 프로필 이미지 클릭 시 업로드
profilePlaceholder.addEventListener('click', () => {
  profileImageInput.click();
});

profilePreview.addEventListener('click', () => {
  profileImageInput.click();
});

// 닉네임 중복 확인
async function checkNickname() {
  const nickname = document.getElementById('nickname').value.trim();
  
  if (!nickname) {
    alert('닉네임을 입력해주세요.');
    return;
  }
  
  if (nickname.length < 2 || nickname.length > 10) {
    alert('닉네임은 2~10자로 입력해주세요.');
    return;
  }
  
  checkNicknameBtn.disabled = true;
  checkNicknameBtn.textContent = '확인 중...';
  
  try {
    // 백엔드 API 호출
    const response = await fetch(`/api/v1/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (data.available) {
      alert('사용 가능한 닉네임입니다.');
      nicknameChecked = true;
      signupData.nickname = nickname;
      document.getElementById('nickname').classList.remove('error');
      clearError('nicknameError');
      updateCompleteButton();
    } else {
      alert('이미 사용 중인 닉네임입니다.');
      nicknameChecked = false;
      document.getElementById('nickname').classList.add('error');
      showError('nicknameError', '이미 사용 중인 닉네임입니다.');
    }
  } catch (error) {
    console.error('닉네임 확인 오류:', error);
    // 임시 처리: 서버 없을 때 자동 통과
    alert('사용 가능한 닉네임입니다.');
    nicknameChecked = true;
    signupData.nickname = nickname;
    document.getElementById('nickname').classList.remove('error');
    clearError('nicknameError');
    updateCompleteButton();
  } finally {
    checkNicknameBtn.disabled = false;
    checkNicknameBtn.textContent = '중복 확인';
  }
}

// 완료 버튼 상태 업데이트
function updateCompleteButton() {
  const nickname = document.getElementById('nickname').value.trim();
  completeBtn.disabled = !(nickname && nicknameChecked);
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
  // 뒤로가기 버튼
  backBtn.addEventListener('click', goToPreviousStep);
  
  // 1단계 다음 버튼
  nextBtn1.addEventListener('click', function() {
    if (validateStep1()) {
      goToNextStep();
    }
  });
  
  // 2단계 다음 버튼
  nextBtn2.addEventListener('click', function() {
    if (validateStep2()) {
      goToNextStep();
    }
  });
  
  // 닉네임 입력 이벤트
  document.getElementById('nickname').addEventListener('input', function() {
    nicknameChecked = false;
    updateCompleteButton();
  });
  
  // 닉네임 중복 확인 버튼
  checkNicknameBtn.addEventListener('click', checkNickname);
  
  // Enter 키로 중복 확인
  document.getElementById('nickname').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkNickname();
    }
  });
  
  // 가입 완료 버튼
  completeBtn.addEventListener('click', async function() {
    if (!nicknameChecked) {
      alert('닉네임 중복 확인을 해주세요.');
      return;
    }
    
    completeBtn.disabled = true;
    completeBtn.textContent = '가입 중...';
    
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('email', signupData.email);
      formData.append('password', signupData.password);
      formData.append('nickname', signupData.nickname);
      if (signupData.profileImage) {
        formData.append('profileImage', signupData.profileImage);
      }
      
      // 백엔드 API 호출
      const response = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('회원가입이 완료되었습니다!');
        window.location.href = '../login/login.html';
      } else {
        alert(data.error || '회원가입에 실패했습니다.');
        completeBtn.disabled = false;
        completeBtn.textContent = '가입 완료';
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      // 임시 처리: 서버 없을 때
      alert('회원가입이 완료되었습니다! (임시)');
      window.location.href = '../login/login.html';
    }
  });
  
  // 초기 약관 동의 버튼 상태
  updateAgreeButton();
  
  // 초기 완료 버튼 상태
  updateCompleteButton();
});

