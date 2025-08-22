const Part = require('../model/parts');

// ✅ Add new part (with GST calculation)
exports.addPart = async (req, res) => {
  try {
    console.log('📝 Raw request body:', req.body);
    console.log('📝 Request headers:', req.headers);

    let { name, part_number, category, stock_quantity, cost_price, selling_price, gst_rate, supplier, rack_location, min_stock_level } = req.body;

    // Debug logging with detailed type information
    console.log('📝 Adding new part with detailed data:', {
      name: { value: name, type: typeof name },
      part_number: { value: part_number, type: typeof part_number },
      category: { value: category, type: typeof category },
      stock_quantity: { value: stock_quantity, type: typeof stock_quantity },
      cost_price: { value: cost_price, type: typeof cost_price, isNaN: isNaN(cost_price) },
      selling_price: { value: selling_price, type: typeof selling_price, isNaN: isNaN(selling_price) },
      gst_rate: { value: gst_rate, type: typeof gst_rate },
      supplier: { value: supplier, type: typeof supplier },
      rack_location: { value: rack_location, type: typeof rack_location },
      min_stock_level: { value: min_stock_level, type: typeof min_stock_level }
    });

    // Validate required fields
    if (!cost_price || cost_price === '' || cost_price === null || cost_price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Cost price is required and cannot be empty'
      });
    }

    // Convert to numbers with strict validation
    const validCostPrice = parseFloat(cost_price);
    const validSellingPrice = parseFloat(selling_price);
    const validGstRate = parseFloat(gst_rate) || 18;
    const validStockQuantity = parseInt(stock_quantity) || 0;
    const validMinStockLevel = parseInt(min_stock_level) || 5;

    // Check if conversions were successful
    if (isNaN(validCostPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cost price value'
      });
    }

    if (isNaN(validSellingPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid selling price value'
      });
    }

    // GST Amount calculate
    const gst_amount = (validSellingPrice * validGstRate) / 100;

    console.log('📝 Final processed values:', {
      validCostPrice: { value: validCostPrice, type: typeof validCostPrice },
      validSellingPrice: { value: validSellingPrice, type: typeof validSellingPrice },
      validGstRate: { value: validGstRate, type: typeof validGstRate },
      gst_amount: { value: gst_amount, type: typeof gst_amount }
    });

    // Create part object with explicit values
    const partData = {
      name: String(name),
      part_number: String(part_number),
      category: String(category),
      stock_quantity: validStockQuantity,
      cost_price: validCostPrice,
      selling_price: validSellingPrice,
      gst_rate: validGstRate,
      gst_amount: gst_amount,
      supplier: String(supplier),
      rack_location: String(rack_location),
      min_stock_level: validMinStockLevel
    };

    console.log('📝 Part data object before creating model:', partData);

    const newPart = new Part(partData);

    console.log('📝 New part model before save:', {
      cost_price: newPart.cost_price,
      selling_price: newPart.selling_price,
      cost_price_type: typeof newPart.cost_price,
      selling_price_type: typeof newPart.selling_price
    });

    const savedPart = await newPart.save();
    
    console.log('✅ Part saved successfully:', {
      id: savedPart._id,
      name: savedPart.name,
      cost_price: savedPart.cost_price,
      selling_price: savedPart.selling_price,
      cost_price_type: typeof savedPart.cost_price,
      selling_price_type: typeof savedPart.selling_price
    });

    // Fetch the saved part back to verify
    const verifyPart = await Part.findById(savedPart._id);
    console.log('🔍 Verification - Part fetched from DB:', {
      id: verifyPart._id,
      name: verifyPart.name,
      cost_price: verifyPart.cost_price,
      selling_price: verifyPart.selling_price,
      cost_price_type: typeof verifyPart.cost_price
    });

    res.status(201).json({
      success: true,
      message: 'Part added successfully!',
      data: savedPart
    });
  } catch (error) {
    console.error('❌ Error adding part:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add part'
    });
  }
};

