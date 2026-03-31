const Order = require("../models/Order");
const Product = require("../models/Product");

/* ================= HELPER: CALCULATE STATS ================= */

const calculateStats = (orders) => {

    const totalRevenue = orders
        .filter(order => order.status === "Delivered")
        .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    const activeOrders = orders.filter(order =>
        ["Pending", "Preparing", "Out for Delivery"].includes(order.status)
    ).length;

    return {
        totalRevenue: totalRevenue.toFixed(2),
        orderCount: orders.length,
        activeOrders
    };
};


/* ================= ADMIN DASHBOARD PAGE ================= */

exports.getAdminDashboard = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        const products = await Product.find().sort({ name: 1 });

        const stats = calculateStats(orders);

        res.render("admin/adminDashboard", {
            user: req.user,
            orders,
            products,
            stats
        });

    } catch (err) {
        console.error("Dashboard Error:", err);

        res.status(500).render("error", {
            message: "Error loading dashboard"
        });
    }
};


/* ================= DASHBOARD AUTO REFRESH DATA ================= */

exports.getDashboardData = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        const stats = calculateStats(orders);

        res.json({
            success: true,
            orders,
            stats
        });

    } catch (err) {
        console.error("Dashboard Data Error:", err);
        res.status(500).json({ success: false });
    }
};


/* ================= UPDATE ORDER STATUS ================= */

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        const updatedOrder = await Order.findById(orderId);

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // ✅ DECREASE STOCK ONLY WHEN DELIVERED
        if (status === "Delivered" && updatedOrder.status !== "Delivered") {
            for (const item of updatedOrder.items) {
                await Product.updateOne(
                    { name: item.name },
                    { $inc: { stock: -item.quantity } }
                );
            }
        }

        updatedOrder.status = status;
        await updatedOrder.save();

        // --- 🔔 PUSH NOTIFICATION TO CUSTOMER 🔔 ---
        const subscriptions = req.app.locals.subscriptions || [];
        const webpush = req.app.locals.webpush;

        if (webpush && updatedOrder.user) {
            const customerId = updatedOrder.user.toString();
            const userSubscriptions = subscriptions.filter(s => s.userId === customerId);

            const payload = JSON.stringify({ 
                title: 'Order Status Updated! ☕', 
                body: `Your order is now: ${updatedOrder.status}`,
                url: '/products/my-orders' 
            });

            userSubscriptions.forEach(userSub => {
                webpush.sendNotification(userSub.sub, payload).catch(err => console.error("Push Error:", err));
            });
        }
        // -------------------------------------------

        res.json({ success: true, message: "Order status updated successfully" });

    } catch (err) {
        console.error("Order Status Update Error:", err);
        res.status(500).json({ success: false, message: "Failed to update order" });
    }
};


/* ================= TOGGLE PRODUCT STATUS ================= */

exports.toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // ✅ FIXED FIELD NAME
        product.isAvailable = !product.isAvailable;

        await product.save();

        res.json({
            success: true,
            isAvailable: product.isAvailable
        });

    } catch (err) {
        console.error("Toggle Product Error:", err);
        res.status(500).json({ success: false });
    }
};


/* ================= UPDATE PRODUCT STOCK ================= */

exports.updateProductStock = async (req, res) => {
    try {
        const { stock } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { stock: Number(stock) },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, stock: product.stock });

    } catch (err) {
        console.error("Stock Update Error:", err);
        res.status(500).json({ success: false });
    }
};

/* ================= SHOW ADD PRODUCT PAGE ================= */

exports.getAddProduct = (req, res) => {
    res.render("admin/addProduct", {
        user: req.user
    });
};


/* ================= ADD PRODUCT ================= */

exports.postAddProduct = async (req, res) => {
    try {

        const { name, price, category, description, stock } = req.body;

        const product = new Product({
            name,
            price,
            category,
            description,
            stock: stock ? Number(stock) : 50, // Save stock
            // ✅ safe image handling
            image: req.file
                ? "/uploads/" + req.file.filename
                : "/images/default.png"
        });

        await product.save();

        // Print the product in the exact seed format requested to the terminal
        console.log(`\n{ name: "${name}", price: ${price}, image: "${product.image}", category: "${category}", description: "${description}" },\n`);

        // redirect back to dashboard
        res.redirect("/admin/dashboard");

    } catch (err) {
        console.error("Add Product Error:", err);

        res.status(500).render("error", {
            message: "Error adding product"
        });
    }
};

/* ================= DELETE PRODUCT ================= */

exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).render("error", {
                message: "Product not found"
            });
        }

        // redirect back
        res.redirect("/admin/add-product");

    } catch (err) {
        console.error("Delete Product Error:", err);

        res.status(500).render("error", {
            message: "Failed to delete product"
        });
    }
};