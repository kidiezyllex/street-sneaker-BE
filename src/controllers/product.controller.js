import Product, { Brand, Category, Color, Material, Size, Sole } from '../models/product.model.js';

/**
 * Lấy danh sách tất cả sản phẩm có phân trang và filter
 * @route GET /api/products
 * @access Public
 */
export const getAllProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10, sort = '-createdAt', name, brand, category, color, material, minPrice, maxPrice, status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Xây dựng query
    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (status) query.status = status;

    // Filter cho variants
    const variantFilters = {};
    if (brand) variantFilters['variants.brand.name'] = { $regex: brand, $options: 'i' };
    if (category) variantFilters['variants.category.name'] = { $regex: category, $options: 'i' };
    if (color) variantFilters['variants.color.name'] = { $regex: color, $options: 'i' };
    if (material) variantFilters['variants.material.name'] = { $regex: material, $options: 'i' };
    if (minPrice) variantFilters['variants.price'] = { $gte: parseInt(minPrice) };
    if (maxPrice) {
      if (variantFilters['variants.price']) {
        variantFilters['variants.price'].$lte = parseInt(maxPrice);
      } else {
        variantFilters['variants.price'] = { $lte: parseInt(maxPrice) };
      }
    }

    // Kết hợp các filter
    const finalQuery = { ...query };
    if (Object.keys(variantFilters).length > 0) {
      finalQuery.$or = [
        { $and: Object.entries(variantFilters).map(([key, value]) => ({ [key]: value })) }
      ];
    }

    // Thực hiện truy vấn
    const total = await Product.countDocuments(finalQuery);
    const products = await Product.find(finalQuery)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin chi tiết sản phẩm
 * @route GET /api/products/:id
 * @access Public
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin sản phẩm',
      error: error.message
    });
  }
};

/**
 * Thêm sản phẩm mới
 * @route POST /api/products
 * @access Private (Admin, Staff)
 */
export const createProduct = async (req, res) => {
  try {
    const validatedData = validateProduct(req.body);
    const product = new Product(validatedData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Cập nhật thông tin sản phẩm
 * @route PUT /api/products/:id
 * @access Private (Admin, Staff)
 */
export const updateProduct = async (req, res) => {
  try {
    const validatedData = validateProduct(req.body);
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Xóa sản phẩm
 * @route DELETE /api/products/:id
 * @access Private (Admin)
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Ẩn sản phẩm thay vì xóa
    product.status = 'KHONG_HOAT_DONG';
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa sản phẩm',
      error: error.message
    });
  }
};

/**
 * Thêm biến thể mới cho sản phẩm
 * @route POST /api/products/:id/variants
 * @access Private (Admin, Staff)
 */
export const addProductVariant = async (req, res) => {
  try {
    const { price, weight, amount, description, brand, sole, material, category, size, color, images } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Tạo biến thể mới
    const newVariant = {
      price,
      weight,
      amount: amount || 0,
      description,
      status: 'HOAT_DONG',
      brand,
      sole,
      material,
      category,
      size,
      color,
      images: images || [],
      promotions: []
    };

    product.variants.push(newVariant);
    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm biến thể sản phẩm thành công',
      data: product.variants[product.variants.length - 1]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm biến thể sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật biến thể sản phẩm
 * @route PUT /api/products/:id/variants/:variantId
 * @access Private (Admin, Staff)
 */
export const updateProductVariant = async (req, res) => {
  try {
    const { price, weight, amount, description, brand, sole, material, category, size, color, status } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Tìm biến thể cần cập nhật
    const variantIndex = product.variants.findIndex(v => v._id.toString() === req.params.variantId);
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    // Cập nhật thông tin biến thể
    if (price) product.variants[variantIndex].price = price;
    if (weight) product.variants[variantIndex].weight = weight;
    if (amount !== undefined) product.variants[variantIndex].amount = amount;
    if (description) product.variants[variantIndex].description = description;
    if (brand) product.variants[variantIndex].brand = brand;
    if (sole) product.variants[variantIndex].sole = sole;
    if (material) product.variants[variantIndex].material = material;
    if (category) product.variants[variantIndex].category = category;
    if (size) product.variants[variantIndex].size = size;
    if (color) product.variants[variantIndex].color = color;
    if (status) product.variants[variantIndex].status = status;

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật biến thể sản phẩm thành công',
      data: product.variants[variantIndex]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật biến thể sản phẩm',
      error: error.message
    });
  }
};

/**
 * Xóa biến thể sản phẩm
 * @route DELETE /api/products/:id/variants/:variantId
 * @access Private (Admin, Staff)
 */
export const deleteProductVariant = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Tìm biến thể cần xóa
    const variantIndex = product.variants.findIndex(v => v._id.toString() === req.params.variantId);
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    // Ẩn biến thể thay vì xóa
    product.variants[variantIndex].status = 'KHONG_HOAT_DONG';
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa biến thể sản phẩm thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa biến thể sản phẩm',
      error: error.message
    });
  }
};

