// Appwrite 클라이언트 초기화
const client = new Appwrite.Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Appwrite 엔드포인트
    .setProject('treekiosk'); // 프로젝트 ID

const account = new Appwrite.Account(client);
const database = new Appwrite.Databases(client, 'treekiosk');
const storage = new Appwrite.Storage(client);

// DOM 요소 참조
const ul = document.getElementById("list");

// 초기화 함수
window.addEventListener('load', init);

function init() {
  home();

  if (ul && ul.innerHTML.trim() === '') {
    loadItem();
  }
}

// 데이터 로드
function loadItem() {
  fetch("/image/file.json")
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    ul.innerHTML = ''; // Clear existing content

    for (let key in data) {
      const listItem = display(data[key], key);
      ul.appendChild(listItem);
    }

    // Preload images using lazy loading
    let images = document.querySelectorAll(".lazyload");
    fastLazyLoad(images);
  })
  .catch(error => {
    console.error("Error fetching data:", error);
  });
}

// 아이템 표시
function display(child, key) {
  const li = document.createElement('li');
  li.className = "list-group-item d-flex justify-content-between align-items-center item";

  const img = document.createElement('img');
  img.className = "lazyload";
  img.alt = child.name;
  img.dataset.id = key;
  img.src = child.placeholder || 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA=='; // 작은 placeholder 이미지

  img.dataset.src = child.image;  // 실제 이미지는 나중에 로드
  img.dataset.srcset = `${child.imageSmall} 320w, ${child.image} 640w`; // 다양한 해상도 지원

  img.loading = 'eager';
  img.onclick = edit; // 편집 기능 연결

  const span = document.createElement('span');
  span.className = "info";
  span.textContent = child.name;

  li.appendChild(img);
  li.appendChild(span);

  return li;
}
// 최적화된 Lazy Load 함수
function fastLazyLoad(images) {
  const observer = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        preloadImage(entry.target);
        self.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px',
    threshold: 0.1
  });

  images.forEach(image => observer.observe(image));
}

function preloadImage(img) {
  const src = img.dataset.src;
  if (src) {
    img.src = src; // 실제 이미지 로드
  }
  if (img.dataset.srcset) {
    img.srcset = img.dataset.srcset; // 고해상도 디스플레이 지원
  }
}

// 편집 기능
function edit(event) {
  const id = event.target.dataset.id;
  const url = `add.html?item=${encodeURIComponent(id)}`;
  openWindow(url);
}

// 페이지 전환
function switchPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    page.style.display = page.id === pageId ? 'block' : 'none';
  });
}

function home() {
  switchPage('main');
}

function openWindow(name) {
  const url = `${name}`;
  const win = window.open(url, '_blank');
  win.focus();
}

// 인증 상태 확인
account.get()
  .then(user => {
    console.log("Logged in as:", user);
  })
  .catch(() => {
    location.href = "index.html";
  });

// 메시지 이벤트 핸들러
window.addEventListener("message", function (event) {
  if (event.origin !== window.location.origin) {
    return;
  }
  if (event.data === "home") {
    window.location.href = `index.html`;
  }
});

// 로컬 데이터 설정
async function setLocal(email) {
  try {
      const response = await database.listDocuments(
        'tree-kiosk',        // 데이터베이스 ID
        'owner',             // 컬렉션 ID
          [Appwrite.Query.equal('email', email)] // 이메일 주소 사용
      );

      if (response.documents.length === 0) {
          location.href = "index.html";
          return;
      }

      const doc = response.documents[0]; // 첫 번째 검색 결과
      if (doc.active) {
          localStorage.setItem("name", doc.name);
          localStorage.setItem("email", email);
      } else {
          location.href = "index.html";
      }
  } catch (error) {
      location.href = "index.html";
  }
}


document.addEventListener("DOMContentLoaded", function () {
  const email = localStorage.getItem('email');
  if (email) {
    setLocal(email);
  }
});