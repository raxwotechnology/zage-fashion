const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
    })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a review
// @route   POST /api/reviews/product/:productId
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const existing = await Review.findOne({
      userId: req.user._id,
      productId: req.params.productId,
    });

    if (existing) {
      res.status(400);
      return next(new Error('You have already reviewed this product'));
    }

    const review = await Review.create({
      userId: req.user._id,
      productId: req.params.productId,
      rating,
      comment,
    });

    // Update product average rating
    await updateProductRating(req.params.productId);

    const populated = await Review.findById(review._id).populate('userId', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      return next(new Error('Review not found'));
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    review.rating = req.body.rating || review.rating;
    review.comment = req.body.comment || review.comment;
    await review.save();

    await updateProductRating(review.productId);

    const populated = await Review.findById(review._id).populate('userId', 'name avatar');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      return next(new Error('Review not found'));
    }

    if (
      review.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    const productId = review.productId;
    await review.deleteOne();
    await updateProductRating(productId);

    res.json({ message: 'Review removed' });
  } catch (error) {
    next(error);
  }
};

// Helper: recalculate product rating
async function updateProductRating(productId) {
  const reviews = await Review.find({ productId });
  const product = await Product.findById(productId);
  if (product) {
    if (reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      product.averageRating = Math.round(avg * 10) / 10;
      product.totalReviews = reviews.length;
    } else {
      product.averageRating = 0;
      product.totalReviews = 0;
    }
    await product.save();
  }
}

module.exports = { getProductReviews, createReview, updateReview, deleteReview };
