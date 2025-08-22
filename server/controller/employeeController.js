const Employee = require('../model/employee');
const { sendEmployeeWelcomeEmail } = require('../services/emailService');

// Add new employee
const addEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      address,
      position,
      department,
      joining_date,
      monthly_salary,
      salary_type,
      bank_details,
      emergency_contact,
      documents
    } = req.body;

    // Check if employee with same mobile already exists
    const existingEmployee = await Employee.findOne({ mobile: mobile });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this mobile number already exists'
      });
    }

    const employee = new Employee({
      name,
      email,
      mobile,
      address,
      position,
      department,
      joining_date: joining_date || new Date(),
      monthly_salary,
      salary_type,
      bank_details,
      emergency_contact,
      documents,
      created_by: req.user?.id
    });

    await employee.save();

    // Send welcome email if employee has email
    if (employee.email) {
      try {
        const emailResult = await sendEmployeeWelcomeEmail(employee);
        if (emailResult.success) {
          console.log(`✅ Welcome email sent to ${employee.name} (${employee.email})`);
        } else {
          console.log(`⚠️ Failed to send welcome email to ${employee.name}: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error(`❌ Error sending welcome email to ${employee.name}:`, emailError);
        // Don't fail the employee creation if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      data: employee
    });

  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding employee',
      error: error.message
    });
  }
};

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const { status, search, department } = req.query;
    
    let query = {};
    
    // Filter by status - default to Active if no status specified
    if (status) {
      query.status = status;
    } else {
      // Default behavior: only show Active employees
      query.status = 'Active';
    }
    
    // Filter by department
    if (department) {
      query.department = department;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employee_id: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .sort({ joining_date: -1 })
      .lean();

    // Add calculated fields
    const employeesWithCalculations = employees.map(employee => {
      const joinDate = new Date(employee.joining_date);
      const today = new Date();
      
      // Calculate current month completion date
      const currentMonthCompletion = new Date(today.getFullYear(), today.getMonth(), joinDate.getDate());
      if (currentMonthCompletion <= today) {
        currentMonthCompletion.setMonth(currentMonthCompletion.getMonth() + 1);
      }
      
      // Calculate days until payment
      const diffTime = currentMonthCompletion - today;
      const daysUntilPayment = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Check if current month salary is paid
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const currentMonthSalary = employee.salary_payments?.find(payment => payment.month === currentMonth);
      
      return {
        ...employee,
        current_month_completion: currentMonthCompletion,
        days_until_payment: daysUntilPayment,
        current_month_paid: currentMonthSalary?.payment_status === 'Paid',
        pending_advance_amount: employee.advance_payments?.filter(advance => !advance.deducted_from_salary)
          .reduce((sum, advance) => sum + advance.amount, 0) || 0
      };
    });

    res.status(200).json({
      success: true,
      data: employeesWithCalculations,
      count: employeesWithCalculations.length
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findById(id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check for duplicate mobile (excluding current employee)
    if (updateData.mobile) {
      const duplicateEmployee = await Employee.findOne({
        _id: { $ne: id },
        mobile: updateData.mobile
      });
      
      if (duplicateEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee with this mobile number already exists'
        });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
};

// Delete employee (soft delete)
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Soft delete - mark as inactive
    await Employee.findByIdAndUpdate(id, { status: 'Inactive' });

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};

// Permanent delete employee
const permanentDeleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Permanent delete - remove all employee data including financial records
    await Employee.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Employee and all associated records permanently deleted successfully'
    });

  } catch (error) {
    console.error('Error permanently deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error permanently deleting employee',
      error: error.message
    });
  }
};

// Add advance payment
const addAdvancePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Advance amount must be greater than 0'
      });
    }

    // Check if advance amount is reasonable (not more than 2 months salary)
    if (amount > employee.monthly_salary * 2) {
      return res.status(400).json({
        success: false,
        message: 'Advance amount cannot exceed 2 months salary'
      });
    }

    await employee.addAdvancePayment(amount, reason);

    res.status(200).json({
      success: true,
      message: 'Advance payment added successfully',
      data: employee
    });

  } catch (error) {
    console.error('Error adding advance payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding advance payment',
      error: error.message
    });
  }
};

// Process monthly salary
const processMonthlySalary = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      month,
      other_deductions = 0,
      bonus = 0,
      overtime_amount = 0,
      payment_method = 'Cash',
      notes = ''
    } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if salary for this month already exists
    const existingSalary = employee.salary_payments.find(payment => payment.month === month);
    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: 'Salary for this month already processed'
      });
    }

    await employee.processMonthlySalary(month, {
      other_deductions,
      bonus,
      overtime_amount,
      payment_method,
      notes
    });

    res.status(200).json({
      success: true,
      message: 'Monthly salary processed successfully',
      data: employee
    });

  } catch (error) {
    console.error('Error processing monthly salary:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing monthly salary',
      error: error.message
    });
  }
};

// Update salary payment status
const updateSalaryPaymentStatus = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const { payment_status, payment_date, payment_method, notes } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const salaryPayment = employee.salary_payments.id(paymentId);
    if (!salaryPayment) {
      return res.status(404).json({
        success: false,
        message: 'Salary payment not found'
      });
    }

    salaryPayment.payment_status = payment_status;
    if (payment_date) salaryPayment.payment_date = payment_date;
    if (payment_method) salaryPayment.payment_method = payment_method;
    if (notes) salaryPayment.notes = notes;

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Salary payment status updated successfully',
      data: employee
    });

  } catch (error) {
    console.error('Error updating salary payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating salary payment status',
      error: error.message
    });
  }
};

// Get employee statistics
const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'Inactive' });
    
    // Get employees with pending payments
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const employeesWithPendingPayments = await Employee.find({
      status: 'Active',
      $or: [
        { 'salary_payments': { $not: { $elemMatch: { month: currentMonth } } } },
        { 'salary_payments': { $elemMatch: { month: currentMonth, payment_status: 'Pending' } } }
      ]
    }).countDocuments();

    // Calculate total pending advance amount
    const advanceStats = await Employee.aggregate([
      { $match: { status: 'Active' } },
      { $unwind: '$advance_payments' },
      { $match: { 'advance_payments.deducted_from_salary': false } },
      {
        $group: {
          _id: null,
          totalPendingAdvance: { $sum: '$advance_payments.amount' },
          employeesWithAdvance: { $addToSet: '$_id' }
        }
      }
    ]);

    const totalPendingAdvance = advanceStats[0]?.totalPendingAdvance || 0;
    const employeesWithAdvance = advanceStats[0]?.employeesWithAdvance?.length || 0;

    res.status(200).json({
      success: true,
      data: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        pendingPayments: employeesWithPendingPayments,
        totalPendingAdvance: totalPendingAdvance,
        employeesWithAdvance: employeesWithAdvance
      }
    });

  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee statistics',
      error: error.message
    });
  }
};

// Get employees with upcoming payment due dates
const getUpcomingPayments = async (req, res) => {
  try {
    const { days = 7 } = req.query; // Default to next 7 days
    
    const employees = await Employee.find({ status: 'Active' }).lean();
    const today = new Date();
    const targetDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const upcomingPayments = employees.filter(employee => {
      const joinDate = new Date(employee.joining_date);
      const currentMonthCompletion = new Date(today.getFullYear(), today.getMonth(), joinDate.getDate());
      
      if (currentMonthCompletion <= today) {
        currentMonthCompletion.setMonth(currentMonthCompletion.getMonth() + 1);
      }
      
      return currentMonthCompletion <= targetDate;
    }).map(employee => {
      const joinDate = new Date(employee.joining_date);
      const currentMonthCompletion = new Date(today.getFullYear(), today.getMonth(), joinDate.getDate());
      
      if (currentMonthCompletion <= today) {
        currentMonthCompletion.setMonth(currentMonthCompletion.getMonth() + 1);
      }
      
      const diffTime = currentMonthCompletion - today;
      const daysUntilPayment = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...employee,
        payment_due_date: currentMonthCompletion,
        days_until_payment: daysUntilPayment
      };
    });

    res.status(200).json({
      success: true,
      data: upcomingPayments,
      count: upcomingPayments.length
    });

  } catch (error) {
    console.error('Error fetching upcoming payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming payments',
      error: error.message
    });
  }
};

module.exports = {
  addEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  permanentDeleteEmployee,
  addAdvancePayment,
  processMonthlySalary,
  updateSalaryPaymentStatus,
  getEmployeeStats,
  getUpcomingPayments
};