const firebaseConfig = {
    apiKey: "AIzaSyBsUla3VNIn6wccJ43Ui5Dzw9mwIAHcdKE",
    authDomain: "auth.appwebsite.tech",
    databaseURL: "https://treeentertainment-default-rtdb.firebaseio.com",
    projectId: "treeentertainment",
    storageBucket: "treeentertainment.appspot.com",
    messagingSenderId: "302800551840",
    appId: "1:302800551840:web:1f7ff24b21ead43cc3eec5"
};

// Firebase 초기화
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();    
const realtimeDb = firebase.database();
var email = JSON.parse(window.localStorage.getItem('email'));
var number = JSON.parse(window.localStorage.getItem('number'));
var name = JSON.parse(window.localStorage.getItem('name'));
const user = firebase.auth().currentUser;
let orderwindow;


window.addEventListener('message', (event) => {  
  if (event.data.type === 'updateOrder' && event.origin === window.location.origin) {
    updatequantity(Number(event.data.id), event.data.quantity);
  } else if(event.data === 'newOrder' && event.origin === window.location.origin) {
    displayorders();
  } else if(event.data === 'noselect' && event.origin === window.location.origin) {
    if(orderwindow) {
      orderwindow.close(); // 기존 창 닫기
      orderwindow = null; // 참조 초기화
    }
  } else if(event.data === 'original' && event.origin === window.location.origin) {
    window.location.href = "index.html"; // 첫 페이지로 이동
  }
}, false);

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        var originalEmail = user.email;
        var fixedemail = originalEmail.replace(".", "@");

        window.localStorage.setItem('email', JSON.stringify(fixedemail));

        firebase.database().ref('/people/admin/' + fixedemail).once('value').then((snapshot) => {
          const data = snapshot.val();
          if (data && data.enabled === true) {

            firebase.database().ref('/people/data/' + data.store).once('value').then((snapshot) => {
              const data = snapshot.val();
              if (data && data.email === fixedemail) {
                window.localStorage.setItem('name', JSON.stringify(data.name));
            } else {
                window.location.href = "index.html"; // 로그인 페이지로 이동
              }
            });
  
          } else {
            window.location.href = "index.html"; // 로그인 페이지로 이동
        }
      });    
    } else {
      console.log("사용자 없음, 로그인 페이지로 이동");
      window.location.href = "index.html"; // 로그인 페이지로 이동
    }
});
    
function updatePage() {
      let hash = location.hash.substring(1) || "all"; // 기본값 "all"

      // 모든 페이지 숨기기
      document.querySelectorAll('.page').forEach(page => {
          page.classList.remove('active');
      });

      // 현재 해시에 맞는 페이지 표시
      let activePage = document.getElementById(hash);
      if (activePage) {
          activePage.classList.add('active');
      }

      document.querySelectorAll('.tabs ul li').forEach(li => {
        li.classList.remove('is-active');
    });

    // 현재 해시와 일치하는 <a> 태그 찾기
    let activeLink = document.querySelector(`.tabs ul li a[href="#${hash}"]`);
    
    // <a> 태그가 존재하면, 해당 <a>의 부모 <li>에 is-active 추가
    if (activeLink) {
        activeLink.parentElement.classList.add('is-active');
    }
}

window.addEventListener("hashchange", updatePage);
window.addEventListener("load", updatePage);
document.addEventListener("DOMContentLoaded", display);

function getOrder() {
    return JSON.parse(localStorage.getItem('order')) || [];
}

