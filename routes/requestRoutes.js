const Request = require('../models/request');
const User = require('../models/user');
const Book = require('../models/book');
const Trade = require('../models/trade');
const router = require("express").Router();
const ensureAuthenticate = require('../config/authenticate');

//make a request 
router.get("/newrequest/:id", ensureAuthenticate, (req, res) => {
    const { id } = req.params;

    User.findById(id)
        .populate({ path: "books" ,model:Book})//model has to be included here because use mongoose.createConnection()
        .then((user) => {
            Book.find({ username: { $ne: user.username },tradestatus:"Active" }, (err, books) => {
                res.render("request/user-request", { books: user.books, nonuserbooks: books })
            })

        })
        .catch((err) => { throw err })
})

router.post('/newrequest/:id', ensureAuthenticate, (req, res) => {
    const { id } = req.params;
    const { pick } = req.query;
    const take = req.query.take.split('.')[0];
    const takeid = req.query.take.split('.')[1];
    const take_username = req.query.take.split('.')[2];
    const take_userid = req.query.take.split('.')[3]
    const { user } = req.query;
    const { note } = req.body;
    const newRequest = new Request();
    const date = new Date();

    const query = {
        takeid: takeid,
        requestuserid: id,
        pick: pick
    }
    Request.findOne(query, (err, request) => {
        if (err) { throw err }
        else if (request !== null) {//make sure user didn't send the same request
            req.flash("error", "Sorry ,You already made this request already. Tried different book request. ")
            res.send("error")
        } else {
            newRequest.requestuserid = id;
            newRequest.pick = pick;
            newRequest.take = take;
            newRequest.takeid = takeid;
            newRequest.take_username = take_username;
            newRequest.take_userid = take_userid;
            newRequest.note = note;
            newRequest.date = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
            newRequest.requestusername = user;
            newRequest.save({ new: true }, (err, request) => {
                Book.findById(takeid, (err, book) => {
                    book.requests.push(request._id);
                    book.save();
                })

            });
            req.flash("message", "Your request has been sent! We'll let you know once lister accept your book. You can also click on your outgoing requests tag to check on the status.Feel free to ask any question to the lister as well.");
            res.send("success");
        }
    })

})

router.get('/all', ensureAuthenticate, (req, res) => {
    Request.find({})
           .sort({"requestdate":-1})
           .exec((err, requests) => {
        if (err) { throw err }
        res.render("request/allrequest", { requests: requests, title: "All Requests" })
    })
})


router.get('/myincoming/', ensureAuthenticate, (req, res) => {
    const userid = req.user._id;
    const { status } = req.query;

    User.findById(userid)
        .populate({ path: "books", model:Book, populate: { path: "requests", model:Request, match: { status: { $eq: status } } } })
        .then((user) => {
            const book_array = user.books.filter((book) => {
                return book.requests.length > 0
            })
            //only books with requests will show up in this page
            res.render("request/incoming", { books: book_array })

        })
})

//for the statas of  Accepted and Rejected
router.post('/myincoming/:request_id', ensureAuthenticate, (req, res) => {
    const { status } = req.body;
    const { request_id } = req.params;

    console.log(status, request_id);//update request status to either Rejected or Accepted
    Request.findByIdAndUpdate(request_id, { $set: { "status": status } }, { new: true, useFindAndModify: false }, (err, request) => {
        //console.log(request)        
        if (status === "Rejected") {
            req.flash("message", "Your response has been submited")
            return res.redirect('/request/myincoming/?status=Pending')
        } else {

            const query1 = {
                bookname: request.take,
                username: request.take_username
            };
            const query2={
                bookname:request.pick,
                username:request.requestusername
            }
            // update the book status if it is accepted
            Book.findOne(query1, (err, book) => {
                //console.log(book);
                if (err) { throw err }
                if (book.tradestatus == "Active" && status == "Accepted") {
                    book.tradestatus = "Deal"
                    book.save();
                }
            })

            Book.findOne(query2,(err,book)=>{
                if (err) { throw err }
                if (book.tradestatus == "Active" && status == "Accepted") {
                    book.tradestatus = "Deal"
                    book.save();
                }
            })
            res.redirect('/trade/' + request_id)

        }

    })
})



router.get('/myoutgoing', ensureAuthenticate, (req, res) => {
    const userid = req.user._id;
    Request.find({ requestuserid: userid }, (err, requests) => {
        //console.log(requests)
        if (requests.length == 0) {
            req.flash("error", "You don't have any outgoing request, start to make a book request.")
            res.redirect("/request/newrequest/" + userid)
        } else {
            res.render("request/outgoing", { requests: requests })
        }

    })
})

router.delete('/delete/:requestid', ensureAuthenticate, (req, res) => {
    const { requestid } = req.params

    Request.findById(requestid, (err, request) => {
        if (request.status === "Accepted") {
            req.flash("error","Sorry, You can't delete this request because this request is already accepted")
          res.send("You can't delete this request")
        } else {
            const query = {
                bookname: request.take,
                userid: request.take_userid
            }
            Book.findOne(query, (err, book) => {
                const n = book.requests.indexOf(requestid);
                book.requests.splice(n, 1);
                book.save();
            })
            Request.deleteOne({ _id: requestid }, (err, result) => {
                req.flash("error", "This request has been canceled");
                res.send("success")
            })
        }
    })



})



module.exports = router;
