const mongoose = require("mongoose");

mongoose.connect('mongodb+srv://trendnestshop99:Punya%407477@cluster0.kukccy7.mongodb.net/trendnest', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

module.exports = mongoose.connection;