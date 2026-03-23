/* ================= ENVIRONMENT ================= */
require("dotenv").config();
require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);
/* ================= IMPORTS ================= */
const express = require("express");
const path = require("path");
const webpush = require('web-push');

// Same keys you generated earlier
const publicVapidKey = 'BCIYkRwzmWNoxtgzgpuDf8tytuODjCMwRlcnYQEH7rN5vPU4wYVZSmAPgOt3QxWvz05UWpQP5hf8hJ7tQAYjmG4';
const privateVapidKey = 'fBuXKd6YOYYfsJaDg9HqOWS77kI1Xfpe6caH2GkoamE';

webpush.setVapidDetails(
  'mailto:your-email@example.com', 
  publicVapidKey, 
  privateVapidKey
);

const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const sessionMiddleware = require("./middleware/session");
const { checkAuth } = require("./controllers/authcontroller");

/* ================= APP INIT ================= */
const app = express();
const PORT = process.env.PORT || 3000;

/* ================= DATABASE ================= */
connectDB();

/* ================= VIEW ENGINE ================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ================= GLOBAL MIDDLEWARE ================= */
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

/* ================= STATIC FILES ================= */

// public assets (css/js/images)
app.use(express.static(path.join(__dirname, "public")));

// ✅ serve uploaded images (IMPORTANT)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

/* ================= SESSION ================= */
app.use(sessionMiddleware);

/* ================= AUTH CHECK ================= */
app.use(checkAuth);

/* ================= GLOBAL EJS VARIABLES ================= */
app.use((req, res, next) => {

    // create cart if not exists
    if (!req.session.cart) {
        req.session.cart = [];
    }

    res.locals.session = req.session;
    res.locals.user = req.user || null;

    next();
});

/* ================= ROUTES ================= */

// Auth routes
app.use("/", require("./routes/authroutes"));

// Home redirect
app.get("/", (req, res) => {
    res.redirect("/products");
});

// Support routes
app.use("/support", require("./routes/supportroutes"));

// Product routes
app.use("/products", require("./routes/productRoutes"));

// ✅ Admin routes (ADD PRODUCT WORKS HERE)
app.use("/admin", require("./routes/adminroute"));

// A simple array to hold subscriptions (In production, save this to MongoDB User model)
let subscriptions = [];
app.locals.subscriptions = subscriptions; // Make accessible in other files via req.app.locals.subscriptions
app.locals.webpush = webpush; // Make webpush accessible in other files

app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    
    // Save to array and associate it with the logged-in user
    subscriptions.push({
        userId: req.user ? req.user._id.toString() : null,
        sub: subscription
    });
    res.status(201).json({});

    // Optional: Send a test notification immediately upon subscribing
    const payload = JSON.stringify({ 
        title: 'Welcome to FullStack Cafe! ☕', 
        body: 'You will now receive order updates.',
        url: '/products' 
    });

    // webpush.sendNotification(subscription, payload).catch(err => console.error(err));
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
    res.status(404).render("error", {
        message: "Page Not Found"
    });
});

/* ================= GLOBAL ERROR HANDLER ================= */
app.use((err, req, res, next) => {
    console.error("Server Error:", err);

    res.status(500).render("error", {
        message: "Something went wrong!"
    });
});

/* ================= SERVER ================= */
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});