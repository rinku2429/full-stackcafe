// routes/adminroute.js

const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admincontroller");
const { requireAuth } = require("../controllers/authcontroller");
const Order = require("../models/Order");
const Product = require("../models/Product");
const upload = require("../middleware/multer"); // ✅ multer middleware

/* ================= ADMIN CHECK ================= */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }

    return res.status(403).render("error", {
        message: "Admin access required"
    });
};


/* ================= DASHBOARD ROUTES ================= */

// ✅ Admin Dashboard Page
router.get(
    "/dashboard",
    requireAuth,
    adminOnly,
    adminController.getAdminDashboard
);

// Dashboard API Data
router.get(
    "/dashboard-data",
    requireAuth,
    adminOnly,
    adminController.getDashboardData
);


/* ================= ADD PRODUCT ROUTES ✅ ================= */

// 👉 OPEN ADD PRODUCT PAGE
router.get(
    "/add-product",
    requireAuth,
    adminOnly,
    async (req, res) => {
        const products = await Product.find().sort({ createdAt: -1 });

        res.render("admin/addProduct", { products });
    }
);

// 👉 SAVE PRODUCT (FORM SUBMIT)
router.post(
    "/add-product",
    requireAuth,
    adminOnly,
    upload.single("image"),
    adminController.postAddProduct
);
/* ================= DELETE PRODUCT ================= */

router.post(
    "/products/delete/:id",
    requireAuth,
    adminOnly,
    adminController.deleteProduct
);

/* ================= PRODUCT STATUS ================= */

router.patch(
    "/product/toggle-status/:id",
    requireAuth,
    adminOnly,
    adminController.toggleProductStatus
);


router.patch(
    "/product/update-stock/:id",
    requireAuth,
    adminOnly,
    adminController.updateProductStock
);

/* ================= ORDER STATUS UPDATE ================= */

router.post(
    "/update-order-status/:id",
    requireAuth,
    adminOnly,
    adminController.updateOrderStatus
);

module.exports = router;