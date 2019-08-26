const mongoose=require('mongoose');
require("dotenv").config();
const conn=mongoose.createConnection(process.env.URL,{useNewUrlParser:true});

const ReplySchema=mongoose.Schema({
    username:{type:String,
          required:true},
    message:{type:String,
            required:true},
    replydate:{type:Date,        
        default:new Date()},
    threadid:mongoose.Schema.Types.ObjectId,    
    date:String          
})

module.exports=conn.model("Reply",ReplySchema);