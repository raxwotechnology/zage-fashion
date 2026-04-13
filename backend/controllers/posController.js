const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Store = require('../models/Store');

// @desc    Get products for cashier's assigned store
// @route   GET /api/pos/products
// @access  Private/Cashier
const getPosProducts = async (req, res, next) => {
  try {
    const cashier = await User.findById(req.user._id);
    if (!cashier || !cashier.assignedStore) {
      res.status(400);
      return next(new Error('No store assigned to this cashier'));
    }

    const { search, category } = req.query;
    const filter = {
      storeId: cashier.assignedStore,
      status: 'active',
    };

    if (category) {
      filter.categoryId = category;
    }

    let products;
    if (search) {
      // Search by name, barcode, or sku
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: search },
        { sku: { $regex: search, $options: 'i' } },
      ];
      products = await Product.find(filter)
        .select('name price mrp stock images unit barcode sku variants discount')
        .limit(50)
        .lean();
    } else {
      products = await Product.find(filter)
        .select('name price mrp stock images unit barcode sku variants discount')
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
// @access  Private/Cashier
const getProductByBarcode = async (req, res, next) => {
  try {
    const cashier = await User.findById(req.user._id);
    if (!cashier || !cashier.assignedStore) {
      res.status(400);
      return next(new Error('No store assigned to this cashier'));
    }

    const product = await Product.findOne({
      barcode: req.params.code,
      storeId: cashier.assignedStore,
      status: 'active',
    })
      .select('name price mrp stock images unit barcode sku variants discount')
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
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400);
      return next(new Error('No items in cart'));
    }

    const cashier = await User.findById(req.user._id);
    if (!cashier || !cashier.assignedStore) {
      res.status(400);
      return next(new Error('No store assigned to this cashier'));
    }

    const store = await Store.findById(cashier.assignedStore);
    if (!store) {
      res.status(404);
      return next(new Error('Assigned store not found'));
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

    // Calculate discount
    let discountAmount = 0;
    if (discount && discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }

    // Tax (5%)
    const taxableAmount = subtotal - discountAmount;
    const tax = parseFloat((taxableAmount * 0.05).toFixed(2));
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
      userId: cashier._id,
      storeId: cashier.assignedStore,
      items: validatedItems,
      totalAmount,
      tax,
      deliveryFee: 0,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'completed',
      orderStatus: 'completed',
      isPosOrder: true,
      cashierId: cashier._id,
      tenderedAmount: tenderedAmount || totalAmount,
      changeGiven,
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

    res.json({
      orders,
      summary: {
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalOrders,
        cashSales: parseFloat(cashSales.toFixed(2)),
        cardSales: parseFloat(cardSales.toFixed(2)),
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
