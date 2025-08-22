const Customer = require('../model/customer');

// ✅ Add new customer
exports.addCustomer = async (req, res) => {
  try {
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      zip_code, 
      vehicle_number, 
      model_name, 
      mfg_year, 
      notes 
    } = req.body;

    const newCustomer = new Customer({
      first_name,
      last_name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      vehicle_number,
      model_name,
      mfg_year,
      notes: notes || ''
    });

    await newCustomer.save();
    res.status(201).json({
      success: true,
      message: 'Customer added successfully!',
      data: newCustomer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add customer'
    });
  }
};

// ✅ Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully!',
      data: updatedCustomer
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update customer' 
    });
  }
};

// ✅ Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
};

// ✅ Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer'
    });
  }
};

// ✅ Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer'
    });
  }
};

// ✅ Search customers by multiple fields
exports.searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const customers = await Customer.find({
      $or: [
        { first_name: { $regex: query, $options: 'i' } },
        { last_name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { vehicle_number: { $regex: query, $options: 'i' } },
        { model_name: { $regex: query, $options: 'i' } },
        { mfg_year: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search customers'
    });
  }
};

// ✅ Update service count for customer
exports.updateServiceCount = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.total_services += 1;
    customer.last_service_date = new Date();
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Service count updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update service count'
    });
  }
};
