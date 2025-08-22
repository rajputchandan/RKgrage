const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  part_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part',
    required: true
  },
  part_name: {
    type: String,
    required: true
  },
  part_number: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  gst_rate: {
    type: Number,
    default: 0
  },
  gst_amount: {
    type: Number,
    default: 0
  },
  final_amount: {
    type: Number,
    required: true
  }
});

const inventoryPurchaseSchema = new mongoose.Schema({
  purchase_number: {
    type: String
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
  purchase_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  invoice_number: {
    type: String,
    trim: true
  },
  invoice_date: {
    type: Date
  },
  items: [purchaseItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  total_gst: {
    type: Number,
    default: 0
  },
  total_amount: {
    type: Number,
    required: true,
    default: 0
  },
  payment_status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  payment_method: {
    type: String,
    enum: ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Credit'],
    default: 'Cash'
  },
  paid_amount: {
    type: Number,
    default: 0
  },
  balance_amount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Received', 'Cancelled'],
    default: 'Confirmed'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Pre-save middleware to calculate totals and payment status
inventoryPurchaseSchema.pre('save', function(next) {
  // Calculate subtotal and total GST
  this.subtotal = this.items.reduce((sum, item) => sum + item.total_price, 0);
  this.total_gst = this.items.reduce((sum, item) => sum + item.gst_amount, 0);
  this.total_amount = this.subtotal + this.total_gst;
  this.balance_amount = this.total_amount - this.paid_amount;
  
  // Auto-calculate payment status based on paid amount
  if (this.paid_amount <= 0) {
    this.payment_status = 'Pending';
  } else if (this.paid_amount >= this.total_amount) {
    this.payment_status = 'Paid';
  } else {
    this.payment_status = 'Partial';
  }
  
  next();
});

// Generate purchase number
inventoryPurchaseSchema.pre('save', async function(next) {
  if (this.isNew && !this.purchase_number) {
    try {
      const count = await this.constructor.countDocuments();
      this.purchase_number = `PUR${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-update middleware to calculate payment status on updates
inventoryPurchaseSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // If paid_amount is being updated, calculate payment status
  if (update.paid_amount !== undefined || update.$set?.paid_amount !== undefined) {
    const paidAmount = update.paid_amount || update.$set?.paid_amount || 0;
    
    // We need to get the total_amount to calculate status
    // This will be handled in the controller for better control
    next();
  } else {
    next();
  }
});

// Indexes for better performance
inventoryPurchaseSchema.index({ purchase_number: 1 }, { unique: true });
inventoryPurchaseSchema.index({ supplier_id: 1 });
inventoryPurchaseSchema.index({ purchase_date: -1 });
inventoryPurchaseSchema.index({ status: 1 });

module.exports = mongoose.model('InventoryPurchase', inventoryPurchaseSchema);