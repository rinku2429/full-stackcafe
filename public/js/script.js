/* ================= GLOBAL VARIABLES ================= */
const container = document.getElementById("food-container");
const filter = document.getElementById("filter"); 
const searchInput = document.getElementById("searchInput");

let foodItems = [];
let selectedCategory = "all";

/* ================= FETCH PRODUCTS ================= */
if (container) {
    fetch("/products") 
        .then(res => {
            if (!res.ok) throw new Error("Server error");
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return res.json();
            } else {
                throw new Error("Oops, the server didn't send JSON!");
            }
        })
        .then(data => {
            foodItems = data.foodItems || data; 
            displayFoods(foodItems);
        })
        .catch(err => console.log("Note: API fetch failed. If you use server-side rendering, this is normal.", err));
}

/* ================= DISPLAY FUNCTION ================= */
function displayFoods(items) {
    if (!container) return;

    container.innerHTML = "";

    items.forEach(food => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.dataset.category = food.category ? food.category.toLowerCase() : "all";
        card.dataset.name = food.name;
        card.dataset.price = food.price;
        card.dataset.description = food.description || "Delicious item from our menu!";

        const isOutOfStock = food.stock <= 0;

        card.innerHTML = `
            <div style="position:relative;">
                <img src="${food.image || '/images/default.png'}" alt="${food.name}" class="food-img" style="${isOutOfStock ? 'filter: blur(3px) grayscale(80%); opacity: 0.8;' : ''}">
                ${isOutOfStock ? '<div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(255,0,0,0.8); color:white; padding:5px 15px; border-radius:20px; font-weight:bold; letter-spacing:1px; z-index:10;">SOLD OUT</div>' : ''}
            </div>
            <h3 style="${isOutOfStock ? 'color: #999;' : ''}">${food.name}</h3>
            <p style="${isOutOfStock ? 'color: #999;' : ''}">₹${food.price} <span class="stock-text" style="font-size: 13px; color: ${isOutOfStock ? '#999' : '#e67e22'}; float: right; font-weight: bold;">Stock: ${food.stock}</span></p>
            <div class="action-container" style="margin: 15px;">
                <button class="cart-btn main-add-btn" style="margin: 0; width: 100%;" ${isOutOfStock ? 'disabled style="background: #ccc; cursor: not-allowed; color: #666;"' : ''}>
                    ${isOutOfStock ? 'Out of Stock ❌' : 'Add To Cart 🛒'}
                </button>
                <div class="qty-controls" style="display: none; justify-content: space-between; align-items: center; background: var(--primary); padding: 5px 10px; border-radius: 8px;">
                    <button class="decrease-btn" style="background: var(--accent); color: #000; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer; font-weight: bold; font-size: 18px;">-</button>
                    <span class="qty-val" style="color: white; font-weight: bold; font-size: 16px;">1</span>
                    <button class="increase-btn" style="background: var(--accent); color: #000; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer; font-weight: bold; font-size: 18px;">+</button>
                </div>
            </div>
        `;

        if (!isOutOfStock) {
            const mainAddBtn = card.querySelector(".main-add-btn");
            const qtyControls = card.querySelector(".qty-controls");
            const decreaseBtn = card.querySelector(".decrease-btn");
            const increaseBtn = card.querySelector(".increase-btn");
            const qtyVal = card.querySelector(".qty-val");
            const stockText = card.querySelector(".stock-text");

            let currentQty = 0;

            const updateBadge = (count) => {
                const badge = document.getElementById("cart-count");
                if (badge && count !== undefined) badge.textContent = count;
            };

            mainAddBtn.addEventListener("click", () => {
                fetch("/products/add-to-cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: food.name, price: food.price, image: food.image })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        currentQty = 1;
                        mainAddBtn.style.display = "none";
                        qtyControls.style.display = "flex";
                        qtyVal.textContent = currentQty;
                        updateBadge(data.cartCount);
                        food.stock--;
                        stockText.textContent = `Stock: ${food.stock}`;
                    }
                });
            });

            increaseBtn.addEventListener("click", () => {
                if (food.stock <= 0) return;
                fetch("/products/add-to-cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: food.name, price: food.price, image: food.image })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        currentQty++;
                        qtyVal.textContent = currentQty;
                        updateBadge(data.cartCount);
                        food.stock--;
                        stockText.textContent = `Stock: ${food.stock}`;
                    }
                });
            });

            decreaseBtn.addEventListener("click", () => {
                fetch("/products/update-quantity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: food.name, action: "remove" })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        currentQty--;
                        updateBadge(data.cartCount);
                        food.stock++;
                        stockText.textContent = `Stock: ${food.stock}`;
                        if (currentQty <= 0) {
                            qtyControls.style.display = "none";
                            mainAddBtn.style.display = "block";
                        } else {
                            qtyVal.textContent = currentQty;
                        }
                    }
                });
            });
        }
        container.appendChild(card);
    });
    initImagePopup();
}