/**
 * Thêm hình ảnh cho biến thể sản phẩm
 * @route POST /api/products/:id/variants/:variantId/images
 * @access Private (Admin, Staff)
 */
export const addProductImage = async (req, res) => {
  try {
    const { url, defaultImage } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Tìm biến thể
    const variantIndex = product.variants.findIndex(v => v._id.toString() === req.params.variantId);
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    // Nếu đặt ảnh mới là mặc định, bỏ các ảnh mặc định khác
    if (defaultImage) {
      product.variants[variantIndex].images.forEach(img => {
        img.defaultImage = false;
      });
    }

    // Thêm ảnh mới
    const newImage = {
      url,
      defaultImage: defaultImage || false,
      status: 'HOAT_DONG'
    };

    product.variants[variantIndex].images.push(newImage);
    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm hình ảnh sản phẩm thành công',
      data: product.variants[variantIndex].images[product.variants[variantIndex].images.length - 1]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm hình ảnh sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật hình ảnh biến thể sản phẩm
 * @route PUT /api/products/:id/variants/:variantId/images/:imageId
 * @access Private (Admin, Staff)
 */
export const updateProductImage = async (req, res) => {
  try {
    const { url, defaultImage, status } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Tìm biến thể
    const variantIndex = product.variants.findIndex(v => v._id.toString() === req.params.variantId);
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    // Tìm ảnh
    const imageIndex = product.variants[variantIndex].images.findIndex(img => img._id.toString() === req.params.imageId);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hình ảnh'
      });
    }

    // Nếu đặt ảnh này là mặc định, bỏ các ảnh mặc định khác
    if (defaultImage) {
      product.variants[variantIndex].images.forEach((img, idx) => {
        if (idx !== imageIndex) {
          img.defaultImage = false;
        }
      });
    }

    // Cập nhật thông tin
    if (url) product.variants[variantIndex].images[imageIndex].url = url;
    if (defaultImage !== undefined) product.variants[variantIndex].images[imageIndex].defaultImage = defaultImage;
    if (status) product.variants[variantIndex].images[imageIndex].status = status;

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hình ảnh sản phẩm thành công',
      data: product.variants[variantIndex].images[imageIndex]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật hình ảnh sản phẩm',
      error: error.message
    });
  }
};

/**
 * Xóa hình ảnh biến thể sản phẩm
 * @route DELETE /api/products/:id/variants/:variantId/images/:imageId
 * @access Private (Admin, Staff)
 */
export const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Tìm biến thể
    const variantIndex = product.variants.findIndex(v => v._id.toString() === req.params.variantId);
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    // Tìm ảnh
    const imageIndex = product.variants[variantIndex].images.findIndex(img => img._id.toString() === req.params.imageId);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hình ảnh'
      });
    }

    // Ẩn hình ảnh thay vì xóa
    product.variants[variantIndex].images[imageIndex].status = 'KHONG_HOAT_DONG';
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa hình ảnh sản phẩm thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa hình ảnh sản phẩm',
      error: error.message
    });
  }
};

