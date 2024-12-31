// Appwrite 클라이언트 초기화
const client = new Appwrite.Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Appwrite 엔드포인트
    .setProject('treekiosk'); // 프로젝트 ID

const account = new Appwrite.Account(client);
const database = new Appwrite.Databases(client);

// Authentication check
account.get().then(user => {
console.log('User logged in:', user);
}).catch(() => {
window.location.href = 'index.html'; // Redirect if not logged in
});

// Fetch item data and render form
window.onload = function () {
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('item');

if (itemId) {
  const decodedItemId = decodeURIComponent(itemId);

  fetch("image/file.json")
    .then(res => res.json())
    .then(data => {
      const item = data[decodedItemId];
      const form = document.getElementById("select");
      form.innerHTML = `
        <img src="${item.image}" alt="${item.name}" data-id="${decodedItemId}"><br>
        <span class="info">${item.name}</span><br><br>
        <div class="input-group flex-nowrap">
          <button type="button" class="btn btn-outline-danger" onclick="decreaseQuantity()">-</button>
          <input type="number" id="quantity" value="1" min="1" max="5" class="form-control"/>
          <button type="button" class="btn btn-outline-success" onclick="increaseQuantity()">+</button>
        </div>
        <br>
        <button type="submit" class="btn btn-outline-success">확인</button>
        <button type="reset" class="btn btn-outline-warning">취소</button>
      `;

      form.dataset.id = decodedItemId;
      form.dataset.description = item.name;
      form.dataset.image = item.image;
      form.dataset.price = item.price;
      form.addEventListener("submit", handleSubmit);
      form.addEventListener("reset", resetForm);
    })
    .catch(err => console.error(err));
} else {
  console.error('Item not found');
}
};

function decreaseQuantity() {
const quantityInput = document.getElementById('quantity');
let currentValue = parseInt(quantityInput.value);
if (currentValue > 1) {
  quantityInput.value = currentValue - 1;
}
}

function increaseQuantity() {
const quantityInput = document.getElementById('quantity');
let currentValue = parseInt(quantityInput.value);
if (currentValue < 5) {
  quantityInput.value = currentValue + 1;
}
}

function handleSubmit(e) {
e.preventDefault();
const form = e.target;
const itemId = form.dataset.id;
const description = form.dataset.description;
const image = form.dataset.image;
const price = form.dataset.price;
const quantity = document.getElementById("quantity").value;

const urlParams = new URLSearchParams({
  id: itemId,
  description: description,
  image: image,
  price: price,
  quantity: quantity
});

window.location.href = `cart.html?${urlParams.toString()}`;
}

function resetForm(event) {
event.preventDefault();
const form = event.target;
form.querySelector('#quantity').value = 1;
window.close();
}

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