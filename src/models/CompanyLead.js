import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
     
    },

    email: {
      type: String,
      
    },

    phoneNumber: {
      type: String,
      
    },

    whatsappNumber: {
      type: String,
    
    },

    companyName: {
      type: String,
     
    },

    companySize: {
      type: String,
      enum: ["1-25", "26-50", "51-100", "100+"],
      index: true,
      default: "1-25"
    },

    address: {
      type: String,
     
    },

    // 🔹 Optional future scaling
    tags: [{
      type: String
    }],

    source: {
      type: String,
      enum: ["website", "referral", "ads", "manual"],
      default: "manual"
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false
  }
);

// 🔥 Compound Index (used in search APIs)
companySchema.index({ email: 1, phoneNumber: 1 });

// 🔥 Pre-save normalization (like production systems)
companySchema.pre("save", function (next) {
  if (this.name) this.name = this.name.trim();
  if (this.companyName) this.companyName = this.companyName.trim();
  next();
});

export default mongoose.model("CompanyLead", companySchema);