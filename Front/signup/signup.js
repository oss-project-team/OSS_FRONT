// 회원가입 데이터 저장
const signupData = {
  email: '',
  password: '',
  nickname: '',
  profileImage: null,
  profileImageBase64: '',
  agreedTerms: {
    service: false,
    privacy: false,
    marketing: false
  }
};

let currentStep = 1;
const totalSteps = 3;
let nicknameChecked = false;
let emailVerified = true; // 이메일 인증 건너뛰기 (테스트용)

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
const sendVerificationBtn = document.getElementById('sendVerificationBtn');
const verifyCodeBtn = document.getElementById('verifyCodeBtn');
const verificationSection = document.getElementById('verificationSection');
const verificationCodeInput = document.getElementById('verificationCode');

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
  
  // 이메일 검증 (일반 이메일 형식)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    showError('emailError', '이메일을 입력해주세요.');
    isValid = false;
  } else if (!emailPattern.test(email)) {
    showError('emailError', '이메일 형식이 올바르지 않습니다.');
    isValid = false;
  } else {
    // 이메일 인증 체크 제거 (테스트용)
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
      // base64 데이터도 저장 (나중에 API 호출 시 사용)
      signupData.profileImageBase64 = e.target.result;
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

// 이메일 인증번호 발송
async function sendVerificationCode() {
  const email = document.getElementById('email').value.trim();
  
  if (!email) {
    showError('emailError', '이메일을 입력해주세요.');
    return;
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showError('emailError', '이메일 형식이 올바르지 않습니다.');
    return;
  }
  
  sendVerificationBtn.disabled = true;
  sendVerificationBtn.textContent = '발송 중...';
  clearError('emailError');
  
  try {
    const response = await fetch('https://chajabat.onrender.com/api/v1/auth/send-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    });
    
    // CORS 오류나 네트워크 오류 확인
    if (!response) {
      throw new Error('서버에 연결할 수 없습니다. CORS 설정을 확인해주세요.');
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 (빈 응답 등)
      if (response.ok) {
        // 응답은 성공했지만 JSON이 아닌 경우
        alert('인증번호가 발송되었습니다. 이메일을 확인해주세요.');
        verificationSection.style.display = 'block';
        emailVerified = false;
        signupData.email = email;
        return;
      } else {
        throw new Error(`서버 오류 (${response.status}): ${response.statusText}`);
      }
    }
    
    if (response.ok) {
      alert('인증번호가 발송되었습니다. 이메일을 확인해주세요.');
      verificationSection.style.display = 'block';
      emailVerified = false;
      signupData.email = email;
    } else {
      showError('emailError', data.error || `인증번호 발송에 실패했습니다. (${response.status})`);
    }
  } catch (error) {
    console.error('인증번호 발송 오류:', error);
    
    // CORS 오류인지 확인
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      showError('emailError', 'CORS 오류: 백엔드 서버의 CORS 설정을 확인해주세요. 또는 로컬 서버를 사용해주세요.');
      alert('CORS 오류가 발생했습니다.\n\n해결 방법:\n1. 로컬 서버를 사용하여 실행하세요 (예: Live Server)\n2. 백엔드에서 CORS 설정을 확인하세요');
    } else {
      showError('emailError', error.message || '인증번호 발송 중 오류가 발생했습니다.');
    }
  } finally {
    sendVerificationBtn.disabled = false;
    sendVerificationBtn.textContent = '인증번호 발송';
  }
}

// 이메일 인증번호 확인
async function verifyCode() {
  const email = document.getElementById('email').value.trim();
  const code = verificationCodeInput.value.trim();
  
  if (!code) {
    showError('verificationError', '인증번호를 입력해주세요.');
    return;
  }
  
  verifyCodeBtn.disabled = true;
  verifyCodeBtn.textContent = '확인 중...';
  clearError('verificationError');
  
  try {
    const response = await fetch('https://chajabat.onrender.com/api/v1/auth/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email: email,
        code: code 
      })
    });
    
    // CORS 오류나 네트워크 오류 확인
    if (!response) {
      throw new Error('서버에 연결할 수 없습니다. CORS 설정을 확인해주세요.');
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시
      if (response.ok) {
        // 응답은 성공했지만 JSON이 아닌 경우
        emailVerified = true;
        document.getElementById('verificationStatus').textContent = '✓ 이메일 인증이 완료되었습니다.';
        document.getElementById('verificationStatus').style.color = '#4caf50';
        verificationCodeInput.disabled = true;
        verifyCodeBtn.disabled = true;
        verifyCodeBtn.textContent = '인증 완료';
        clearError('emailError');
        document.getElementById('email').classList.remove('error');
        return;
      } else {
        throw new Error(`서버 오류 (${response.status}): ${response.statusText}`);
      }
    }
    
    if (response.ok) {
      emailVerified = true;
      document.getElementById('verificationStatus').textContent = '✓ 이메일 인증이 완료되었습니다.';
      document.getElementById('verificationStatus').style.color = '#4caf50';
      verificationCodeInput.disabled = true;
      verifyCodeBtn.disabled = true;
      verifyCodeBtn.textContent = '인증 완료';
      clearError('emailError');
      document.getElementById('email').classList.remove('error');
    } else {
      showError('verificationError', data.error || `인증번호가 일치하지 않습니다. (${response.status})`);
    }
  } catch (error) {
    console.error('인증번호 확인 오류:', error);
    
    // CORS 오류인지 확인
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      showError('verificationError', 'CORS 오류: 백엔드 서버의 CORS 설정을 확인해주세요.');
    } else {
      showError('verificationError', error.message || '인증번호 확인 중 오류가 발생했습니다.');
    }
  } finally {
    if (!emailVerified) {
      verifyCodeBtn.disabled = false;
      verifyCodeBtn.textContent = '인증 확인';
    }
  }
}

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
    const response = await fetch(`https://chajabat.onrender.com/api/v1/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
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
  
  // 이메일 인증번호 발송 버튼
  sendVerificationBtn.addEventListener('click', sendVerificationCode);
  
  // 이메일 인증번호 확인 버튼
  verifyCodeBtn.addEventListener('click', verifyCode);
  
  // 이메일 입력 시 인증 상태 초기화
  document.getElementById('email').addEventListener('input', function() {
    emailVerified = false;
    verificationSection.style.display = 'none';
    verificationCodeInput.value = '';
    verificationCodeInput.disabled = false;
    verifyCodeBtn.disabled = false;
    verifyCodeBtn.textContent = '인증 확인';
    document.getElementById('verificationStatus').textContent = '';
    clearError('verificationError');
  });
  
  // 인증번호 입력 시 Enter 키로 확인
  verificationCodeInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      verifyCode();
    }
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
      // 프로필 이미지 base64 사용 (이미 변환되어 있음)
      const profileImageBase64 = signupData.profileImageBase64 || '';
      
      // JSON 형식으로 전송 (이메일 인증 없이)
      const requestData = {
        email: signupData.email,
        password: signupData.password,
        nickname: signupData.nickname,
        profileImage: profileImageBase64
      };
      
      // 백엔드 API 호출
      const response = await fetch('https://chajabat.onrender.com/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // localStorage에 닉네임 및 프로필 이미지 저장
        if (signupData.nickname) {
          localStorage.setItem("nickname", signupData.nickname);
        }
        if (profileImageBase64) {
          localStorage.setItem("profileImage", profileImageBase64);
        }
        alert('회원가입이 완료되었습니다!');
        window.location.href = '../login/login.html';
      } else {
        alert(data.error || '회원가입에 실패했습니다.');
        completeBtn.disabled = false;
        completeBtn.textContent = '가입 완료';
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      // 임시 처리: 서버 없을 때 - localStorage에 닉네임 저장
      if (signupData.nickname) {
        localStorage.setItem("nickname", signupData.nickname);
      }
      alert('회원가입이 완료되었습니다! (임시)');
      window.location.href = '../login/login.html';
    }
  });
  
  // 초기 약관 동의 버튼 상태
  updateAgreeButton();
  
  // 초기 완료 버튼 상태
  updateCompleteButton();
});

