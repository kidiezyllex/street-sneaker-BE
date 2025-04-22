import Bill from '../models/bill.model.js';
import Product from '../models/product.model.js';
import Account from '../models/account.model.js';
import Voucher from '../models/voucher.model.js';

/**
 * Lấy danh sách tất cả đơn hàng có phân trang và filter
 * @route GET /api/bills
 * @access Private (Admin, Staff)
 */
export const getAllBills = async (req, res) => {
  try {
    let { page = 1, limit = 10, sort = '-createdAt', code, fullName, phoneNumber, status, type, fromDate, toDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Xây dựng query
    const query = {};
    if (code) query.code = { $regex: code, $options: 'i' };
    if (fullName) query.fullName = { $regex: fullName, $options: 'i' };
    if (phoneNumber) query.phoneNumber = { $regex: phoneNumber, $options: 'i' };
    if (status) query.status = status;
    if (type) query.type = type;

    // Filter theo khoảng thời gian
    if (fromDate && toDate) {
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    } else if (fromDate) {
      query.createdAt = { $gte: new Date(fromDate) };
    } else if (toDate) {
      query.createdAt = { $lte: new Date(toDate) };
    }

    // Thực hiện truy vấn
    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .populate('customer', 'fullName email phoneNumber')
      .populate('voucher', 'code name value typeValue')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        bills,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

/**
 * Tìm kiếm đơn hàng (alias cho getAllBills nhưng có thể mở rộng sau này)
 * @route GET /api/bills/search
 * @access Private (Admin, Staff)
 */
export const searchBill = getAllBills;

/**
 * Lấy chi tiết đơn hàng
 * @route GET /api/bills/:id
 * @access Private
 */
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'fullName email phoneNumber')
      .populate('voucher', 'code name value typeValue')
      .populate({
        path: 'billDetails.productDetail',
        populate: {
          path: 'variants.brand variants.sole variants.material variants.category variants.size variants.color',
          select: 'name code'
        }
      })
      .populate('billHistory.account', 'fullName email')
      .populate('billHistory.receptionStaff', 'fullName email')
      .populate('transactions.account', 'fullName email');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra quyền truy cập nếu không phải admin/staff
    if (req.user.role === 'CUSTOMER' && (!bill.customer || bill.customer._id.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng này'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn hàng thành công',
      data: bill
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy chi tiết đơn hàng',
      error: error.message
    });
  }
};

/**
 * Tạo đơn hàng mới (POS)
 * @route POST /api/bills
 * @access Private (Admin, Staff)
 */
