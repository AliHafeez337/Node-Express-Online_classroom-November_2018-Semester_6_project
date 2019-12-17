var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');// it is used to hash the passoword
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const config = require('../config/database');//importing the database
const Subject = require('../models/subject');
const Student = require('../models/student');
const Teacher = require('../models/teacher');
const Marks = require('../models/marks');
const mongoose = require('mongoose');

mongoose.connect(config.database);
  let db = mongoose.connection;
  //check connection
  db.once('open', function(){
      console.log("Connected to mongodb in student.js");
  });
  //Check for db errors
  db.on('error', function(err){
      console.log(err);
      console.log("Connection failed in student.js");
  });

let result = "students will be shown here";
/* GET users listing. */
router.get('/', ensureAuthenticated, function(req, res, next) {
    res.send(res.locals.user.courses);
});

router.get('/login', (req, res) => {
    //form of login will be rendered
    res.send('login');
});

router.post('/login', (req, res) => {
    //student logsin
    //when student logsin, his registered subjects will be shown on the screen
    //by clicking any one registered subject, link in the class will be called
    console.log("login working");
    passport.authenticate('local', {
        successRedirect: '/student/',
        failureRedirect: '/student/login',
        failureFlash: true
    })(req, res);
});

//Loutout route
router.get('/logout', function(req, res){
    req.logout();
    req.flash('success', 'You are loged out');
    res.redirect('/student/login');
});

router.get('/register', (req, res) => {
    //registration form is called by student
    res.send('get registered');
});

router.post('/register', (req, res) => {
    //student gets registered

    console.log("req.name "+req.body.Name);
    console.log("req.reg "+req.body.Registration);
    console.log("req.pass1 "+req.body.Password1);
    console.log("req.pass2 "+req.body.Password2);

    const name = req.body.Name;
    const reg = req.body.Registration;
    const pass1 = req.body.Password1;
    const pass2 = req.body.Password2;
    
    req.checkBody('Name', 'Name is required').notEmpty();
    req.checkBody('Registration', 'Registration is required').notEmpty();
    req.checkBody('Password1', 'Password is required').notEmpty();
    req.checkBody('Password2', 'Passwords do not match').equals(req.body.Password1);

    let errors = req.validationErrors();
    console.log('errors are '+errors);

    if(errors){
        res.send('errors', {
            errors: errors
        });
    }
    else{
        let newUser = new Student({
            name: name,
            registration: reg,
            password: pass2,
            active: true,
            courses: []
        });
        //now password hashing
        
        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(newUser.password, salt, function(err, hash){
                if(err){
                    console.log(err);
                }
                newUser.password = hash;
                newUser.save(function(err){
                    if(err){
                        console.log(err);
                    }
                    else{
                        req.flash('success', 'You are now registered and can login');
                        res.redirect('/teacher/login');
                    }
                });
            });
        });
        
    }
});


router.get('/:id/marks', ensureAuthenticated, (req, res) => {
    //view the form to edit marks
    //only teacher can call this link
    //res.send(res.locals.user.);
    res.send('send form');
});

router.post('/:id/marks', ensureAuthenticated, (req, res) => {
    //send the form
    //only teacher can call this link
    
    Marks.update({studentId: req.params.id}, {$set: {"marks": req.body.Marks}}, function(err){
        if(err){
            console.log("Error "+err);
            return;
        }
        else{
            req.flash('success', 'Marks Updated');
            res.redirect('/student/'+req.params.id);
        }
    })
});

router.get('/:id/block', ensureAuthenticated, (req, res) => {
    //only teacher can call this link
    let query= {_id: req.params.id}=
    Teacher.findById(req.user._id, function(err, tea){
        if(err){
            res.send("you are not authorized for this.");
        }
        else if(!tea){
            res.send("you are not authorized for this.");
        }
        else{
            Student.findById(req.params.id, function(err, subj){
                        if(err){
                            console.log(err);
                        }
                        else if(!subj){
                            res.send("document not found.");
                        }
                        else{
                            subj.remove(query, function(err){
                                if(err) throw err;
                                else{
                                    res.send('Successfully removed the course.');
                                }
                        }); 
                        }
            });
        }
    });
});

router.get('/:id', ensureAuthenticated, (req, res) => {
    //marks and attendence will be shown here
    //teacher can edit marks or attendence
    //student can only see them
    Student.findById(req.params.id, function(err, std){
        console.log("working teacher id "+ std.name);
        if(err){
            console.log(err);
        }
        else if(!std){
            res.send("no student found");
        }
        else {
            res.send(std);
        }
    });
});

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }    
    else{
        console.log("redirecting to logoin");
        req.flash('danger', 'Please Login first');
        res.redirect('/student/login');
    }
}

module.exports = router;
