
/**
 * Category Controller
 * @description Handles all category-related operations
 * @author: Tho Panha
 */
const Category = require("../models/category");
const { logError } = require("../utils/logError");

const CategoryController = {
    /**
     * Get all categories for current user
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    getAll: async (req, res) => {
        try {
            const categories = await Category.find({ created_by: req.current_id })
                .populate("created_by", "first_name last_name phone_number email title")

            res.status(200).json({
                success: true,
                data: categories,
                message: "Categories fetched successfully"
            });
        } catch (err) {
            await logError("CategoryController.getAll", err.message, res.statusCode);
            res.status(500).json({
                success: false,
                error: "Failed to fetch categories",
                details: err.message
            });
        }
    },

    /**
     * Get single category by ID
     * @param {Object} req - Request object with category ID
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    getOne: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await Category.findOne({
                _id: id,
                created_by: req.current_id
            }).populate("created_by", "first_name last_name phone_number email title");

            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: "Category not found"
                });
            }

            res.status(200).json({
                success: true,
                data: category,
                message: "Category fetched successfully"
            });
        } catch (err) {
            await logError("CategoryController.getOne", err.message, res.statusCode);
            res.status(500).json({
                success: false,
                error: "Failed to fetch category",
                details: err.message
            });
        }
    },

    /**
     * Create new category
     * @param {Object} req - Request object with category title
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    create: async (req, res) => {
        try {
            const { title } = req.body;

            if (!title) {
                return res.status(400).json({
                    success: false,
                    error: "Title is required"
                });
            }

            const category = new Category({
                title,
                created_by: req.current_id
            });

            await category.save();

            res.status(201).json({
                success: true,
                data: category,
                message: "Category created successfully"
            });
        } catch (err) {
            await logError("CategoryController.create", err.message, res.statusCode);
            res.status(500).json({
                success: false,
                error: "Failed to create category",
                details: err.message
            });
        }
    },

    /**
     * Update existing category
     * @param {Object} req - Request object with updated category title
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { title } = req.body;

            const category = await Category.findOneAndUpdate(
                { _id: id, created_by: req.current_id },
                { title },
                { new: true }
            );

            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: "Category not found"
                });
            }

            res.status(200).json({
                success: true,
                data: category,
                message: "Category updated successfully"
            });
        } catch (err) {
            await logError("CategoryController.update", err.message, res.statusCode);
            res.status(500).json({
                success: false,
                error: "Failed to update category",
                details: err.message
            });
        }
    },

    /**
     * Delete category
     * @param {Object} req - Request object with category ID
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await Category.findOneAndDelete({
                _id: id,
                created_by: req.current_id,
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: "Category not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Category deleted successfully"
            });
        } catch (err) {
            await logError("CategoryController.delete", err.message, res.statusCode);
            res.status(500).json({
                success: false,
                error: "Failed to delete category",
                details: err.message
            });
        }
    }
};

module.exports = CategoryController;