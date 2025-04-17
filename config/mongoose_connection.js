const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://trendnestshop99:U3NybUGPZ4xBeNaK@cluster0.2bzw6oc.mongodb.net/trendnest')
module.exports = mongoose.connection;