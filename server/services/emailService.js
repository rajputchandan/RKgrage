const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send bill ready notification email
const sendBillReadyNotification = async (customerData, billData) => {
  try {
    const transporter = createTransporter();

    // Create email content
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Your Vehicle is Ready for Pickup</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2c3e50, #3498db); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 30px; }
            .ready-message { background: #27ae60; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px; }
            .ready-message h2 { margin: 0; font-size: 24px; }
            .ready-message p { margin: 10px 0 0 0; font-size: 16px; }
            .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
            .detail-row:last-child { border-bottom: none; margin-bottom: 0; }
            .detail-label { font-weight: bold; color: #2c3e50; }
            .detail-value { color: #34495e; }
            .thank-you { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .thank-you h3 { color: #2c3e50; margin: 0 0 10px 0; }
            .thank-you p { color: #7f8c8d; margin: 5px 0; }
            .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .footer p { margin: 5px 0; }
            .contact-info { margin-top: 15px; }
            .contact-info p { margin: 3px 0; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>🚗 RADHEKRISHNA AUTOMOBILE HARDA</h1>
                <p>Your Trusted Auto Service Partner</p>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- Ready Message -->
                <div class="ready-message">
                    <h2>🎉 Your Vehicle is Ready for Pickup!</h2>
                    <p>Service completed successfully. You can collect your vehicle now.</p>
                </div>

                <!-- Customer Details -->
                <div class="details">
                    <h3 style="margin: 0 0 15px 0; color: #2c3e50;">📋 Service Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Customer Name:</span>
                        <span class="detail-value">${customerData.first_name} ${customerData.last_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Vehicle Number:</span>
                        <span class="detail-value">${customerData.vehicle_number || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone Number:</span>
                        <span class="detail-value">${customerData.phone}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Service Date:</span>
                        <span class="detail-value">${new Date(billData.date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Invoice Number:</span>
                        <span class="detail-value">${billData.invoice_number}</span>
                    </div>
                </div>

                <!-- Thank You Message -->
                <div class="thank-you">
                    <h3>🙏 Thank You for Choosing Us!</h3>
                    <p>We appreciate your trust in our services.</p>
                    <p>Your vehicle service has been completed successfully.</p>
                    <p>Please bring this email when collecting your vehicle.</p>
                    <p><strong>For billing details, please visit our office.</strong></p>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>RADHEKRISHNA AUTOMOBILE HARDA</strong></p>
                <div class="contact-info">
                    <p>📍 Khandwa Road Near Kakariya, Harda - 461331</p>
                    <p>📞 +91-9669664286</p>
                    <p>🕒 Working Hours: 9:00 AM - 7:00 PM (Mon-Sat)</p>
                </div>
                <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerData.email,
      subject: `🚗 Your Vehicle is Ready for Pickup - ${customerData.vehicle_number || 'Service Complete'}`,
      html: emailHTML
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return { success: true };
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return { success: false, error: error.message };
  }
};

// Send daily admin report email
const sendDailyAdminReport = async () => {
  try {
    const mongoose = require('mongoose');
    
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGOURL);
      console.log('📊 Connected to database for daily report');
    }

    const Customer = require('../model/customer');
    const Part = require('../model/parts');
    const Billing = require('../model/billing');
    const InventoryPurchase = require('../model/inventoryPurchase');

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get today's data
    const [
      newCustomersToday,
      newPartsToday,
      billsToday,
      allBills,
      lowStockParts,
      inventoryPurchasesToday
    ] = await Promise.all([
      Customer.find({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Part.find({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Billing.find({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Billing.find({ payment_status: { $in: ['pending', 'partial'] } }),
      Part.find({ $expr: { $lte: ['$stock_quantity', '$min_stock_level'] } }),
      InventoryPurchase.find({ createdAt: { $gte: startOfDay, $lt: endOfDay } })
    ]);

    // Calculate statistics
    const stats = {
      newCustomers: newCustomersToday.length,
      newParts: newPartsToday.length,
      billsToday: billsToday.length,
      paidBillsToday: billsToday.filter(bill => bill.payment_status === 'paid').length,
      pendingBillsToday: billsToday.filter(bill => bill.payment_status === 'pending').length,
      partialBillsToday: billsToday.filter(bill => bill.payment_status === 'partial').length,
      totalPendingBills: allBills.length,
      todayRevenue: billsToday.filter(bill => bill.payment_status === 'paid').reduce((sum, bill) => sum + bill.total_amount, 0),
      pendingAmount: allBills.reduce((sum, bill) => sum + (bill.total_amount - bill.amount_paid), 0),
      lowStockCount: lowStockParts.length,
      inventoryPurchases: inventoryPurchasesToday.length
    };

    // Calculate parts usage (parts that had stock reduced today)
    const partsUsageToday = await Part.aggregate([
      {
        $match: {
          updatedAt: { $gte: startOfDay, $lt: endOfDay }
        }
      },
      {
        $project: {
          name: 1,
          part_number: 1,
          stock_quantity: 1,
          category: 1
        }
      }
    ]);

    // Create email content
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Daily Business Report - ${today.toLocaleDateString('en-IN')}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2c3e50, #3498db); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 30px; }
            .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; }
            .card.revenue { border-left-color: #27ae60; }
            .card.pending { border-left-color: #e74c3c; }
            .card.warning { border-left-color: #f39c12; }
            .card h3 { margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; text-transform: uppercase; }
            .card .value { font-size: 24px; font-weight: bold; color: #2c3e50; }
            .section { margin: 30px 0; }
            .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background: #3498db; color: white; }
            .table tr:nth-child(even) { background: #f9f9f9; }
            .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>📊 Daily Business Report</h1>
                <p>RADHEKRISHNA AUTOMOBILE HARDA</p>
                <p>${today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- Summary Cards -->
                <div class="summary-cards">
                    <div class="card">
                        <h3>👥 New Customers</h3>
                        <div class="value">${stats.newCustomers}</div>
                    </div>
                    <div class="card revenue">
                        <h3>💰 Today's Revenue</h3>
                        <div class="value">₹${stats.todayRevenue.toFixed(2)}</div>
                    </div>
                    <div class="card">
                        <h3>📄 Bills Today</h3>
                        <div class="value">${stats.billsToday}</div>
                    </div>
                    <div class="card pending">
                        <h3>⏳ Pending Amount</h3>
                        <div class="value">₹${stats.pendingAmount.toFixed(2)}</div>
                    </div>
                </div>

                <!-- Bills Summary -->
                <div class="section">
                    <h2>📋 Bills Summary</h2>
                    <table class="table">
                        <tr>
                            <th>Status</th>
                            <th>Today</th>
                            <th>Total Pending</th>
                            <th>Amount</th>
                        </tr>
                        <tr>
                            <td>✅ Paid Bills</td>
                            <td>${stats.paidBillsToday}</td>
                            <td>-</td>
                            <td>₹${stats.todayRevenue.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>⏳ Pending Bills</td>
                            <td>${stats.pendingBillsToday}</td>
                            <td>${stats.totalPendingBills}</td>
                            <td>₹${stats.pendingAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>🔄 Partial Bills</td>
                            <td>${stats.partialBillsToday}</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                    </table>
                </div>

                <!-- Inventory Summary -->
                <div class="section">
                    <h2>📦 Inventory Summary</h2>
                    <table class="table">
                        <tr>
                            <th>Category</th>
                            <th>Count</th>
                            <th>Details</th>
                        </tr>
                        <tr>
                            <td>🆕 New Parts Added</td>
                            <td>${stats.newParts}</td>
                            <td>Parts added to inventory today</td>
                        </tr>
                        <tr>
                            <td>📦 Inventory Purchases</td>
                            <td>${stats.inventoryPurchases}</td>
                            <td>Purchase orders processed today</td>
                        </tr>
                        <tr>
                            <td>⚠️ Low Stock Items</td>
                            <td>${stats.lowStockCount}</td>
                            <td>Items below minimum stock level</td>
                        </tr>
                        <tr>
                            <td>🔄 Parts Updated</td>
                            <td>${partsUsageToday.length}</td>
                            <td>Parts with stock changes today</td>
                        </tr>
                    </table>
                </div>

                ${stats.lowStockCount > 0 ? `
                <!-- Low Stock Alert -->
                <div class="section">
                    <h2>⚠️ Low Stock Alert</h2>
                    <div class="highlight">
                        <strong>Attention Required:</strong> ${stats.lowStockCount} items are running low on stock!
                    </div>
                    <table class="table">
                        <tr>
                            <th>Part Name</th>
                            <th>Part Number</th>
                            <th>Current Stock</th>
                            <th>Min Level</th>
                            <th>Category</th>
                        </tr>
                        ${lowStockParts.slice(0, 10).map(part => `
                        <tr>
                            <td>${part.name}</td>
                            <td>${part.part_number}</td>
                            <td>${part.stock_quantity}</td>
                            <td>${part.min_stock_level}</td>
                            <td>${part.category}</td>
                        </tr>
                        `).join('')}
                        ${lowStockParts.length > 10 ? `
                        <tr>
                            <td colspan="5" style="text-align: center; font-style: italic;">
                                ... and ${lowStockParts.length - 10} more items
                            </td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
                ` : ''}

                ${newCustomersToday.length > 0 ? `
                <!-- New Customers -->
                <div class="section">
                    <h2>👥 New Customers Today</h2>
                    <table class="table">
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Vehicle Number</th>
                            <th>Time</th>
                        </tr>
                        ${newCustomersToday.map(customer => `
                        <tr>
                            <td>${customer.first_name} ${customer.last_name}</td>
                            <td>${customer.phone}</td>
                            <td>${customer.vehicle_number || 'N/A'}</td>
                            <td>${new Date(customer.createdAt).toLocaleTimeString('en-IN')}</td>
                        </tr>
                        `).join('')}
                    </table>
                </div>
                ` : ''}

                <!-- Summary -->
                <div class="section">
                    <h2>📈 Daily Summary</h2>
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px;">
                        <p><strong>Business Performance:</strong></p>
                        <ul>
                            <li>💰 Revenue Generated: ₹${stats.todayRevenue.toFixed(2)}</li>
                            <li>👥 New Customers: ${stats.newCustomers}</li>
                            <li>📄 Bills Processed: ${stats.billsToday}</li>
                            <li>📦 Inventory Updates: ${partsUsageToday.length}</li>
                            <li>⚠️ Items Needing Attention: ${stats.lowStockCount}</li>
                        </ul>
                        ${stats.pendingAmount > 0 ? `
                        <p style="color: #e74c3c;"><strong>⚠️ Action Required:</strong> ₹${stats.pendingAmount.toFixed(2)} in pending payments</p>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>RADHEKRISHNA AUTOMOBILE HARDA</strong></p>
                <p>📍 Khandwa Road Near Kakariya, Harda - 461331 | 📞 +91-9669664286</p>
                <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
                    This is an automated daily report generated at ${new Date().toLocaleString('en-IN')}
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.AdminEmaildata, // Send to admin email
      subject: `📊 Daily Business Report - ${today.toLocaleDateString('en-IN')} - RADHEKRISHNA AUTOMOBILE`,
      html: emailHTML
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Daily admin report sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId, stats };

  } catch (error) {
    console.error('❌ Daily admin report sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send employee welcome email
const sendEmployeeWelcomeEmail = async (employeeData) => {
  try {
    const transporter = createTransporter();

    // Create email content
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Welcome to RADHEKRISHNA AUTOMOBILE HARDA</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2c3e50, #3498db); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 30px; }
            .welcome-message { background: #27ae60; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px; }
            .welcome-message h2 { margin: 0; font-size: 24px; }
            .welcome-message p { margin: 10px 0 0 0; font-size: 16px; }
            .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
            .detail-row:last-child { border-bottom: none; margin-bottom: 0; }
            .detail-label { font-weight: bold; color: #2c3e50; }
            .detail-value { color: #34495e; }
            .thank-you { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .thank-you h3 { color: #2c3e50; margin: 0 0 10px 0; }
            .thank-you p { color: #7f8c8d; margin: 5px 0; }
            .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .footer p { margin: 5px 0; }
            .contact-info { margin-top: 15px; }
            .contact-info p { margin: 3px 0; font-size: 14px; }
            .guidelines { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .guidelines h3 { color: #2c3e50; margin: 0 0 15px 0; }
            .guidelines ul { margin: 0; padding-left: 20px; }
            .guidelines li { margin: 5px 0; color: #34495e; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>🎉 Welcome to Our Team!</h1>
                <p>RADHEKRISHNA AUTOMOBILE HARDA</p>
                <p>Your Journey Starts Here</p>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- Welcome Message -->
                <div class="welcome-message">
                    <h2>🙏 Welcome ${employeeData.name}!</h2>
                    <p>We are excited to have you join our team at RADHEKRISHNA AUTOMOBILE HARDA</p>
                </div>

                <!-- Employee Details -->
                <div class="details">
                    <h3 style="margin: 0 0 15px 0; color: #2c3e50;">👤 Your Employee Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Employee ID:</span>
                        <span class="detail-value">${employeeData.employee_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${employeeData.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Department:</span>
                        <span class="detail-value">${employeeData.department}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Position:</span>
                        <span class="detail-value">${employeeData.position}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Joining Date:</span>
                        <span class="detail-value">${new Date(employeeData.joining_date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${employeeData.email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Mobile:</span>
                        <span class="detail-value">${employeeData.mobile}</span>
                    </div>
                </div>

                <!-- Guidelines -->
                <div class="guidelines">
                    <h3>📋 Important Guidelines</h3>
                    <ul>
                        <li>Please report to your supervisor on your first day</li>
                        <li>Bring all required documents for verification</li>
                        <li>Working hours: 9:00 AM - 7:00 PM (Monday to Saturday)</li>
                        <li>Lunch break: 1:00 PM - 2:00 PM</li>
                        <li>Please maintain punctuality and professional conduct</li>
                        <li>For any queries, contact the HR department</li>
                    </ul>
                </div>

                <!-- Thank You Message -->
                <div class="thank-you">
                    <h3>🙏 Thank You for Joining Us!</h3>
                    <p>We look forward to working with you and achieving great success together.</p>
                    <p>Welcome to the RADHEKRISHNA AUTOMOBILE family!</p>
                    <p><strong>Best wishes for your new journey with us.</strong></p>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>RADHEKRISHNA AUTOMOBILE HARDA</strong></p>
                <div class="contact-info">
                    <p>📍 Khandwa Road Near Kakariya, Harda - 461331</p>
                    <p>📞 +91-9669664286</p>
                    <p>🕒 Working Hours: 9:00 AM - 7:00 PM (Mon-Sat)</p>
                </div>
                <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
                    This is an automated welcome message. For any queries, please contact HR.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: employeeData.email,
      subject: `🎉 Welcome to RADHEKRISHNA AUTOMOBILE HARDA - ${employeeData.name}`,
      html: emailHTML
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Employee welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Employee welcome email sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBillReadyNotification,
  sendDailyAdminReport,
  sendEmployeeWelcomeEmail,
  testEmailConfig
};