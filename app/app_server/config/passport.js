const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Teacher = require('../models/teacher');
const Student = require('../models/student');
const config = require('./database');
const bcrypt = require('bcryptjs');

module.exports = function(passport){
    //Local strategy
    passport.use(new LocalStrategy(function(username, password, done){
        //Match username
        console.log("username from user is "+username);
        Teacher.findOne({username:username}, function(err, user){
            console.log('username db '+user);
            if(err) throw err;
            if(!user){
                console.log("no Teacher found, let's search for a Student");
                Student.findOne({registration: username}, function(err, user){
                    console.log('student returned '+user);
                    if(err) throw err;
                    if(!user){
                        return done(null, false, {message: 'No user found'});
                    }
                    else{
                        //Match password
                        bcrypt.compare(password, user.password, function(err, isMatch){
                            if(err) throw err;
                            if(isMatch){
                                return done(null, user);
                            }
                            else{
                                return done(null, false, {message: 'Wrong Password'});
                            }
                        });
                    }
                })
            }
            else{
                //Match password
                bcrypt.compare(password, user.password, function(err, isMatch){
                    if(err) throw err;
                    if(isMatch){
                        return done(null, user);
                    }
                    else{
                        return done(null, false, {message: 'Wrong Password'});
                    }
                });
            }
        });
    }));
    //Here we are writing serialize and deserialize user function
    passport.serializeUser(function(user, done){
        console.log("serailize user.id "+user.id);
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done){
        Teacher.findById(id, function(err, user){
            if(err) throw err;
            if(!user){
                Student.findById(id, (err, user) => {
                    if(err) throw err;
                    if(user){
                        console.log("student found "+user.name);
                        done(err, user);
                    }
                })
            }
            else{
                console.log("teacher found "+user.name);
                done(err, user);
            }
        });
    });
}