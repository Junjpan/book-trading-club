const mongoose=require('mongoose');
require("dotenv").config();
const conn=mongoose.createConnection(process.env.URL,{useNewUrlParser:true});

const SystemSchema=mongoose.Schema({
    userid:mongoose.Schema.Types.ObjectId,
    request:{type:mongoose.Schema.Types.ObjectId, ref:"Request"},  
    date:{type:Date,
          default:new Date()},
    title:String              
})

module.exports=conn.model("System",SystemSchema);