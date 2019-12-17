//bring in mongoose;
let mongoose = require('mongoose');

//Subject schema
let studentSchema = mongoose.Schema({
    name: {
        type : String,
        required : true
    },
    registration: {
        type : String,
        required : true,
        unique: true
    },
    password: {
        type : String,
        required : true
    },
    active: {
        type: Boolean,
        required : false
    },
    courses: Array
    /*
    courses: {
        
        type: Array,
        required : false
    }
    */
});

//we create a model and set it to a variabe 'Student'
const Student = module.exports = mongoose.model('Student', studentSchema);