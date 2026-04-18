const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const crypto = require('crypto');
const { sendEmail, paymentReceiptEmail, orderConfirmationEmail } = require('../utils/emailService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      deliveryAddress,
      deliverySlot,
      paymentMethod,
      deliveryFee,
      tax,
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400);
      return next(new Error('No order items'));
    }

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.price * item.quantity;
    }
    totalAmount += (deliveryFee || 0) + (tax || 0);

    // Group items by store
    const storeId = items[0].storeId || null;

    const order = await Order.create({
      userId: req.user._id,
      storeId,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
      })),
      deliveryAddress,
      deliverySlot,
      totalAmount,
      deliveryFee: deliveryFee || 0,
      tax: tax || 0,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: 'pending',
    });

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user cart
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { items: [] }
    );

    // Send order confirmation & receipt email
    try {
      const customer = await User.findById(req.user._id);
      if (customer?.email) {
        const receipt = paymentReceiptEmail(order, customer.name);
        await sendEmail(customer.email, receipt.subject, receipt.html);
      }
    } catch (emailErr) {
      console.error('[Email] Receipt send failed:', emailErr.message);
    }

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('storeId', 'name logo');

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('storeId', 'name logo phone')
      .populate('userId', 'name email');

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    // Verify ownership
    if (
      order.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/StoreOwner/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    order.orderStatus = req.body.orderStatus || order.orderStatus;
    order.paymentStatus = req.body.paymentStatus || order.paymentStatus;

    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate PayHere hash for payment
// @route   POST /api/orders/:id/payhere-hash
// @access  Private
const generatePayHereHash = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    const orderId = order._id.toString();
    const amount = order.totalAmount.toFixed(2);
    const currency = 'LKR';

    // PayHere hash generation: md5(merchantId + orderId + amountFormatted + currency + md5(merchantSecret))
    const secretHash = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    const hash = crypto
      .createHash('md5')
      .update(merchantId + orderId + amount + currency + secretHash)
      .digest('hex')
      .toUpperCase();

    res.json({
      merchant_id: merchantId,
      order_id: orderId,
      amount,
      currency,
      hash,
      sandbox: process.env.PAYHERE_SANDBOX === 'true',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    PayHere IPN notification handler
// @route   POST /api/orders/payhere-notify
// @access  Public (called by PayHere)
const payHereNotify = async (req, res, next) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    } = req.body;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const secretHash = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    const localSig = crypto
      .createHash('md5')
      .update(
        merchant_id +
          order_id +
          payhere_amount +
          payhere_currency +
          status_code +
          secretHash
      )
      .digest('hex')
      .toUpperCase();

    if (localSig !== md5sig) {
      console.error('PayHere IPN signature mismatch');
      return res.status(400).send('Signature mismatch');
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    // status_code: 2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargeback
    if (status_code === '2') {
      order.paymentStatus = 'completed';
      order.orderStatus = 'confirmed';

      // Send payment receipt email
      try {
        const customer = await User.findById(order.userId);
        if (customer?.email) {
          const receipt = paymentReceiptEmail(order, customer.name);
          await sendEmail(customer.email, receipt.subject, receipt.html);
        }
      } catch (emailErr) {
        console.error('[Email] PayHere receipt failed:', emailErr.message);
      }
    } else if (status_code === '0') {
      order.paymentStatus = 'pending';
    } else {
      order.paymentStatus = 'failed';
    }

    await order.save();
    res.status(200).send('OK');
  } catch (error) {
    console.error('PayHere IPN Error:', error);
    res.status(500).send('Server Error');
  }
};

// @desc    Get orders for a store owner's store
// @route   GET /api/orders/store
// @access  Private/StoreOwner
const getStoreOrders = async (req, res, next) => {
  try {
    const Store = require('../models/Store');
    const store = await Store.findOne({ managerId: req.user._id });
    if (!store) {
      res.status(404);
      return next(new Error('No store found for this user'));
    }
    const orders = await Order.find({ storeId: store._id })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  generatePayHereHash,
  payHereNotify,
  getStoreOrders,
};