/* ================= FILTER FUNCTIONS ================= */
function filterCategory(category) {
    selectedCategory = category.toLowerCase();
    applyFilters();
}

function applyFilters() {
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        const foodName = card.dataset.name ? card.dataset.name.toLowerCase() : "";
        const foodCategory = card.dataset.category || "all";
        const categoryMatch = selectedCategory === "all" || foodCategory === selectedCategory;
        const searchMatch = foodName.includes(searchText);
        card.style.display = (categoryMatch && searchMatch) ? "" : "none";
    });
}

if (filter) filter.addEventListener("change", e => filterCategory(e.target.value));
if (searchInput) searchInput.addEventListener("input", () => applyFilters());

/* ================= IMAGE POPUP FUNCTION ================= */
function initImagePopup() {
    let popup = document.getElementById("imagePopup");
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "imagePopup";
        popup.style.cssText = `display:none; position:fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.85); justify-content:center; align-items:center; z-index:1000; flex-direction: column; color:white; text-align:center; padding:20px; cursor: pointer;`;
        document.body.appendChild(popup);
    }
    popup.innerHTML = `<img id="popupImg" style="max-width:90%; max-height:60%; border-radius:10px; border: 3px solid #ffcc00;"><h2 id="popupName" style="margin-top:15px;"></h2><p id="popupPrice" style="font-size:20px; color:#27ae60; font-weight:bold;"></p><p id="popupDesc" style="max-width:600px; margin-top:10px; font-style:italic;"></p>`;
    
    document.querySelectorAll(".food-img").forEach(image => {
        image.addEventListener("click", () => {
            const card = image.closest(".card");
            document.getElementById("popupImg").src = image.src;
            document.getElementById("popupName").textContent = card.dataset.name;
            document.getElementById("popupPrice").textContent = "₹ " + card.dataset.price;
            document.getElementById("popupDesc").textContent = card.dataset.description;
            popup.style.display = "flex";
        });
    });
    popup.onclick = () => popup.style.display = "none";
}

/* ================= FIXED: LOGIN & SIGNUP HANDLER ================= */
// This finds ALL forms on your page that submit to login or signup
const authForms = document.querySelectorAll('form[action*="login"], form[action*="signup"]');

authForms.forEach(form => {
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(form.action, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success && result.redirectUrl) {
                // REDIRECT TO THE URL PROVIDED BY BACKEND
                window.location.href = result.redirectUrl; 
            } else {
                alert(result.message || "Action failed! Check your input.");
            }
        } catch (err) {
            console.error("Auth error:", err);
            alert("Connection error. Is the server running?");
        }
    });
});

// Check for messages in the URL (e.g., "?message=Account created")
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('message');
    if (msg) {
        // You can replace this with a nicer alert/toast later
        alert(msg);
    }
});

/* ================= PUSH NOTIFICATIONS ================= */
const publicVapidKey = 'BCIYkRwzmWNoxtgzgpuDf8tytuODjCMwRlcnYQEH7rN5vPU4wYVZSmAPgOt3QxWvz05UWpQP5hf8hJ7tQAYjmG4'; 

async function subscribeToPush() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const register = await navigator.serviceWorker.register('/sw.js');
            const subscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
            await fetch('/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: { 'content-type': 'application/json' }
            });
        } catch (err) { console.error('Push notification error:', err); }
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
}