const Billing = require('../model/billing');
const Customer = require('../model/customer');
const JobCard = require('../model/jobcard');
const Part = require('../model/parts');
const fs = require('fs');
const path = require('path');
const { sendBillReadyNotification } = require('../services/emailService');

// Function to get logo as base64
const getLogoBase64 = () => {
  try {
    const logoPath = path.join(__dirname, '../image/logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.log('Logo file not found, using fallback');
  }
  return null;
};

// ✅ Create new bill
exports.createBill = async (req, res) => {
  try {
    const {
      customer_id,
      jobcard_id,
      items,
      discount,
      notes,
      payment_status,
      amount_paid,
      payment_method,
      gst_enabled,
      cgst_rate,
      sgst_rate
    } = req.body;

    // Get customer details
    const customer = await Customer.findById(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Process items
    let processedItems = [];
    if (items && items.length > 0) {
      for (let item of items) {
        processedItems.push({
          item_type: item.item_type || 'part',
          item_id: item.item_id || item.partId,
          item_name: item.item_name || item.partName,
          description: item.description || '',
          quantity: item.quantity,
          unit_price: item.unit_price || item.selling_price,
          total_price: (item.unit_price || item.selling_price) * item.quantity
        });
      }
    }

    const newBill = new Billing({
      customer_id: customer._id,
      jobcard_id: jobcard_id || null,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email,
      items: processedItems,
      discount: discount || 0,
      notes: notes || '',
      payment_status: payment_status || 'pending',
      amount_paid: amount_paid || 0,
      payment_method: payment_method || '',
      gst_enabled: gst_enabled !== undefined ? gst_enabled : true,
      cgst_rate: cgst_rate || 9,
      sgst_rate: sgst_rate || 9
    });

    await newBill.save();

    // Email notification removed - now manual from billing page

    res.status(201).json({
      success: true,
      message: 'Bill created successfully!',
      data: newBill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create bill'
    });
  }
};

// ✅ Create bill from jobcard
exports.createBillFromJobCard = async (req, res) => {
  try {
    const { jobcard_id } = req.params;
    
    // Get jobcard with customer details
    const jobCard = await JobCard.findById(jobcard_id).populate('customer_id');
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    // Check if bill already exists for this jobcard
    const existingBill = await Billing.findOne({ jobcard_id: jobcard_id });
    if (existingBill) {
      // Delete the job card even if bill already exists
      await JobCard.findByIdAndDelete(jobcard_id);
      
      return res.status(400).json({
        success: false,
        message: 'Bill already exists for this job card',
        data: existingBill
      });
    }

    // Prepare items from jobcard
    let items = [];
    
    // Add parts
    if (jobCard.parts_used && jobCard.parts_used.length > 0) {
      for (let part of jobCard.parts_used) {
        items.push({
          item_type: 'part',
          item_id: part.part_id,
          item_name: part.part_name,
          description: `Part: ${part.part_number}`,
          quantity: part.quantity,
          unit_price: part.unit_price,
          total_price: part.total_price
        });
      }
    }
    
    // Add labor entries
    if (jobCard.labor_entries && jobCard.labor_entries.length > 0) {
      for (let labor of jobCard.labor_entries) {
        items.push({
          item_type: 'service',
          item_id: labor._id,
          item_name: labor.labor_type,
          description: `Service: ${labor.labor_type}`,
          quantity: 1,
          unit_price: labor.total_amount,
          total_price: labor.total_amount
        });
      }
    }

    const newBill = new Billing({
      customer_id: jobCard.customer_id._id,
      jobcard_id: jobCard._id,
      first_name: jobCard.customer_id.first_name,
      last_name: jobCard.customer_id.last_name,
      phone: jobCard.customer_id.phone,
      email: jobCard.customer_id.email,
      items: items,
      discount: jobCard.discount || 0,
      notes: `Bill generated from Job Card: ${jobCard.job_card_number}`,
      gst_enabled: true, // Default to GST enabled for job card bills
      cgst_rate: 9,
      sgst_rate: 9
    });

    await newBill.save();

    // Email notification removed - now manual from billing page

    // Delete the job card after bill creation
    await JobCard.findByIdAndDelete(jobcard_id);

    res.status(201).json({
      success: true,
      message: 'Bill created from job card successfully! Job card has been removed.',
      data: newBill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create bill from job card'
    });
  }
};

// ✅ Get all bills
exports.getAllBills = async (req, res) => {
  try {
    const { customer_id, payment_status } = req.query;
    
    let filter = {};
    if (customer_id) filter.customer_id = customer_id;
    if (payment_status) filter.payment_status = payment_status;

    const bills = await Billing.find(filter)
      .populate('customer_id', 'first_name last_name email phone vehicle_number kilometer')
      .populate('jobcard_id', 'job_card_number service_type')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills'
    });
  }
};

