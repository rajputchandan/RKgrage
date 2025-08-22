const mongoose = require("mongoose");


const db = async (url) => {
    try {
        await mongoose.connect(url);
        console.log("database connect successfully")
    } catch (error) {
        console.log(error)
    }
}

module.exports = db 