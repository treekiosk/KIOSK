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

window.onload = function() {
  const id = new URLSearchParams(window.location.search).get('id');
  console.log(id);
  console.log(window.data);
  selectoption(window.data)
};

var email = JSON.parse(window.localStorage.getItem('email'));
var number = JSON.parse(window.localStorage.getItem('number'));
var name = JSON.parse(window.localStorage.getItem('name'));
const user = firebase.auth().currentUser;

document.getElementById("optionform").addEventListener("submit", function(event) {
    event.preventDefault(); // 기본 제출 동작 방지
    addorder();
});

function getOrder() {
    const order = JSON.parse(localStorage.getItem('order')) || [];
    return order;
}

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


function selectoption(data) {
  try {
    const optionform = document.getElementById('optionform');

    const optioncontent = document.getElementById('optioncontent');
    for (const key in optionform.dataset) {
      delete optionform.dataset[key];
    }
    optioncontent.innerHTML = ''; // Clear existing content
    const center = document.createElement('center');

    const figure = document.createElement('figure');
    const image = document.createElement('img');

    image.className = 'image is-128x128';
    image.style.width = '128px';  
    image.style.height = '128px';
    image.style.objectFit = 'cover';
    image.src = data.image;
    image.style.borderRadius = '30px';
    image.id = 'optionimg';
    figure.appendChild(image);
    center.appendChild(figure);

    const title = document.createElement('h1');
    title.className = 'title name';  
    title.textContent = data.name;
    center.appendChild(title);

    const subtitle = document.createElement('h2');
    subtitle.className = 'subtitle';    
    subtitle.id = 'optionprice';
    subtitle.textContent = data.price;
    center.appendChild(subtitle);
    
    optionform.dataset.id = data.key;
    optionform.dataset.max = data.max;
    optionform.dataset.option = JSON.stringify(data.option);

    if (data.option) {
      for (let i = 0; i < data.option.length; i++) {
        if (data.option[i].type === "radio") {
          const container = document.createElement('div');
          container.className = 'field';
          container.id = "radio-" + data.option[i].key;

          const labels = document.createElement('label');
          labels.className = 'label'; 
          labels.textContent = data.option[i].name;
          container.appendChild(labels);  

          const containerr = document.createElement('div');
          containerr.className = 'buttons has-addons is-centered';
          for (let j = 0; j < data.option[i].options.length; j++) {
            const button = document.createElement('button');
            button.className = `button ${data.option[i].color[j]} is-normal button-group`;
            button.textContent = data.option[i].options[j].toUpperCase();
            if(j === data.option[i].default){
              button.classList.add('is-focused');
            }
            button.onclick = function(event) {
              event.preventDefault(); // 폼 제출 방지         
              document.querySelectorAll('.button-group').forEach(button => {
                button.classList.remove('is-focused'); // 모든 버튼의 is-selected 클래스 제거
              });
              button.classList.add('is-focused');
            };
            containerr.appendChild(button);
        }

        
        container.appendChild(containerr);
        center.appendChild(container);

      }
        if (data.option[i].type === "range") {
          const field0 = document.createElement('div');
          field0.className = 'field';

          const labels = document.createElement('label');
          labels.className = 'label';
          labels.textContent = data.option[i].name;
        
          field0.appendChild(labels);

          const field = document.createElement('div');
          field.className = 'field has-addons has-addons-centered';
          field.id = "range-" + data.option[i].key;

          const control1 = document.createElement('p');
          control1.className = 'control';

          const minusButton = document.createElement('button');
          minusButton.className = 'button is-primary';
          minusButton.textContent = '-';
          control1.appendChild(minusButton);
        
          const control2 = document.createElement('p');
          control2.className = 'control';
        
          const inputs = document.createElement('input');
          inputs.className = 'input';
          inputs.type = 'number';
          inputs.min = data.option[i].min;

          if(data.option[i].max != null) {
          inputs.max = data.option[i].max;
          }

          inputs.onchange = function() {
            if(inputs.value > data.option[i].max && data.option[i].max != null) {
              inputs.value =  data.option[i].max;      
              inputs.max =  data.option[i].max;      
    
            }
          };

          inputs.value = 0;
          inputs.classList.add('optionquantity');
          inputs.placeholder = '수량';

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
                
          // Add event listeners for the buttons
          minusButton.addEventListener('click', (event) => {
            event.preventDefault(); // 폼 제출 방지
          
            let currentValue = parseInt(inputs.value) || 0;
            if (currentValue > 0) {
              inputs.value = currentValue - 1;
              subtitle.textContent = Number(subtitle.textContent) - Number(data.option[i].price);
            }
          });
        
          plusButton.addEventListener('click', (event) => {
            event.preventDefault(); // 폼 제출 방지
    
            let currentValue = parseInt(inputs.value) || 0;
    
            if (currentValue < data.option[i].max || data.option[i].max === "null") {
              inputs.value = currentValue + 1;
              subtitle.textContent = Number(subtitle.textContent) + Number(data.option[i].price);
            }

            
          });
        
          center.appendChild(field0);
          center.appendChild(field);
        }
      }
      
    }
      const field0 = document.createElement('div');
      field0.className = 'field';

      const labels = document.createElement('label');
      labels.className = 'label';
      labels.textContent = "수량";

      field0.appendChild(labels);


      const field = document.createElement('div');
      field.className = 'field has-addons has-addons-centered';
    
      const control1 = document.createElement('p');
      control1.className = 'control';
    
      const minusButton = document.createElement('button');
      minusButton.className = 'button is-primary';
      minusButton.textContent = '-';
      control1.appendChild(minusButton);
    
      const control2 = document.createElement('p');
      control2.className = 'control';
    
      const inputs = document.createElement('input');
      inputs.className = 'input optionquantity';
      inputs.type = 'number';
      inputs.min = 1;

      const existingIndex = getItemIndex(data.key.toString()); // Check if item exists based on id and options
      var order = getOrder(); // Get the latest order
      var maxvalue = data.max;

      if (existingIndex !== -1  && order[existingIndex].max != "null") {
        maxvalue = data.max - order[existingIndex].quantity;
        if (maxvalue <= 0 && maxvalue != "null") { 
          isfull();
          return;
        } else if (maxvalue != "null") {
          inputs.max = maxvalue;
        }
      } else if (maxvalue != "null") {
        inputs.max = maxvalue;
      }
      

      inputs.value = 1;
      inputs.id = 'optionquantity';
      inputs.placeholder = '수량';
      control2.appendChild(inputs);
    
      const control3 = document.createElement('p');
      control3.className = 'control';
    
      const plusButton = document.createElement('button');
      plusButton.className = 'button is-primary';
      plusButton.textContent = '+';
      control3.appendChild(plusButton);
    
      // Add controls to the field container
      field.appendChild(control1);
      field.appendChild(control2);
      field.appendChild(control3);
    
      // Add event listeners for the buttons
      minusButton.addEventListener('click', (event) => {
        event.preventDefault(); // 폼 제출 방지

        let currentValue = parseInt(inputs.value) || 0;
        if (currentValue > 1) {
          inputs.value = currentValue - 1;
          subtitle.textContent = Number(subtitle.textContent) - Number(data.price);
        }
      });
    
      plusButton.addEventListener('click', (event) => {
        event.preventDefault(); // 폼 제출 방지
        let currentValue = parseInt(inputs.value) || 0;

        if (currentValue < maxvalue || maxvalue === "null") {
          inputs.value = currentValue + 1;
          subtitle.textContent = Number(subtitle.textContent) + Number(data.price);
        }
      });
    
      center.appendChild(field0);
      center.appendChild(field);

      optioncontent.appendChild(center);
    } catch (error) {
    window.close();
    }
}  

