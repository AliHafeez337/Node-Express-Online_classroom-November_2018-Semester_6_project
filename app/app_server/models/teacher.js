//bring in mongoose;
let mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Subject schema
const teacherSchema = new Schema({
    name: {
        type : String,
        required : true
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        required: true
    },
    classes: Array
    /*
    classes: {
        type: Array,
        required: true
    }
    */
});

//we create a model and set it to a variabe 'Teacher'
module.exports= mongoose.model('teacher', teacherSchema);