const mongoose=require("mongoose");
const connect=require("../config/mongoose_connection");

const productScheme=mongoose.Schema({
    email:String,
    name:String,
    productName:String,
    prize:Number,
    discount:Number,
    imgurl:String,
})
module.exports = mongoose.model("productData", productScheme);