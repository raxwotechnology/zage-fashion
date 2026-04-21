const mongoose = require('mongoose');

const stockReceiptItemSchema = mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
    qty: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const stockReceiptSchema = mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Store' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Supplier' },
    receivedAt: { type: Date, default: Date.now },
    invoiceNo: { type: String, trim: true },
    items: { type: [stockReceiptItemSchema], required: true, validate: (v) => Array.isArray(v) && v.length > 0 },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockReceiptSchema.index({ storeId: 1, receivedAt: -1 });

const StockReceipt = mongoose.model('StockReceipt', stockReceiptSchema);

module.exports = StockReceipt;

