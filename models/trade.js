const mongoose = require('mongoose');
require("dotenv").config();
const conn=mongoose.createConnection(process.env.URL,{useNewUrlParser:true});

const TradeSchema = mongoose.Schema({
   request: {type:mongoose.Schema.Types.ObjectId,ref:"Request"},
   username: {
      type: String
   },
   fullname: {
      type: String
   },
   email: String,
   city: String,
   state: String,
   address: String,
   zipcode: Number,
   date: {
      type: Date,
      default: new Date()
   }
})

module.exports = conn.model("Trade", TradeSchema);