/**
 * Thêm khuyến mãi cho biến thể sản phẩm
 * @route POST /api/products/:id/variants/:variantId/promotions
 * @access Private (Admin, Staff)
 */
export const addProductPromotion = async (req, res) => {
  try {
    const { promotionId, pricePromotion } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Tìm biến thể
    const variantIndex = product.variants.findIndex(v => v._id.toString() === req.params.variantId);
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    // Kiểm tra khuyến mãi đã tồn tại chưa
    const existingPromotion = product.variants[variantIndex].promotions.find(
      promo => promo.promotionId.toString() === promotionId
    );

    if (existingPromotion) {
      return res.status(400).json({
        success: false,
        message: 'Khuyến mãi đã được áp dụng cho sản phẩm này'
      });
    }

    // Thêm khuyến mãi
    const newPromotion = {
      promotionId,
      pricePromotion
    };

    product.variants[variantIndex].promotions.push(newPromotion);
    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm khuyến mãi cho sản phẩm thành công',
      data: product.variants[variantIndex].promotions[product.variants[variantIndex].promotions.length - 1]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm khuyến mãi cho sản phẩm',
      error: error.message
    });
  }
};

/**
 * Xóa khuyến mãi của biến thể sản phẩm
 * @route DELETE /api/products/:id/variants/:variantId/promotions/:promotionId
 * @access Private (Admin, Staff)
 */
export const deleteProductPromotion = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Tìm biến thể
    const variantIndex = product.variants.findIndex(v => v._id.toString() === req.params.variantId);
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    // Tìm và xóa khuyến mãi
    const promotionIndex = product.variants[variantIndex].promotions.findIndex(
      promo => promo.promotionId.toString() === req.params.promotionId
    );

    if (promotionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi'
      });
    }

    product.variants[variantIndex].promotions.splice(promotionIndex, 1);
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa khuyến mãi thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa khuyến mãi',
      error: error.message
    });
  }
};

// =================== Brand Controller ===================

// Lấy danh sách tất cả thương hiệu
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thương hiệu thành công',
      data: brands
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách thương hiệu',
      error: error.message
    });
  }
};

// Tạo thương hiệu mới
export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Kiểm tra thương hiệu đã tồn tại chưa
    const existingBrand = await Brand.findOne({ name });
    
    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: 'Tên thương hiệu đã tồn tại'
      });
    }
    
    // Tạo thương hiệu mới
    const newBrand = new Brand({
      name,
      status: 'HOAT_DONG'
    });
    
    await newBrand.save();
    
    return res.status(201).json({
      success: true,
      message: 'Thêm thương hiệu mới thành công',
      data: newBrand
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm thương hiệu mới',
      error: error.message
    });
  }
};

// Cập nhật thương hiệu
export const updateBrand = async (req, res) => {
  try {
    const { name, status } = req.body;
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thương hiệu'
      });
    }
    
    // Kiểm tra nếu đổi tên thì tên mới đã tồn tại chưa
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({ name });
      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: 'Tên thương hiệu đã tồn tại'
        });
      }
      brand.name = name;
    }
    
    if (status) brand.status = status;
    
    await brand.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thương hiệu thành công',
      data: brand
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thương hiệu',
      error: error.message
    });
  }
};

// ---------- QUẢN LÝ THUỘC TÍNH SẢN PHẨM ---------- //

/**
 * Lấy danh sách danh mục
 * @route GET /api/products/categories
 * @access Public
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục thành công',
      data: categories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách danh mục',
      error: error.message
    });
  }
};

/**
 * Thêm danh mục mới
 * @route POST /api/products/categories
 * @access Private (Admin, Staff)
 */
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Kiểm tra danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục đã tồn tại'
      });
    }
    
    // Tạo danh mục mới
    const newCategory = new Category({
      name,
      status: 'HOAT_DONG'
    });
    
    await newCategory.save();
    
    return res.status(201).json({
      success: true,
      message: 'Thêm danh mục mới thành công',
      data: newCategory
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm danh mục mới',
      error: error.message
    });
  }
};

