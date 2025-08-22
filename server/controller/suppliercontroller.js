const Supplier = require('../model/supplier');

// Add new supplier
const addSupplier = async (req, res) => {
  try {
    const {
      supplier_name,
      contact_person,
      mobile,
      email,
      address,
      city,
      state,
      pincode,
      gstin,
      pan,
      bank_details,
      payment_terms,
      credit_limit,
      notes
    } = req.body;

    // Check if supplier with same name or mobile already exists
    const existingSupplier = await Supplier.findOne({
      $or: [
        { supplier_name: supplier_name },
        { mobile: mobile }
      ]
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this name or mobile number already exists'
      });
    }

    const supplier = new Supplier({
      supplier_name,
      contact_person,
      mobile,
      email,
      address,
      city,
      state,
      pincode,
      gstin,
      pan,
      bank_details,
      payment_terms,
      credit_limit,
      notes
    });

    await supplier.save();

    res.status(201).json({
      success: true,
      message: 'Supplier added successfully',
      data: supplier
    });

  } catch (error) {
    console.error('Error adding supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding supplier',
      error: error.message
    });
  }
};

// Get all suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { supplier_name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query)
      .sort({ supplier_name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: suppliers,
      count: suppliers.length
    });

  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suppliers',
      error: error.message
    });
  }
};

// Get supplier by ID
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      data: supplier
    });

  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier',
      error: error.message
    });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if supplier exists
    const existingSupplier = await Supplier.findById(id);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check for duplicate name or mobile (excluding current supplier)
    if (updateData.supplier_name || updateData.mobile) {
      const duplicateQuery = {
        _id: { $ne: id },
        $or: []
      };

      if (updateData.supplier_name) {
        duplicateQuery.$or.push({ supplier_name: updateData.supplier_name });
      }
      if (updateData.mobile) {
        duplicateQuery.$or.push({ mobile: updateData.mobile });
      }

      const duplicate = await Supplier.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Supplier with this name or mobile number already exists'
        });
      }
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: updatedSupplier
    });

  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating supplier',
      error: error.message
    });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if supplier has any associated inventory purchases
    const InventoryPurchase = require('../model/inventoryPurchase');
    const associatedPurchases = await InventoryPurchase.countDocuments({ supplier_id: id });
    
    if (associatedPurchases > 0) {
      // If supplier has purchases, mark as inactive instead of deleting
      await Supplier.findByIdAndUpdate(id, { status: 'Inactive' });
      return res.status(200).json({
        success: true,
        message: 'Supplier has associated purchases, marked as inactive instead of deletion'
      });
    }

    // If no associated purchases, perform hard delete
    await Supplier.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting supplier',
      error: error.message
    });
  }
};

// Get supplier statistics
const getSupplierStats = async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ status: 'Active' });
    const inactiveSuppliers = await Supplier.countDocuments({ status: 'Inactive' });

    res.status(200).json({
      success: true,
      data: {
        total: totalSuppliers,
        active: activeSuppliers,
        inactive: inactiveSuppliers
      }
    });

  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier statistics',
      error: error.message
    });
  }
};

module.exports = {
  addSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierStats
};