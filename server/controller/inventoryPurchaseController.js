const InventoryPurchase = require('../model/inventoryPurchase');
const Supplier = require('../model/supplier');
const Part = require('../model/parts');
const PaymentTransaction = require('../model/paymentTransaction');

// Add new inventory purchase
const addInventoryPurchase = async (req, res) => {
  try {
    const {
      supplier_id,
      purchase_date,
      invoice_number,
      invoice_date,
      items,
      payment_method,
      paid_amount,
      notes
    } = req.body;

    // Validate supplier exists
    const supplier = await Supplier.findById(supplier_id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check for duplicate invoice number with same supplier
    if (invoice_number && invoice_number.trim()) {
      const existingPurchase = await InventoryPurchase.findOne({
        supplier_id: supplier_id,
        invoice_number: invoice_number.trim()
      });

      if (existingPurchase) {
        return res.status(409).json({
          success: false,
          message: `Invoice number "${invoice_number}" already exists for this supplier. Please edit the existing purchase (${existingPurchase.purchase_number}) or use a different invoice number.`,
          existingPurchase: {
            purchase_number: existingPurchase.purchase_number,
            purchase_date: existingPurchase.purchase_date,
            total_amount: existingPurchase.total_amount,
            _id: existingPurchase._id
          }
        });
      }
    }

    // Process and validate items
    const processedItems = [];
    for (let item of items) {
      let part;
      let partId = item.part_id;

      // Check if part exists by ID or create/find by part_number
      if (item.part_id && item.part_id !== 'new') {
        part = await Part.findById(item.part_id);
      } else if (item.part_number) {
        // Try to find existing part by part_number
        part = await Part.findOne({ part_number: item.part_number });
      }

      // If part doesn't exist, create a new one
      if (!part) {
        if (!item.part_name || !item.part_number) {
          return res.status(400).json({
            success: false,
            message: 'Part name and part number are required for new parts'
          });
        }

        // Validate and process cost price (unit_price)
        if (!item.unit_price || item.unit_price === '' || item.unit_price === null || item.unit_price === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Unit price (cost price) is required for new parts'
          });
        }

        const validCostPrice = parseFloat(item.unit_price);
        const validSellingPrice = parseFloat(item.selling_price || item.unit_price);
        const validGstRate = parseFloat(item.gst_rate) || 18;
        const validMinStockLevel = parseInt(item.min_stock_level) || 5;

        // Check if conversions were successful
        if (isNaN(validCostPrice)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid unit price (cost price) value'
          });
        }

        if (isNaN(validSellingPrice)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid selling price value'
          });
        }

        console.log(`📝 Creating new part in inventory purchase:`, {
          name: item.part_name,
          part_number: item.part_number,
          cost_price: { original: item.unit_price, converted: validCostPrice, type: typeof validCostPrice },
          selling_price: { original: item.selling_price || item.unit_price, converted: validSellingPrice, type: typeof validSellingPrice }
        });

        // Create new part with validated data
        const newPart = new Part({
          name: String(item.part_name),
          part_number: String(item.part_number),
          category: String(item.category || 'General'),
          stock_quantity: 0, // Will be updated below
          cost_price: validCostPrice, // Use validated unit_price as cost_price for purchases
          selling_price: validSellingPrice, // Use validated selling_price if provided, otherwise use unit_price
          gst_rate: validGstRate,
          gst_amount: (validSellingPrice * validGstRate) / 100,
          supplier: String(supplier.supplier_name),
          rack_location: String(item.rack_location || 'A1'), // Default rack location
          min_stock_level: validMinStockLevel
        });

        console.log(`📝 New part object before save:`, {
          name: newPart.name,
          part_number: newPart.part_number,
          cost_price: newPart.cost_price,
          selling_price: newPart.selling_price,
          cost_price_type: typeof newPart.cost_price
        });

        await newPart.save();
        part = newPart;
        partId = newPart._id;
        
        console.log(`✅ Created new part: ${part.name} (${part.part_number}) with cost_price: ₹${part.cost_price}`);
      } else {
        // Update existing part's supplier, cost price, and selling price if needed
        const updateData = {
          supplier: supplier.supplier_name
        };
        
        // Update cost price (purchase price) with validation
        if (item.unit_price) {
          const validCostPrice = parseFloat(item.unit_price);
          if (!isNaN(validCostPrice)) {
            updateData.cost_price = validCostPrice;
            console.log(`📝 Updating cost_price for ${part.name}: ${item.unit_price} → ${validCostPrice}`);
          } else {
            console.warn(`⚠️ Invalid unit_price for ${part.name}: ${item.unit_price}`);
          }
        }
        
        // Update selling price if provided and different
        if (item.selling_price && item.selling_price !== part.selling_price) {
          const validSellingPrice = parseFloat(item.selling_price);
          if (!isNaN(validSellingPrice)) {
            updateData.selling_price = validSellingPrice;
            updateData.gst_amount = (validSellingPrice * part.gst_rate) / 100;
            console.log(`📝 Updating selling_price for ${part.name}: ${item.selling_price} → ${validSellingPrice}`);
          } else {
            console.warn(`⚠️ Invalid selling_price for ${part.name}: ${item.selling_price}`);
          }
        }
        
        // Update rack location if provided
        if (item.rack_location) {
          updateData.rack_location = item.rack_location;
        }

        console.log(`📝 Update data for ${part.name}:`, updateData);

        const updatedPart = await Part.findByIdAndUpdate(part._id, updateData, { new: true });
        console.log(`✅ Updated existing part: ${part.name} (${part.part_number}) - cost_price: ₹${updatedPart.cost_price}`);
      }

      // Calculate GST and final amount
      const gst_rate = item.gst_rate || part.gst_rate || 18;
      const total_price = item.quantity * item.unit_price;
      const gst_amount = (total_price * gst_rate) / 100;
      const final_amount = total_price + gst_amount;

      processedItems.push({
        part_id: partId,
        part_name: part.name,
        part_number: part.part_number,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: total_price,
        gst_rate: gst_rate,
        gst_amount: gst_amount,
        final_amount: final_amount
      });

      // Update part inventory with detailed tracking
      const updatedPart = await Part.findByIdAndUpdate(
        partId,
        {
          $inc: { stock_quantity: item.quantity }
        },
        { new: true }
      );
      
      console.log(`📦 Inventory Updated: ${part.name} (${part.part_number}) - Added ${item.quantity} units. New stock: ${updatedPart.stock_quantity}`);
    }

    // Create purchase record
    const purchase = new InventoryPurchase({
      supplier_id,
      supplier_name: supplier.supplier_name,
      purchase_date: purchase_date || new Date(),
      invoice_number,
      invoice_date,
      items: processedItems,
      payment_method,
      paid_amount: paid_amount || 0,
      notes,
      created_by: req.user?.id
    });

    // Save the purchase (purchase_number will be auto-generated)
    await purchase.save();

    // Ensure purchase_number was generated
    if (!purchase.purchase_number) {
      throw new Error('Failed to generate purchase number');
    }

    // Populate the response
    const populatedPurchase = await InventoryPurchase.findById(purchase._id)
      .populate('supplier_id', 'supplier_name mobile email')
      .populate('items.part_id', 'name part_number category');

    res.status(201).json({
      success: true,
      message: 'Inventory purchase added successfully',
      data: populatedPurchase
    });

  } catch (error) {
    console.error('Error adding inventory purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding inventory purchase',
      error: error.message
    });
  }
};

