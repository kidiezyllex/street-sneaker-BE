import Product from '../models/product.model.js';
import mongoose from 'mongoose';
import { Brand, Category, Material, Color, Size } from '../models/attribute.model.js';

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

    if (!name || !brand || !category || !material || !description || !weight || !variants || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm'
      });
    }

    // Xử lý vấn đề với mã sản phẩm 
    // Xóa Counter collection để tránh lỗi duplicate key
    try {
      const Counter = mongoose.model('Counter');
      await Counter.deleteOne({ _id: 'productId' });
    } catch (error) {
      console.log('Không tìm thấy Counter collection, tiếp tục tạo sản phẩm');
    }

    const [brandDoc, categoryDoc, materialDoc] = await Promise.all([
      mongoose.Types.ObjectId.isValid(brand) 
        ? Brand.findById(brand)
        : Brand.findOne({ name: brand }),
      mongoose.Types.ObjectId.isValid(category)
        ? Category.findById(category)
        : Category.findOne({ name: category }),
      mongoose.Types.ObjectId.isValid(material)
        ? Material.findById(material)
        : Material.findOne({ name: material })
    ]);

    if (!brandDoc) {
      return res.status(404).json({
        success: false,
        message: 'Thương hiệu không tồn tại'
      });
    }
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }
    if (!materialDoc) {
      return res.status(404).json({
        success: false,
        message: 'Chất liệu không tồn tại'
      });
    }

    const processedVariants = [];
    for (const variant of variants) {
      if (!variant.colorId || !variant.sizeId || !variant.price || variant.price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi biến thể cần có màu sắc, kích cỡ và giá hợp lệ',
          variant
        });
      }

      let color, size;
      
      if (mongoose.Types.ObjectId.isValid(variant.colorId)) {
        color = await Color.findById(variant.colorId);
      } else {
        color = await Color.findOne({ code: variant.colorId });
      }
      
      if (!color) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy màu sắc: ${variant.colorId}`
        });
      }
      
      if (mongoose.Types.ObjectId.isValid(variant.sizeId)) {
        size = await Size.findById(variant.sizeId);
      } else {
        size = await Size.findOne({ value: parseInt(variant.sizeId.replace(/\D/g, '')) });
      }
      
      if (!size) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy kích cỡ: ${variant.sizeId}`
        });
      }

      processedVariants.push({
        ...variant,
        colorId: color._id,
        sizeId: size._id
      });
    }

    const latestProduct = await Product.findOne().sort({ createdAt: -1 });
    let productNumber = 1;
    
    if (latestProduct && latestProduct.code) {
      const match = latestProduct.code.match(/PRD(\d+)/);
      if (match && match[1]) {
        productNumber = parseInt(match[1]) + 1;
      }
    }
    
    const productCode = `PRD${productNumber.toString().padStart(6, '0')}`;

    const newProduct = new Product({
      code: productCode,
      name,
      brand: brandDoc._id,
      category: categoryDoc._id,
      material: materialDoc._id,
      description,
      weight,
      variants: processedVariants,
      status: 'HOAT_DONG'
    });

    await newProduct.save();

    await newProduct.populate([
      { path: 'brand', select: 'name' },
      { path: 'category', select: 'name' },
      { path: 'material', select: 'name' },
      { path: 'variants.colorId', select: 'name code' },
      { path: 'variants.sizeId', select: 'value' }
    ]);

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
      color,
      size,
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
    
    // Lọc theo thương hiệu (hỗ trợ nhiều thương hiệu)
    if (brand) {
      if (Array.isArray(brand)) {
        filter.brand = { $in: brand };
      } else {
        filter.brand = brand;
      }
    }
    
    // Lọc theo danh mục (hỗ trợ nhiều danh mục)
    if (category) {
      if (Array.isArray(category)) {
        filter.category = { $in: category };
      } else {
        filter.category = category;
      }
    }
    
    if (material) {
      filter.material = material;
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Lọc theo màu sắc
    if (color) {
      const colorIds = Array.isArray(color) ? color : [color];
      filter['variants.colorId'] = { $in: colorIds };
    }
    
    // Lọc theo kích cỡ
    if (size) {
      const sizeIds = Array.isArray(size) ? size : [size];
      filter['variants.sizeId'] = { $in: sizeIds };
    }
    
    // Lọc theo khoảng giá
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
      .populate('variants.sizeId', 'value')
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
    let { 
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

    // Xử lý brand, category, material: cho phép truyền ObjectId hoặc tên
    let brandId = brand;
    let categoryId = category;
    let materialId = material;

    if (brand && !mongoose.Types.ObjectId.isValid(brand)) {
      // Nếu là tên, tìm hoặc tạo mới
      const brandDoc = await Brand.findOne({ name: brand });
      brandId = brandDoc._id;
    }
    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      const categoryDoc = await Category.findOne({ name: category });
      categoryId = categoryDoc._id;
    }
    if (material && !mongoose.Types.ObjectId.isValid(material)) {
      const materialDoc = await Material.findOne({ name: material });
      materialId = materialDoc._id;
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
    if (brandId) product.brand = brandId;
    if (categoryId) product.category = categoryId;
    if (materialId) product.material = materialId;
    if (description) product.description = description;
    if (weight) product.weight = weight;
    if (variants) product.variants = variants;
    if (status) product.status = status;

    await product.save();
    // Populate thông tin chi tiết trước khi trả về
    await product.populate([
      { path: 'brand', select: 'name' },
      { path: 'category', select: 'name' },
      { path: 'material', select: 'name' },
      { path: 'variants.colorId', select: 'name code' },
      { path: 'variants.sizeId', select: 'value' }
    ]);

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
    const { 
      keyword, 
      brand, 
      category, 
      material, 
      color, 
      size, 
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 10 
    } = req.query;
    
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
    
    // Áp dụng các bộ lọc nâng cao
    
    // Lọc theo thương hiệu
    if (brand) {
      if (Array.isArray(brand)) {
        filter.brand = { $in: brand };
      } else {
        filter.brand = brand;
      }
    }
    
    // Lọc theo danh mục
    if (category) {
      if (Array.isArray(category)) {
        filter.category = { $in: category };
      } else {
        filter.category = category;
      }
    }
    
    // Lọc theo chất liệu
    if (material) {
      filter.material = material;
    }
    
    // Lọc theo màu sắc
    if (color) {
      const colorIds = Array.isArray(color) ? color : [color];
      filter['variants.colorId'] = { $in: colorIds };
    }
    
    // Lọc theo kích cỡ
    if (size) {
      const sizeIds = Array.isArray(size) ? size : [size];
      filter['variants.sizeId'] = { $in: sizeIds };
    }
    
    // Lọc theo khoảng giá
    if (minPrice || maxPrice) {
      filter['variants.price'] = {};
      if (minPrice) filter['variants.price'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['variants.price'].$lte = parseFloat(maxPrice);
    }
    
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('brand', 'name')
      .populate('category', 'name')
      .populate('material', 'name')
      .populate('variants.colorId', 'name code')
      .populate('variants.sizeId', 'value')
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

/**
 * Lấy tất cả các thuộc tính lọc sản phẩm (màu sắc, kích cỡ, thương hiệu, danh mục, chất liệu)
 * @route GET /api/products/filters
 * @access Public
 */
export const getAllFilters = async (req, res) => {
  try {
    const [brands, categories, materials, colors, sizes] = await Promise.all([
      Brand.find({ status: 'HOAT_DONG' }).select('_id name'),
      Category.find({ status: 'HOAT_DONG' }).select('_id name'),
      Material.find({ status: 'HOAT_DONG' }).select('_id name'),
      Color.find({ status: 'HOAT_DONG' }).select('_id name code'),
      Size.find({ status: 'HOAT_DONG' }).select('_id value').sort({ value: 1 })
    ]);

    // Xác định khoảng giá
    const productWithMinPrice = await Product.findOne({ status: 'HOAT_DONG' })
      .sort({ 'variants.price': 1 })
      .select('variants.price');
      
    const productWithMaxPrice = await Product.findOne({ status: 'HOAT_DONG' })
      .sort({ 'variants.price': -1 })
      .select('variants.price');
    
    // Lấy giá thấp nhất và cao nhất
    const minProductPrice = productWithMinPrice?.variants[0]?.price || 0;
    const maxProductPrice = productWithMaxPrice?.variants[0]?.price || 1000000;

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách bộ lọc thành công',
      data: {
        brands,
        categories,
        materials,
        colors,
        sizes,
        priceRange: {
          min: minProductPrice,
          max: maxProductPrice
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bộ lọc:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách bộ lọc',
      error: error.message
    });
  }
}; 