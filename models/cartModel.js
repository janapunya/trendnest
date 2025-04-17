const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    email:String,
    productId:String,
});


module.exports = mongoose.model('cart', cartSchema); 