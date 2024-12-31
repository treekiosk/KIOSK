// Appwrite 클라이언트 초기화
const client = new Appwrite.Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Appwrite 엔드포인트
    .setProject('treekiosk'); // 프로젝트 ID

const account = new Appwrite.Account(client);
const database = new Appwrite.Databases(client);

// 유틸리티 함수: 특정 요소를 보여주거나 숨김
function toggleVisibility(elementsToShow, elementsToHide) {
    elementsToShow.forEach(id => document.getElementById(id).style.display = 'block');
    elementsToHide.forEach(id => document.getElementById(id).style.display = 'none');
}

// 로컬 스토리지에 사용자 데이터 설정 및 UI 업데이트
async function setLocalUserData(email) {
    try {
        // 이메일 속성 기반으로 문서 검색
        const response = await database.listDocuments(
            'tree-kiosk',        // 데이터베이스 ID
            'owner',             // 컬렉션 ID
            [Appwrite.Query.equal('email', email)] // 원본 이메일 주소 사용
        );

        if (response.documents.length === 0) {
            console.error('문서를 찾을 수 없습니다.');
            toggleVisibility(['nouser'], ['front', 'login-container']);
            return;
        }

        const document = response.documents[0]; // 첫 번째 검색 결과
        const { name, active } = document;

        if (active !== false) {
            localStorage.setItem("name", name);
            localStorage.setItem("email", email);
            toggleVisibility(['front'], ['login-container']);
        } else {
            toggleVisibility(['nouser'], ['front', 'login-container']);
        }
    } catch (error) {
        console.error('사용자 데이터를 가져오는 중 오류 발생:', error);
        toggleVisibility(['nouser'], ['front', 'login-container']);
    }
}



// 인증 상태 확인 및 UI 업데이트
async function checkAuthState() {
    try {
        const user = await account.get();

        if (user) {
            console.log('로그인된 사용자:', user.email);
            localStorage.setItem('name', user.name);
            localStorage.setItem('email', user.email);
            setLocalUserData(user.email);
        }
    } catch (error) {
        console.error('로그인되지 않았거나 세션이 만료됨:', error);
        toggleVisibility(['login-container'], ['front']);
    }
}

// 로그아웃 처리
document.getElementById('logout-link').addEventListener('click', async (e) => {
    e.preventDefault();
    if (confirm('정말로 로그아웃하시겠습니까?')) {
        try {
            await account.deleteSession('current');
            console.log('로그아웃 완료');
            localStorage.clear();
            sessionStorage.clear();
            toggleVisibility(['login-container'], ['front']);
        } catch (error) {
            console.error('로그아웃 중 오류 발생:', error);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});


// Google OAuth 로그인
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
    try {
        await account.createOAuth2Session('google', 'https://127.0.0.1:5500', 'https://127.0.0.1:5500');
        console.log('Google OAuth 세션 생성 완료');
        checkAuthState();
    } catch (error) {
        console.error('Google 로그인 중 오류 발생:', error);
    }
});

