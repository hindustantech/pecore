import express from "express";
import {
    createCompanyLead,
    getCompanyLeads,
    getCompanyLeadById,
    updateCompanyLead,
    deleteCompanyLead,
    hardDeleteCompanyLead
} from "../controllers/companyLeadController.js";

const router = express.Router();

/**
 * ==============================
 * 📌 PUBLIC ROUTES
 * ==============================
 */

// Create Lead (public form / landing page)
router.post("/", createCompanyLead);


/**
 * ==============================
 * 📌 PROTECTED ROUTES (Admin)
 * ==============================
 */

// Get all leads (with filters, pagination)
router.get(
    "/",

    getCompanyLeads
);

// Get single lead
router.get(
    "/:id",

    getCompanyLeadById
);

// Update lead
router.put(
    "/:id",

    updateCompanyLead
);

// Soft delete (recommended)
router.delete(
    "/:id",

    deleteCompanyLead
);

// Hard delete (only superadmin)
router.delete(
    "/hard/:id",

    hardDeleteCompanyLead
);

export default router;