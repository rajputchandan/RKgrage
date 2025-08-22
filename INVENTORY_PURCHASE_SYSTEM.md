# Inventory Purchase Management System

## Overview

A comprehensive inventory purchase management system that tracks supplier information, purchase orders, and automatically updates inventory levels. The system provides detailed tracking of which supplier provided which items, quantities received, and complete purchase history.

## Features

### 🏢 Supplier Management
- **Complete Supplier Profiles**: Name, contact details, address, GSTIN, payment terms
- **Supplier Search & Filtering**: Quick search by name, mobile, email, or GSTIN
- **Payment Terms Tracking**: Cash, Credit, Net 30/60/90 days
- **Credit Limit Management**: Track and monitor supplier credit limits
- **Supplier Statistics**: Active/inactive supplier counts and analytics

### 📦 Purchase Order Management
- **Auto-Generated Purchase Numbers**: Sequential purchase numbering (PUR000001, PUR000002, etc.)
- **Multi-Item Purchases**: Add multiple parts in a single purchase order
- **GST Calculations**: Automatic GST calculation per item and total
- **Invoice Tracking**: Link supplier invoices to purchase orders
- **Payment Tracking**: Track paid amounts and outstanding balances
- **Purchase Status**: Draft, Confirmed, Received, Cancelled

### 📊 Inventory Integration
- **Automatic Stock Updates**: Inventory levels automatically increase when purchases are received
- **Supplier Tracking**: Each part tracks its primary supplier
- **Purchase History**: Complete history of which supplier provided which parts
- **Stock Validation**: Prevents negative inventory when purchases are cancelled

### 💰 Financial Tracking
- **Payment Methods**: Cash, Cheque, Bank Transfer, UPI, Credit
- **Payment Status**: Pending, Partial, Paid
- **GST Breakdown**: Separate tracking of GST amounts
- **Purchase Statistics**: Total purchases, amounts, and trends
- **Supplier-wise Summary**: Purchase totals per supplier

## Database Models

### Supplier Model
```javascript
{
  supplier_name: String (required),
  contact_person: String,
  mobile: String (required),
  email: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  gstin: String,
  pan: String,
  bank_details: {
    account_number: String,
    bank_name: String,
    ifsc_code: String,
    branch: String
  },
  payment_terms: Enum ['Cash', 'Credit', 'Net 30', 'Net 60', 'Net 90'],
  credit_limit: Number,
  status: Enum ['Active', 'Inactive'],
  notes: String
}
```

### Inventory Purchase Model
```javascript
{
  purchase_number: String (auto-generated, unique),
  supplier_id: ObjectId (ref: Supplier),
  supplier_name: String,
  purchase_date: Date,
  invoice_number: String,
  invoice_date: Date,
  items: [{
    part_id: ObjectId (ref: Part),
    part_name: String,
    part_number: String,
    quantity: Number,
    unit_price: Number,
    total_price: Number,
    gst_rate: Number,
    gst_amount: Number,
    final_amount: Number
  }],
  subtotal: Number (auto-calculated),
  total_gst: Number (auto-calculated),
  total_amount: Number (auto-calculated),
  payment_status: Enum ['Pending', 'Partial', 'Paid'],
  payment_method: Enum ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Credit'],
  paid_amount: Number,
  balance_amount: Number (auto-calculated),
  notes: String,
  status: Enum ['Draft', 'Confirmed', 'Received', 'Cancelled'],
  created_by: ObjectId (ref: User)
}
```

## API Endpoints

### Supplier Endpoints
- `POST /api/suppliers/add` - Add new supplier
- `GET /api/suppliers/` - Get all suppliers (with search & filter)
- `GET /api/suppliers/:id` - Get supplier by ID
- `PUT /api/suppliers/update/:id` - Update supplier
- `DELETE /api/suppliers/delete/:id` - Deactivate supplier
- `GET /api/suppliers/stats` - Get supplier statistics

### Inventory Purchase Endpoints
- `POST /api/inventory-purchases/add` - Add new purchase
- `GET /api/inventory-purchases/` - Get all purchases (with pagination & filters)
- `GET /api/inventory-purchases/:id` - Get purchase by ID
- `PUT /api/inventory-purchases/update/:id` - Update purchase
- `DELETE /api/inventory-purchases/delete/:id` - Delete purchase
- `GET /api/inventory-purchases/stats` - Get purchase statistics
- `GET /api/inventory-purchases/supplier-summary` - Get supplier-wise summary

## Frontend Features

### 📱 User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Material-UI Components**: Modern, professional interface
- **Data Grid**: Sortable, filterable purchase list
- **Search Functionality**: Quick search across purchases
- **Status Indicators**: Color-coded chips for status and payment status

### 🔧 Purchase Management
- **Add Supplier Dialog**: Quick supplier addition without leaving the page
- **Part Selection**: Autocomplete dropdown with part search
- **Real-time Calculations**: Automatic GST and total calculations
- **Item Management**: Add/remove items dynamically
- **Validation**: Form validation and error handling

### 📊 Purchase Tracking
- **Purchase History**: Complete list of all purchases
- **Supplier Information**: Quick access to supplier details
- **Payment Tracking**: Visual indicators for payment status
- **Edit/Delete**: Modify or remove purchases
- **Print Ready**: Formatted for printing purchase orders

