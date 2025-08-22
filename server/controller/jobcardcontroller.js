const JobCard = require('../model/jobcard');
const Customer = require('../model/customer');
const Part = require('../model/parts');

// ✅ Create new job card
exports.createJobCard = async (req, res) => {
  try {
    const {
      customer_id,
      service_type,
      complaint,
      parts_used,
      labor_entries,
      discount,
      mechanic_assigned,
      notes,
      priority,
      estimated_completion
    } = req.body;

    // Get customer details
    const customer = await Customer.findById(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Process parts used and validate
    let processedParts = [];
    if (parts_used && parts_used.length > 0) {
      for (let partItem of parts_used) {
        const part = await Part.findById(partItem.part_id);
        if (!part) {
          return res.status(404).json({
            success: false,
            message: `Part with ID ${partItem.part_id} not found`
          });
        }

        // Check stock availability
        if (part.stock_quantity < partItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for part ${part.name}. Available: ${part.stock_quantity}, Required: ${partItem.quantity}`
          });
        }

        processedParts.push({
          part_id: part._id,
          part_name: part.name,
          part_number: part.part_number,
          quantity: partItem.quantity,
          unit_price: part.selling_price,
          total_price: part.selling_price * partItem.quantity
        });
      }
    }

    const newJobCard = new JobCard({
      customer_id: customer._id,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_phone: customer.phone,
      vehicle_info: customer.vehicle_info,
      service_type,
      complaint,
      parts_used: processedParts,
      labor_entries: labor_entries || [],
      discount: discount || 0,
      mechanic_assigned: mechanic_assigned || '',
      notes: notes || '',
      priority: priority || 'Medium',
      estimated_completion: estimated_completion ? new Date(estimated_completion) : null
    });

    await newJobCard.save();

    // Update part stock quantities
    for (let partItem of processedParts) {
      const result = await Part.findByIdAndUpdate(
        partItem.part_id,
        { $inc: { stock_quantity: -partItem.quantity } },
        { new: true }
      );
      console.log(`📦 Created job card - reduced stock for ${partItem.part_name}: -${partItem.quantity}, new stock: ${result.stock_quantity}`);
    }

    // Update customer service count
    await Customer.findByIdAndUpdate(
      customer_id,
      { 
        $inc: { total_services: 1 },
        last_service_date: new Date()
      }
    );

    res.status(201).json({
      success: true,
      message: 'Job card created successfully!',
      data: newJobCard
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create job card'
    });
  }
};

// ✅ Get all job cards
exports.getAllJobCards = async (req, res) => {
  try {
    const { status, priority, customer_id } = req.query;
    
    let filter = {}; // No need to filter billed job cards since they are deleted
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (customer_id) filter.customer_id = customer_id;

    const jobCards = await JobCard.find(filter)
      .populate('customer_id', 'first_name last_name email phone')
      .populate('parts_used.part_id', 'name part_number category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: jobCards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job cards'
    });
  }
};

// ✅ Get job card by ID
exports.getJobCardById = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id)
      .populate('customer_id', 'first_name last_name email phone address city state')
      .populate('parts_used.part_id', 'name part_number category supplier');

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    res.status(200).json({
      success: true,
      data: jobCard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job card'
    });
  }
};

// ✅ Update job card (for non-parts updates)
exports.updateJobCard = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get the existing job card
    const existingJobCard = await JobCard.findById(id);
    if (!existingJobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    // Handle status updates with date tracking
    if (updateData.status) {
      const currentDate = new Date();
      switch (updateData.status) {
        case 'In Progress':
          updateData.date_started = currentDate;
          break;
        case 'Completed':
          updateData.date_completed = currentDate;
          break;
        case 'Delivered':
          updateData.date_delivered = currentDate;
          break;
      }
    }

    // Remove parts_used from updateData if present - parts should be updated via separate endpoint
    if (updateData.parts_used !== undefined) {
      console.log('⚠️ Parts update detected in general update - ignoring. Use addPartsToJobCard endpoint instead.');
      delete updateData.parts_used;
    }

    const updatedJobCard = await JobCard.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customer_id', 'first_name last_name email phone');

    if (!updatedJobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job card updated successfully!',
      data: updatedJobCard
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update job card'
    });
  }
};

// ✅ Update job card parts (handles both new parts addition and existing parts update)
exports.updateJobCardParts = async (req, res) => {
  try {
    const { id } = req.params;
    const { parts_used, update_mode = 'edit' } = req.body; // edit, add, replace, or update

    // Get the existing job card
    const existingJobCard = await JobCard.findById(id);
    if (!existingJobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    console.log(`🔄 Processing parts ${update_mode} for job card:`, id);
    
    // Helper function to normalize part ID
    const normalizePartId = (partId) => {
      if (typeof partId === 'string') return partId;
      if (partId && partId._id) return partId._id.toString();
      if (partId && partId.toString) return partId.toString();
      return String(partId);
    };

    // Create maps for existing parts
    const existingPartsMap = new Map();
    existingJobCard.parts_used.forEach(part => {
      const partId = normalizePartId(part.part_id);
      existingPartsMap.set(partId, {
        quantity: part.quantity,
        part_data: part
      });
    });

    console.log('📦 Existing parts:', Array.from(existingPartsMap.entries()).map(([id, data]) => `${id}: ${data.quantity}`));

    // Process incoming parts and remove duplicates
    const incomingPartsMap = new Map();
    if (parts_used && parts_used.length > 0) {
      for (let partItem of parts_used) {
        const partId = normalizePartId(partItem.part_id);
        
        // Handle duplicates in incoming parts by adding quantities
        if (incomingPartsMap.has(partId)) {
          const existing = incomingPartsMap.get(partId);
          existing.quantity += partItem.quantity;
          console.log(`⚠️ Duplicate part in request: ${partId}, combined quantity: ${existing.quantity}`);
        } else {
          incomingPartsMap.set(partId, { ...partItem, part_id: partId });
        }
      }
    }

    console.log('📝 Incoming parts:', Array.from(incomingPartsMap.entries()).map(([id, data]) => `${id}: ${data.quantity}`));

    // Calculate final parts based on update mode
    const finalPartsMap = new Map();
    const inventoryChanges = new Map(); // Track inventory changes needed

    if (update_mode === 'edit') {
      // Edit mode: Smart update - only subtract newly added parts from inventory
      console.log('✏️ Edit mode: only new parts will be subtracted from inventory');
      
      // Set final parts to incoming parts (this is the new state)
      incomingPartsMap.forEach((data, partId) => {
        finalPartsMap.set(partId, { ...data });
      });
      
      // Calculate inventory changes: only subtract the difference for new/increased parts
      incomingPartsMap.forEach((incomingData, partId) => {
        const existingData = existingPartsMap.get(partId);
        
        if (existingData) {
          // Part already exists - only subtract the difference if quantity increased
          const qtyDiff = incomingData.quantity - existingData.quantity;
          if (qtyDiff > 0) {
            console.log(`📈 Part ${partId} quantity increased: ${existingData.quantity} → ${incomingData.quantity} (diff: +${qtyDiff})`);
            inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) - qtyDiff);
          } else if (qtyDiff < 0) {
            console.log(`📉 Part ${partId} quantity decreased: ${existingData.quantity} → ${incomingData.quantity} (diff: ${qtyDiff})`);
            inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) - qtyDiff);
          } else {
            console.log(`➡️ Part ${partId} quantity unchanged: ${existingData.quantity}`);
          }
        } else {
          // New part - subtract full quantity from inventory
          console.log(`🆕 New part ${partId}: ${incomingData.quantity} (will subtract from inventory)`);
          inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) - incomingData.quantity);
        }
      });
      
      // Handle removed parts - restore to inventory
      existingPartsMap.forEach((existingData, partId) => {
        if (!incomingPartsMap.has(partId)) {
          console.log(`🗑️ Part ${partId} removed: ${existingData.quantity} (will restore to inventory)`);
          inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) + existingData.quantity);
        }
      });
      
    } else if (update_mode === 'replace') {
      // Replace mode: completely replace existing parts with new ones
      console.log('🔄 Replace mode: replacing all existing parts');
      
      // Restore all existing parts to inventory
      existingPartsMap.forEach((data, partId) => {
        inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) + data.quantity);
      });
      
      // Set final parts to incoming parts only
      incomingPartsMap.forEach((data, partId) => {
        finalPartsMap.set(partId, { ...data });
        inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) - data.quantity);
      });
      
    } else if (update_mode === 'update') {
      // Update mode: update existing parts quantities, add new parts
      console.log('🔄 Update mode: updating existing parts and adding new ones');
      
      // Start with existing parts
      existingPartsMap.forEach((data, partId) => {
        finalPartsMap.set(partId, { ...data.part_data });
      });
      
      // Update or add incoming parts
      incomingPartsMap.forEach((data, partId) => {
        if (existingPartsMap.has(partId)) {
          // Update existing part
          const existingQty = existingPartsMap.get(partId).quantity;
          const newQty = data.quantity;
          const qtyDiff = newQty - existingQty;
          
          console.log(`🔄 Updating part ${partId}: ${existingQty} → ${newQty} (diff: ${qtyDiff})`);
          
          const existingPart = existingPartsMap.get(partId).part_data;
          finalPartsMap.set(partId, {
            part_id: existingPart.part_id,
            part_name: existingPart.part_name,
            part_number: existingPart.part_number,
            quantity: newQty,
            unit_price: existingPart.unit_price,
            total_price: existingPart.unit_price * newQty
          });
          inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) - qtyDiff);
        } else {
          // Add new part
          console.log(`🆕 Adding new part ${partId}: ${data.quantity}`);
          finalPartsMap.set(partId, { ...data });
          inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) - data.quantity);
        }
      });
      
    } else {
      // Add mode: add incoming parts to existing parts
      console.log('🔄 Add mode: adding new parts to existing ones');
      
      // Start with existing parts
      existingPartsMap.forEach((data, partId) => {
        finalPartsMap.set(partId, { ...data.part_data });
      });
      
      // Add incoming parts
      incomingPartsMap.forEach((data, partId) => {
        if (existingPartsMap.has(partId)) {
          // Add to existing part
          const existingQty = existingPartsMap.get(partId).quantity;
          const addQty = data.quantity;
          const newQty = existingQty + addQty;
          
          console.log(`➕ Adding to existing part ${partId}: ${existingQty} + ${addQty} = ${newQty}`);
          
          const existingPart = existingPartsMap.get(partId).part_data;
          finalPartsMap.set(partId, {
            part_id: existingPart.part_id,
            part_name: existingPart.part_name,
            part_number: existingPart.part_number,
            quantity: newQty,
            unit_price: existingPart.unit_price,
            total_price: existingPart.unit_price * newQty
          });
          inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) - addQty);
        } else {
          // Add new part
          console.log(`🆕 Adding new part ${partId}: ${data.quantity}`);
          finalPartsMap.set(partId, { ...data });
          inventoryChanges.set(partId, (inventoryChanges.get(partId) || 0) - data.quantity);
        }
      });
    }

    console.log('📊 Final parts:', Array.from(finalPartsMap.entries()).map(([id, data]) => `${id}: ${data.quantity}`));
    console.log('📈 Inventory changes:', Array.from(inventoryChanges.entries()));

    // Validate and fetch part details for new parts
    const processedParts = [];
    for (let [partId, partData] of finalPartsMap) {
      let processedPart;
      
      if (!partData.part_name || !partData.part_number || !partData.unit_price) {
        // Fetch part details from database
        const part = await Part.findById(partId);
        if (!part) {
          return res.status(404).json({
            success: false,
            message: `Part with ID ${partId} not found`
          });
        }
        
        processedPart = {
          part_id: part._id,
          part_name: part.name,
          part_number: part.part_number,
          quantity: partData.quantity,
          unit_price: part.selling_price,
          total_price: part.selling_price * partData.quantity
        };
      } else {
        processedPart = {
          part_id: partData.part_id || partId,
          part_name: partData.part_name,
          part_number: partData.part_number,
          quantity: partData.quantity,
          unit_price: partData.unit_price,
          total_price: partData.unit_price * partData.quantity
        };
      }
      
      processedParts.push(processedPart);
    }

    // Validate stock availability for parts that need more inventory
    for (let [partId, qtyChange] of inventoryChanges) {
      if (qtyChange < 0) { // Negative means we need more parts from inventory
        const neededQty = Math.abs(qtyChange);
        try {
          const part = await Part.findById(partId);
          if (!part) {
            return res.status(404).json({
              success: false,
              message: `Part with ID ${partId} not found`
            });
          }

          console.log(`✅ Stock check for ${part.name}: available ${part.stock_quantity}, need ${neededQty}`);
          if (part.stock_quantity < neededQty) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for part ${part.name}. Available: ${part.stock_quantity}, Required: ${neededQty}`
            });
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: `Error validating part ${partId}: ${error.message}`
          });
        }
      }
    }

    // Apply inventory changes
    for (let [partId, qtyChange] of inventoryChanges) {
      if (qtyChange !== 0) {
        try {
          const result = await Part.findByIdAndUpdate(
            partId,
            { $inc: { stock_quantity: qtyChange } },
            { new: true }
          );
          console.log(`📦 Applied inventory change for part ${partId}: ${qtyChange > 0 ? '+' : ''}${qtyChange}, new stock: ${result.stock_quantity}`);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: `Error updating inventory for part ${partId}: ${error.message}`
          });
        }
      }
    }
    
    // Update the job card with final parts and trigger recalculation
    const jobCardToUpdate = await JobCard.findById(id);
    if (!jobCardToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    // Update parts and save to trigger pre-save middleware
    jobCardToUpdate.parts_used = processedParts;
    const updatedJobCard = await jobCardToUpdate.save();

    // Populate customer data for response
    await updatedJobCard.populate('customer_id', 'first_name last_name email phone');

    res.status(200).json({
      success: true,
      message: `Job card parts ${update_mode}ed successfully!`,
      data: updatedJobCard
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update job card parts'
    });
  }
};

