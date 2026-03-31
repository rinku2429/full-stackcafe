const Support = require("../models/support");

exports.submitContact = async (req, res) => {
    try {
        const { name, email, product_name, message } = req.body;
console.log("Received support contact:", { name, email, product_name, message });
        const newSupportEntry = new Support({
            name,
            email,
            product_name,
            message
        });

        await newSupportEntry.save();

        // Send a JSON response for fetch handling
        res.json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("Support submission error:", error);
        res.status(500).json({ success: false, message: "There was an error saving your message." });
    }
};