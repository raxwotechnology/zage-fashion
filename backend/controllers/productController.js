const Product = require('../models/Product');

// @desc    Get all products (with filtering, sorting, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { status: 'active' };

    if (req.query.category) filter.categoryId = req.query.category;
    if (req.query.store) filter.storeId = req.query.store;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.onSale === 'true') filter.isOnSale = true;

    // Price range
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Rating filter
    if (req.query.rating) {
      filter.averageRating = { $gte: Number(req.query.rating) };
    }

    // Build sort
    let sort = {};
    switch (req.query.sort) {
      case 'price_low':
        sort = { price: 1 };
        break;
      case 'price_high':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { averageRating: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'popular':
        sort = { totalReviews: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('categoryId', 'name slug')
      .populate('storeId', 'name slug logo')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res, next) => {
  try {
    const keyword = req.query.q;
    if (!keyword) {
      return res.json({ products: [] });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ],
      status: 'active',
    })
      .populate('categoryId', 'name slug')
      .populate('storeId', 'name slug logo')
      .limit(20);

    res.json({ products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true, status: 'active' })
      .populate('categoryId', 'name slug')
      .populate('storeId', 'name slug logo')
      .limit(12);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get deals / on-sale products
// @route   GET /api/products/deals
// @access  Public
const getDeals = async (req, res, next) => {
  try {
    const products = await Product.find({ isOnSale: true, status: 'active' })
      .populate('categoryId', 'name slug')
      .populate('storeId', 'name slug logo')
      .sort({ discount: -1 })
      .limit(12);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name slug')
      .populate('storeId', 'name slug logo city phone email');

    if (product) {
      res.json(product);
    } else {
      res.status(404);
      next(new Error('Product not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/StoreOwner
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      categoryId,
      subCategory,
      description,
      price,
      mrp,
      discount,
      unit,
      variants,
      stock,
      images,
      isFeatured,
      isOnSale,
    } = req.body;

    const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    const product = await Product.create({
      storeId: req.body.storeId,
      name,
      slug,
      categoryId,
      subCategory,
      description,
      price,
      mrp,
      discount: discount || Math.round(((mrp - price) / mrp) * 100),
      unit,
      variants: variants || [],
      stock,
      images: images || [],
      isFeatured: isFeatured || false,
      isOnSale: isOnSale || false,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/StoreOwner
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    const fields = [
      'name', 'categoryId', 'subCategory', 'description', 'price',
      'mrp', 'discount', 'unit', 'variants', 'stock', 'images',
      'isFeatured', 'isOnSale', 'status',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.name) {
      product.slug = req.body.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/StoreOwner/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products for a store owner's store (including inactive)
// @route   GET /api/products/my-store
// @access  Private/StoreOwner
const getMyProducts = async (req, res, next) => {
  try {
    const Store = require('../models/Store');
    const store = await Store.findOne({ managerId: req.user._id });
    if (!store) {
      res.status(404);
      return next(new Error('No store found for this user'));
    }
    const products = await Product.find({ storeId: store._id })
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });
    res.json({ products, store });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  searchProducts,
  getFeaturedProducts,
  getDeals,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
};
