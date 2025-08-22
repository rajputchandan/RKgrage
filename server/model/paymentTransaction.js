const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  purchase_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryPurchase',
    required: true
  },
  purchase_number: {
    type: String,
    required: true
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplier_name: {
    type: String,
    required: true
  },
  payment_amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Credit'],
    default: 'Cash'
  },
  payment_date: {
    type: Date,
    default: Date.now
  },
  payment_notes: {
    type: String,
    trim: true
  },
  transaction_type: {
    type: String,
    enum: ['Payment', 'Refund'],
    default: 'Payment'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Indexes for better performance
paymentTransactionSchema.index({ purchase_id: 1 });
paymentTransactionSchema.index({ supplier_id: 1 });
paymentTransactionSchema.index({ payment_date: -1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);