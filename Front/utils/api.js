// API 기본 설정
const API_BASE_URL = 'https://chajabat.onrender.com';

// 인증 토큰을 포함한 헤더 가져오기
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return headers;
}

// FormData를 사용할 때의 인증 헤더 (Content-Type 제외)
function getAuthHeadersForFormData() {
    const headers = {};
    
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return headers;
}

// API 호출 래퍼 함수
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: getAuthHeaders(),
        ...options
    };
    
    try {
        const response = await fetch(url, defaultOptions);
        return response;
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
}

// FormData를 사용하는 API 호출
async function apiCallFormData(endpoint, formData) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getAuthHeadersForFormData();
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        return response;
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
}


