/* ================= GLOBAL VARIABLES ================= */
const container = document.getElementById("food-container");
const filter = document.getElementById("filter"); 
const searchInput = document.getElementById("searchInput");

let foodItems = [];
let selectedCategory = "all";

/* ================= FETCH PRODUCTS ================= */
// Note: Ensure your backend has a route: router.get("/api/products", productController.getAllProductsJSON)
if (container) {
    fetch("/products") // Adjusting to your product route if it returns JSON
        .then(res => {
            if (!res.ok) throw new Error("Server error");
            // Check if response is JSON before parsing
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return res.json();
            } else {
                throw new Error("Oops, the server didn't send JSON!");
            }
        })
        .then(data => {
            foodItems = data.foodItems || data; // Handle different response structures
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

        // ✅ Check if out of stock
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

        // ---------- ADD TO CART (FIXED ROUTE) ----------
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
            fetch("/products/add-to-cart", { // URL updated to match app.js prefix
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: food.name,
                    price: food.price,
                    image: food.image
                })
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
                } else {
                    alert("❌ Could not add item. " + (data.message || ""));
                }
            })
            .catch(err => {
                console.error("Cart Error:", err);
                alert("❌ Error adding item to cart.");
            });
        });

            increaseBtn.addEventListener("click", () => {
                if (food.stock <= 0) {
                    alert("No more stock available!");
                    return;
                }
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

function searchFood() {
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
if (searchInput) searchInput.addEventListener("input", searchFood);

/* ================= IMAGE POPUP FUNCTION ================= */
function initImagePopup() {
    let popup = document.getElementById("imagePopup");
    
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "imagePopup";
        popup.style.cssText = `
            display:none; position:fixed; top:0; left:0;
            width:100%; height:100%; background: rgba(0,0,0,0.85);
            justify-content:center; align-items:center;
            z-index:1000; flex-direction: column; color:white;
            text-align:center; padding:20px; cursor: pointer;
        `;
        document.body.appendChild(popup);
    }

    // Clear previous content to avoid duplicates on re-render
    popup.innerHTML = `
        <img id="popupImg" style="max-width:90%; max-height:60%; border-radius:10px; border: 3px solid #ffcc00;">
        <h2 id="popupName" style="margin-top:15px;"></h2>
        <p id="popupPrice" style="font-size:20px; color:#27ae60; font-weight:bold;"></p>
        <p id="popupDesc" style="max-width:600px; margin-top:10px; font-style:italic;"></p>
        <p style="margin-top:20px; font-size:12px; color:#aaa;">Click anywhere to close</p>
    `;

    const foodImages = document.querySelectorAll(".food-img");
    foodImages.forEach(image => {
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

/* ================= PUSH NOTIFICATIONS ================= */

// ⚠️ Replace this with the Public Key generated from `npx web-push generate-vapid-keys`
const publicVapidKey = 'BCIYkRwzmWNoxtgzgpuDf8tytuODjCMwRlcnYQEH7rN5vPU4wYVZSmAPgOt3QxWvz05UWpQP5hf8hJ7tQAYjmG4'; 

async function subscribeToPush() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            console.log('Registering Service Worker...');
            const register = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker Registered...');

            console.log('Registering Push...');
            const subscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
            console.log('Push Registered...');

            console.log('Sending Subscription to Server...');
            await fetch('/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: { 'content-type': 'application/json' }
            });
            console.log('Subscription Sent...');
        } catch (err) {
            console.error('Push notification error:', err);
        }
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}