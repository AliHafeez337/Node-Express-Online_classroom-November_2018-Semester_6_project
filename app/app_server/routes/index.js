var express = require('express');
var classRouter = require('./class');
var teacherRouter = require('./teacher');
var studentRouter = require('./student');

const config = require('../config/database');//importing the database
const mongoose = require('mongoose');
const Subject = require('../models/subject');

var appRouter=function(app){
  mongoose.connect(config.database);
  let db = mongoose.connection;
  //check connection
  db.once('open', function(){
      console.log("Connected to mongodb in index.js");
  });
  //Check for db errors
  db.on('error', function(err){
      console.log(err);
      console.log("Connection failed in index.js");
  });

  /* GET home page. */
  app.get('/', function(req, res, next) {
    // res.render('index', { title: 'class room' });
    res.send('classroom');
  });
  app.use('/class', classRouter);
  app.use('/student', studentRouter);
  app.use('/teacher', teacherRouter);

}

module.exports=appRouter;