// Get all inventory purchases
const getAllInventoryPurchases = async (req, res) => {
  try {
    const { 
      supplier_id, 
      status, 
      payment_status, 
      start_date, 
      end_date,
      page = 1,
      limit = 10,
      search
    } = req.query;

    let query = {};

    // Filter by supplier
    if (supplier_id) {
      query.supplier_id = supplier_id;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (payment_status) {
      query.payment_status = payment_status;
    }

    // Date range filter
    if (start_date || end_date) {
      query.purchase_date = {};
      if (start_date) {
        query.purchase_date.$gte = new Date(start_date);
      }
      if (end_date) {
        query.purchase_date.$lte = new Date(end_date);
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { purchase_number: { $regex: search, $options: 'i' } },
        { supplier_name: { $regex: search, $options: 'i' } },
        { invoice_number: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const purchases = await InventoryPurchase.find(query)
      .populate('supplier_id', 'supplier_name mobile email gstin')
      .populate('items.part_id', 'name part_number category')
      .sort({ purchase_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InventoryPurchase.countDocuments(query);

    res.status(200).json({
      success: true,
      data: purchases,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching inventory purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory purchases',
      error: error.message
    });
  }
};

// Get inventory purchase by ID
const getInventoryPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await InventoryPurchase.findById(id)
      .populate('supplier_id')
      .populate('items.part_id', 'name part_number category stock_quantity')
      .populate('created_by', 'username email');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Inventory purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      data: purchase
    });

  } catch (error) {
    console.error('Error fetching inventory purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory purchase',
      error: error.message
    });
  }
};

// Update inventory purchase
const updateInventoryPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const purchase = await InventoryPurchase.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Inventory purchase not found'
      });
    }

    // Don't allow updating items if status is 'Received' to maintain inventory integrity
    if (purchase.status === 'Received' && updateData.items) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify items of a received purchase'
      });
    }

    // Check for duplicate invoice number with same supplier (excluding current purchase)
    if (updateData.invoice_number && updateData.invoice_number.trim()) {
      const supplierId = updateData.supplier_id || purchase.supplier_id;
      const existingPurchase = await InventoryPurchase.findOne({
        _id: { $ne: id }, // Exclude current purchase
        supplier_id: supplierId,
        invoice_number: updateData.invoice_number.trim()
      });

      if (existingPurchase) {
        return res.status(409).json({
          success: false,
          message: `Invoice number "${updateData.invoice_number}" already exists for this supplier. Please use a different invoice number or edit the existing purchase (${existingPurchase.purchase_number}).`,
          existingPurchase: {
            purchase_number: existingPurchase.purchase_number,
            purchase_date: existingPurchase.purchase_date,
            total_amount: existingPurchase.total_amount,
            _id: existingPurchase._id
          }
        });
      }
    }

    // If items are being updated, process them like in addInventoryPurchase
    if (updateData.items) {
      const supplier = await Supplier.findById(updateData.supplier_id || purchase.supplier_id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Process and validate items (same logic as addInventoryPurchase)
      const processedItems = [];
      for (let item of updateData.items) {
        let part;
        let partId = item.part_id;

        // Check if part exists by ID or create/find by part_number
        if (item.part_id && item.part_id !== 'new') {
          part = await Part.findById(item.part_id);
        } else if (item.part_number) {
          // Try to find existing part by part_number
          part = await Part.findOne({ part_number: item.part_number });
        }

        // If part doesn't exist, create a new one
        if (!part) {
          if (!item.part_name || !item.part_number) {
            return res.status(400).json({
              success: false,
              message: 'Part name and part number are required for new parts'
            });
          }

          // Validate and process cost price (unit_price) for update
          if (!item.unit_price || item.unit_price === '' || item.unit_price === null || item.unit_price === undefined) {
            return res.status(400).json({
              success: false,
              message: 'Unit price (cost price) is required for new parts'
            });
          }

          const validCostPrice = parseFloat(item.unit_price);
          const validSellingPrice = parseFloat(item.selling_price || item.unit_price);
          const validGstRate = parseFloat(item.gst_rate) || 18;
          const validMinStockLevel = parseInt(item.min_stock_level) || 5;

          // Check if conversions were successful
          if (isNaN(validCostPrice)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid unit price (cost price) value'
            });
          }

          if (isNaN(validSellingPrice)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid selling price value'
            });
          }

          console.log(`📝 Creating new part during update:`, {
            name: item.part_name,
            part_number: item.part_number,
            cost_price: { original: item.unit_price, converted: validCostPrice, type: typeof validCostPrice },
            selling_price: { original: item.selling_price || item.unit_price, converted: validSellingPrice, type: typeof validSellingPrice }
          });

          // Create new part with validated data
          const newPart = new Part({
            name: String(item.part_name),
            part_number: String(item.part_number),
            category: String(item.category || 'General'),
            stock_quantity: 0, // Will be updated below
            cost_price: validCostPrice, // Use validated unit_price as cost_price for purchases
            selling_price: validSellingPrice, // Use validated selling_price if provided, otherwise use unit_price
            gst_rate: validGstRate,
            gst_amount: (validSellingPrice * validGstRate) / 100,
            supplier: String(supplier.supplier_name),
            rack_location: String(item.rack_location || 'A1'), // Default rack location
            min_stock_level: validMinStockLevel
          });

          await newPart.save();
          part = newPart;
          partId = newPart._id;
          
          console.log(`✅ Created new part during update: ${part.name} (${part.part_number}) with cost_price: ₹${part.cost_price}`);
        } else {
          // Update existing part's supplier, cost price, and selling price if needed
          const updatePartData = {
            supplier: supplier.supplier_name
          };
          
          // Update cost price (purchase price) with validation
          if (item.unit_price) {
            const validCostPrice = parseFloat(item.unit_price);
            if (!isNaN(validCostPrice)) {
              updatePartData.cost_price = validCostPrice;
              console.log(`📝 Updating cost_price during update for ${part.name}: ${item.unit_price} → ${validCostPrice}`);
            } else {
              console.warn(`⚠️ Invalid unit_price during update for ${part.name}: ${item.unit_price}`);
            }
          }
          
          // Update selling price if provided and different
          if (item.selling_price && item.selling_price !== part.selling_price) {
            const validSellingPrice = parseFloat(item.selling_price);
            if (!isNaN(validSellingPrice)) {
              updatePartData.selling_price = validSellingPrice;
              updatePartData.gst_amount = (validSellingPrice * part.gst_rate) / 100;
              console.log(`📝 Updating selling_price during update for ${part.name}: ${item.selling_price} → ${validSellingPrice}`);
            } else {
              console.warn(`⚠️ Invalid selling_price during update for ${part.name}: ${item.selling_price}`);
            }
          }
          
          // Update rack location if provided
          if (item.rack_location) {
            updatePartData.rack_location = item.rack_location;
          }

          console.log(`📝 Update data during purchase update for ${part.name}:`, updatePartData);

          const updatedPart = await Part.findByIdAndUpdate(part._id, updatePartData, { new: true });
          console.log(`✅ Updated existing part during update: ${part.name} (${part.part_number}) - cost_price: ₹${updatedPart.cost_price}`);
        }

        // Calculate GST and final amount
        const gst_rate = item.gst_rate || part.gst_rate || 18;
        const total_price = item.quantity * item.unit_price;
        const gst_amount = (total_price * gst_rate) / 100;
        const final_amount = total_price + gst_amount;

        processedItems.push({
          part_id: partId,
          part_name: part.name,
          part_number: part.part_number,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: total_price,
          gst_rate: gst_rate,
          gst_amount: gst_amount,
          final_amount: final_amount
        });

        // Update part inventory (difference from old quantity)
        const oldItem = purchase.items.find(oldItem =>
          oldItem.part_id.toString() === partId.toString()
        );
        const quantityDiff = item.quantity - (oldItem ? oldItem.quantity : 0);
        
        if (quantityDiff !== 0) {
          const updatedPart = await Part.findByIdAndUpdate(
            partId,
            { $inc: { stock_quantity: quantityDiff } },
            { new: true }
          );
          
          console.log(`📦 Inventory Updated (Edit): ${part.name} (${part.part_number}) - ${quantityDiff > 0 ? 'Added' : 'Removed'} ${Math.abs(quantityDiff)} units. New stock: ${updatedPart.stock_quantity}`);
        }
      }

      // Update the items in updateData
      updateData.items = processedItems;
    }

    // Handle payment updates with proper transaction tracking
    if (updateData.paid_amount !== undefined) {
      const totalAmount = updateData.total_amount || purchase.total_amount;
      const newPaymentAmount = updateData.paid_amount;
      const currentPaidAmount = purchase.paid_amount || 0;
      
      // Determine if this is an additional payment or setting total paid amount
      let finalPaidAmount;
      let isAdditionalPayment = false;
      
      // If the new amount is different from current and less than total, treat as additional payment
      if (newPaymentAmount > 0 && newPaymentAmount !== currentPaidAmount && newPaymentAmount < totalAmount) {
        // This looks like an additional payment
        finalPaidAmount = currentPaidAmount + newPaymentAmount;
        isAdditionalPayment = true;
      } else {
        // This is setting the total paid amount
        finalPaidAmount = newPaymentAmount;
      }
      
      // Ensure we don't exceed total amount
      if (finalPaidAmount > totalAmount) {
        finalPaidAmount = totalAmount;
      }
      
      // Create payment transaction record for tracking
      if (isAdditionalPayment && newPaymentAmount > 0) {
        const paymentTransaction = new PaymentTransaction({
          purchase_id: purchase._id,
          purchase_number: purchase.purchase_number,
          supplier_id: purchase.supplier_id,
          supplier_name: purchase.supplier_name,
          payment_amount: newPaymentAmount,
          payment_method: updateData.payment_method || purchase.payment_method,
          payment_notes: updateData.notes || `Additional payment of ₹${newPaymentAmount}`,
          created_by: req.user?.id
        });
        
        await paymentTransaction.save();
        console.log(`💰 Payment Transaction Created: ₹${newPaymentAmount} for ${purchase.purchase_number}`);
      }
      
      updateData.paid_amount = finalPaidAmount;
      
      if (finalPaidAmount <= 0) {
        updateData.payment_status = 'Pending';
      } else if (finalPaidAmount >= totalAmount) {
        updateData.payment_status = 'Paid';
      } else {
        updateData.payment_status = 'Partial';
      }
      
      updateData.balance_amount = totalAmount - finalPaidAmount;
      
      console.log(`💰 Payment Update: Purchase ${purchase.purchase_number}`, {
        previousPaid: currentPaidAmount,
        newPayment: newPaymentAmount,
        finalPaidAmount: finalPaidAmount,
        totalAmount: totalAmount,
        status: updateData.payment_status,
        isAdditionalPayment: isAdditionalPayment
      });
    }

    const updatedPurchase = await InventoryPurchase.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplier_id', 'supplier_name mobile email');

    res.status(200).json({
      success: true,
      message: 'Inventory purchase updated successfully',
      data: updatedPurchase
    });

  } catch (error) {
    console.error('Error updating inventory purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory purchase',
      error: error.message
    });
  }
};

