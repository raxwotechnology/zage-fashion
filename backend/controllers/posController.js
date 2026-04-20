const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Store = require('../models/Store');
const { isValidSLPhone, formatSLPhone, isStrictSLE164Phone, isValidEmail } = require('../utils/validators');
const { sendSms, buildPosReceiptMessage } = require('../utils/smsService');
const { sendEmail, posReceiptEmail } = require('../utils/emailService');

// Helper: resolve store ID for the current user (cashier, manager, or admin)
const resolveStoreId = async (user) => {
  // Cashier / stockEmployee — use assignedStore
  if (user.assignedStore) return user.assignedStore;

  // Manager — find store they manage
  if (user.role === 'manager') {
    const store = await Store.findOne({ managerId: user._id });
    return store?._id || null;
  }

  // Admin — use first store (they can access any)
  if (user.role === 'admin') {
    const store = await Store.findOne({ isActive: true });
    return store?._id || null;
  }

  return null;
};

// @desc    Get products for POS
// @route   GET /api/pos/products
// @access  Private/Cashier/Manager/Admin
const getPosProducts = async (req, res, next) => {
  try {
    const storeId = await resolveStoreId(req.user);
    if (!storeId) {
      res.status(400);
      return next(new Error('No store found for your account'));
    }

    const { search, category } = req.query;
    const filter = {
      storeId,
      status: 'active',
    };

    if (category) {
      filter.categoryId = category;
    }

    let products;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: search },
        { sku: { $regex: search, $options: 'i' } },
      ];
      products = await Product.find(filter)
        .select('name price mrp stock images unit barcode sku variants discount allowKokoPos')
        .limit(50)
        .lean();
    } else {
      products = await Product.find(filter)
        .select('name price mrp stock images unit barcode sku variants discount allowKokoPos')
        .limit(100)
        .lean();
    }

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Look up a product by barcode
// @route   GET /api/pos/products/barcode/:code
// @access  Private/Cashier/Manager/Admin
const getProductByBarcode = async (req, res, next) => {
  try {
    const storeId = await resolveStoreId(req.user);
    if (!storeId) {
      res.status(400);
      return next(new Error('No store found for your account'));
    }

    const product = await Product.findOne({
      barcode: req.params.code,
      storeId,
      status: 'active',
    })
      .select('name price mrp stock images unit barcode sku variants discount allowKokoPos')
      .lean();

    if (!product) {
      res.status(404);
      return next(new Error('Product not found with this barcode'));
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Process POS checkout
// @route   POST /api/pos/checkout
// @access  Private/Cashier
const posCheckout = async (req, res, next) => {
  try {
    const {
      items,
      paymentMethod,
      tenderedAmount,
      discount,
      discountType,
      couponCode,
      customerName,
      customerPhone,
      sendSmsReceipt = false,
      sendReceiptEmail = false,
      receiptEmail,
      printReceipt = true,
    } = req.body;
    let normalizedCustomerPhone = customerPhone ? formatSLPhone(customerPhone) : undefined;
    if (customerPhone && !isValidSLPhone(customerPhone)) {
      res.status(400);
      return next(new Error('Customer phone must be a valid Sri Lankan mobile number.'));
    }
    if (sendSmsReceipt && !normalizedCustomerPhone) {
      res.status(400);
      return next(new Error('Customer phone is required when SMS receipt is enabled.'));
    }
    if (sendSmsReceipt && !isStrictSLE164Phone(normalizedCustomerPhone)) {
      res.status(400);
      return next(new Error('Customer phone must be in +947XXXXXXXX format for SMS receipts.'));
    }
    if (sendReceiptEmail && receiptEmail && !isValidEmail(receiptEmail)) {
      res.status(400);
      return next(new Error('Please enter a valid email address for receipt delivery.'));
    }


    if (!items || items.length === 0) {
      res.status(400);
      return next(new Error('No items in cart'));
    }

    const storeId = await resolveStoreId(req.user);
    if (!storeId) {
      res.status(400);
      return next(new Error('No store found for your account'));
    }

    const store = await Store.findById(storeId);
    if (!store) {
      res.status(404);
      return next(new Error('Store not found'));
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        res.status(404);
        return next(new Error(`Product not found: ${item.name || item.productId}`));
      }
      if (product.stock < item.quantity) {
        res.status(400);
        return next(
          new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`)
        );
      }
      if (paymentMethod === 'koko' && product.allowKokoPos === false) {
        res.status(400);
        return next(new Error(`${product.name} is not eligible for Koko Pay in POS.`));
      }

      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || '',
        quantity: item.quantity,
        price: item.price,
      });
    }

    // Calculate manual discount
    let discountAmount = 0;
    if (discount && discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }

    // Apply coupon/voucher discount
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      try {
        const Voucher = require('../models/Voucher');
        const voucher = await Voucher.findOne({
          code: couponCode.toUpperCase(),
          isActive: true,
        });
        if (voucher) {
          if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
            // Expired — skip silently
          } else if (voucher.usedCount >= voucher.maxUses) {
            // Max uses reached — skip silently
          } else if (voucher.minOrderAmount && subtotal < voucher.minOrderAmount) {
            // Min order not met — skip silently
          } else {
            if (voucher.type === 'percentage') {
              couponDiscount = (subtotal * voucher.value) / 100;
              if (voucher.maxDiscountAmount) {
                couponDiscount = Math.min(couponDiscount, voucher.maxDiscountAmount);
              }
            } else {
              couponDiscount = Math.min(voucher.value, subtotal);
            }
            // Increment usage
            voucher.usedCount = (voucher.usedCount || 0) + 1;
            await voucher.save();
            appliedCoupon = voucher.code;
          }
        }
      } catch (err) {
        // Voucher model may not exist — skip coupon
      }
    }

    const totalDiscount = discountAmount + couponDiscount;

    // Dynamic tax from settings
    let taxRate = 0.05; // default 5%
    try {
      const Settings = require('../models/Settings');
      const settings = await Settings.findOne();
      if (settings?.taxRate !== undefined) taxRate = settings.taxRate;
    } catch (err) { /* use default */ }

    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const tax = parseFloat((taxableAmount * taxRate).toFixed(2));
    const totalAmount = parseFloat((taxableAmount + tax).toFixed(2));

    // Change calculation for cash
    let changeGiven = 0;
    if (paymentMethod === 'cash' && tenderedAmount) {
      changeGiven = parseFloat((tenderedAmount - totalAmount).toFixed(2));
      if (changeGiven < 0) {
        res.status(400);
        return next(new Error('Tendered amount is less than total'));
      }
    }

    // Create the POS order
    const order = await Order.create({
      userId: req.user._id,
      storeId,
      items: validatedItems,
      totalAmount,
      tax,
      deliveryFee: 0,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'completed',
      orderStatus: 'completed',
      isPosOrder: true,
      cashierId: req.user._id,
      tenderedAmount: tenderedAmount || totalAmount,
      changeGiven,
      customerName: customerName || undefined,
      customerPhone: normalizedCustomerPhone || undefined,
      couponCode: appliedCoupon || undefined,
      sendReceiptEmail: !!sendReceiptEmail,
      receiptEmail: receiptEmail || undefined,
      sendSmsReceipt: !!sendSmsReceipt,
      printReceipt: !!printReceipt,
    });

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // Return full order with store info for invoice
    const populatedOrder = await Order.findById(order._id)
      .populate('storeId', 'name address phone email logo')
      .populate('cashierId', 'name')
      .lean();

    // Add extra invoice data
    populatedOrder.subtotal = subtotal;
    populatedOrder.discountAmount = discountAmount;
    populatedOrder.discountType = discountType || null;
    populatedOrder.discountValue = discount || 0;
    populatedOrder.couponCode = appliedCoupon;
    populatedOrder.couponDiscount = couponDiscount;
    populatedOrder.sendReceiptEmail = !!sendReceiptEmail;
    populatedOrder.receiptEmail = receiptEmail || undefined;
    populatedOrder.sendSmsReceipt = !!sendSmsReceipt;
    populatedOrder.printReceipt = !!printReceipt;

    if (sendSmsReceipt && normalizedCustomerPhone) {
      try {
        await sendSms(normalizedCustomerPhone, buildPosReceiptMessage(totalAmount));
      } catch (smsErr) {
        populatedOrder.smsReceiptError = smsErr.message;
      }
    }

    if (sendReceiptEmail) {
      try {
        const cashier = await User.findById(req.user._id).select('name email phone').lean();
        const targetEmail = receiptEmail || cashier?.email;
        if (targetEmail) {
          const template = posReceiptEmail(populatedOrder, {
            name: customerName || 'Walk-in Customer',
            email: targetEmail,
            phone: normalizedCustomerPhone || '',
          });
          const sent = await sendEmail(targetEmail, template.subject, template.html);
          if (sent) {
            await Order.findByIdAndUpdate(order._id, { receiptEmailSentAt: new Date(), receiptEmailError: undefined });
          } else {
            await Order.findByIdAndUpdate(order._id, { receiptEmailError: 'Email service failed to deliver receipt' });
            populatedOrder.receiptEmailError = 'Email service failed to deliver receipt';
          }
        }
      } catch (emailErr) {
        populatedOrder.receiptEmailError = emailErr.message;
      }
    }

    res.status(201).json(populatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Get POS orders for today's shift
// @route   GET /api/pos/orders
// @access  Private/Cashier
const getPosOrders = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      cashierId: req.user._id,
      isPosOrder: true,
      createdAt: { $gte: today },
    })
      .sort({ createdAt: -1 })
      .populate('storeId', 'name')
      .lean();

    // Calculate shift summary
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const cashSales = orders
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const cardSales = orders
      .filter((o) => o.paymentMethod === 'card')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const kokoSales = orders
      .filter((o) => o.paymentMethod === 'koko')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      orders,
      summary: {
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalOrders,
        cashSales: parseFloat(cashSales.toFixed(2)),
        cardSales: parseFloat(cardSales.toFixed(2)),
        kokoSales: parseFloat(kokoSales.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single POS order (invoice)
// @route   GET /api/pos/orders/:id
// @access  Private/Cashier
const getPosOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('storeId', 'name address phone email logo')
      .populate('cashierId', 'name')
      .lean();

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    if (!order.isPosOrder) {
      res.status(400);
      return next(new Error('This is not a POS order'));
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosProducts,
  getProductByBarcode,
  posCheckout,
  getPosOrders,
  getPosOrderById,
};