export const createBill = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      email,
      address,
      totalMoney,
      moneyReduced,
      moneyAfter,
      type,
      note,
      desiredReceiptDate,
      receivingMethod,
      customerId,
      voucherId,
      billDetails,
      transactions
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!fullName || !phoneNumber || !totalMoney || !moneyAfter || !type || !billDetails || billDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin đơn hàng'
      });
    }

    // Kiểm tra khách hàng nếu có
    let customer = null;
    if (customerId) {
      customer = await Account.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khách hàng'
        });
      }
    }

    // Kiểm tra voucher nếu có
    let voucher = null;
    if (voucherId) {
      voucher = await Voucher.findById(voucherId);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy voucher'
        });
      }

      // Kiểm tra trạng thái voucher
      if (voucher.status !== 'SU_DUNG') {
        return res.status(400).json({
          success: false,
          message: 'Voucher không khả dụng'
        });
      }

      // Kiểm tra thời gian hiệu lực
      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Voucher không trong thời gian hiệu lực'
        });
      }

      // Kiểm tra số tiền tối thiểu
      if (totalMoney < voucher.minimumAmount) {
        return res.status(400).json({
          success: false,
          message: `Giá trị đơn hàng cần tối thiểu ${voucher.minimumAmount.toLocaleString('vi-VN')} đ để sử dụng voucher này`
        });
      }
    }

    // Xử lý chi tiết đơn hàng và kiểm tra sản phẩm
    const processedBillDetails = [];
    for (const detail of billDetails) {
      const { productDetailId, quantity, price } = detail;

      // Kiểm tra số lượng sản phẩm có đủ không
      const product = await Product.findOne({
        'variants._id': productDetailId,
        'variants.status': 'HOAT_DONG'
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm'
        });
      }

      const variant = product.variants.find(v => v._id.toString() === productDetailId);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy biến thể sản phẩm'
        });
      }

      if (variant.amount < quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${product.name} (${variant.color.name}, size ${variant.size.size}) chỉ còn ${variant.amount} sản phẩm`
        });
      }

      // Thêm vào chi tiết đơn hàng
      processedBillDetails.push({
        quantity,
        price,
        status: 'CHO_XAC_NHAN',
        productDetail: productDetailId
      });

      // Cập nhật số lượng sản phẩm
      variant.amount -= quantity;
      await product.save();
    }

    // Xử lý giao dịch
    const processedTransactions = [];
    if (transactions && transactions.length > 0) {
      for (const transaction of transactions) {
        processedTransactions.push({
          ...transaction,
          account: req.user.id
        });
      }
    }

    // Tạo đơn hàng mới
    const newBill = new Bill({
      fullName,
      phoneNumber,
      email,
      address,
      totalMoney,
      moneyReduced: moneyReduced || 0,
      moneyAfter,
      type,
      note,
      desiredReceiptDate,
      receivingMethod: receivingMethod || 0,
      status: transactions && transactions.length > 0 ? 'DA_THANH_TOAN' : 'CHO_XAC_NHAN',
      customer: customerId || null,
      voucher: voucherId || null,
      billDetails: processedBillDetails,
      transactions: processedTransactions
    });

    // Thêm lịch sử đơn hàng
    newBill.billHistory.push({
      statusBill: transactions && transactions.length > 0 ? 'DA_THANH_TOAN' : 'CHO_XAC_NHAN',
      note: 'Tạo đơn hàng mới',
      account: req.user.id
    });

    await newBill.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: newBill
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn hàng',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái đơn hàng
 * @route PUT /api/bills/:id/status
 * @access Private (Admin, Staff)
 */
export const updateBillStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatus = ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_VAN_CHUYEN', 'DA_GIAO', 'DA_THANH_TOAN', 'DA_HUY'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái đơn hàng không hợp lệ'
      });
    }

    // Cập nhật trạng thái
    bill.status = status;
    
    // Thêm vào lịch sử đơn hàng
    bill.billHistory.push({
      statusBill: status,
      note: note || `Cập nhật trạng thái đơn hàng thành ${status}`,
      account: req.user.id
    });

    // Cập nhật các ngày tương ứng với trạng thái
    if (status === 'DA_XAC_NHAN') {
      bill.confirmationDate = new Date();
    } else if (status === 'DANG_VAN_CHUYEN') {
      bill.shipDate = new Date();
    } else if (status === 'DA_GIAO') {
      bill.receiveDate = new Date();
    } else if (status === 'DA_THANH_TOAN') {
      bill.completeDate = new Date();
    }

    await bill.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: bill
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng',
      error: error.message
    });
  }
};

/**
 * Thêm giao dịch thanh toán cho đơn hàng
 * @route POST /api/bills/:id/transactions
 * @access Private (Admin, Staff)
 */
export const addTransaction = async (req, res) => {
  try {
    const { type, totalMoney, paymentMethod, note, transactionCode } = req.body;
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra thông tin giao dịch
    if (!type || !totalMoney || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin giao dịch'
      });
    }

    // Thêm giao dịch mới
    bill.transactions.push({
      type,
      totalMoney,
      paymentMethod,
      note,
      transactionCode,
      status: 'HOAT_DONG',
      account: req.user.id
    });

    // Nếu đã thanh toán đủ, cập nhật trạng thái đơn hàng
    const totalPaid = bill.transactions.reduce((sum, t) => sum + (t.type === 'THANH_TOAN' ? t.totalMoney : -t.totalMoney), 0);
    if (totalPaid >= bill.moneyAfter && bill.status !== 'DA_THANH_TOAN') {
      bill.status = 'DA_THANH_TOAN';
      bill.completeDate = new Date();
      
      // Thêm vào lịch sử đơn hàng
      bill.billHistory.push({
        statusBill: 'DA_THANH_TOAN',
        note: 'Thanh toán hoàn tất',
        account: req.user.id
      });
    }

    await bill.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm giao dịch thanh toán thành công',
      data: bill
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm giao dịch thanh toán',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin đơn hàng
 * @route PUT /api/bills/:id
 * @access Private (Admin, Staff)
 */
export const updateBill = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      email,
      address,
      note,
      desiredReceiptDate,
      receivingMethod
    } = req.body;

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Chỉ cho phép cập nhật đơn hàng chưa xác nhận
    if (bill.status !== 'CHO_XAC_NHAN') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật đơn hàng chưa xác nhận'
      });
    }

    // Cập nhật thông tin đơn hàng
    if (fullName) bill.fullName = fullName;
    if (phoneNumber) bill.phoneNumber = phoneNumber;
    if (email) bill.email = email;
    if (address) bill.address = address;
    if (note) bill.note = note;
    if (desiredReceiptDate) bill.desiredReceiptDate = desiredReceiptDate;
    if (receivingMethod !== undefined) bill.receivingMethod = receivingMethod;

    await bill.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin đơn hàng thành công',
      data: bill
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin đơn hàng',
      error: error.message
    });
  }
};

/**
 * Thêm sản phẩm vào đơn hàng
 * @route POST /api/bills/:id/details
 * @access Private (Admin, Staff)
 */
export const addBillDetail = async (req, res) => {
  try {
    const { productDetailId, quantity, price } = req.body;
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Chỉ cho phép thêm sản phẩm vào đơn hàng chưa xác nhận
    if (bill.status !== 'CHO_XAC_NHAN') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể thêm sản phẩm vào đơn hàng chưa xác nhận'
      });
    }

    // Kiểm tra số lượng sản phẩm có đủ không
    const product = await Product.findOne({
      'variants._id': productDetailId,
      'variants.status': 'HOAT_DONG'
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    const variant = product.variants.find(v => v._id.toString() === productDetailId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    if (variant.amount < quantity) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm ${product.name} (${variant.color.name}, size ${variant.size.size}) chỉ còn ${variant.amount} sản phẩm`
      });
    }

    // Kiểm tra xem sản phẩm đã có trong đơn hàng chưa
    const existingDetailIndex = bill.billDetails.findIndex(
      detail => detail.productDetail.toString() === productDetailId
    );

    if (existingDetailIndex !== -1) {
      // Cập nhật số lượng sản phẩm đã có
      const _oldQuantity = bill.billDetails[existingDetailIndex].quantity;
      bill.billDetails[existingDetailIndex].quantity += quantity;
      bill.billDetails[existingDetailIndex].price = price;

      // Cập nhật số lượng sản phẩm trong kho
      variant.amount -= quantity;
      await product.save();

      // Cập nhật tổng tiền đơn hàng
      bill.totalMoney += price * quantity;
      bill.moneyAfter = bill.totalMoney - bill.moneyReduced;
    } else {
      // Thêm sản phẩm mới vào đơn hàng
      bill.billDetails.push({
        quantity,
        price,
        status: 'CHO_XAC_NHAN',
        productDetail: productDetailId
      });

      // Cập nhật số lượng sản phẩm trong kho
      variant.amount -= quantity;
      await product.save();

      // Cập nhật tổng tiền đơn hàng
      bill.totalMoney += price * quantity;
      bill.moneyAfter = bill.totalMoney - bill.moneyReduced;
    }

    await bill.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm vào đơn hàng thành công',
      data: bill
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm sản phẩm vào đơn hàng',
      error: error.message
    });
  }
};