// ✅ Add parts to existing job card
exports.addPartsToJobCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { parts_to_add } = req.body;

    const jobCard = await JobCard.findById(id);
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    // Process and validate new parts
    let newParts = [];
    for (let partItem of parts_to_add) {
      const part = await Part.findById(partItem.part_id);
      if (!part) {
        return res.status(404).json({
          success: false,
          message: `Part with ID ${partItem.part_id} not found`
        });
      }

      if (part.stock_quantity < partItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for part ${part.name}`
        });
      }

      newParts.push({
        part_id: part._id,
        part_name: part.name,
        part_number: part.part_number,
        quantity: partItem.quantity,
        unit_price: part.selling_price,
        total_price: part.selling_price * partItem.quantity
      });

      // Update stock
      await Part.findByIdAndUpdate(
        part._id,
        { $inc: { stock_quantity: -partItem.quantity } }
      );
    }

    // Add new parts to job card
    jobCard.parts_used.push(...newParts);
    await jobCard.save();

    res.status(200).json({
      success: true,
      message: 'Parts added to job card successfully!',
      data: jobCard
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add parts to job card'
    });
  }
};

// ✅ Recalculate totals for existing job cards (fix calculation issues)
exports.recalculateJobCardTotals = async (req, res) => {
  try {
    const jobCards = await JobCard.find();
    let updatedCount = 0;

    for (let jobCard of jobCards) {
      // Recalculate parts total
      jobCard.parts_total = jobCard.parts_used.reduce((total, part) => total + (part.total_price || 0), 0);
      
      // Recalculate labor total from multiple labor entries, fallback to old labor_charges for backward compatibility
      if (jobCard.labor_entries && jobCard.labor_entries.length > 0) {
        jobCard.labor_total = jobCard.labor_entries.reduce((total, labor) => total + (labor.total_amount || 0), 0);
        // Clear old labor_charges when using new system
        jobCard.labor_charges = 0;
        jobCard.labor_hours = 0;
      } else {
        jobCard.labor_total = jobCard.labor_charges || 0;
      }
      
      // Recalculate subtotal
      jobCard.subtotal = jobCard.parts_total + jobCard.labor_total;
      
      // Recalculate GST (18% on subtotal)
      jobCard.gst_amount = Math.round((jobCard.subtotal * 18) / 100);
      
      // Recalculate total amount (subtotal + GST - discount)
      jobCard.total_amount = jobCard.subtotal + jobCard.gst_amount - (jobCard.discount || 0);
      
      await jobCard.save();
      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully recalculated totals for ${updatedCount} job cards`,
      data: { updated_count: updatedCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate job card totals'
    });
  }
};