## Installation & Setup

### Backend Setup
1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Database Models**: All models are automatically created
   - `server/model/supplier.js`
   - `server/model/inventoryPurchase.js`

3. **Controllers**: Business logic implemented
   - `server/controller/suppliercontroller.js`
   - `server/controller/inventoryPurchaseController.js`

4. **Routes**: API endpoints configured
   - `server/routes/supplierroutes.js`
   - `server/routes/inventoryPurchaseroutes.js`

### Frontend Setup
1. **Install Dependencies**:
   ```bash
   cd client
   npm install
   ```

2. **Components**: UI components ready
   - `client/src/pages/InventoryPurchase.js`
   - Navigation updated in `client/src/components/Layout.js`

## Usage Guide

### Adding a New Purchase

1. **Navigate to Inventory Purchase**
   - Click "Inventory Purchase" in the sidebar

2. **Add Supplier** (if new)
   - Click "Add Supplier" button
   - Fill supplier details
   - Save supplier

3. **Create Purchase Order**
   - Click "New Purchase" button
   - Select supplier from dropdown
   - Set purchase date and invoice details

4. **Add Items**
   - Select part from autocomplete dropdown
   - Enter quantity and unit price
   - GST is auto-calculated
   - Click "Add Item"
   - Repeat for multiple items

5. **Set Payment Details**
   - Choose payment method
   - Enter paid amount
   - Add notes if needed

6. **Save Purchase**
   - Click "Save Purchase"
   - Inventory is automatically updated

### Managing Suppliers

1. **View Suppliers**
   - All suppliers are listed in the purchase dialog dropdown
   - Search by name, mobile, or GSTIN

2. **Add New Supplier**
   - Click "Add Supplier" button
   - Fill required fields (name, mobile)
   - Add optional details (GSTIN, address, payment terms)
   - Save supplier

3. **Supplier Information**
   - Contact details and address
   - Payment terms and credit limits
   - GSTIN for tax compliance

### Tracking Purchases

1. **Purchase List**
   - View all purchases in data grid
   - Sort by date, supplier, amount
   - Filter by status or payment status

2. **Purchase Details**
   - Click edit to view full purchase details
   - See all items, quantities, and prices
   - Track payment status and balance

3. **Inventory Updates**
   - Stock quantities automatically increase
   - Supplier information updated on parts
   - Purchase history maintained

## Business Benefits

### 📈 Improved Inventory Management
- **Accurate Stock Levels**: Real-time inventory updates
- **Supplier Tracking**: Know which supplier provides which parts
- **Purchase History**: Complete audit trail of all purchases
- **Stock Planning**: Better planning with supplier lead times

### 💼 Better Supplier Relationships
- **Complete Profiles**: Maintain detailed supplier information
- **Payment Tracking**: Monitor outstanding payments
- **Performance Analysis**: Track supplier performance over time
- **Communication**: Contact details readily available

### 📊 Financial Control
- **Cost Tracking**: Monitor purchase costs and trends
- **GST Compliance**: Automatic GST calculations and tracking
- **Payment Management**: Track payments and outstanding balances
- **Budget Planning**: Historical data for budget planning

### 🔍 Operational Efficiency
- **Quick Purchase Entry**: Streamlined purchase order creation
- **Automated Calculations**: Reduce manual calculation errors
- **Search & Filter**: Quickly find purchases and suppliers
- **Reporting**: Built-in statistics and summaries

## Testing

### Automated Testing
Run the test suite to verify functionality:
```bash
node test_inventory_purchase_system.js
```

### Manual Testing Checklist
- [ ] Add new supplier
- [ ] Create purchase order with multiple items
- [ ] Verify inventory stock increases
- [ ] Update purchase payment status
- [ ] Search and filter purchases
- [ ] Edit existing purchase
- [ ] Delete purchase (verify inventory restoration)
- [ ] View purchase statistics

## Security Features

- **Authentication Required**: All endpoints require valid JWT token
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Comprehensive error handling and logging
- **Data Integrity**: Prevents duplicate suppliers and invalid purchases

## Future Enhancements

### Planned Features
- **Purchase Approvals**: Multi-level approval workflow
- **Supplier Performance**: Rating and performance metrics
- **Purchase Requisitions**: Request-to-purchase workflow
- **Barcode Integration**: Barcode scanning for parts
- **Email Notifications**: Automated purchase confirmations
- **Advanced Reporting**: Custom reports and analytics
- **Mobile App**: Dedicated mobile application
- **Integration**: ERP and accounting system integration

### Technical Improvements
- **Caching**: Redis caching for better performance
- **File Uploads**: Attach invoices and documents
- **Bulk Operations**: Bulk import/export functionality
- **API Rate Limiting**: Prevent API abuse
- **Audit Logs**: Detailed activity logging
- **Backup & Recovery**: Automated backup systems

## Support

For technical support or feature requests:
1. Check the test file for common issues
2. Review API documentation
3. Verify database connections
4. Check authentication tokens
5. Review error logs in browser console

## Conclusion

The Inventory Purchase Management System provides a complete solution for tracking supplier relationships, managing purchase orders, and maintaining accurate inventory levels. With automatic calculations, real-time updates, and comprehensive tracking, it streamlines the entire purchase-to-inventory process while maintaining data integrity and providing valuable business insights.