/**
 * Cập nhật danh mục
 * @route PUT /api/products/categories/:id
 * @access Private (Admin, Staff)
 */
export const updateCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }
    
    // Kiểm tra nếu đổi tên thì tên mới đã tồn tại chưa
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục đã tồn tại'
        });
      }
      category.name = name;
    }
    
    if (status) category.status = status;
    
    await category.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật danh mục',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách màu sắc
 * @route GET /api/products/colors
 * @access Public
 */
export const getAllColors = async (req, res) => {
  try {
    const colors = await Color.find().sort({ name: 1 });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách màu sắc thành công',
      data: colors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách màu sắc',
      error: error.message
    });
  }
};

/**
 * Thêm màu sắc mới
 * @route POST /api/products/colors
 * @access Private (Admin, Staff)
 */
export const createColor = async (req, res) => {
  try {
    const { name, code } = req.body;
    
    // Kiểm tra màu đã tồn tại chưa
    const existingColor = await Color.findOne({ 
      $or: [{ name }, { code }]
    });
    
    if (existingColor) {
      return res.status(400).json({
        success: false,
        message: 'Màu sắc đã tồn tại'
      });
    }
    
    // Tạo màu mới
    const newColor = new Color({
      name,
      code,
      status: 'HOAT_DONG'
    });
    
    await newColor.save();
    
    return res.status(201).json({
      success: true,
      message: 'Thêm màu sắc mới thành công',
      data: newColor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm màu sắc mới',
      error: error.message
    });
  }
};

/**
 * Cập nhật màu sắc
 * @route PUT /api/products/colors/:id
 * @access Private (Admin, Staff)
 */
export const updateColor = async (req, res) => {
  try {
    const { name, code, status } = req.body;
    const color = await Color.findById(req.params.id);
    
    if (!color) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy màu sắc'
      });
    }
    
    // Kiểm tra nếu đổi tên hoặc mã màu thì đã tồn tại chưa
    if ((name && name !== color.name) || (code && code !== color.code)) {
      const existingColor = await Color.findOne({
        $or: [
          { name: name || color.name },
          { code: code || color.code }
        ],
        _id: { $ne: color._id }
      });
      
      if (existingColor) {
        return res.status(400).json({
          success: false,
          message: 'Tên hoặc mã màu đã tồn tại'
        });
      }
    }
    
    if (name) color.name = name;
    if (code) color.code = code;
    if (status) color.status = status;
    
    await color.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật màu sắc thành công',
      data: color
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật màu sắc',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách vật liệu
 * @route GET /api/products/materials
 * @access Public
 */
export const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({ name: 1 });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách vật liệu thành công',
      data: materials
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách vật liệu',
      error: error.message
    });
  }
};

/**
 * Thêm vật liệu mới
 * @route POST /api/products/materials
 * @access Private (Admin, Staff)
 */
export const createMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Kiểm tra vật liệu đã tồn tại chưa
    const existingMaterial = await Material.findOne({ name });
    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: 'Vật liệu đã tồn tại'
      });
    }
    
    // Tạo vật liệu mới
    const newMaterial = new Material({
      name,
      status: 'HOAT_DONG'
    });
    
    await newMaterial.save();
    
    return res.status(201).json({
      success: true,
      message: 'Thêm vật liệu mới thành công',
      data: newMaterial
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm vật liệu mới',
      error: error.message
    });
  }
};

/**
 * Cập nhật vật liệu
 * @route PUT /api/products/materials/:id
 * @access Private (Admin, Staff)
 */
