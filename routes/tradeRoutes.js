const Request = require('../models/request');
const User = require('../models/user');
const System = require('../models/system');
const Book = require('../models/book');
const Trade = require('../models/trade');
const router = require("express").Router();
const ensureAuthenticate = require('../config/authenticate');
const nodemailer=require('nodemailer');

require("dotenv").config();

var transporter=nodemailer.createTransport({
    host:"smtp-mail.outlook.com",
    secureConnection:false,
    port:587,
    tls:{ciphers:'SSLv3'},
    auth:{
        user:'customer_service_jb@outlook.com',
        pass:process.env.PASS
    }
})

router.get("/all", ensureAuthenticate,(req, res) => {
    Trade.find({})
         .sort({date:-1})
         .populate({path:"request",model:Request})
         .then((trades)=>{
            res.render('trade/alltrade',{trades:trades,title:"All Trade Histories"})
         })
         .catch((err)=>{throw err})
})

router.get('/:request_id', ensureAuthenticate, (req, res) => {
    const { request_id } = req.params;
    Request.findById(request_id)
        .then((request) => {
            res.render("request/acceptrequest", { request: request, id: request_id })
        })

})

router.post('/:request_id', ensureAuthenticate, (req, res) => {
    const { request_id } = req.params;
    const trade = new Trade();
    trade.request = request_id;
    trade.fullname = req.body.fullname;
    trade.address = req.body.address;
    trade.email = req.body.email;
    trade.city = req.body.city;
    trade.state = req.body.state;
    trade.message = req.body.message;
    trade.username = req.body.username;
    trade.zipcode = req.body.zipcode;
    trade.save((err)=>{
      if (err){throw err}  
    });
  
   Request.findById(request_id)
          .then((request)=>{
              User.findById(request.requestuserid,(err,user)=>{
                const newSystem=new System();
                newSystem.userid=request.requestuserid
                newSystem.request=request_id
                newSystem.title=`Congratulations! Your Trading request for the book - ${request.take} has been accepted`
                newSystem.save({new:true},(err,system)=>{
                    user.systems.push(system._id);
                    user.save();
                });

                var mailOptions={
                    from:'"JB Book Trading Club" <customer_service_jb@outlook.com>',
                    to:user.email,
                    subject:`Congratulations! Your Trading request for the book - ${request.take} has been accepted`,
                    html:`<b>Hello ${user.fullname},</b><br><h5>Congratulations! Your book request for the book "${request.take}" has been accepted by ${request.take_username},The transaction ID# is ${request._id}</br>
                          <p>Here are ${request.take_username}'s contact information. Please reach out to him/her through email within 7 days to schedule a shipment. If ${request.take_username}
                          doesn't hear back from you within the required timeframe, he/she can have full right to cancel this transaction.<br>
                          <hr><u>${request.take_username}'s contact infomration:</u><br><b>Username:</b> ${request.take_username}<br><b>Full Name:</b> ${req.body.fullname}<br><b>Email:</b> ${req.body.email}<br>
                          <b>Address:</b> ${req.body.address}<br><b>City:</b> ${req.body.city}<br><b>State:</b> ${req.body.state}<br><b>Zipcode:</b> ${req.body.zipcode}<br><b>Message:</b> ${req.body.message}<br><br>
                          <hr><p>Have Questions? Feel free to reach out to us at customer_service_jb@outlook.com. Thanks again for using our JB Book Club Trading platform. Happy Trading!<br><br>
                          <p> The JB Book Trading Club `                
                }
                 /** temporary disable this function because outlook keep ask for verify account
                transporter.sendMail(mailOptions,(err,info)=>{
                    if(err){throw err}
                    console.log('Message sent:'+info.response);
                })*/
                
                res.render("trade/tradesuccess",{request:request})
              })
          })
})

router.get("/system/details/:systemid",ensureAuthenticate,(req,res)=>{
    const {systemid}=req.params;
    console.log(systemid)
    System.findById(systemid)
          .populate({path:"request",model:Request})
          .then((system)=>{
            Trade.findOne({request:system.request},(err,trade)=>{
                console.log(trade)
                res.render('message/systemtrademessage',{request:system.request,trade:trade})
            })                      
          })
          .catch((err)=>{
              throw err;
          })

})


router.get("/system/:userid",ensureAuthenticate,(req,res)=>{
    const {userid}=req.params;
    
    User.findById(userid)
        .sort({date:-1})
        .populate({path:"systems",model:System})
        .then((user)=>{
            res.render('message/msgtitle',{systems:user.systems})
        })
        .catch((err)=>{
            throw err;
        })
})



module.exports = router;
