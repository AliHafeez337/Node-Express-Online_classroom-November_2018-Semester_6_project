//bring in mongoose;
let mongoose = require('mongoose');

//Subject schema
let subjectSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    teacher: {
        type: String,
        required: true
    },
    lectures: {
        type: Number,
        required: true
    },
    credits: {
        type: Number,
        required: true
    },
    students: Array,
    timings: {
        type: Date,
        required: true
    },
    
   tempAttendences: Array
});

//we create a model and set it to a variabe 'Subject'
module.exports = mongoose.model('Subject', subjectSchema);