function display() {
    window.localStorage.removeItem('order');
    firebase.database().ref('/people/data/' + number + '/menu').once('value').then((snapshot) => {
      const allcontent = document.getElementById("all-content");
      const drinkscontent = document.getElementById("drinks-content");
      const foodscontent = document.getElementById("foods-content");
      drinkscontent.innerHTML = ''; // Clear existing content
      foodscontent.innerHTML = ''; // Clear existing content  
      allcontent.innerHTML = ''; // Clear existing content
  
      snapshot.val().cafe.drinks.forEach((drink) => {
        const cellBox = document.createElement('div');
        cellBox.className = 'cell box boxes';

        cellBox.onclick = function(event) {
          selectoption(event, drink);
        };

        const figure = document.createElement('figure');
        figure.className = 'image is-128x128 blurred-img';
  
        const img = document.createElement('img');
        img.src = drink.image;
        img.style.width = '128px';
        img.style.height = '128px';
        img.style.objectFit = 'cover';

        img.addEventListener('load', function() {
          figure.classList.add("loaded");
        });

      const center = document.createElement('center');
        center.appendChild(img);


        const br = document.createElement('br');
        center.appendChild(br);

        
        const strong = document.createElement('strong');
        strong.textContent = drink.name;
        center.appendChild(strong);

        const br2 = document.createElement('br');
        center.appendChild(br2); 

        const price = document.createElement('strong');
        price.textContent = drink.price + "원";
        center.appendChild(price);

        const br3 = document.createElement('br');
  
        center.appendChild(br3); 
  
        if (drink.option && drink.option.some(option => option.name.includes('HOT/ICE'))) {
          const hot = document.createElement('span');
          hot.className = 'tag is-danger';
          hot.textContent = 'HOT';
          center.appendChild(hot);
          const devide = document.createElement('strong');
          devide.textContent = " / ";

          center.appendChild(devide);
          const ice = document.createElement('span');
          ice.className = 'tag is-success';
          ice.textContent = 'ICE';
          center.appendChild(ice);
        }
        
        center.appendChild(figure);

        
        cellBox.appendChild(center);
        const cellbox2 = cellBox.cloneNode(true);
        cellbox2.onclick = function(event) {
          selectoption(event, drink);
        };
        allcontent.appendChild(cellbox2);

        drinkscontent.appendChild(cellBox);
      });
  
      snapshot.val().cafe.foods.forEach((food) => {
        const cellBox = document.createElement('div');
        cellBox.className = 'cell box boxes';
  
        
        cellBox.onclick = function(event) {
          selectoption(event, food);
        };

        const figure = document.createElement('figure');
        figure.className = 'image is-128x128';
  
        const img = document.createElement('img');
        img.src = food.image;
        img.style.width = '128px';
        img.style.height = '128px';
        img.style.objectFit = 'cover';
  
        const center = document.createElement('center');
        center.appendChild(img);

        const br = document.createElement('br');
  
        center.appendChild(br);
        const strong = document.createElement('strong');
        strong.textContent = food.name;
  
        center.appendChild(strong);
  
        const br2 = document.createElement('br');
  
        center.appendChild(br2);

        if (food.option && food.option.some(option => option.name.includes('HOT/ICE'))) {
          const hot = document.createElement('span');
          hot.className = 'tag is-danger';
          hot.textContent = 'HOT';
          center.appendChild(hot);
          
          const devide = document.createElement('strong');
          devide.textContent = " / ";

          center.appendChild(devide);
          
          const ice = document.createElement('span');
          ice.className = 'tag is-success';
          ice.textContent = 'ICE';
          center.appendChild(ice);
        }
  
        center.appendChild(figure);
        cellBox.appendChild(center);
        const cellbox2 = cellBox.cloneNode(true);

        cellbox2.onclick = function(event) {
          selectoption(event, food);
        };

        allcontent.appendChild(cellbox2);
        foodscontent.appendChild(cellBox);
      });
    });
}

function isfull() {
    const optionform = document.getElementById('optionform');
    const optioncontent = document.getElementById('optioncontent');
    optioncontent.innerHTML = ''; // Clear existing content

    const center = document.createElement('center');
    const title = document.createElement('h1');

    title.className = 'title';
    title.textContent = "최대 주문 개수를 초과하였습니다.";
    center.appendChild(title);
    optioncontent.appendChild(center);

    var optionbuttons = document.getElementById('submitbutton');
    optionbuttons.style.display = 'none';

    openModal(document.getElementById('optionpage'));
}

function selectoption(event, item) {
  event.preventDefault(); // 기본 제출 동작 방지

  if(orderwindow) {
    orderwindow.close(); // 기존 창 닫기
    orderwindow = null; // 참조 초기화
  }
  orderwindow = window.open(`cart.html?id=${item.key}`, '_blank'); // 새 탭에서 열기
  orderwindow.data = item; // 데이터 전달
}

