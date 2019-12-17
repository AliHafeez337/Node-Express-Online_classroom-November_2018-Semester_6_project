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
      console.log("Connected to mongodb in class.js");
  });
  //Check for db errors
  db.on('error', function(err){
      console.log(err);
      console.log("Connection failed in class.js");
  });

let result = "classes will be shown here";

router.get('/new', ensureAuthenticated, (req, res) => {
  //get form to create a new class
  res.send('create class');
});

router.post('/new', ensureAuthenticated,  (req, res) => {
    //upload form to create a new class
    //redirect to /class/
    console.log("/clas/new is running");
    
    const title = req.body.Title;
    const lec = req.body.Lectures;
    const credit = req.body.Credits;
    const Date = req.body.Date;
    const Time = req.body.Time;
    
    req.checkBody('Title', 'Title is required').notEmpty();
    req.checkBody('Lectures', 'Lectures is required').notEmpty();
    req.checkBody('Credits', 'Credits is required').notEmpty();
    req.checkBody('Date', 'Date is required').notEmpty();
    req.checkBody('Time', 'Time are required').notEmpty();
  
    let errors = req.validationErrors();
  
    if(errors){
        res.send('errors', {
            errors: errors
        });
    }
    else{
        //console.log('res.locals.user '+req.user);
        let newClass = new Subject({
            title: title,
            teacher: req.user._id,
            lectures: lec,
            credits: credit,
            students: [],
            timings: Date+" "+Time,
            tempAttendence: []
        });
        console.log("new class is "+newClass);
        
        newClass.save(function(err){
          if(err){
              console.log(err);
          }
          else{
              req.flash('success', 'You have registered new class');
              res.redirect('/teacher/');
          }
        });
    }
});

router.get('/', function(req, res) {
    //all the classes will be shown
    Subject.find(function(err, cla){
        console.log("working teacher id "+ cla);
        if(err){
            console.log(err);
        }
        else {
            res.send(cla);
        }
    });
});
  
router.get('/:id/start', (req, res) => {
    //teacher starts class
    var moment = require('moment');

    var startDate = moment(new Date()).format("YYYY-MM-DD");
    var endDate;// = moment(new Date("Sat Nov 25 2018 09:13:40 GMT+0530 (IST)")).format("YYYY-MM-DD");

    Subject.findById(req.params.id, (err, dataa) => {
        if(!dataa){
            res.status(500).send("You are not authorized to do this.");
        }
        else if(dataa.teacher != req.user._id){
            res.status(500).send("You are not authorized to do this.");
        }
        else{
            endDate = dataa.timings;
            console.log("end date is "+endDate);
            
            //var endDate = moment(new Date("Sat Nov 25 2018 09:13:40 GMT+0530 (IST)")).format("YYYY-MM-DD");
            var remainingDate = moment(endDate).diff(startDate, 'minutes');
            //var remainingDate = moment(endDate).diff(startDate, 'days');
            console.log(remainingDate+" minutes remaining to start the class");

            if(remainingDate>0){
                res.send("you can not class start before time.\n"+remainingDate+" minutes remaining to start the class.");
            }
            else{
                remainingDate = remainingDate + 2(remainingDate);
                res.send("clas is starting "+remainingDate+" minutes late.")
            }
        }
    });

});

router.get('/:id/end', ensureAuthenticated, (req, res) => {
  //teacher ends class
    var total = 0;
    var att;
    Subject.findOne({_id:req.params.id})
    .then(subject=>{
        if(subject.teacher != req.user._id){
            res.status(500).send("You are not authorized to do this.");
        }
        console.log(subject.tempAttendences);
        subject.tempAttendences.forEach(function (y) {
            console.log("elemets are "+y);
            total++;
            Marks.findOne({courseId: req.params.id,studentId:y})
            .then(obj=>{
                console.log(obj);
                console.log(obj.attendence);
                att = 5 + obj.attendence;
                Marks.update({_id: obj._id}, {$set: {"attendence": att}}, function(err){
                    if(err){
                        console.log("Error "+err);
                        return;
                    }
                    else{
                        req.flash('success', 'Attendence Updated');
                        res.send("attendence updated for "+obj._id);
                    }
                })
            })
            .catch(err=>{
                console.log('err in getting marks '+err);
            });
        });
        Subject.update({_id: subject._id}, {$set: {"tempAttendences": []}}, function(err){
            if(err){
                console.log("Error "+err);
                return;
            }
            else{
                console.log("attendence is empty now in "+subject._id);
            }
        })
           
    })
    .catch(err=>{
        if(err) throw err;
    })
    
});

router.get('/:id/join', ensureAuthenticated, (req, res) => {
  //student joins class

  console.log("req.user._id "+req.user._id);
    console.log("req.params.id "+req.params.id);

    Subject.findOne({_id:req.params.id})
        .then(subject=>{
            console.log(subject);
            subject.tempAttendences.push(req.user._id);
            subject.save(err => {
              if (err) throw err;
              res.send({ success: "student enters a class" });
            });
        })
        .catch(err=>{
            if(err) throw err;
        })

});

