import { Brand, Category, Material, Color, Size } from '../models/attribute.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the brand
 *         name:
 *           type: string
 *           description: The brand name
 *         status:
 *           type: string
 *           enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *           description: The brand status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the brand was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the brand was last updated
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the category
 *         name:
 *           type: string
 *           description: The category name
 *         status:
 *           type: string
 *           enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *           description: The category status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the category was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the category was last updated
 *     Material:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the material
 *         name:
 *           type: string
 *           description: The material name
 *         status:
 *           type: string
 *           enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *           description: The material status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the material was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the material was last updated
 *     Color:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the color
 *         name:
 *           type: string
 *           description: The color name
 *         code:
 *           type: string
 *           description: The color code (hex)
 *         status:
 *           type: string
 *           enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *           description: The color status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the color was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the color was last updated
 *     Size:
 *       type: object
 *       required:
 *         - value
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the size
 *         value:
 *           type: number
 *           description: The size value
 *         status:
 *           type: string
 *           enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *           description: The size status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the size was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the size was last updated
 */

// Generic controller methods for attributes
const createGenericController = (Model) => {
  return {
    // Create a new attribute
    create: async (req, res) => {
      try {
        const attribute = new Model(req.body);
        const savedAttribute = await attribute.save();
        res.status(201).json({
          success: true,
          data: savedAttribute,
          message: 'Created successfully',
        });
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'Duplicate entry. This record already exists.',
          });
        }
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },

    // Get all attributes
    getAll: async (req, res) => {
      try {
        const { status } = req.query;
        let query = {};
        
        if (status) {
          query.status = status;
        }
        
        const attributes = await Model.find(query).sort({ createdAt: -1 });
        res.status(200).json({
          success: true,
          data: attributes,
          message: 'Retrieved successfully',
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },

    // Get attribute by ID
    getById: async (req, res) => {
      try {
        const attribute = await Model.findById(req.params.id);
        if (!attribute) {
          return res.status(404).json({
            success: false,
            message: 'Not found',
          });
        }
        res.status(200).json({
          success: true,
          data: attribute,
          message: 'Retrieved successfully',
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },

    // Update attribute
    update: async (req, res) => {
      try {
        const attribute = await Model.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true, runValidators: true }
        );
        if (!attribute) {
          return res.status(404).json({
            success: false,
            message: 'Not found',
          });
        }
        res.status(200).json({
          success: true,
          data: attribute,
          message: 'Updated successfully',
        });
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'Duplicate entry. This record already exists.',
          });
        }
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },

    // Delete attribute
    delete: async (req, res) => {
      try {
        const attribute = await Model.findByIdAndDelete(req.params.id);
        if (!attribute) {
          return res.status(404).json({
            success: false,
            message: 'Not found',
          });
        }
        res.status(200).json({
          success: true,
          message: 'Deleted successfully',
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },
  };
};

// Create controllers for each attribute model
export const brandController = createGenericController(Brand);
export const categoryController = createGenericController(Category);
export const materialController = createGenericController(Material);
export const colorController = createGenericController(Color);
export const sizeController = createGenericController(Size); 