export const updateMaterial = async (req, res) => {
  try {
    const { name, status } = req.body;
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vật liệu'
      });
    }
    
    // Kiểm tra nếu đổi tên thì tên mới đã tồn tại chưa
    if (name && name !== material.name) {
      const existingMaterial = await Material.findOne({ name });
      if (existingMaterial) {
        return res.status(400).json({
          success: false,
          message: 'Tên vật liệu đã tồn tại'
        });
      }
      material.name = name;
    }
    
    if (status) material.status = status;
    
    await material.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật vật liệu thành công',
      data: material
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật vật liệu',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách kích thước
 * @route GET /api/products/sizes
 * @access Public
 */
export const getAllSizes = async (req, res) => {
  try {
    const sizes = await Size.find().sort({ size: 1 });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách kích thước thành công',
      data: sizes
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách kích thước',
      error: error.message
    });
  }
};

/**
 * Thêm kích thước mới
 * @route POST /api/products/sizes
 * @access Private (Admin, Staff)
 */
export const createSize = async (req, res) => {
  try {
    const { size } = req.body;
    
    // Kiểm tra kích thước đã tồn tại chưa
    const existingSize = await Size.findOne({ size });
    if (existingSize) {
      return res.status(400).json({
        success: false,
        message: 'Kích thước đã tồn tại'
      });
    }
    
    // Tạo kích thước mới
    const newSize = new Size({
      size,
      status: 'HOAT_DONG'
    });
    
    await newSize.save();
    
    return res.status(201).json({
      success: true,
      message: 'Thêm kích thước mới thành công',
      data: newSize
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm kích thước mới',
      error: error.message
    });
  }
};

/**
 * Cập nhật kích thước
 * @route PUT /api/products/sizes/:id
 * @access Private (Admin, Staff)
 */
export const updateSize = async (req, res) => {
  try {
    const { size, status } = req.body;
    const sizeObj = await Size.findById(req.params.id);
    
    if (!sizeObj) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kích thước'
      });
    }
    
    // Kiểm tra nếu đổi kích thước thì kích thước mới đã tồn tại chưa
    if (size && size !== sizeObj.size) {
      const existingSize = await Size.findOne({ size });
      if (existingSize) {
        return res.status(400).json({
          success: false,
          message: 'Kích thước đã tồn tại'
        });
      }
      sizeObj.size = size;
    }
    
    if (status) sizeObj.status = status;
    
    await sizeObj.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật kích thước thành công',
      data: sizeObj
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật kích thước',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đế giày
 * @route GET /api/products/soles
 * @access Public
 */
export const getAllSoles = async (req, res) => {
  try {
    const soles = await Sole.find().sort({ name: 1 });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đế giày thành công',
      data: soles
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đế giày',
      error: error.message
    });
  }
};

/**
 * Thêm đế giày mới
 * @route POST /api/products/soles
 * @access Private (Admin, Staff)
 */
export const createSole = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Kiểm tra đế giày đã tồn tại chưa
    const existingSole = await Sole.findOne({ name });
    if (existingSole) {
      return res.status(400).json({
        success: false,
        message: 'Đế giày đã tồn tại'
      });
    }
    
    // Tạo đế giày mới
    const newSole = new Sole({
      name,
      status: 'HOAT_DONG'
    });
    
    await newSole.save();
    
    return res.status(201).json({
      success: true,
      message: 'Thêm đế giày mới thành công',
      data: newSole
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm đế giày mới',
      error: error.message
    });
  }
};

/**
 * Cập nhật đế giày
 * @route PUT /api/products/soles/:id
 * @access Private (Admin, Staff)
 */
export const updateSole = async (req, res) => {
  try {
    const { name, status } = req.body;
    const sole = await Sole.findById(req.params.id);
    
    if (!sole) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đế giày'
      });
    }
    
    // Kiểm tra nếu đổi tên thì tên mới đã tồn tại chưa
    if (name && name !== sole.name) {
      const existingSole = await Sole.findOne({ name });
      if (existingSole) {
        return res.status(400).json({
          success: false,
          message: 'Tên đế giày đã tồn tại'
        });
      }
      sole.name = name;
    }
    
    if (status) sole.status = status;
    
    await sole.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật đế giày thành công',
      data: sole
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật đế giày',
      error: error.message
    });
  }
};

