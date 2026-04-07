import CompanyLead from "../models/CompanyLead.js";
/**
 * @desc    Create new company lead
 * @route   POST /api/company-leads
 * @access  Public / Admin
 */
export const createCompanyLead = async (req, res) => {
    try {
        const {
            name,
            email,
            phoneNumber,
            whatsappNumber,
            companyName,
            companySize,
            address,
            tags,
            source
        } = req.body;

        // 🔹 Basic validation (production systems use JOI/Zod)
        if (!name || !email || !phoneNumber || !companyName) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }


        const lead = await CompanyLead.create({
            name,
            email,
            phoneNumber,
            whatsappNumber,
            companyName,
            companySize,
            address,
            tags,
            source
        });

        return res.status(201).json({
            success: true,
            data: lead
        });

    } catch (error) {
        console.error("Create Lead Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


/**
 * @desc    Get all company leads (with pagination + filters)
 * @route   GET /api/company-leads
 * @access  Admin
 */
export const getCompanyLeads = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            companySize,
            isActive
        } = req.query;

        const query = {};

        // 🔹 Search (optimized for index usage)
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { companyName: { $regex: search, $options: "i" } }
            ];
        }

        if (companySize) query.companySize = companySize;
        if (isActive !== undefined) query.isActive = isActive === "true";

        const skip = (page - 1) * limit;

        // 🔥 Parallel queries (Netflix-style optimization)
        const [leads, total] = await Promise.all([
            CompanyLead.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),

            CompanyLead.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            data: leads,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Get Leads Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


/**
 * @desc    Get single company lead
 * @route   GET /api/company-leads/:id
 */
export const getCompanyLeadById = async (req, res) => {
    try {
        const { id } = req.params;

        const lead = await CompanyLead.findById(id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: lead
        });

    } catch (error) {
        console.error("Get Lead Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


/**
 * @desc    Update company lead
 * @route   PUT /api/company-leads/:id
 */
export const updateCompanyLead = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedLead = await CompanyLead.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: updatedLead
        });

    } catch (error) {
        console.error("Update Lead Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


/**
 * @desc    Soft delete (recommended instead of hard delete)
 * @route   DELETE /api/company-leads/:id
 */
export const deleteCompanyLead = async (req, res) => {
    try {
        const { id } = req.params;

        const lead = await CompanyLead.findById(id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        lead.isActive = false;
        await lead.save();

        return res.status(200).json({
            success: true,
            message: "Lead deactivated successfully"
        });

    } catch (error) {
        console.error("Delete Lead Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


/**
 * @desc    Hard delete (only for admin/internal use)
 */
export const hardDeleteCompanyLead = async (req, res) => {
    try {
        const { id } = req.params;

        const lead = await CompanyLead.findByIdAndDelete(id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lead permanently deleted"
        });

    } catch (error) {
        console.error("Hard Delete Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};