function displayorders() {
  let order = getOrder(); // 최신 값 가져오기

  console.log(order); // 디버깅을 위한 로그 출력
  const menupan = document.getElementById('menupan');
  menupan.innerHTML = ''; // 기존 내용 초기화

  const container = document.createElement('div');
  container.className = 'child';
  container.style.display = 'flex';
  container.style.flexWrap = 'nowrap';
  container.style.overflowX = 'auto'; // 가로 스크롤 가능하도록 설정

  order.forEach(item => {
      const cellBox = document.createElement('div');
      cellBox.className = 'box boxes menupan';
      cellBox.style.flexShrink = '0'; // 크기 유지
      cellBox.style.width = '500px'; // 요소 크기 조정
      cellBox.style.height = '110px';
      cellBox.style.margin = '5px';

      // 이미지 & 수량 조절을 가로 정렬
      const center = document.createElement('div');
      center.className = 'center';

      // 이미지 영역
      const figure = document.createElement('figure');
      figure.className = 'image';
      const img = document.createElement('img');
      img.src = item.image;
      img.style.width = '200px';
      img.style.height = '100px';
      img.style.borderRadius = '30px';
      img.style.objectFit = 'cover';

      figure.appendChild(img);
      center.appendChild(figure); // 이미지 추가

      // HOT/ICE 배지 (이미지 아래)
      item.options.forEach(option => {
          if (option.name.includes('HOT/ICE')) {
              const tag = document.createElement('span');
              tag.className = option.value === 'HOT' ? 'tag is-rounded is-danger' : 'tag is-rounded is-success';
              tag.classList.add('badge');

              tag.textContent = option.value;
              center.appendChild(tag);
          }
      });


      // 수량 조절 필드 (이미지 오른쪽)
      const field = document.createElement('div');
      field.className = 'field has-addons has-addons-centered basket';

      const control1 = document.createElement('p');
      control1.className = 'control';

      const minusButton = document.createElement('button');
      minusButton.className = 'button is-primary';
      minusButton.textContent = '-';
      control1.appendChild(minusButton);

      const control2 = document.createElement('p');
      control2.className = 'control';

      const inputs = document.createElement('input');
      inputs.className = `input basket-${item.id}`; // 각 input에 고유한 클래스 추가
      inputs.type = 'number';
      inputs.min = 1;
      if (item.max != null) {
          inputs.max = item.max;
      }
      inputs.addEventListener('input', function() {
          enforceMinMax(this);
      });

      inputs.value = item.quantity;
      control2.appendChild(inputs);

      const control3 = document.createElement('p');
      control3.className = 'control';

      const plusButton = document.createElement('button');
      plusButton.className = 'button is-primary';
      plusButton.textContent = '+';
      control3.appendChild(plusButton);

      field.appendChild(control1);
      field.appendChild(control2);
      field.appendChild(control3);

      center.appendChild(field); // 수량 조절 필드 추가

      cellBox.appendChild(center); // 전체 묶음 추가

      // 버튼 이벤트 추가
      minusButton.addEventListener('click', (event) => {
          event.preventDefault(); 
          let currentValue = parseInt(inputs.value) || 0;
          if (currentValue > 1) {
              updatequantity(item.id, currentValue - 1);
          } else if(currentValue === 1) {
            const index = order.findIndex(order => order.id === item.id);
            order.splice(index, 1);
            localStorage.setItem('order', JSON.stringify(order));
            cellBox.remove();
          }
      });

      plusButton.addEventListener('click', (event) => {
          event.preventDefault(); 
          let currentValue = parseInt(inputs.value) || 0;
          if (currentValue < item.max || item.max === "null") {
              updatequantity(item.id, currentValue + 1);
          }
      });

      container.appendChild(cellBox);
  });

  menupan.appendChild(container);
}

function updatequantity(id, quantity) {
  let order = getOrder(); // 최신 값 가져오기
  const existingIndex = order.findIndex(item => Number(item.id) === id); // Check if item exists based on id
  order[existingIndex].quantity = quantity;
  order[existingIndex].price = order[existingIndex].pricePerUnit * quantity;
  localStorage.setItem('order', JSON.stringify(order)); // Save to localStorage
  document.querySelector(`.basket-${id}`).value = quantity; // Update the input field directly
}

function enforceMinMax(el) {
  if (el.value !== "") {
    const value = parseInt(el.value, 10);  // Ensure to parse the value
    const min = parseInt(el.min, 10);      // Parse the min attribute
    const max = parseInt(el.max, 10);      // Parse the max attribute

    if (value < min) {
      el.value = min;  // Set to min if value is less than min
    } else if (value > max) {
      el.value = max;  // Set to max if value is greater than max
    }
  }
}

document.getElementById('gopay').addEventListener('click', function(event) {
  submitorder(event);
});
function submitorder(event) {
  event.preventDefault(); // 기본 제출 동작 방지
  if(orderwindow) {
    orderwindow.close(); // 기존 창 닫기
    orderwindow = null; // 참조 초기화
  }
  orderwindow = window.open(`checkout.html`, '_blank'); // 새 탭에서 열기
}