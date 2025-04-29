import { Brand, Category, Material, Color, Size } from '../models/attribute.model.js';

// BRAND CONTROLLERS
const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Không tìm thấy thương hiệu' });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Tên thương hiệu là bắt buộc' });
    }

    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      return res.status(400).json({ message: 'Thương hiệu đã tồn tại' });
    }

    const newBrand = new Brand({
      name,
      status: 'HOAT_DONG'
    });

    const savedBrand = await newBrand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name && !status) {
      return res.status(400).json({ message: 'Dữ liệu cập nhật không hợp lệ' });
    }

    if (name) {
      const existingBrand = await Brand.findOne({ name, _id: { $ne: req.params.id } });
      if (existingBrand) {
        return res.status(400).json({ message: 'Thương hiệu đã tồn tại' });
      }
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      { name, status },
      { new: true, runValidators: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ message: 'Không tìm thấy thương hiệu' });
    }

    res.status(200).json(updatedBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const deletedBrand = await Brand.findByIdAndDelete(req.params.id);
    if (!deletedBrand) {
      return res.status(404).json({ message: 'Không tìm thấy thương hiệu' });
    }
    res.status(200).json({ message: 'Xóa thương hiệu thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CATEGORY CONTROLLERS
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Danh mục đã tồn tại' });
    }

    const newCategory = new Category({
      name,
      status: 'HOAT_DONG'
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name && !status) {
      return res.status(400).json({ message: 'Dữ liệu cập nhật không hợp lệ' });
    }

    if (name) {
      const existingCategory = await Category.findOne({ name, _id: { $ne: req.params.id } });
      if (existingCategory) {
        return res.status(400).json({ message: 'Danh mục đã tồn tại' });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, status },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.status(200).json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MATERIAL CONTROLLERS
const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({ createdAt: -1 });
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Không tìm thấy chất liệu' });
    }
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Tên chất liệu là bắt buộc' });
    }

    const existingMaterial = await Material.findOne({ name });
    if (existingMaterial) {
      return res.status(400).json({ message: 'Chất liệu đã tồn tại' });
    }

    const newMaterial = new Material({
      name,
      status: 'HOAT_DONG'
    });

    const savedMaterial = await newMaterial.save();
    res.status(201).json(savedMaterial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name && !status) {
      return res.status(400).json({ message: 'Dữ liệu cập nhật không hợp lệ' });
    }

    if (name) {
      const existingMaterial = await Material.findOne({ name, _id: { $ne: req.params.id } });
      if (existingMaterial) {
        return res.status(400).json({ message: 'Chất liệu đã tồn tại' });
      }
    }

    const updatedMaterial = await Material.findByIdAndUpdate(
      req.params.id,
      { name, status },
      { new: true, runValidators: true }
    );

    if (!updatedMaterial) {
      return res.status(404).json({ message: 'Không tìm thấy chất liệu' });
    }

    res.status(200).json(updatedMaterial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const deletedMaterial = await Material.findByIdAndDelete(req.params.id);
    if (!deletedMaterial) {
      return res.status(404).json({ message: 'Không tìm thấy chất liệu' });
    }
    res.status(200).json({ message: 'Xóa chất liệu thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// COLOR CONTROLLERS
const getAllColors = async (req, res) => {
  try {
    const colors = await Color.find().sort({ createdAt: -1 });
    res.status(200).json(colors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getColorById = async (req, res) => {
  try {
    const color = await Color.findById(req.params.id);
    if (!color) {
      return res.status(404).json({ message: 'Không tìm thấy màu sắc' });
    }
    res.status(200).json(color);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createColor = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Tên và mã màu là bắt buộc' });
    }

    const existingColor = await Color.findOne({ $or: [{ name }, { code }] });
    if (existingColor) {
      return res.status(400).json({ message: 'Màu sắc hoặc mã màu đã tồn tại' });
    }

    const newColor = new Color({
      name,
      code,
      status: 'HOAT_DONG'
    });

    const savedColor = await newColor.save();
    res.status(201).json(savedColor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateColor = async (req, res) => {
  try {
    const { name, code, status } = req.body;
    if (!name && !code && !status) {
      return res.status(400).json({ message: 'Dữ liệu cập nhật không hợp lệ' });
    }

    // Kiểm tra trùng lặp
    if (name || code) {
      const query = { _id: { $ne: req.params.id } };
      if (name) query.name = name;
      if (code) query.code = code;
      
      const existingColor = await Color.findOne(query);
      if (existingColor) {
        return res.status(400).json({ message: 'Màu sắc hoặc mã màu đã tồn tại' });
      }
    }

    const updatedColor = await Color.findByIdAndUpdate(
      req.params.id,
      { name, code, status },
      { new: true, runValidators: true }
    );

    if (!updatedColor) {
      return res.status(404).json({ message: 'Không tìm thấy màu sắc' });
    }

    res.status(200).json(updatedColor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteColor = async (req, res) => {
  try {
    const deletedColor = await Color.findByIdAndDelete(req.params.id);
    if (!deletedColor) {
      return res.status(404).json({ message: 'Không tìm thấy màu sắc' });
    }
    res.status(200).json({ message: 'Xóa màu sắc thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SIZE CONTROLLERS
const getAllSizes = async (req, res) => {
  try {
    const sizes = await Size.find().sort({ value: 1 });
    res.status(200).json(sizes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSizeById = async (req, res) => {
  try {
    const size = await Size.findById(req.params.id);
    if (!size) {
      return res.status(404).json({ message: 'Không tìm thấy kích cỡ' });
    }
    res.status(200).json(size);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSize = async (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res.status(400).json({ message: 'Giá trị kích cỡ là bắt buộc' });
    }

    const existingSize = await Size.findOne({ value });
    if (existingSize) {
      return res.status(400).json({ message: 'Kích cỡ đã tồn tại' });
    }

    const newSize = new Size({
      value,
      status: 'HOAT_DONG'
    });

    const savedSize = await newSize.save();
    res.status(201).json(savedSize);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSize = async (req, res) => {
  try {
    const { value, status } = req.body;
    if (!value && !status) {
      return res.status(400).json({ message: 'Dữ liệu cập nhật không hợp lệ' });
    }

    if (value) {
      const existingSize = await Size.findOne({ value, _id: { $ne: req.params.id } });
      if (existingSize) {
        return res.status(400).json({ message: 'Kích cỡ đã tồn tại' });
      }
    }

    const updatedSize = await Size.findByIdAndUpdate(
      req.params.id,
      { value, status },
      { new: true, runValidators: true }
    );

    if (!updatedSize) {
      return res.status(404).json({ message: 'Không tìm thấy kích cỡ' });
    }

    res.status(200).json(updatedSize);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSize = async (req, res) => {
  try {
    const deletedSize = await Size.findByIdAndDelete(req.params.id);
    if (!deletedSize) {
      return res.status(404).json({ message: 'Không tìm thấy kích cỡ' });
    }
    res.status(200).json({ message: 'Xóa kích cỡ thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  // Brand
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  
  // Category
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Material
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  
  // Color
  getAllColors,
  getColorById,
  createColor,
  updateColor,
  deleteColor,
  
  // Size
  getAllSizes,
  getSizeById,
  createSize,
  updateSize,
  deleteSize
}; 