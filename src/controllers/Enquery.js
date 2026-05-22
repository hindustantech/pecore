import Enquery from "../models/Enquery.js";

const createEnquery = async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({
                success: false,
                message: "Email and message are required fields"
            });
        }
        const enquery = await Enquery.create({ name, email, message });
        return res.status(201).json({
            success: true,
            data: enquery,
            message: "Enquery created successfully"
        });
    } catch (error) {
        console.error("Create Enquery Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export { createEnquery };