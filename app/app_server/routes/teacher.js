var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');// it is used to hash the passoword
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const config = require('../config/database');//importing the database
const Teacher = require('../models/teacher');
const Subject = require('../models/subject');

const mongoose = require('mongoose');

mongoose.connect(config.database);
  let db = mongoose.connection;
  console.log('db is '+db);
  //check connection
  db.once('open', function(){
      console.log("Connected to mongodb in teacher.js");
  });
  //Check for db errors
  db.on('error', function(err){
      console.log(err);
      console.log("Connection failed in teacher.js");
  });

let result = "teachers will be shown here";
/* GET users listing. */
router.get('/', ensureAuthenticated, (req, res, next) => {
    //his classes will be shown here
    //by clicking a class, link to a single class will be called
    
    Subject.find({'teacher':res.locals.user._id}, function(err, sub){
        console.log("user id is "+res.locals.user._id);
        if(err){
            console.log(err);
        }
        else {
            res.send(sub);
        }
    });
    //res.send(result);
});

router.get('/register', (req, res) => {
    res.send('register');
});

router.post('/register', (req, res) => {
    console.log("/register running");
    console.log("req.name "+req.body.Name);
    console.log("req.email "+req.body.Email);
    console.log("req.quali "+req.body.Qualification);
    console.log("req.user "+req.body.userName);
    console.log("req.pass1 "+req.body.Password1);
    console.log("req.pass2 "+req.body.Password2);

    const name = req.body.Name;
    const email = req.body.Email;
    const quali = req.body.Qualification;
    const user = req.body.userName;
    const pass1 = req.body.Password1;
    const pass2 = req.body.Password2;
    
    req.checkBody('Name', 'Name is required').notEmpty();
    req.checkBody('Email', 'Email is required').notEmpty();
    req.checkBody('Qualification', 'Qualification is required').notEmpty();
    req.checkBody('userName', 'userName is required').notEmpty();
    req.checkBody('Password1', 'Password is required').notEmpty();
    req.checkBody('Password2', 'Passwords do not match').equals(req.body.Password1);

    let errors = req.validationErrors();

    if(errors){
        console.log("errors "+errors);
        res.send('errors', {
            errors: errors
        });
    }
    else{
        console.log("no errors "+errors);
        let newUser = new Teacher({
            name: name,
            email: email,
            username: user,
            password: pass2,
            qualification: quali,
            active: true,
            classes: []
        });
        console.log("new user is "+newUser);
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
                        console.log('error occured');
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

//Login route
router.get('/login', function(req, res){
    console.log("login route");
    res.send('login');
});

console.log("reached near");
//Login process
router.post('/login', function(req, res, next){
    console.log("login working");
    /* passport.authenticate('local',  {
        successRedirect: '/teacher/',
        failureRedirect: '/teacher/login',
        failureFlash: true
    })(request, response)
    console.log(response); */
    passport.authenticate('local', {
        successRedirect: '/teacher/',
        failureRedirect: '/teacher/login',
        failureFlash: true
    })(req, res, next); 
    /* res.send(successRedirect);
    res.send(failureRedirect); */
});

//Loutout route
router.get('/logout', function(req, res){
    req.logout();
    req.flash('success', 'You are loged out');
    res.redirect('/teacher/login');
});

router.get('/:id', (req, res) => {
    //anyone can see teachers profile like qualification
    //but only teacher himself can edit them
    console.log("teacher got called"+res.params.id);
    Teacher.findById(res.params.id, function(err, teach){
        console.log("working teacher id "+ teach.name);
        if(err){
            console.log(err);
        }
        else {
            res.send(teach);
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
        res.redirect('/teacher/login');
    }
}

module.exports = router;
