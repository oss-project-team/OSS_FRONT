document.addEventListener("DOMContentLoaded", function() {
    const loginBtn = document.getElementById("loginBtn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    loginBtn.addEventListener("click", async function () {
        const email = emailInput.value.trim();
        const pw = passwordInput.value;

        if (email === "" || pw === "") {
            alert("학교메일과 비밀번호를 입력해주세요.");
            return;
        }

        // 로딩 상태 표시
        loginBtn.disabled = true;
        loginBtn.textContent = "로그인 중...";

        try {
            // 서버로 로그인 요청 보내기
            const response = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    password: pw
                })
            });

            const data = await response.json();

            if (response.ok) {
                // 로그인 성공 - 백엔드가 반환하는 access_token과 refresh_token 저장
                if (data.access_token) {
                    localStorage.setItem("access_token", data.access_token);
                }
                if (data.refresh_token) {
                    localStorage.setItem("refresh_token", data.refresh_token);
                }
                // 홈 페이지로 이동
                window.location.href = "../home/home.html";
            } else {
                // 로그인 실패 - 백엔드가 반환하는 error 메시지 표시
                alert(data.error || "로그인에 실패했습니다. 다시 시도해주세요.");
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
});
