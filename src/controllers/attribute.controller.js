import { Category, Color, Material, Size, Sole } from '../models/index.js';

// Lấy danh sách tất cả danh mục
export const getAllCategories = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Xây dựng query filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const categories = await Category.find(filter).sort({ name: 1 });
    
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

// Tạo danh mục mới
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Kiểm tra tên danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({ name });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại'
      });
    }
    
    // Tạo danh mục mới
    const newCategory = new Category({ name });
    
    await newCategory.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: newCategory
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo danh mục',
      error: error.message
    });
  }
};

// Cập nhật danh mục
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    
    // Tìm danh mục cần cập nhật
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }
    
    // Kiểm tra nếu đổi tên thì cần kiểm tra tên mới đã tồn tại chưa
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
    
    // Cập nhật trạng thái nếu có
    if (status) {
      category.status = status;
    }
    
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

// =================== Color Controller ===================

// Lấy danh sách tất cả màu sắc
export const getAllColors = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Xây dựng query filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    const colors = await Color.find(filter).sort({ name: 1 });
    
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

// Tạo màu sắc mới
export const createColor = async (req, res) => {
  try {
    const { name, code } = req.body;
    
    // Kiểm tra mã màu hoặc tên màu đã tồn tại chưa
    const existingColor = await Color.findOne({
      $or: [
        { name },
        { code }
      ]
    });
    
    if (existingColor) {
      return res.status(400).json({
        success: false,
        message: 'Mã màu hoặc tên màu đã tồn tại'
      });
    }
    
    // Tạo màu sắc mới
    const newColor = new Color({ name, code });
    
    await newColor.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tạo màu sắc thành công',
      data: newColor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo màu sắc',
      error: error.message
    });
  }
};

// Cập nhật màu sắc
export const updateColor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, status } = req.body;
    
    // Tìm màu sắc cần cập nhật
    const color = await Color.findById(id);
    
    if (!color) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy màu sắc'
      });
    }
    
    // Kiểm tra nếu đổi tên hoặc mã màu thì cần kiểm tra đã tồn tại chưa
    if ((name && name !== color.name) || (code && code !== color.code)) {
      const existingColor = await Color.findOne({
        $or: [
          { name: name || color.name },
          { code: code || color.code }
        ],
        _id: { $ne: id }
      });
      
      if (existingColor) {
        return res.status(400).json({
          success: false,
          message: 'Mã màu hoặc tên màu đã tồn tại'
        });
      }
      
      if (name) color.name = name;
      if (code) color.code = code;
    }
    
    // Cập nhật trạng thái nếu có
    if (status) {
      color.status = status;
    }
    
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

// =================== Material Controller ===================

// Lấy danh sách tất cả vật liệu
export const getAllMaterials = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Xây dựng query filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const materials = await Material.find(filter).sort({ name: 1 });
    
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

// Tạo vật liệu mới
export const createMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Kiểm tra tên vật liệu đã tồn tại chưa
    const existingMaterial = await Material.findOne({ name });
    
    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: 'Tên vật liệu đã tồn tại'
      });
    }
    
    // Tạo vật liệu mới
    const newMaterial = new Material({ name });
    
    await newMaterial.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tạo vật liệu thành công',
      data: newMaterial
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo vật liệu',
      error: error.message
    });
  }
};

// Cập nhật vật liệu
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    
    // Tìm vật liệu cần cập nhật
    const material = await Material.findById(id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vật liệu'
      });
    }
    
    // Kiểm tra nếu đổi tên thì cần kiểm tra tên mới đã tồn tại chưa
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
    
    // Cập nhật trạng thái nếu có
    if (status) {
      material.status = status;
    }
    
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

// =================== Size Controller ===================

// Lấy danh sách tất cả kích thước
export const getAllSizes = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Xây dựng query filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    const sizes = await Size.find(filter).sort({ size: 1 });
    
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

// Tạo kích thước mới
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
    const newSize = new Size({ size });
    
    await newSize.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tạo kích thước thành công',
      data: newSize
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo kích thước',
      error: error.message
    });
  }
};

// Cập nhật kích thước
export const updateSize = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, status } = req.body;
    
    // Tìm kích thước cần cập nhật
    const sizeObj = await Size.findById(id);
    
    if (!sizeObj) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kích thước'
      });
    }
    
    // Kiểm tra nếu đổi kích thước thì cần kiểm tra kích thước mới đã tồn tại chưa
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
    
    // Cập nhật trạng thái nếu có
    if (status) {
      sizeObj.status = status;
    }
    
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

// =================== Sole Controller ===================

// Lấy danh sách tất cả đế giày
export const getAllSoles = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Xây dựng query filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const soles = await Sole.find(filter).sort({ name: 1 });
    
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

// Tạo đế giày mới
export const createSole = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Kiểm tra tên đế giày đã tồn tại chưa
    const existingSole = await Sole.findOne({ name });
    
    if (existingSole) {
      return res.status(400).json({
        success: false,
        message: 'Tên đế giày đã tồn tại'
      });
    }
    
    // Tạo đế giày mới
    const newSole = new Sole({ name });
    
    await newSole.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tạo đế giày thành công',
      data: newSole
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đế giày',
      error: error.message
    });
  }
};

// Cập nhật đế giày
export const updateSole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    
    // Tìm đế giày cần cập nhật
    const sole = await Sole.findById(id);
    
    if (!sole) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đế giày'
      });
    }
    
    // Kiểm tra nếu đổi tên thì cần kiểm tra tên mới đã tồn tại chưa
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
    
    // Cập nhật trạng thái nếu có
    if (status) {
      sole.status = status;
    }
    
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