// ✅ Update part (with GST calculation)
exports.updatePart = async (req, res) => {
  try {
    let { selling_price, gst_rate, cost_price } = req.body;

    console.log('📝 Updating part with data:', req.body);

    // Ensure numeric values are properly converted
    if (cost_price !== undefined) {
      req.body.cost_price = cost_price && !isNaN(cost_price) ? Number(cost_price) : 0;
    }
    
    if (selling_price !== undefined) {
      req.body.selling_price = selling_price && !isNaN(selling_price) ? Number(selling_price) : 0;
    }
    
    if (gst_rate !== undefined) {
      req.body.gst_rate = gst_rate && !isNaN(gst_rate) ? Number(gst_rate) : 18;
    }

    // Recalculate GST amount if selling_price or gst_rate is updated
    if (req.body.selling_price !== undefined && req.body.gst_rate !== undefined) {
      req.body.gst_amount = (req.body.selling_price * req.body.gst_rate) / 100;
    }

    console.log('📝 Processed update data:', req.body);

    const updatedPart = await Part.findByIdAndUpdate(req.params.id, req.body, { new: true });

    console.log('✅ Part updated successfully:', {
      id: updatedPart._id,
      name: updatedPart.name,
      cost_price: updatedPart.cost_price,
      selling_price: updatedPart.selling_price
    });

    res.status(200).json({
      success: true,
      message: 'Part updated successfully!',
      data: updatedPart
    });
  } catch (error) {
    console.error('❌ Error updating part:', error);
    res.status(400).json({ success: false, message: 'Failed to update part' });
  }
};

// ✅ Get all parts
exports.getAllParts = async (req, res) => {
  try {
    const parts = await Part.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: parts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parts'
    });
  }
};

// ✅ Get part by ID
exports.getPartById = async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }
    res.status(200).json({
      success: true,
      data: part
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch part'
    });
  }
};

// ✅ Delete part
exports.deletePart = async (req, res) => {
  try {
    const deleted = await Part.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Part deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete part'
    });
  }
};