function addorder() {
    const form = document.getElementById('optionform');
    const itemId = form.dataset.id;
    const max = form.dataset.max;
    const name = document.querySelector('.name')?.innerText;
    const image = document.querySelector('#optionimg').src;
    const price = Number(document.querySelector('#optionform .subtitle').textContent);
    const quantity = Number(document.querySelector('#optionquantity').value);
    let jsons; 
    try {
      jsons = JSON.parse(form.dataset.option);
    } catch (error) {
      jsons = [];
    }
    
    var newjsons = [];

    console.log(jsons.length);
    for(let i = 0; i < jsons.length; i++) {

      if(jsons[i].type === "radio") {
        const optionele = document.querySelector(`#radio-${jsons[i].key}`);
        var values = optionele.querySelector(".is-focused").innerText;
      } else if(jsons[i].type === "range") {
        const optionele = document.querySelector(`#range-${jsons[i].key}`);
        var values = optionele.querySelector(".optionquantity").value;
      }

      newjsons.push({ name: jsons[i].name, value: values });
    };

    addItemToOrder({ id: itemId, name, image, price, quantity, options: newjsons, max });  
}

function addItemToOrder({ id, image, name, price, quantity, options, max }) {
    const existingIndex = getItemIndex(id); // Check if item exists based on id and options
    let order = getOrder(); // Get the latest order

    if (existingIndex !== -1) {
        // Update existing item: add quantity and recalculate total price
        order[existingIndex].quantity += quantity;
        order[existingIndex].price = order[existingIndex].pricePerUnit * order[existingIndex].quantity;
    } else {
        // Add new item: Store price per unit for future calculations
        order.push({ id, image, name, quantity, price: price * quantity, pricePerUnit: price, options, max });
    }

    localStorage.setItem('order', JSON.stringify(order)); // Save to localStorage

    if(existingIndex !== -1) {
      window.opener.postMessage({ type: "updateOrder", id: id, quantity: order[existingIndex].quantity }, window.location.origin);
    } else {
      window.opener.postMessage("newOrder", window.location.origin);
    }
    window.close(); // Close the window
}

  // Get item index based on id and options (first match by id, then by options)
function getItemIndex(id) {
  let order = getOrder(); // Get the latest order
  return order.findIndex(item => item.id === id);
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
}

document.getElementById('closeform').addEventListener('click', function() {
  window.opener.postMessage("noselect", window.location.origin);
});