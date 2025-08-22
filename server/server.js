const express = require("express");
let path = require('path');
const db = require("./databaseConnect/db")
const { scheduleDailyReport } = require('./services/schedulerService');
let app = express();

let dotenv = require("dotenv");


let cors = require("cors")
// console.log(path)
const adminRoute = require('./routes/loginroutes');
const partsRoutes = require('./routes/partsroutes');
const customerRoutes = require('./routes/customerroutes');
const jobCardRoutes = require('./routes/jobcardroutes');
const billingRoutes = require('./routes/billingroutes');
const supplierRoutes = require('./routes/supplierroutes');
const inventoryPurchaseRoutes = require('./routes/inventoryPurchaseroutes');
const employeeRoutes = require('./routes/employeeRoutes');
const reportsRoutes = require('./routes/reportsroutes');
// const empRoute = require('./routes/empRoute.js');
// const taskRoute = require('./routes/taskRoute.js');

dotenv.config({ path: '../.env' });
app.use(express.json())
app.use(cors());

// Serve static files from image directory
app.use('/image', express.static('image'));

let port = process.env.PORT || 5050
db(process.env.MONGOURL);




// Routes

app.use('/api/admin/', adminRoute)
app.use('/api/parts/', partsRoutes);
app.use('/api/customers/', customerRoutes);
app.use('/api/jobcards/', jobCardRoutes);
app.use('/api/billing/', billingRoutes);
app.use('/api/suppliers/', supplierRoutes);
app.use('/api/inventory-purchases/', inventoryPurchaseRoutes);
app.use('/api/employees/', employeeRoutes);
app.use('/api/reports/', reportsRoutes);
// app.use('/api/emp/', empRoute)
// app.use('/api/task/', taskRoute)
// let car = require('../client/build/')

let frontendpath = path.join(__dirname, "../client/build");
console.log(frontendpath)
app.use(express.static(frontendpath))
app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
});

app.use((err, req, res, next) => {
    console.error("Error caught by middleware:", err);
    // If response has already been sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(err);
    }
    return res.status(err.status || 500).json({
        result: false,
        message: err.message || "Internal Server Error",
    });
})



app.listen(port, (err) => {
    console.log(err || "app run on port " + port)
    
    // Start the daily report scheduler
    scheduleDailyReport();
    console.log("📅 Daily admin report scheduler initialized");
})