// ✅ Get dashboard parts reports (today and this week)
exports.getDashboardPartsReports = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of this week (Sunday)

    // Today's parts data
    const todayParts = await Part.find({
      createdAt: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    // This week's parts data
    const thisWeekParts = await Part.find({
      createdAt: { $gte: thisWeekStart, $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
    });

    // All parts for inventory stats
    const allParts = await Part.find();

    // Get low stock parts details
    const lowStockPartsToday = allParts.filter(part => part.stock_quantity <= part.min_stock_level && part.stock_quantity > 0);
    const outOfStockPartsToday = allParts.filter(part => part.stock_quantity === 0);

    // Calculate today's stats
    const todayStats = {
      totalParts: todayParts.length,
      totalValue: todayParts.reduce((sum, part) => sum + (part.selling_price * part.stock_quantity), 0),
      lowStockParts: todayParts.filter(part => part.stock_quantity <= part.min_stock_level).length,
      outOfStockParts: todayParts.filter(part => part.stock_quantity === 0).length
    };

    // Calculate this week's stats
    const thisWeekStats = {
      totalParts: thisWeekParts.length,
      totalValue: thisWeekParts.reduce((sum, part) => sum + (part.selling_price * part.stock_quantity), 0),
      lowStockParts: thisWeekParts.filter(part => part.stock_quantity <= part.min_stock_level).length,
      outOfStockParts: thisWeekParts.filter(part => part.stock_quantity === 0).length
    };

    // Overall inventory stats
    const inventoryStats = {
      totalParts: allParts.length,
      totalValue: allParts.reduce((sum, part) => sum + (part.selling_price * part.stock_quantity), 0),
      inStockParts: allParts.filter(part => part.stock_quantity > part.min_stock_level).length,
      lowStockParts: allParts.filter(part => part.stock_quantity <= part.min_stock_level && part.stock_quantity > 0).length,
      outOfStockParts: allParts.filter(part => part.stock_quantity === 0).length
    };

    // Low stock parts details for today
    const lowStockDetails = lowStockPartsToday.map(part => ({
      name: part.name,
      part_number: part.part_number,
      current_stock: part.stock_quantity,
      min_stock_level: part.min_stock_level,
      category: part.category
    }));

    // Out of stock parts details for today
    const outOfStockDetails = outOfStockPartsToday.map(part => ({
      name: part.name,
      part_number: part.part_number,
      category: part.category,
      min_stock_level: part.min_stock_level
    }));

    res.status(200).json({
      success: true,
      data: {
        today: todayStats,
        thisWeek: thisWeekStats,
        inventory: inventoryStats,
        lowStockDetails: lowStockDetails,
        outOfStockDetails: outOfStockDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard parts reports'
    });
  }
};

// ✅ Get low stock alerts
exports.getLowStockAlerts = async (req, res) => {
  try {
    // Get parts where stock_quantity <= min_stock_level
    const lowStockParts = await Part.find({
      $expr: { $lte: ['$stock_quantity', '$min_stock_level'] }
    }).sort({ stock_quantity: 1 });

    // Get out of stock parts
    const outOfStockParts = await Part.find({
      stock_quantity: 0
    }).sort({ name: 1 });

    // Get critical stock parts (stock < 50% of min level)
    const criticalStockParts = await Part.find({
      $expr: { $lt: ['$stock_quantity', { $multiply: ['$min_stock_level', 0.5] }] },
      stock_quantity: { $gt: 0 }
    }).sort({ stock_quantity: 1 });

    res.status(200).json({
      success: true,
      data: {
        lowStock: lowStockParts.map(part => ({
          _id: part._id,
          name: part.name,
          part_number: part.part_number,
          current_stock: part.stock_quantity,
          min_stock_level: part.min_stock_level,
          category: part.category,
          rack_location: part.rack_location,
          supplier: part.supplier,
          status: part.stock_quantity === 0 ? 'Out of Stock' :
                  part.stock_quantity < (part.min_stock_level * 0.5) ? 'Critical' : 'Low Stock'
        })),
        outOfStock: outOfStockParts.map(part => ({
          _id: part._id,
          name: part.name,
          part_number: part.part_number,
          category: part.category,
          rack_location: part.rack_location,
          supplier: part.supplier,
          min_stock_level: part.min_stock_level
        })),
        critical: criticalStockParts.map(part => ({
          _id: part._id,
          name: part.name,
          part_number: part.part_number,
          current_stock: part.stock_quantity,
          min_stock_level: part.min_stock_level,
          category: part.category,
          rack_location: part.rack_location,
          supplier: part.supplier
        })),
        summary: {
          totalLowStock: lowStockParts.length,
          totalOutOfStock: outOfStockParts.length,
          totalCritical: criticalStockParts.length,
          totalAlerts: lowStockParts.length + outOfStockParts.length + criticalStockParts.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock alerts',
      error: error.message
    });
  }
};

// ✅ Get inventory valuation report
exports.getInventoryValuation = async (req, res) => {
  try {
    const parts = await Part.find();
    
    let totalCostValue = 0;
    let totalSellingValue = 0;
    let totalItems = 0;
    let categoryBreakdown = {};
    
    const valuationData = parts.map(part => {
      const costValue = part.stock_quantity * part.cost_price;
      const sellingValue = part.stock_quantity * part.selling_price;
      
      totalCostValue += costValue;
      totalSellingValue += sellingValue;
      totalItems += part.stock_quantity;
      
      // Category breakdown
      if (!categoryBreakdown[part.category]) {
        categoryBreakdown[part.category] = {
          totalParts: 0,
          totalQuantity: 0,
          totalCostValue: 0,
          totalSellingValue: 0
        };
      }
      
      categoryBreakdown[part.category].totalParts += 1;
      categoryBreakdown[part.category].totalQuantity += part.stock_quantity;
      categoryBreakdown[part.category].totalCostValue += costValue;
      categoryBreakdown[part.category].totalSellingValue += sellingValue;
      
      return {
        _id: part._id,
        name: part.name,
        part_number: part.part_number,
        category: part.category,
        stock_quantity: part.stock_quantity,
        cost_price: part.cost_price,
        selling_price: part.selling_price,
        cost_value: costValue,
        selling_value: sellingValue,
        potential_profit: sellingValue - costValue,
        rack_location: part.rack_location,
        supplier: part.supplier
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalParts: parts.length,
          totalItems: totalItems,
          totalCostValue: totalCostValue,
          totalSellingValue: totalSellingValue,
          potentialProfit: totalSellingValue - totalCostValue,
          profitMargin: totalCostValue > 0 ? ((totalSellingValue - totalCostValue) / totalCostValue * 100) : 0
        },
        categoryBreakdown: Object.keys(categoryBreakdown).map(category => ({
          category,
          ...categoryBreakdown[category],
          profitMargin: categoryBreakdown[category].totalCostValue > 0 ?
            ((categoryBreakdown[category].totalSellingValue - categoryBreakdown[category].totalCostValue) / categoryBreakdown[category].totalCostValue * 100) : 0
        })),
        parts: valuationData.sort((a, b) => b.selling_value - a.selling_value)
      }
    });
  } catch (error) {
    console.error('Error generating inventory valuation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory valuation report',
      error: error.message
    });
  }
};

// ✅ Test endpoint to verify cost price data
exports.testCostPrice = async (req, res) => {
  try {
    console.log('🧪 Test endpoint called with body:', req.body);
    
    const { name, cost_price, selling_price } = req.body;
    
    // Create a simple test part
    const testPart = new Part({
      name: name || 'Test Part',
      part_number: 'TEST-' + Date.now(),
      category: 'Test',
      stock_quantity: 1,
      cost_price: Number(cost_price) || 100,
      selling_price: Number(selling_price) || 150,
      gst_rate: 18,
      gst_amount: ((Number(selling_price) || 150) * 18) / 100,
      supplier: 'Test Supplier',
      rack_location: 'T1',
      min_stock_level: 1
    });

    console.log('🧪 Test part before save:', {
      name: testPart.name,
      cost_price: testPart.cost_price,
      selling_price: testPart.selling_price,
      typeof_cost_price: typeof testPart.cost_price
    });

    await testPart.save();

    console.log('🧪 Test part after save:', {
      id: testPart._id,
      name: testPart.name,
      cost_price: testPart.cost_price,
      selling_price: testPart.selling_price,
      typeof_cost_price: typeof testPart.cost_price
    });

    // Fetch it back from database to verify
    const savedPart = await Part.findById(testPart._id);
    console.log('🧪 Test part fetched from DB:', {
      id: savedPart._id,
      name: savedPart.name,
      cost_price: savedPart.cost_price,
      selling_price: savedPart.selling_price,
      typeof_cost_price: typeof savedPart.cost_price
    });

    res.status(200).json({
      success: true,
      message: 'Test completed',
      data: {
        beforeSave: {
          cost_price: testPart.cost_price,
          selling_price: testPart.selling_price
        },
        afterSave: {
          cost_price: savedPart.cost_price,
          selling_price: savedPart.selling_price
        }
      }
    });
  } catch (error) {
    console.error('🧪 Test error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
};

// ✅ Debug endpoint to check all parts cost prices
exports.debugAllParts = async (req, res) => {
  try {
    const parts = await Part.find().select('name part_number cost_price selling_price').limit(10);
    
    console.log('🔍 Debug - All parts cost prices:');
    parts.forEach(part => {
      console.log(`  ${part.name} (${part.part_number}): cost_price=${part.cost_price} (${typeof part.cost_price}), selling_price=${part.selling_price}`);
    });

    res.status(200).json({
      success: true,
      data: parts.map(part => ({
        name: part.name,
        part_number: part.part_number,
        cost_price: part.cost_price,
        selling_price: part.selling_price,
        cost_price_type: typeof part.cost_price
      }))
    });
  } catch (error) {
    console.error('🔍 Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
};

// ✅ Migration function to update parts without cost_price
exports.migrateCostPrice = async (req, res) => {
  try {
    // Find parts that don't have cost_price or have null/undefined cost_price
    const partsWithoutCostPrice = await Part.find({
      $or: [
        { cost_price: { $exists: false } },
        { cost_price: null },
        { cost_price: undefined },
        { cost_price: 0 }
      ]
    });

    console.log(`Found ${partsWithoutCostPrice.length} parts without cost_price`);

    let updatedCount = 0;
    for (let part of partsWithoutCostPrice) {
      // Set cost_price to selling_price * 0.8 (assuming 20% markup) if not set
      const defaultCostPrice = part.selling_price ? part.selling_price * 0.8 : 0;
      
      await Part.findByIdAndUpdate(part._id, {
        cost_price: defaultCostPrice
      });
      
      updatedCount++;
      console.log(`Updated part ${part.name} (${part.part_number}) with cost_price: ₹${defaultCostPrice}`);
    }

    res.status(200).json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} parts with cost_price.`,
      data: {
        totalPartsFound: partsWithoutCostPrice.length,
        partsUpdated: updatedCount
      }
    });
  } catch (error) {
    console.error('Error in cost price migration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to migrate cost price',
      error: error.message
    });
  }
};