/**
 * Cập nhật sản phẩm trong đơn hàng
 * @route PUT /api/bills/:id/details/:detailId
 * @access Private (Admin, Staff)
 */
export const updateBillDetail = async (req, res) => {
  try {
    const { quantity, price, note } = req.body;
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Chỉ cho phép cập nhật sản phẩm trong đơn hàng chưa xác nhận
    if (bill.status !== 'CHO_XAC_NHAN') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật sản phẩm trong đơn hàng chưa xác nhận'
      });
    }

    // Tìm chi tiết đơn hàng
    const detailIndex = bill.billDetails.findIndex(
      detail => detail._id.toString() === req.params.detailId
    );

    if (detailIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong đơn hàng'
      });
    }

    const detail = bill.billDetails[detailIndex];

    if (quantity !== undefined && quantity !== detail.quantity) {
      // Kiểm tra số lượng sản phẩm có đủ không
      const product = await Product.findOne({
        'variants._id': detail.productDetail
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm'
        });
      }

      const variant = product.variants.find(v => v._id.toString() === detail.productDetail.toString());
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy biến thể sản phẩm'
        });
      }

      const quantityDiff = quantity - detail.quantity;
      if (quantityDiff > 0 && variant.amount < quantityDiff) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${product.name} không đủ số lượng, chỉ còn ${variant.amount} sản phẩm`
        });
      }

      // Cập nhật số lượng sản phẩm trong kho
      variant.amount -= quantityDiff;
      await product.save();

      // Cập nhật tổng tiền đơn hàng
      bill.totalMoney += detail.price * quantityDiff;
      bill.moneyAfter = bill.totalMoney - bill.moneyReduced;

      // Cập nhật số lượng sản phẩm trong đơn hàng
      detail.quantity = quantity;
    }

    if (price !== undefined && price !== detail.price) {
      // Cập nhật tổng tiền đơn hàng
      bill.totalMoney = bill.totalMoney - (detail.price * detail.quantity) + (price * detail.quantity);
      bill.moneyAfter = bill.totalMoney - bill.moneyReduced;

      // Cập nhật giá sản phẩm
      detail.price = price;
    }

    if (note !== undefined) {
      detail.note = note;
    }

    await bill.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm trong đơn hàng thành công',
      data: bill
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật sản phẩm trong đơn hàng',
      error: error.message
    });
  }
};

/**
 * Xóa sản phẩm khỏi đơn hàng
 * @route DELETE /api/bills/:id/details/:detailId
 * @access Private (Admin, Staff)
 */
export const deleteBillDetail = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Chỉ cho phép xóa sản phẩm khỏi đơn hàng chưa xác nhận
    if (bill.status !== 'CHO_XAC_NHAN') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xóa sản phẩm khỏi đơn hàng chưa xác nhận'
      });
    }

    // Tìm chi tiết đơn hàng
    const detailIndex = bill.billDetails.findIndex(
      detail => detail._id.toString() === req.params.detailId
    );

    if (detailIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong đơn hàng'
      });
    }

    const detail = bill.billDetails[detailIndex];

    // Khôi phục số lượng sản phẩm trong kho
    const product = await Product.findOne({
      'variants._id': detail.productDetail
    });

    if (product) {
      const variant = product.variants.find(v => v._id.toString() === detail.productDetail.toString());
      if (variant) {
        variant.amount += detail.quantity;
        await product.save();
      }
    }

    // Cập nhật tổng tiền đơn hàng
    bill.totalMoney -= detail.price * detail.quantity;
    bill.moneyAfter = bill.totalMoney - bill.moneyReduced;

    // Xóa sản phẩm khỏi đơn hàng
    bill.billDetails.splice(detailIndex, 1);

    await bill.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm khỏi đơn hàng thành công',
      data: bill
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa sản phẩm khỏi đơn hàng',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đơn hàng của khách hàng
 * @route GET /api/bills/customer
 * @access Private
 */
export const getCustomerBills = async (req, res) => {
  try {
    let { page = 1, limit = 10, sort = '-createdAt', status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Xây dựng query
    const query = {
      customer: req.user.id
    };

    if (status) query.status = status;

    // Thực hiện truy vấn
    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        bills,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

/**
 * Xử lý trả hàng
 * @route POST /api/bills/:id/return
 * @access Private (Admin, Staff)
 */
export const processBillReturn = async (req, res) => {
  try {
    const { items, note } = req.body;
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Chỉ cho phép trả hàng cho đơn hàng đã thanh toán
    if (bill.status !== 'DA_THANH_TOAN') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể trả hàng cho đơn hàng đã thanh toán'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách sản phẩm cần trả'
      });
    }

    let totalRefund = 0;

    // Xử lý từng sản phẩm trả hàng
    for (const item of items) {
      const { detailId, quantity, reason } = item;

      if (!detailId || !quantity || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm cần trả'
        });
      }

      // Tìm chi tiết đơn hàng
      const detailIndex = bill.billDetails.findIndex(
        detail => detail._id.toString() === detailId
      );

      if (detailIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm trong đơn hàng'
        });
      }

      const detail = bill.billDetails[detailIndex];

      // Kiểm tra số lượng trả hàng
      if (quantity > detail.quantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng trả hàng không được vượt quá số lượng đã mua (${detail.quantity})`
        });
      }

      // Cập nhật số lượng sản phẩm trong kho
      const product = await Product.findOne({
        'variants._id': detail.productDetail
      });

      if (product) {
        const variant = product.variants.find(v => v._id.toString() === detail.productDetail.toString());
        if (variant) {
          variant.amount += quantity;
          variant.quantityReturn += quantity;
          await product.save();
        }
      }

      // Tính tiền hoàn trả
      const refundAmount = detail.price * quantity;
      totalRefund += refundAmount;

      // Cập nhật chi tiết đơn hàng
      detail.quantity -= quantity;
      detail.note = detail.note ? `${detail.note}; Trả hàng: ${quantity} sản phẩm - ${reason}` : `Trả hàng: ${quantity} sản phẩm - ${reason}`;
    }

    // Cập nhật tổng tiền đơn hàng
    bill.totalMoney -= totalRefund;
    bill.moneyAfter -= totalRefund;

    // Thêm giao dịch hoàn tiền
    bill.transactions.push({
      type: 'HOAN_TIEN',
      totalMoney: totalRefund,
      paymentMethod: 'TIEN_MAT', // Hoặc lấy từ request
      note: note || 'Hoàn tiền trả hàng',
      status: 'HOAT_DONG',
      account: req.user.id
    });

    // Thêm vào lịch sử đơn hàng
    bill.billHistory.push({
      statusBill: 'DA_THANH_TOAN',
      note: note || 'Xử lý trả hàng và hoàn tiền',
      account: req.user.id
    });

    await bill.save();

    return res.status(200).json({
      success: true,
      message: 'Xử lý trả hàng thành công',
      data: {
        bill,
        totalRefund
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý trả hàng',
      error: error.message
    });
  }
};

/**
 * Xóa đơn hàng
 * @route DELETE /api/bills/:id
 * @access Private (Admin, Staff)
 */
export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Kiểm tra trạng thái - chỉ cho phép xóa đơn hàng ở trạng thái mới
    if (bill.status !== 'CHO_XAC_NHAN') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa đơn hàng đã được xử lý hoặc hoàn thành'
      });
    }
    
    // Thực hiện xóa
    await Bill.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Xóa đơn hàng thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa đơn hàng',
      error: error.message
    });
  }
}; 