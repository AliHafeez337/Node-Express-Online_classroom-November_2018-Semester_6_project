//bring in mongoose;
let mongoose = require('mongoose');

//marks and attendence schema
let marksSchema = mongoose.Schema({
    courseId: {
        type : String,
        required : true
    },
    studentId: {
        type : String,
        required : true
    },
    marks: {
        type : Number,
        required : true
    },
    attendence: {
        type : Number,
        required : true
    }
});

//we create a model and set it to a variabe 'Marks'
const Marks = module.exports = mongoose.model('Marks', marksSchema);