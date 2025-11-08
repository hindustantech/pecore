import express from "express";
import {
    registerEmployee,
    loginEmployee,
    reverseGeocode,
    getAllEmployees,
    getEmployeeById,
    getEmployeeStats,
    createEmployee,
    updateEmployee,
    changePassword,
    deleteEmployee
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerEmployee);
router.post("/login", loginEmployee);

router.get("/reverse-geocode", reverseGeocode);



// 📊 GET Routes
router.get("/", getAllEmployees); // Get all employees with search, filter, pagination
router.get("/stats", getEmployeeStats); // Get employee statistics
router.get("/:id", getEmployeeById); // Get employee by ID


// ➕ POST Routes
router.post("/", createEmployee); // Create new employee


// ✏️ PUT/PATCH Routes
router.put("/:id", updateEmployee); // Update employee details
router.patch("/:id", updateEmployee); // Partial update employee
router.patch("/:id/password", changePassword); // Change employee password

// 🗑️ DELETE Routes
router.delete("/:id", deleteEmployee);

export default router;
