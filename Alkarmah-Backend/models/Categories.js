import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true, default: "" },
      ar: { type: String },
    },
    description: {
      en: { type: String, required: true, default: "" },
      ar: { type: String },
    },
    image: String,
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    level: { type: Number, default: 0 }, // 0 = main category, 1 = subcategory, etc.
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Hidden"],
      default: "Active",
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", CategorySchema);
export default Category;