// ✅ Get bill by ID
exports.getBillById = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('customer_id', 'first_name last_name email phone address city state vehicle_number kilometer')
      .populate('jobcard_id', 'job_card_number service_type complaint');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill'
    });
  }
};

// ✅ Update bill
exports.updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle payment status updates without processing items
    if (updateData.paymentStatus || updateData.payment_status || updateData.amountPaid !== undefined || updateData.amount_paid !== undefined || updateData.paymentMethod || updateData.payment_method) {
      const paymentUpdateData = {};
      
      if (updateData.paymentStatus) {
        paymentUpdateData.payment_status = updateData.paymentStatus;
      }
      if (updateData.payment_status) {
        paymentUpdateData.payment_status = updateData.payment_status;
      }
      if (updateData.amountPaid !== undefined) {
        paymentUpdateData.amount_paid = updateData.amountPaid;
      }
      if (updateData.amount_paid !== undefined) {
        paymentUpdateData.amount_paid = updateData.amount_paid;
      }
      if (updateData.paymentMethod) {
        paymentUpdateData.payment_method = updateData.paymentMethod;
      }
      if (updateData.payment_method) {
        paymentUpdateData.payment_method = updateData.payment_method;
      }
      if (updateData.notes) {
        paymentUpdateData.notes = updateData.notes;
      }

      const updatedBill = await Billing.findByIdAndUpdate(
        id,
        paymentUpdateData,
        { new: true, runValidators: true }
      ).populate('customer_id', 'first_name last_name email phone');

      if (!updatedBill) {
        return res.status(404).json({
          success: false,
          message: 'Bill not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Bill updated successfully!',
        data: updatedBill
      });
    }

    // Process items only if provided and not a payment update
    if (updateData.items && updateData.items.length > 0) {
      let processedItems = [];
      for (let item of updateData.items) {
        // Skip items with undefined critical fields
        if (!item.item_name || item.unit_price === undefined || !item.quantity) {
          continue;
        }
        
        processedItems.push({
          item_type: item.item_type || 'part',
          item_id: item.item_id || item.partId || null,
          item_name: item.item_name || item.partName,
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || item.selling_price || 0,
          total_price: (item.unit_price || item.selling_price || 0) * (item.quantity || 1)
        });
      }
      updateData.items = processedItems;
    }

    const updatedBill = await Billing.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customer_id', 'first_name last_name email phone');

    if (!updatedBill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully!',
      data: updatedBill
    });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update bill'
    });
  }
};

// ✅ Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, amount_paid, payment_method } = req.body;

    const bill = await Billing.findByIdAndUpdate(
      id,
      {
        payment_status,
        amount_paid: amount_paid || 0,
        payment_method: payment_method || ''
      },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully!',
      data: bill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update payment status'
    });
  }
};

