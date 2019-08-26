const mongoose=require('mongoose');
require("dotenv").config();
const conn=mongoose.createConnection(process.env.URL,{useNewUrlParser:true});

const BookSchema=mongoose.Schema({
    username:{type:String,
          required:true},
    userid:{type:mongoose.Schema.Types.ObjectId},      
    bookname:{type:String,
            required:true},
    description:String,
    requestdate:{type:Date,
                 default:new Date},         
    requests:[{type:mongoose.Schema.Types.ObjectId,ref:"Request"}],            
    tradestatus:{type:String,
                default:"Active"}        
})

module.exports=conn.model("Book",BookSchema);