// Delete inventory purchase
const deleteInventoryPurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await InventoryPurchase.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Inventory purchase not found'
      });
    }

    // If purchase was received, restore inventory
    if (purchase.status === 'Received') {
      for (let item of purchase.items) {
        const updatedPart = await Part.findByIdAndUpdate(
          item.part_id,
          { $inc: { stock_quantity: -item.quantity } },
          { new: true }
        );
        
        console.log(`📦 Inventory Restored (Delete): ${item.part_name} (${item.part_number}) - Removed ${item.quantity} units. New stock: ${updatedPart.stock_quantity}`);
      }
    }

    await InventoryPurchase.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Inventory purchase deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting inventory purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting inventory purchase',
      error: error.message
    });
  }
};

// Get purchase statistics
const getPurchaseStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = {};
    if (start_date || end_date) {
      dateFilter.purchase_date = {};
      if (start_date) dateFilter.purchase_date.$gte = new Date(start_date);
      if (end_date) dateFilter.purchase_date.$lte = new Date(end_date);
    }

    const stats = await InventoryPurchase.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: '$total_amount' },
          totalPaid: { $sum: '$paid_amount' },
          totalPending: { $sum: '$balance_amount' }
        }
      }
    ]);

    const statusStats = await InventoryPurchase.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$total_amount' }
        }
      }
    ]);

    const paymentStats = await InventoryPurchase.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$payment_status',
          count: { $sum: 1 },
          amount: { $sum: '$total_amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalPurchases: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalPending: 0
        },
        statusBreakdown: statusStats,
        paymentBreakdown: paymentStats
      }
    });

  } catch (error) {
    console.error('Error fetching purchase stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase statistics',
      error: error.message
    });
  }
};