// ✅ Generate receipt/invoice with GST option
exports.generateReceiptWithGST = async (req, res) => {
  try {
    const { withGST } = req.query; // Get GST option from query parameter
    const bill = await Billing.findById(req.params.id)
      .populate('customer_id', 'first_name last_name email phone address city state vehicle_number kilometer')
      .populate('jobcard_id', 'job_card_number service_type complaint diagnosis work_description vehicle_info');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Get logo as base64
    const logoBase64 = getLogoBase64();

    // Override GST settings based on parameter
    const gstEnabled = withGST === 'true';
    let modifiedBill = { ...bill.toObject() };
    
    if (!gstEnabled) {
      // Recalculate without GST
      modifiedBill.gst_enabled = false;
      modifiedBill.cgst_amount = 0;
      modifiedBill.sgst_amount = 0;
      modifiedBill.gst_amount = 0;
      modifiedBill.total_amount = modifiedBill.subtotal - (modifiedBill.discount || 0);
    } else {
      // Ensure GST is calculated
      modifiedBill.gst_enabled = true;
      if (!modifiedBill.cgst_amount && !modifiedBill.sgst_amount) {
        // Calculate GST and round to 2 decimal places
        modifiedBill.cgst_amount = Math.round((modifiedBill.subtotal * 9 / 100) * 100) / 100;
        modifiedBill.sgst_amount = Math.round((modifiedBill.subtotal * 9 / 100) * 100) / 100;
        modifiedBill.gst_amount = modifiedBill.cgst_amount + modifiedBill.sgst_amount;
        modifiedBill.total_amount = modifiedBill.subtotal + modifiedBill.gst_amount - (modifiedBill.discount || 0);
      }
    }

    // Generate HTML receipt with professional template
    const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Tax Invoice - ${modifiedBill.invoice_number}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
            .invoice-container { max-width: 800px; margin: 0 auto; padding: 20px; background: white; }
            
            /* Header Section */
            .header { border: 2px solid #000; padding: 15px; margin-bottom: 20px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
            .company-logo { width: 80px; height: 80px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; background: #f8f9fa; }
            .company-details { flex: 1; margin-left: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
            .company-tagline { font-size: 14px; color: #7f8c8d; margin-bottom: 10px; }
            .company-address { font-size: 11px; line-height: 1.3; }
            .gst-info { text-align: right; font-size: 11px; }
            .gst-box { border: 1px solid #000; padding: 8px; margin-bottom: 5px; background: #f8f9fa; }
            
            /* Invoice Title */
            .invoice-title { text-align: center; font-size: 18px; font-weight: bold; background: #34495e; color: white; padding: 10px; margin-bottom: 20px; }
            
            /* Bill Details Section */
            .bill-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .bill-to, .invoice-info { width: 48%; }
            .section-header { background: #ecf0f1; padding: 8px; font-weight: bold; border: 1px solid #bdc3c7; margin-bottom: 10px; }
            .detail-row { margin-bottom: 5px; }
            .detail-label { font-weight: bold; display: inline-block; width: 100px; }
            
            /* Items Table */
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #000; }
            .items-table th { background: #34495e; color: white; padding: 10px 8px; text-align: center; font-weight: bold; border: 1px solid #000; }
            .items-table td { padding: 8px; text-align: center; border: 1px solid #000; }
            .items-table .desc-col { text-align: left; }
            .items-table .amount-col { text-align: right; }
            .items-table tbody tr:nth-child(even) { background: #f8f9fa; }
            
            /* Totals Section */
            .totals-section { margin-top: 20px; }
            .totals-table { width: 100%; border-collapse: collapse; }
            .totals-table td { padding: 8px; border: 1px solid #000; }
            .totals-table .label-col { background: #ecf0f1; font-weight: bold; width: 70%; text-align: right; }
            .totals-table .amount-col { text-align: right; width: 30%; }
            .final-total { background: #34495e !important; color: white !important; font-size: 16px; font-weight: bold; }
            
            /* GST Details */
            .gst-details { margin: 20px 0; border: 1px solid #000; }
            .gst-header { background: #34495e; color: white; padding: 8px; text-align: center; font-weight: bold; }
            .gst-table { width: 100%; border-collapse: collapse; }
            .gst-table th, .gst-table td { border: 1px solid #000; padding: 6px; text-align: center; }
            .gst-table th { background: #ecf0f1; font-weight: bold; }
            
            /* Payment Info */
            .payment-info { margin: 20px 0; border: 1px solid #000; padding: 15px; background: #f8f9fa; }
            .payment-header { font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
            
            /* Footer */
            .footer { margin-top: 30px; text-align: center; }
            .terms { font-size: 10px; margin: 20px 0; text-align: left; }
            .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
            .signature-box { width: 200px; text-align: center; }
            .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; }
            
            /* Print Styles */
            .print-button { background: #3498db; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; margin: 20px 0; font-size: 14px; }
            .print-button:hover { background: #2980b9; }
            @media print {
                .print-button { display: none; }
                .invoice-container { padding: 0; }
                body { font-size: 11px; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header Section -->
            <div class="header">
                <div class="header-top">
                    <div class="company-logo">
                       ${logoBase64 ? `
                       <img src="${logoBase64}" alt="Company Logo" style="max-width: 100%; max-height: 100%;">
                       ` : `
                       <div style="width: 80px; height: 80px; border: 2px solid #2980b9; background: #f8f9fa; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #2980b9; font-size: 10px; text-align: center; line-height: 1.2; flex-direction: column;">
                           <div>RADHE</div>
                           <div>KRISHNA</div>
                           <div>AUTO</div>
                       </div>
                       `}
                    </div>
                    <div class="company-details">
                        <div class="company-name">RADHEKRISHNA AUTOMOBILE HARDA</div>
                        <div class="company-address">
                            <strong>Address:</strong> Khandwa Road Near Kakariya<br>
                            City: Harda - 461331<br>
                            <strong>Phone:</strong> +91-9669664286
                          
                        </div>
                    </div>
                    <div class="gst-info">
                        <div >
                            <strong>GSTIN:</strong> 07ABCDE1234F1Z5
                        </div>
                        <div >
                            <strong>PAN:</strong> ABCDE1234F
                        </div>
                        <div >
                            <strong>State Code:</strong> 23
                        </div>
                    </div>
                </div>
            </div>

            <!-- Invoice Title -->
            <div class="invoice-title">TAX INVOICE</div>

            <!-- Bill Details -->
            <div class="bill-details">
                <div class="bill-to">
                    <div class="section-header">BILL TO</div>
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <strong>${modifiedBill.first_name} ${modifiedBill.last_name}</strong>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        ${modifiedBill.phone}
                    </div>
                    ${modifiedBill.email ? `
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        ${modifiedBill.email}
                    </div>
                    ` : ''}
                    ${modifiedBill.customer_id?.address ? `
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        ${modifiedBill.customer_id.address}
                    </div>
                    ` : ''}
                    ${modifiedBill.customer_id?.city ? `
                    <div class="detail-row">
                        <span class="detail-label">City:</span>
                        ${modifiedBill.customer_id.city}, ${modifiedBill.customer_id.state || ''}
                    </div>
                    ` : ''}
                    ${modifiedBill.customer_id?.vehicle_number ? `
                    <div class="detail-row">
                        <span class="detail-label">Vehicle No.:</span>
                        ${modifiedBill.customer_id.vehicle_number}
                    </div>
                    ` : ''}
                    ${modifiedBill.customer_id?.kilometer ? `
                    <div class="detail-row">
                        <span class="detail-label">Kilometer:</span>
                        ${modifiedBill.customer_id.kilometer}
                    </div>
                    ` : ''}
                </div>
                <div class="invoice-info">
                    <div class="section-header">INVOICE DETAILS</div>
                    <div class="detail-row">
                        <span class="detail-label">Invoice #:</span>
                        <strong>${modifiedBill.invoice_number}</strong>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        ${new Date(modifiedBill.date).toLocaleDateString('en-IN')}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Due Date:</span>
                        ${new Date(new Date(modifiedBill.date).getTime() + 30*24*60*60*1000).toLocaleDateString('en-IN')}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <strong style="color: ${modifiedBill.payment_status === 'paid' ? '#27ae60' : modifiedBill.payment_status === 'partial' ? '#f39c12' : '#e74c3c'};">
                            ${modifiedBill.payment_status.toUpperCase()}
                        </strong>
                    </div>
                    ${modifiedBill.jobcard_id ? `
                    <div class="detail-row">
                        <span class="detail-label">Job Card:</span>
                        ${modifiedBill.jobcard_id.job_card_number}
                    </div>
                    ` : ''}
                </div>
            </div>

            ${modifiedBill.jobcard_id ? `
            <!-- Service Details -->
            <div class="payment-info">
                <div class="payment-header">SERVICE DETAILS</div>
                <div class="detail-row"><strong>Service Type:</strong> ${modifiedBill.jobcard_id.service_type}</div>
                <div class="detail-row"><strong>Vehicle:</strong> ${modifiedBill.jobcard_id.vehicle_info || 'N/A'}</div>
                ${modifiedBill.jobcard_id.complaint ? `<div class="detail-row"><strong>Complaint:</strong> ${modifiedBill.jobcard_id.complaint}</div>` : ''}
                ${modifiedBill.jobcard_id.diagnosis ? `<div class="detail-row"><strong>Diagnosis:</strong> ${modifiedBill.jobcard_id.diagnosis}</div>` : ''}
            </div>
            ` : ''}

            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">S.No.</th>
                        <th style="width: 45%;">Description of Goods/Services</th>
                        <th style="width: 15%;">Qty</th>
                        <th style="width: 20%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${modifiedBill.items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td class="desc-col">
                            <strong>${item.item_name}</strong>
                            ${item.description ? `<br><small>${item.description}</small>` : ''}
                        </td>
                        <td>${item.quantity}</td>
                        <td class="amount-col">₹${item.total_price.toFixed(2)}</td>
                    </tr>
                    `).join('')}
                    <tr style="border-top: 2px solid #000;">
                        <td colspan="3" style="text-align: right; font-weight: bold; background: #ecf0f1;">TOTAL</td>
                        <td class="amount-col" style="font-weight: bold; background: #ecf0f1;">₹${modifiedBill.subtotal.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            ${gstEnabled ? `
            <!-- GST Details -->
            <div class="gst-details">
                <div class="gst-header">GST CALCULATION</div>
                <table class="gst-table">
                    <thead>
                        <tr>
                            <th>Taxable Value</th>
                            <th>CGST Rate</th>
                            <th>CGST Amount</th>
                            <th>SGST Rate</th>
                            <th>SGST Amount</th>
                            <th>Total Tax</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>₹${modifiedBill.subtotal.toFixed(2)}</td>
                            <td>9%</td>
                            <td>₹${modifiedBill.cgst_amount.toFixed(2)}</td>
                            <td>9%</td>
                            <td>₹${modifiedBill.sgst_amount.toFixed(2)}</td>
                            <td><strong>₹${modifiedBill.gst_amount.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- Totals Section -->
            <div class="totals-section">
                <table class="totals-table">
                    ${gstEnabled ? `
                    <tr>
                        <td class="label-col">Subtotal (Before Tax)</td>
                        <td class="amount-col">₹${modifiedBill.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="label-col">Total GST</td>
                        <td class="amount-col">₹${modifiedBill.gst_amount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${modifiedBill.discount > 0 ? `
                    <tr>
                        <td class="label-col">Discount</td>
                        <td class="amount-col">-₹${modifiedBill.discount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr class="final-total">
                        <td class="label-col">TOTAL AMOUNT</td>
                        <td class="amount-col">₹${modifiedBill.total_amount.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <!-- Payment Information -->
            ${modifiedBill.amount_paid > 0 ? `
            <div class="payment-info">
                <div class="payment-header">PAYMENT INFORMATION</div>
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <div class="detail-row"><strong>Amount Paid:</strong> ₹${modifiedBill.amount_paid.toFixed(2)}</div>
                        <div class="detail-row"><strong>Payment Method:</strong> ${modifiedBill.payment_method || 'Not specified'}</div>
                    </div>
                    <div>
                        <div class="detail-row"><strong>Balance Due:</strong>
                            <span style="color: ${(modifiedBill.total_amount - modifiedBill.amount_paid) > 0 ? '#e74c3c' : '#27ae60'}; font-weight: bold;">
                                ₹${(modifiedBill.total_amount - modifiedBill.amount_paid).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}

            ${gstEnabled ? `
            <!-- Bank Account Details -->
            <div class="payment-info">
                <div class="payment-header">BANK ACCOUNT DETAILS</div>
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <div class="detail-row"><strong>Account Name:</strong> RADHEKRISHNA AUTOMOBILE HARDA</div>
                        <div class="detail-row"><strong>Account Number:</strong> 1234567890123456</div>
                        <div class="detail-row"><strong>IFSC Code:</strong> SBIN0001234</div>
                    </div>
                    <div>
                        <div class="detail-row"><strong>Bank Name:</strong> State Bank of India</div>
                        <div class="detail-row"><strong>Branch:</strong> Harda Main Branch</div>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Signature Section -->
            <div class="signature-section">
               
                <div class="signature-box">
                    <div style="text-align: center; margin-bottom: 10px;"><strong>Authorized Signatory</strong></div>
                    <div class="signature-line">For RADHEKRISHNA AUTOMOBILE HARDA</div>
                </div>
            </div>

            <!-- Print Button -->
            <button class="print-button" onclick="window.print()">🖨️ Print Invoice</button>

            <!-- Footer -->
            <div class="footer">
                <div style="font-size: 14px; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">
                    Thank You For Choosing Radhekrishna Automobile
Harda !
                </div>
                <div style="font-size: 10px; color: #7f8c8d;">
                    This is a computer-generated document. No signature required.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(receiptHTML);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt'
    });
  }
};

// ✅ Generate receipt/invoice (original function)
exports.generateReceipt = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('customer_id', 'first_name last_name email phone address city state vehicle_number kilometer')
      .populate('jobcard_id', 'job_card_number service_type complaint diagnosis work_description vehicle_info');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Get logo as base64
    const logoBase64 = getLogoBase64();

    // Generate HTML receipt
    const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice - ${bill.invoice_number}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #333; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .customer-details, .invoice-info { width: 48%; }
            .section-title { font-weight: bold; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; font-weight: bold; }
            .totals { margin-top: 20px; text-align: right; }
            .total-row { margin: 5px 0; }
            .final-total { font-size: 18px; font-weight: bold; color: #333; border-top: 2px solid #333; padding-top: 10px; }
            .jobcard-details { background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .print-button { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 20px 0; }
            @media print { .print-button { display: none; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <div style="width: 60px; height: 60px; margin-right: 15px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                    ${logoBase64 ? `
                    <img src="${logoBase64}" alt="Company Logo" style="max-width: 100%; max-height: 100%;">
                    ` : `
                    <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #2980b9; font-size: 8px; text-align: center; line-height: 1.1; flex-direction: column;">
                        <div>RADHE</div>
                        <div>KRISHNA</div>
                        <div>AUTO</div>
                    </div>
                    `}
                </div>
                <div>
                    <div class="company-name">RADHEKRISHNA AUTOMOBILE HARDA</div>
                    <div>Service Invoice</div>
                </div>
            </div>
        </div>

        <div class="invoice-details">
            <div class="customer-details">
                <div class="section-title">Bill To:</div>
                <div><strong>${bill.first_name} ${bill.last_name}</strong></div>
                <div>Phone: ${bill.phone}</div>
                ${bill.email ? `<div>Email: ${bill.email}</div>` : ''}
                ${bill.customer_id?.address ? `<div>Address: ${bill.customer_id.address}</div>` : ''}
                ${bill.customer_id?.city ? `<div>City: ${bill.customer_id.city}, ${bill.customer_id.state || ''}</div>` : ''}
                ${bill.customer_id?.vehicle_number ? `<div>Vehicle No.: ${bill.customer_id.vehicle_number}</div>` : ''}
                ${bill.customer_id?.kilometer ? `<div>Kilometer: ${bill.customer_id.kilometer}</div>` : ''}
            </div>
            <div class="invoice-info">
                <div class="section-title">Invoice Details:</div>
                <div><strong>Invoice #:</strong> ${bill.invoice_number}</div>
                <div><strong>Date:</strong> ${new Date(bill.date).toLocaleDateString()}</div>
                <div><strong>Payment Status:</strong> ${bill.payment_status.toUpperCase()}</div>
                ${bill.jobcard_id ? `<div><strong>Job Card #:</strong> ${bill.jobcard_id.job_card_number}</div>` : ''}
            </div>
        </div>

        ${bill.jobcard_id ? `
        <div class="jobcard-details">
            <div class="section-title">Service Details:</div>
            <div><strong>Service Type:</strong> ${bill.jobcard_id.service_type}</div>
            <div><strong>Vehicle:</strong> ${bill.jobcard_id.vehicle_info || 'N/A'}</div>
            ${bill.jobcard_id.complaint ? `<div><strong>Customer Complaint:</strong> ${bill.jobcard_id.complaint}</div>` : ''}
            ${bill.jobcard_id.diagnosis ? `<div><strong>Diagnosis:</strong> ${bill.jobcard_id.diagnosis}</div>` : ''}
            ${bill.jobcard_id.work_description ? `<div><strong>Work Performed:</strong> ${bill.jobcard_id.work_description}</div>` : ''}
        </div>
        ` : ''}

        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${bill.items.map(item => `
                <tr>
                    <td>${item.item_name}${item.description ? ` - ${item.description}` : ''}</td>
                    <td>${item.item_type === 'part' ? 'Part' : 'Service'}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.total_price.toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row"><strong>Parts Total: ₹${bill.parts_total.toFixed(2)}</strong></div>
            <div class="total-row"><strong>Labor Total: ₹${bill.labor_total.toFixed(2)}</strong></div>
            <div class="total-row"><strong>Subtotal: ₹${bill.subtotal.toFixed(2)}</strong></div>
            ${bill.gst_enabled ? `
            <div class="total-row"><strong>CGST (${bill.cgst_rate || 9}%): ₹${bill.cgst_amount.toFixed(2)}</strong></div>
            <div class="total-row"><strong>SGST (${bill.sgst_rate || 9}%): ₹${bill.sgst_amount.toFixed(2)}</strong></div>
            <div class="total-row"><strong>Total GST: ₹${bill.gst_amount.toFixed(2)}</strong></div>
            ` : '<div class="total-row"><strong>GST: Not Applicable</strong></div>'}
            ${bill.discount > 0 ? `<div class="total-row"><strong>Discount: -₹${bill.discount.toFixed(2)}</strong></div>` : ''}
            <div class="final-total">Total Amount: ₹${bill.total_amount.toFixed(2)}</div>
            ${bill.amount_paid > 0 ? `
            <div class="total-row" style="margin-top: 10px;">
                <strong>Amount Paid: ₹${bill.amount_paid.toFixed(2)}</strong><br>
                <strong>Balance Due: ₹${(bill.total_amount - bill.amount_paid).toFixed(2)}</strong>
            </div>
            ` : ''}
        </div>

        ${bill.notes ? `
        <div style="margin-top: 30px;">
            <div class="section-title">Notes:</div>
            <div>${bill.notes}</div>
        </div>
        ` : ''}

        <!-- Signature Section -->
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
           
            <div style="width: 200px; text-align: center;">
                <div style="margin-bottom: 10px;"><strong>Authorized Signatory</strong></div>
                <div style="border-top: 1px solid #000; margin-top: 50px; padding-top: 5px;">For Garage Management</div>
            </div>
        </div>

        <button class="print-button" onclick="window.print()">Print Receipt</button>

        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
            Thank you for your business!
        </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(receiptHTML);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt'
    });
  }
};

// ✅ Delete bill
exports.deleteBill = async (req, res) => {
  try {
    const bill = await Billing.findByIdAndDelete(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete bill'
    });
  }
};

// ✅ Get billing statistics
exports.getBillingStats = async (req, res) => {
  try {
    const totalBills = await Billing.countDocuments();
    const pendingBills = await Billing.countDocuments({ payment_status: 'pending' });
    const paidBills = await Billing.countDocuments({ payment_status: 'paid' });
    
    const totalRevenue = await Billing.aggregate([
      { $match: { payment_status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);

    const pendingAmount = await Billing.aggregate([
      { $match: { payment_status: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$total_amount', '$amount_paid'] } } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_bills: totalBills,
        pending_bills: pendingBills,
        paid_bills: paidBills,
        total_revenue: totalRevenue[0]?.total || 0,
        pending_amount: pendingAmount[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing statistics'
    });
  }
};

// ✅ Get dashboard billing reports (today and this week)
exports.getDashboardBillingReports = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of this week (Sunday)

    // Today's billing data
    const todayBills = await Billing.find({
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    // This week's billing data
    const thisWeekBills = await Billing.find({
      date: { $gte: thisWeekStart, $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
    });

    // Calculate today's stats
    const todayStats = {
      totalBills: todayBills.length,
      totalAmount: todayBills.reduce((sum, bill) => sum + bill.total_amount, 0),
      paidAmount: todayBills.filter(bill => bill.payment_status === 'paid').reduce((sum, bill) => sum + bill.amount_paid, 0),
      pendingAmount: todayBills.filter(bill => bill.payment_status !== 'paid').reduce((sum, bill) => sum + (bill.total_amount - bill.amount_paid), 0),
      paidBills: todayBills.filter(bill => bill.payment_status === 'paid').length,
      pendingBills: todayBills.filter(bill => bill.payment_status !== 'paid').length
    };

    // Calculate this week's stats
    const thisWeekStats = {
      totalBills: thisWeekBills.length,
      totalAmount: thisWeekBills.reduce((sum, bill) => sum + bill.total_amount, 0),
      paidAmount: thisWeekBills.filter(bill => bill.payment_status === 'paid').reduce((sum, bill) => sum + bill.amount_paid, 0),
      pendingAmount: thisWeekBills.filter(bill => bill.payment_status !== 'paid').reduce((sum, bill) => sum + (bill.total_amount - bill.amount_paid), 0),
      paidBills: thisWeekBills.filter(bill => bill.payment_status === 'paid').length,
      pendingBills: thisWeekBills.filter(bill => bill.payment_status !== 'paid').length
    };

    res.status(200).json({
      success: true,
      data: {
        today: todayStats,
        thisWeek: thisWeekStats
      }
    });
  } catch (error) {
    console.error('Dashboard billing reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard billing reports',
      error: error.message
    });
  }
};

// ✅ Send email notification manually
exports.sendEmailNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get bill with customer details
    const bill = await Billing.findById(id)
      .populate('customer_id', 'first_name last_name email phone vehicle_number');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if customer has email
    if (!bill.customer_id || !bill.customer_id.email) {
      return res.status(400).json({
        success: false,
        message: 'Customer email not found'
      });
    }

    // Send email notification
    try {
      console.log('📧 Sending manual email notification to customer:', bill.customer_id.email);
      const emailResult = await sendBillReadyNotification(bill.customer_id, bill);
      
      if (emailResult.success) {
        console.log('✅ Email sent successfully to customer');
        return res.status(200).json({
          success: true,
          message: 'Email notification sent successfully!',
          data: {
            email: bill.customer_id.email,
            messageId: emailResult.messageId
          }
        });
      } else {
        console.log('❌ Email sending failed:', emailResult.error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send email notification',
          error: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Email sending failed',
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('Send email notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email notification',
      error: error.message
    });
  }
};