/**
 * Tìm kiếm sản phẩm theo giá trị
 * @route GET /api/products/search
 * @access Public
 */
export const searchProducts = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };
    
    const products = await Product.find(searchQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments(searchQuery);
    
    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Lấy sản phẩm mới nhất
 * @route GET /api/products/newest
 * @access Public
 */
export const getNewestProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.find({ status: 'HOAT_DONG' })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy sản phẩm mới nhất thành công',
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy sản phẩm mới nhất',
      error: error.message
    });
  }
};

/**
 * Lấy sản phẩm bán chạy nhất
 * @route GET /api/products/best-selling
 * @access Public
 */
export const getBestSellingProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    // Lấy sản phẩm bán chạy dựa vào số lượng biến thể bán ra
    const products = await Product.aggregate([
      { $match: { status: 'HOAT_DONG' } },
      { $unwind: '$variants' },
      { $match: { 'variants.status': 'HOAT_DONG' } },
      { $sort: { 'variants.amount': -1 } },
      { $group: { _id: '$_id', product: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$product' } },
      { $limit: parseInt(limit) }
    ]);
    
    return res.status(200).json({
      success: true,
      message: 'Lấy sản phẩm bán chạy nhất thành công',
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy sản phẩm bán chạy nhất',
      error: error.message
    });
  }
};

/**
 * Lấy sản phẩm sắp hết hàng
 * @route GET /api/products/low-stock
 * @access Private (Admin, Staff)
 */
export const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 10, limit = 20 } = req.query;
    
    // Lấy sản phẩm có ít nhất một biến thể có số lượng dưới ngưỡng
    const products = await Product.find({
      status: 'HOAT_DONG',
      variants: {
        $elemMatch: {
          amount: { $lte: parseInt(threshold) },
          status: 'HOAT_DONG'
        }
      }
    }).limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy sản phẩm sắp hết hàng thành công',
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy sản phẩm sắp hết hàng',
      error: error.message
    });
  }
};

export const addMaterial = async (req, res) => {
  try {
    const validatedData = validateMaterial(req.body);
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    product.materials.push(validatedData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addVariant = async (req, res) => {
  try {
    const validatedData = validateVariant(req.body);
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    const variant = new Variant({
      ...validatedData,
      productId: product._id
    });
    await variant.save();
    res.status(201).json(variant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addImages = async (req, res) => {
  try {
    const { files } = req;
    const { color } = req.body;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng tải lên ít nhất một hình ảnh' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const uploadPromises = files.map(file => uploadToCloudinary(file.path));
    const uploadedImages = await Promise.all(uploadPromises);

    const images = uploadedImages.map(image => ({
      url: image.url,
      color,
      productId: product._id
    }));

    const savedImages = await Image.insertMany(images);
    res.status(201).json(savedImages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const quickEdit = async (req, res) => {
  try {
    const updates = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Chỉ cho phép cập nhật một số trường nhất định
    const allowedUpdates = ['name', 'description', 'price', 'stock'];
    const updateData = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    Object.assign(product, updateData);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const filterProducts = async (req, res) => {
  try {
    const { 
      categories,
      materials,
      colors,
      sizes,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};
    if (categories) query.categories = { $in: categories.split(',') };
    if (materials) query['materials.name'] = { $in: materials.split(',') };
    if (colors) query['variants.color'] = { $in: colors.split(',') };
    if (sizes) query['variants.size'] = { $in: sizes.split(',') };
    if (minPrice || maxPrice) {
      query['variants.price'] = {};
      if (minPrice) query['variants.price'].$gte = Number(minPrice);
      if (maxPrice) query['variants.price'].$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 