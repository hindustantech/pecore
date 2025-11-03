import Employee from "../models/Employee.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

// 📌 REGISTER EMPLOYEE
export const registerEmployee = async (req, res) => {
    try {
        const { name, email, password, department } = req.body;

        // Basic validation
        if (!name || !email || !password)
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
                department: employee.department,
                role: employee.role,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};







// 🔒 Input sanitization utilities
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return input;
};

const sanitizeEmail = (email) => {
    return email.toLowerCase().trim();
};

const sanitizePhone = (phone) => {
    return phone.replace(/[^\d+-\s]/g, '').trim();
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s+()-]{10,}$/;
    return phoneRegex.test(phone);
};

const sanitizeObject = (obj) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

// ✅ Get all employees with search, filter, and pagination
export const getAllEmployees = asyncHandler(async (req, res) => {
    // Sanitize query parameters
    const {
        page = 1,
        limit = 10,
        search = "",
        department = "",
        sortBy = "createdAt",
        sortOrder = "desc"
    } = req.query;

    const sanitizedQuery = sanitizeObject({
        page,
        limit,
        search,
        department,
        sortBy,
        sortOrder
    });

    // Validate and parse pagination parameters
    const pageNum = Math.max(1, parseInt(sanitizedQuery.page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(sanitizedQuery.limit) || 10));

    // Validate sort parameters
    const allowedSortFields = ['name', 'email', 'department', 'position', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sanitizedQuery.sortBy)
        ? sanitizedQuery.sortBy
        : 'createdAt';

    const sortDirection = sanitizedQuery.sortOrder === 'asc' ? 1 : -1;

    // Build search query
    const searchQuery = {
        isActive: true,
    };

    // Add search conditions if provided
    if (sanitizedQuery.search) {
        searchQuery.$or = [
            { name: { $regex: sanitizeInput(sanitizedQuery.search), $options: "i" } },
            { email: { $regex: sanitizeInput(sanitizedQuery.search), $options: "i" } },
            { department: { $regex: sanitizeInput(sanitizedQuery.search), $options: "i" } },
            { position: { $regex: sanitizeInput(sanitizedQuery.search), $options: "i" } }
        ];
    }

    // Add department filter if provided
    if (sanitizedQuery.department) {
        searchQuery.department = {
            $regex: sanitizeInput(sanitizedQuery.department),
            $options: "i"
        };
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortField] = sortDirection;

    try {
        // Execute queries in parallel
        const [employees, totalCount] = await Promise.all([
            Employee.find(searchQuery)
                .select("-password")
                .sort(sortConfig)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Employee.countDocuments(searchQuery)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;

        res.status(200).json({
            success: true,
            data: employees,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext,
                hasPrev,
                limit: limitNum
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching employees",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ Get employee by ID
export const getEmployeeById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid employee ID format"
        });
    }

    try {
        const employee = await Employee.findById(id).select("-password");

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching employee",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ Create new employee
export const createEmployee = asyncHandler(async (req, res) => {
    // Sanitize input data
    const sanitizedData = sanitizeObject(req.body);

    const {
        name,
        email,
        password,
        phone,
        department,
        position,
        location,
        joinDate,

    } = sanitizedData;

    // Validate required fields
    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: "Name and email are required fields"
        });
    }

    // Validate email format
    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address"
        });
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid phone number"
        });
    }

    // Validate password strength
    if (password && password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long"
        });
    }

    try {
        // Check if employee already exists
        const sanitizedEmail = sanitizeEmail(email);
        const existingEmployee = await Employee.findOne({ email: sanitizedEmail });

        if (existingEmployee) {
            return res.status(409).json({
                success: false,
                message: "Employee with this email already exists"
            });
        }

        // Create new employee with sanitized data
        const employee = await Employee.create({
            name: sanitizeInput(name),
            email: sanitizedEmail,
            password: password || `TempPass${Math.random().toString(36).slice(-8)}`,
            phone: phone ? sanitizePhone(phone) : undefined,
            department: department ? sanitizeInput(department) : undefined,
            position: position ? sanitizeInput(position) : undefined,
            location: location ? sanitizeInput(location) : "Patna, Bihar",
            joinDate: joinDate || new Date(),

        });

        const employeeResponse = employee.toJSON();

        res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: employeeResponse
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: "Error creating employee",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ Update employee
export const updateEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid employee ID format"
        });
    }

    // Sanitize input data
    const sanitizedData = sanitizeObject(req.body);
    const updateData = { ...sanitizedData };

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.isActive;

    // Validate email if provided
    if (updateData.email && !validateEmail(updateData.email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address"
        });
    }

    // Validate phone if provided
    if (updateData.phone && !validatePhone(updateData.phone)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid phone number"
        });
    }

    // Sanitize specific fields
    if (updateData.email) updateData.email = sanitizeEmail(updateData.email);
    if (updateData.phone) updateData.phone = sanitizePhone(updateData.phone);
    if (updateData.name) updateData.name = sanitizeInput(updateData.name);
    if (updateData.department) updateData.department = sanitizeInput(updateData.department);
    if (updateData.position) updateData.position = sanitizeInput(updateData.position);
    if (updateData.location) updateData.location = sanitizeInput(updateData.location);

    try {
        const employee = await Employee.findByIdAndUpdate(
            id,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: employee
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Error updating employee",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ Change password
export const changePassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid employee ID format"
        });
    }

    // Validate password
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long"
        });
    }

    // Additional password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        });
    }

    try {
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        employee.password = newPassword;
        await employee.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error changing password",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ Delete employee (soft delete)
export const deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid employee ID format"
        });
    }

    try {
        const employee = await Employee.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        ).select("-password");

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Employee deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting employee",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ Get employee statistics
export const getEmployeeStats = asyncHandler(async (req, res) => {
    try {
        const stats = await Employee.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: "$department",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    department: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        const totalEmployees = await Employee.countDocuments({ isActive: true });

        res.status(200).json({
            success: true,
            data: {
                totalEmployees,
                byDepartment: stats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching statistics",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