// Get supplier-wise purchase summary
const getSupplierPurchaseSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = {};
    if (start_date || end_date) {
      dateFilter.purchase_date = {};
      if (start_date) dateFilter.purchase_date.$gte = new Date(start_date);
      if (end_date) dateFilter.purchase_date.$lte = new Date(end_date);
    }

    const summary = await InventoryPurchase.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$supplier_id',
          supplier_name: { $first: '$supplier_name' },
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: '$total_amount' },
          totalPaid: { $sum: '$paid_amount' },
          totalPending: { $sum: '$balance_amount' },
          lastPurchaseDate: { $max: '$purchase_date' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching supplier purchase summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier purchase summary',
      error: error.message
    });
  }
};

// Get payment history for a purchase
const getPaymentHistory = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await InventoryPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    const paymentHistory = await PaymentTransaction.find({ purchase_id: purchaseId })
      .sort({ payment_date: -1 })
      .populate('created_by', 'username email');

    // Calculate payment summary
    const totalPayments = paymentHistory.reduce((sum, payment) =>
      payment.transaction_type === 'Payment' ? sum + payment.payment_amount : sum - payment.payment_amount, 0
    );

    res.status(200).json({
      success: true,
      data: {
        purchase: {
          purchase_number: purchase.purchase_number,
          supplier_name: purchase.supplier_name,
          total_amount: purchase.total_amount,
          paid_amount: purchase.paid_amount,
          balance_amount: purchase.balance_amount,
          payment_status: purchase.payment_status
        },
        paymentHistory: paymentHistory,
        summary: {
          totalPayments: totalPayments,
          transactionCount: paymentHistory.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};

// Add a new payment transaction
const addPaymentTransaction = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { payment_amount, payment_method, payment_notes } = req.body;

    const purchase = await InventoryPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    if (!payment_amount || payment_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    const newPaidAmount = (purchase.paid_amount || 0) + payment_amount;
    
    // Ensure we don't exceed total amount
    if (newPaidAmount > purchase.total_amount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance. Maximum allowed: ₹${purchase.total_amount - purchase.paid_amount}`
      });
    }

    // Create payment transaction
    const paymentTransaction = new PaymentTransaction({
      purchase_id: purchase._id,
      purchase_number: purchase.purchase_number,
      supplier_id: purchase.supplier_id,
      supplier_name: purchase.supplier_name,
      payment_amount: payment_amount,
      payment_method: payment_method || 'Cash',
      payment_notes: payment_notes || `Payment of ₹${payment_amount}`,
      created_by: req.user?.id
    });

    await paymentTransaction.save();

    // Update purchase with new payment
    const updateData = {
      paid_amount: newPaidAmount,
      balance_amount: purchase.total_amount - newPaidAmount,
      payment_method: payment_method || purchase.payment_method
    };

    if (newPaidAmount >= purchase.total_amount) {
      updateData.payment_status = 'Paid';
    } else {
      updateData.payment_status = 'Partial';
    }

    const updatedPurchase = await InventoryPurchase.findByIdAndUpdate(
      purchaseId,
      updateData,
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Payment added successfully',
      data: {
        transaction: paymentTransaction,
        purchase: updatedPurchase
      }
    });

  } catch (error) {
    console.error('Error adding payment transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding payment transaction',
      error: error.message
    });
  }
};

module.exports = {
  addInventoryPurchase,
  getAllInventoryPurchases,
  getInventoryPurchaseById,
  updateInventoryPurchase,
  deleteInventoryPurchase,
  getPurchaseStats,
  getSupplierPurchaseSummary,
  getPaymentHistory,
  addPaymentTransaction
};