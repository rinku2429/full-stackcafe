// SELECT ALL CART BUTTONS
const cartButtons = document.querySelectorAll(".cart-btn");

cartButtons.forEach(button => {

    button.addEventListener("click", () => {
        // Prevent running again if the button is already transformed
        if (button.classList.contains("converted")) return;

        const item = {
            name: button.dataset.name,
            price: button.dataset.price,
            image: button.dataset.image
        };

        // ✅ Fixed route (matches app.js /products prefix)
        fetch("/products/add-to-cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(item)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                
                // Update cart count badge
                const badge = document.querySelector(".badge") || document.getElementById("cart-count");
                if (badge && data.cartCount !== undefined) {
                    badge.textContent = data.cartCount;
                }

                // 1️⃣ Hide the original "Add to Cart" button
                button.style.display = "none";
                button.classList.add("converted");

                // 2️⃣ Create the dynamic [ - 1 + ] controls
                const controlsDiv = document.createElement("div");
                controlsDiv.className = "qty-controls";
                controlsDiv.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--primary); padding: 5px 10px; border-radius: 8px; margin: 15px; width: calc(100% - 30px); box-sizing: border-box;";

                let currentQty = 1;

                controlsDiv.innerHTML = `
                    <button class="decrease-btn" style="background: var(--accent); color: #000; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer; font-weight: bold; font-size: 18px;">-</button>
                    <span class="qty-val" style="color: white; font-weight: bold; font-size: 16px;">1</span>
                    <button class="increase-btn" style="background: var(--accent); color: #000; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer; font-weight: bold; font-size: 18px;">+</button>
                `;

                // Insert controls right where the button was
                button.parentNode.insertBefore(controlsDiv, button.nextSibling);

                // 3️⃣ Attach Event Listeners to New Buttons
                controlsDiv.querySelector(".increase-btn").addEventListener("click", () => {
                    fetch("/products/add-to-cart", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(item)
                    }).then(res => res.json()).then(d => {
                        if (d.success) {
                            currentQty++;
                            controlsDiv.querySelector(".qty-val").textContent = currentQty;
                            if (badge && d.cartCount !== undefined) badge.textContent = d.cartCount;
                        }
                    });
                });

                controlsDiv.querySelector(".decrease-btn").addEventListener("click", () => {
                    fetch("/products/update-quantity", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: item.name, action: "remove" })
                    }).then(res => res.json()).then(d => {
                        if (d.success) {
                            currentQty--;
                            if (badge && d.cartCount !== undefined) badge.textContent = d.cartCount;

                            if (currentQty <= 0) {
                                controlsDiv.remove();           // Remove the + / - UI
                                button.style.display = "";      // Show the Add To Cart button again
                                button.classList.remove("converted");
                            } else {
                                controlsDiv.querySelector(".qty-val").textContent = currentQty;
                            }
                        }
                    });
                });

            } else {
                alert(data.message || "❌ Failed to add item to cart.");
            }
        })
        .catch(err => console.log(err));

    });

});
