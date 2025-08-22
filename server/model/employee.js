const mongoose = require('mongoose');

const advancePaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  reason: {
    type: String,
    trim: true
  },
  deducted_from_salary: {
    type: Boolean,
    default: false
  },
  deduction_month: {
    type: String // Format: "YYYY-MM"
  }
}, { timestamps: true });

const salaryPaymentSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true // Format: "YYYY-MM"
  },
  basic_salary: {
    type: Number,
    required: true
  },
  advance_deductions: {
    type: Number,
    default: 0
  },
  other_deductions: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0
  },
  overtime_amount: {
    type: Number,
    default: 0
  },
  net_salary: {
    type: Number,
    required: true
  },
  payment_date: {
    type: Date
  },
  payment_status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  payment_method: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI'],
    default: 'Cash'
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const employeeSchema = new mongoose.Schema({
  employee_id: {
    type: String
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    trim: true,
    default: 'General'
  },
  joining_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  monthly_salary: {
    type: Number,
    required: true,
    min: 0
  },
  salary_type: {
    type: String,
    enum: ['Monthly', 'Daily', 'Hourly'],
    default: 'Monthly'
  },
  bank_details: {
    account_number: String,
    bank_name: String,
    ifsc_code: String,
    account_holder_name: String
  },
  emergency_contact: {
    name: String,
    mobile: String,
    relation: String
  },
  documents: {
    aadhar_number: String,
    pan_number: String,
    photo_url: String
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Terminated'],
    default: 'Active'
  },
  advance_payments: [advancePaymentSchema],
  salary_payments: [salaryPaymentSchema],
  total_advance_taken: {
    type: Number,
    default: 0
  },
  pending_advance_amount: {
    type: Number,
    default: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Generate employee ID
employeeSchema.pre('save', async function(next) {
  if (this.isNew && !this.employee_id) {
    try {
      const count = await this.constructor.countDocuments();
      this.employee_id = `EMP${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Calculate pending advance amount
employeeSchema.pre('save', function(next) {
  this.total_advance_taken = this.advance_payments.reduce((sum, advance) => sum + advance.amount, 0);
  this.pending_advance_amount = this.advance_payments
    .filter(advance => !advance.deducted_from_salary)
    .reduce((sum, advance) => sum + advance.amount, 0);
  next();
});

// Virtual for current month completion date
employeeSchema.virtual('current_month_completion').get(function() {
  const joinDate = new Date(this.joining_date);
  const today = new Date();
  
  // Calculate the completion date for current month
  const currentMonthCompletion = new Date(today.getFullYear(), today.getMonth(), joinDate.getDate());
  
  // If the completion date has passed this month, move to next month
  if (currentMonthCompletion <= today) {
    currentMonthCompletion.setMonth(currentMonthCompletion.getMonth() + 1);
  }
  
  return currentMonthCompletion;
});

// Virtual for days until next payment
employeeSchema.virtual('days_until_payment').get(function() {
  const today = new Date();
  const completionDate = this.current_month_completion;
  const diffTime = completionDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to add advance payment
employeeSchema.methods.addAdvancePayment = function(amount, reason = '') {
  this.advance_payments.push({
    amount: amount,
    date: new Date(),
    reason: reason,
    deducted_from_salary: false
  });
  return this.save();
};

// Method to process monthly salary
employeeSchema.methods.processMonthlySalary = function(month, options = {}) {
  const {
    other_deductions = 0,
    bonus = 0,
    overtime_amount = 0,
    payment_method = 'Cash',
    notes = ''
  } = options;

  // Calculate advance deductions for this month
  const pendingAdvances = this.advance_payments.filter(advance => !advance.deducted_from_salary);
  let advance_deductions = 0;
  
  pendingAdvances.forEach(advance => {
    if (advance_deductions + advance.amount <= this.monthly_salary * 0.5) { // Max 50% deduction
      advance_deductions += advance.amount;
      advance.deducted_from_salary = true;
      advance.deduction_month = month;
    }
  });

  const net_salary = this.monthly_salary + bonus + overtime_amount - advance_deductions - other_deductions;

  this.salary_payments.push({
    month: month,
    basic_salary: this.monthly_salary,
    advance_deductions: advance_deductions,
    other_deductions: other_deductions,
    bonus: bonus,
    overtime_amount: overtime_amount,
    net_salary: net_salary,
    payment_status: 'Pending',
    payment_method: payment_method,
    notes: notes
  });

  return this.save();
};

// Indexes for better performance
employeeSchema.index({ employee_id: 1 }, { unique: true });
employeeSchema.index({ mobile: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ 'salary_payments.month': 1 });

module.exports = mongoose.model('Employee', employeeSchema);