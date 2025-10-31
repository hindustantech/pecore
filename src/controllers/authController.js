import Employee from "../models/Employee.js";

// 📌 REGISTER EMPLOYEE
export const registerEmployee = async (req, res) => {
    try {
        const { name, email, password, department } = req.body;

        // Basic validation
        if (!name  || !email || !password)
            return res.status(400).json({ message: "All fields are required" });

        // Check existing user
        const existing = await Employee.findOne({ email });
        if (existing)
            return res.status(400).json({ message: "Employee already registered" });

        // Create employee
        const employee = new Employee({
            name,
            email,
            password,
            department,
        });
        await employee.save();

        // Generate token
        const token = employee.generateJWT();

        res.status(201).json({
            success: true,
            message: "Employee registered successfully",
            token,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                role: employee.role,
            },
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 📌 LOGIN EMPLOYEE
export const loginEmployee = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password)
            return res.status(400).json({ message: "Email and password are required" });

        // Find user
        const employee = await Employee.findOne({ email });
        if (!employee)
            return res.status(401).json({ message: "Invalid email or password" });

        // Check password
        const isMatch = await employee.comparePassword(password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid email or password" });

        // Generate token
        const token = employee.generateJWT();

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                employeeId: employee.employeeId,
                department: employee.department,
                role: employee.role,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