router.get('/:id/leave', ensureAuthenticated, (req, res) => {
  //student leaves class
  
  console.log("req.user._id "+req.user._id);
    console.log("req.params.id "+req.params.id);
    
    Subject.findOne({_id:req.params.id})
    .then(subject=>{
        console.log(subject);
        subject.tempAttendences.pop(req.user._id);
        subject.save(err => {
          if (err) throw err;
          res.send({ success: "student leaves class" });
        });
    })
    .catch(err=>{
        if(err) throw err;
    })

});

router.get('/:id/register', ensureAuthenticated, (req, res) => {
    //student registers a course
    console.log("req.user._id "+req.user._id);
    console.log("req.params.id "+req.params.id);
    let newcl = new Marks({
        courseId: req.params.id,
        studentId: req.user._id,
        marks: 0,
        attendence: 0
    });
    newcl.save(function(err){
        if(err){
            console.log(err);
        }
        else{
            console.log("new record in marks.");
        }
    });
    Student.findOne({_id:req.user._id})
    .then(subject=>{
        
        console.log(subject);
        subject.courses.push(req.params.id);
        subject.save(err => {
          if (err) throw err;
          
          Subject.findOne({_id:req.params.id})
          .then(subject=>{
              console.log(subject);
              subject.students.push(req.params.id);
              subject.save(err => {
                if (err) throw err;
                res.send({ success: "student registers class" });
              });
          })
          .catch(err=>{
              if(err) throw err;
          })
        });
    })
    .catch(err=>{
        if(err) throw err;
    })
    /*
    
            Marks.find({courseId: req.params.id,studentId:y})
            .then(obj=>{
                console.log(obj);
                console.log(obj.attendence);
                att = 5 + obj.attendence;
                Marks.update({studentId: y}, {$set: {"attendence": att}}, function(err){
                    if(err){
                        console.log("Error "+err);
                        return;
                    }
                    else{
                        req.flash('success', 'Attendence Updated');
                        res.send("attendence updated for "+y);
                    }
                });
            })
            */
    
});

router.get('/:id/drop', ensureAuthenticated, (req, res) => {
//student drops a course
console.log("req.user._id "+req.user._id);
    console.log("req.params.id "+req.params.id);
    
    Student.findOne({_id:req.user._id})
    .then(subject=>{
        console.log(subject);
        subject.courses.pop(req.params.id);
        subject.save(err => {
          if (err) throw err;
          res.send({ success: "student drops class" });
        });
    })
    .catch(err=>{
        if(err) throw err;
    })
});
    
router.get('/:id', (req, res) => {
  //attriblutes of a single class
  //actually, subjects will be shown here
  //by clicking each subject, its students and the teacher will be shown here
  //teacher can see each student and edit there marks or attendence
  //students can only see students and teachers
  //others (non registered people) can only see no of students and teacher or introduction
    var person;
    var object;
    console.log("req.user ="+req.user);
    if (!req.user){
        console.log("Others will see credentials of subject");
        Subject.find({_id:req.params.id}, (err, ob) => {
          if (err){
              console.log("error in getting subjects "+err);
          }
          else{
              console.log("ob is "+ob);
              res.send(ob);
          }
      });
    }
    else {
        Teacher.findById(req.user.id, (err, tea) => {
            if(err){
                console.log("error in getting teacher from db "+err)
            }
            else if(!tea){
                console.log("teacher not found ");
            }
            else{
                person = 0;
                object = tea;
                console.log("teacher is online");
                Subject.find({teacher: req.user.id}, (err, ob) => {
                    if (err){
                        console.log("error in getting subjects "+err);
                    }
                    else{
                        console.log("ob is "+ob.students);
                        res.send(ob);
                        res.end();
                    }
                });
            }
            });
        Student.findById(req.user.id, (err, stu) => {
            if(err){
                console.log("error in getting student from db "+err)
            }
            else if(!stu){
                console.log("student not found ");
            }
            else{
                person = 1;
                object = stu;
                console.log("student is online");
                Marks.find({studentId: req.user.id}, (err, ob) => {
                    if (err){
                        console.log("error in getting marks "+err);
                    }
                    else{
                        console.log("ob is "+ob);
                        res.send(ob);
                        res.end();
                    }
                });
            }
        });
    }
  
});

router.put('/:id/update', (req, res) => {
    Subject.update({_id: req.user._id}, 
        {$set: {"title": req.params.title,
            "credits": req.params.credits,
            "timings": req.params.timings}}, function(err){
        if(err){
            console.log("Error "+err);
            return;
        }
        else{
            console.log("record updated ");
        }
    })
});


router.delete('/:id', function(req, res){
    //Checiking if any user is loged in
    if(!req.user._id){
        res.status(500).send();
    }
    let query= {_id: req.params.id}
    
    Subject.findById(req.params.id, function(err, subj){
        if(subj.teacher != req.user._id){
            res.status(500).send("You are not authorized to do this.");
        }
        else{
            console.log("started working on deletion.");
            subj.remove(query, function(err){
                if(err){
                    console.log("error in deletion.");
                    console.log(err);
                }
                else{
                    /*
                   Student.find()
                   .then(doc=>{
                       console.log(doc.courses);
                       doc.courses.forEach(function (y) {
                           console.log("elemets are "+y);
                            doc.courses.pop(y);
                        });
                        res.send('Successfully removed the course.');
                    })
                    .catch(err => {
                        console.log(err);
                    });
                    */
                   res.send('Successfully removed the course.');
                }
            }); 
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
      res.redirect('/class');
  }
}
module.exports = router;