// ✅ Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, amount_paid, payment_method } = req.body;

    const jobCard = await JobCard.findByIdAndUpdate(
      id,
      {
        payment_status,
        amount_paid: amount_paid || 0,
        payment_method: payment_method || ''
      },
      { new: true }
    );

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully!',
      data: jobCard
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update payment status'
    });
  }
};

// ✅ Delete job card
exports.deleteJobCard = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id);
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    // Restore part stock quantities if job card is deleted
    console.log('🗑️ Deleting job card, restoring inventory for', jobCard.parts_used.length, 'parts');
    for (let partItem of jobCard.parts_used) {
      const result = await Part.findByIdAndUpdate(
        partItem.part_id,
        { $inc: { stock_quantity: partItem.quantity } },
        { new: true }
      );
      console.log(`📦 Restored ${partItem.quantity} units for ${partItem.part_name}, new stock: ${result.stock_quantity}`);
    }

    await JobCard.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job card deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete job card'
    });
  }
};

// ✅ Get job card statistics
exports.getJobCardStats = async (req, res) => {
  try {
    const totalJobCards = await JobCard.countDocuments();
    const openJobCards = await JobCard.countDocuments({ status: 'Open' });
    const inProgressJobCards = await JobCard.countDocuments({ status: 'In Progress' });
    const completedJobCards = await JobCard.countDocuments({ status: 'Completed' });
    
    const totalRevenue = await JobCard.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);

    const pendingPayments = await JobCard.aggregate([
      { $match: { payment_status: { $in: ['Pending', 'Partial'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$total_amount', '$amount_paid'] } } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_job_cards: totalJobCards,
        open_job_cards: openJobCards,
        in_progress_job_cards: inProgressJobCards,
        completed_job_cards: completedJobCards,
        total_revenue: totalRevenue[0]?.total || 0,
        pending_payments: pendingPayments[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job card statistics'
    });
  }
};