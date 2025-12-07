document.addEventListener("DOMContentLoaded", function() {
    const loginBtn = document.getElementById("loginBtn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");

    // 에러 메시지 표시 함수
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add("show");
    }

    // 에러 메시지 숨기기 함수
    function hideError() {
        errorMessage.classList.remove("show");
        errorMessage.textContent = "";
    }

    // 입력 필드에 포커스가 가면 에러 메시지 숨기기
    emailInput.addEventListener("focus", hideError);
    passwordInput.addEventListener("focus", hideError);

    loginBtn.addEventListener("click", async function () {
        const email = emailInput.value.trim();
        const pw = passwordInput.value;

        if (email === "" || pw === "") {
            showError("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        // 에러 메시지 숨기기
        hideError();

        // 로딩 상태 표시
        loginBtn.disabled = true;
        loginBtn.textContent = "로그인 중...";

        try {
            // 서버로 로그인 요청 보내기
            const response = await fetch("https://chajabat.onrender.com/api/v1/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    password: pw
                })
            });

            // 응답 상태 확인
            console.log("로그인 응답 상태:", response.status);
            
            let data;
            try {
                const text = await response.text();
                console.log("로그인 응답 본문:", text);
                if (text) {
                    data = JSON.parse(text);
                } else {
                    data = {};
                }
            } catch (jsonError) {
                console.error("JSON 파싱 오류:", jsonError);
                showError("서버 응답을 처리하는 중 오류가 발생했습니다.");
                return;
            }

            if (response.ok) {
                // 로그인 성공 - 백엔드가 반환하는 access_token과 refresh_token 저장
                console.log("로그인 성공, 토큰:", data);
                
                if (data.access_token) {
                    localStorage.setItem("access_token", data.access_token);
                    console.log("access_token 저장 완료");
                } else {
                    console.error("access_token이 응답에 없습니다!");
                }
                
                if (data.refresh_token) {
                    localStorage.setItem("refresh_token", data.refresh_token);
                    console.log("refresh_token 저장 완료");
                } else {
                    console.error("refresh_token이 응답에 없습니다!");
                }
                
                // 이메일 저장 (작성자 확인용)
                localStorage.setItem("user_email", email);
                
                // 닉네임 저장 (백엔드 응답에 있으면 사용, 없으면 프로필 API에서 가져오기)
                if (data.nickname) {
                    localStorage.setItem("nickname", data.nickname);
                } else {
                    // 닉네임이 응답에 없으면 프로필 API에서 가져오기
                    try {
                        const profileResponse = await fetch('https://chajabat.onrender.com/api/v1/users/profile', {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${data.access_token}`
                            }
                        });
                        
                        if (profileResponse.ok) {
                            const profileData = await profileResponse.json();
                            if (profileData.nickname) {
                                localStorage.setItem("nickname", profileData.nickname);
                            }
                        }
                    } catch (profileError) {
                        console.error("프로필 로드 오류:", profileError);
                    }
                }
                
                // 홈 페이지로 이동
                window.location.href = "../home/home.html";
            } else {
                // 로그인 실패 - 백엔드가 반환하는 error 메시지 표시
                console.error("로그인 실패:", data);
                const errorMsg = data.error || data.message || "이메일 또는 비밀번호가 일치하지 않습니다.";
                showError(errorMsg);
            }
        } catch (error) {
            console.error("로그인 오류:", error);
            // [임시 코드] 서버가 없거나 네트워크 오류 발생 시 임시 로그인 처리
            // 실제 서버가 준비되면 이 부분은 제거하거나 주석 처리하세요
            console.log("서버 연결 실패 - 임시 로그인 처리");
            
            // 임시로 토큰 저장 (테스트용)
            localStorage.setItem("access_token", "temp_token_" + Date.now());
            localStorage.setItem("refresh_token", "temp_refresh_token_" + Date.now());
            
            // 홈 페이지로 이동
            setTimeout(() => {
                window.location.href = "../home/home.html";
            }, 500); // 0.5초 후 이동 (로딩 효과를 위해)
            return; // finally 블록 실행 안 하도록 return
        } finally {
            // 로딩 상태 해제
            loginBtn.disabled = false;
            loginBtn.textContent = "로그인";
        }
    });

    // Enter 키로 로그인
    emailInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            loginBtn.click();
        }
    });

    passwordInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            loginBtn.click();
        }
    });

    // 비밀번호 보기/숨기기 토글
    const passwordToggle = document.getElementById("passwordToggle");
    if (passwordToggle) {
        passwordToggle.addEventListener("click", function() {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            
            if (type === "password") {
                passwordToggle.textContent = "visibility";
            } else {
                passwordToggle.textContent = "visibility_off";
            }
        });
    }
});
