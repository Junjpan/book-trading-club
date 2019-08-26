const Book=require('../models/book');
const User=require('../models/user');
const Request=require('../models/request');
const router=require("express").Router();
const ensureAuthenticate=require('../config/authenticate');

router.get("/add",ensureAuthenticate,(req,res)=>{
    const {id}=req.user
    User.findById(id)
        .populate({path:"books",model:Book})
        .then((user)=>res.render('book/addbook',{subtitle:"ADD BOOK for " + req.user.fullname,
                                                 books:user.books,
                                                 }))
        .catch(err=>console.log(err))
    
    })


router.post("/add",ensureAuthenticate,(req,res)=>{
    const {_id,username}=req.user;
    const {bookname,description}=req.body;
    const newBook=new Book();
    newBook.username=username;
    newBook.bookname=bookname;
    newBook.description=description;
    newBook.userid=_id
    newBook.save({new:true},(err,book)=>{
       // console.log(book);
    User.findById(_id,(err,user)=>{
        user.books.push(book._id);
        user.save();
        //console.log(user);
        req.flash("message","New book has been added!");
    return res.redirect('/book/add');
    })
    
    });  
}) 

// search a book
router.get("/search",ensureAuthenticate,(req,res)=>{
    const {bookname}=req.query;
    Book.find({}) 
        .then((books)=>{
          const filterBook=books.filter((data)=>{
              var search= bookname.toLowerCase().trim();
                return data.bookname.toLowerCase().indexOf(search)!==-1
            })
            if(filterBook.length>0){
                res.render("book/searchbook",{books:filterBook,title:"Search Result for Keyword '"+bookname+"'" });
            } else{
                req.flash("error","No result found, please try different keyword.");
                res.redirect("/book/all/1");
            }         
            
        })
        .catch((err)=>{throw err})   
})

router.delete("/:bookid",ensureAuthenticate,(req,res)=>{
    
    const {bookid}=req.params;
    const {id}=req.user;
    //console.log(bookid);
    Book.findById(bookid,(err,book)=>{
        //You can't delete a book if you have request attach this book
        if (book.requests.length>0){
            req.flash("error","Sorry, you can't delete this book because there are some trade requests for this book already")
            res.send("success")
            
        }else{User.findById(id,(err,user)=>{
            const n=user.books.indexOf(bookid);
            user.books.splice(n,1);
            user.save();
        });
        
        Book.deleteOne({_id:bookid},(err)=>{
         if(err){throw err};
         req.flash("error","The book has been deleted");
         res.send("success")
        })

        }
    })

})  

//edit a book

router.get("/edit/:bookid",ensureAuthenticate,(req,res)=>{
    const {bookid}=req.params;
    Book.findById(bookid,(err,book)=>{
        res.render("book/editbook",{book:book})
    })   
})

router.post("/edit/:bookid",ensureAuthenticate,(req,res)=>{
    const {bookid}=req.params;
    const {description}=req.body;
    Book.findById(bookid,(err,book)=>{
        book.description=description;
        book.save();
        req.flash("message",`${book.bookname} has been updated!`)
        res.redirect('/book/add')
    })   
})  


// get all the book
router.get('/all/:page',ensureAuthenticate,(req,res)=>{
//new
const resPerPage=5;//result per page
const page=req.params.page||1;
Book.countDocuments({tradestatus:"Active"},(err,count)=>{
    //console.log(count);
    Book.find({tradestatus:"Active"})
        .sort({"requestdate":-1})
        .skip((resPerPage*page)-resPerPage)//new skipping page values,
        .limit(resPerPage) //limit results per page
        .then((allbooks)=>res.render("book/allbooks",{books:allbooks,
                                                    title:"Books Available for Trade",
                                                    currentpage:page,
                                                    pages:Math.ceil(count/resPerPage),
                                                    count:count}))
        .catch((err)=>{throw err})
});

    
         
})

// get all the book for a user
router.get('/:id',ensureAuthenticate,(req,res)=>{
    const {id}=req.params;
    User.findById(id)
        .populate({path:"books",model:Book})
        .then((user)=>{
            res.render('book/userbook',{title:"Books Available for Trade",
                                        books:user.books,
                                        user1:user})
        })
        .catch((err)=>{throw err})
    
})



//get a book request based on bookid
router.get("/requests/:id",ensureAuthenticate,(req,res)=>{
    const bookid=req.params.id;
    const msg=`There is no request for this book`;
    Book.findById(bookid)
        .populate({path:"requests", model:Request})
        .then((book)=>{
            if (book.requests.length==0){
                req.flash('error',msg)
                res.redirect("/book/all/1")
            }else{
                res.render("book/singlebookrequest",{requests:book.requests,
                                                    book:book})
            }
        })
})

module.exports=router;