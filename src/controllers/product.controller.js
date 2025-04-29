import Product from '../models/product.model.js';
import mongoose from 'mongoose';

/**
 * Tạo sản phẩm mới
 * @route POST /api/products
 * @access Private/Admin
 */
export const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      brand, 
      category, 
      material, 
      description, 
      weight, 
      variants 
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !brand || !category || !material || !description || !weight || !variants || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm'
      });
    }

    // Kiểm tra các tham chiếu ObjectId
    if (!mongoose.Types.ObjectId.isValid(brand) || 
        !mongoose.Types.ObjectId.isValid(category) || 
        !mongoose.Types.ObjectId.isValid(material)) {
      return res.status(400).json({
        success: false,
        message: 'ID thương hiệu, danh mục hoặc chất liệu không hợp lệ'
      });
    }

    // Kiểm tra từng variant
    for (const variant of variants) {
      if (!variant.colorId || !variant.sizeId || !variant.price || variant.price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi biến thể cần có màu sắc, kích cỡ và giá hợp lệ'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(variant.colorId) || 
          !mongoose.Types.ObjectId.isValid(variant.sizeId)) {
        return res.status(400).json({
          success: false,
          message: 'ID màu sắc hoặc kích cỡ không hợp lệ'
        });
      }
    }

    // Tạo sản phẩm mới
    const newProduct = new Product({
      name,
      brand,
      category,
      material,
      description,
      weight,
      variants,
      status: 'HOAT_DONG'
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: newProduct
    });
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo sản phẩm',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách sản phẩm
 * @route GET /api/products
 * @access Public
 */
export const getProducts = async (req, res) => {
  try {
    const { 
      name, 
      brand, 
      category, 
      material, 
      minPrice, 
      maxPrice, 
      status, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng query filter
    const filter = {};
    
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    
    if (brand) {
      filter.brand = brand;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (material) {
      filter.material = material;
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Thêm filter cho khoảng giá
    if (minPrice || maxPrice) {
      filter['variants.price'] = {};
      if (minPrice) filter['variants.price'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['variants.price'].$lte = parseFloat(maxPrice);
    }
    
    // Thực hiện query với phân trang
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('brand', 'name')
      .populate('category', 'name')
      .populate('material', 'name')
      .populate('variants.colorId', 'name code')
      .populate('variants.sizeId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: {
        products,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết sản phẩm
 * @route GET /api/products/:id
 * @access Public
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    const product = await Product.findById(id)
      .populate('brand', 'name')
      .populate('category', 'name')
      .populate('material', 'name')
      .populate('variants.colorId', 'name code')
      .populate('variants.sizeId', 'name code');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin sản phẩm thành công',
      data: product
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật sản phẩm
 * @route PUT /api/products/:id
 * @access Private/Admin
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      brand, 
      category, 
      material, 
      description, 
      weight, 
      variants, 
      status 
    } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    // Kiểm tra các tham chiếu ObjectId nếu được cung cấp
    if (brand && !mongoose.Types.ObjectId.isValid(brand)) {
      return res.status(400).json({
        success: false,
        message: 'ID thương hiệu không hợp lệ'
      });
    }
    
    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ'
      });
    }
    
    if (material && !mongoose.Types.ObjectId.isValid(material)) {
      return res.status(400).json({
        success: false,
        message: 'ID chất liệu không hợp lệ'
      });
    }
    
    // Kiểm tra từng variant nếu được cung cấp
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        if (variant.colorId && !mongoose.Types.ObjectId.isValid(variant.colorId)) {
          return res.status(400).json({
            success: false,
            message: 'ID màu sắc không hợp lệ'
          });
        }
        
        if (variant.sizeId && !mongoose.Types.ObjectId.isValid(variant.sizeId)) {
          return res.status(400).json({
            success: false,
            message: 'ID kích cỡ không hợp lệ'
          });
        }
        
        if (variant.price && variant.price <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Giá biến thể phải lớn hơn 0'
          });
        }
      }
    }
    
    // Tìm sản phẩm cần cập nhật
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Cập nhật thông tin
    if (name) product.name = name;
    if (brand) product.brand = brand;
    if (category) product.category = category;
    if (material) product.material = material;
    if (description) product.description = description;
    if (weight) product.weight = weight;
    if (variants) product.variants = variants;
    if (status) product.status = status;
    
    await product.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: product
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật sản phẩm',
      error: error.message
    });
  }
};

/**
 * Xóa sản phẩm
 * @route DELETE /api/products/:id
 * @access Private/Admin
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái sản phẩm
 * @route PATCH /api/products/:id/status
 * @access Private/Admin
 */
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    if (!status || !['HOAT_DONG', 'KHONG_HOAT_DONG'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    product.status = status;
    await product.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái sản phẩm thành công',
      data: product
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật tồn kho của biến thể sản phẩm
 * @route PATCH /api/products/:id/stock
 * @access Private/Admin
 */
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { variantUpdates } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    if (!variantUpdates || !Array.isArray(variantUpdates) || variantUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách cập nhật tồn kho'
      });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Cập nhật tồn kho từng biến thể
    for (const update of variantUpdates) {
      const { variantId, stock } = update;
      
      if (!variantId || stock === undefined || stock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin cập nhật tồn kho không hợp lệ'
        });
      }
      
      const variantIndex = product.variants.findIndex(v => v._id.toString() === variantId);
      
      if (variantIndex === -1) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biến thể với ID: ${variantId}`
        });
      }
      
      product.variants[variantIndex].stock = stock;
    }
    
    await product.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật tồn kho thành công',
      data: product
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật tồn kho:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật tồn kho',
      error: error.message
    });
  }
};

/**
 * Tìm kiếm sản phẩm theo từ khóa
 * @route GET /api/products/search
 * @access Public
 */
export const searchProducts = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp từ khóa tìm kiếm'
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Tìm kiếm sản phẩm theo tên hoặc mã
    const filter = {
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } }
      ],
      status: 'HOAT_DONG'
    };
    
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('brand', 'name')
      .populate('category', 'name')
      .populate('material', 'name')
      .populate('variants.colorId', 'name code')
      .populate('variants.sizeId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Tìm kiếm sản phẩm thành công',
      data: {
        products,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tìm kiếm sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật hình ảnh biến thể sản phẩm
 * @route PATCH /api/products/:id/images
 * @access Private/Admin
 */
export const updateProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { variantId, images } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    if (!variantId || !images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID biến thể và danh sách hình ảnh'
      });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    const variantIndex = product.variants.findIndex(v => v._id.toString() === variantId);
    
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể'
      });
    }
    
    product.variants[variantIndex].images = images;
    
    await product.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật hình ảnh thành công',
      data: product
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật hình ảnh:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật hình ảnh',
      error: error.message
    });
  }
}; 