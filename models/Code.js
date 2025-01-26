const mongoose = require('mongoose')
const { required } = require('nodemon/lib/config')
const Schema = mongoose.Schema


const CodeSchema = new Schema({

    isUsed: {
        type: Boolean, 
        required: true, 
    },
    Code :{
        type: String, 
        required: true,  
    },
    codeType:{
        type : String,
        required: true,
    },
    chapterName:{
        type:String,
        required: true,
    },
    codeGrade:{
        type: String,
        required: true,
    },
    codeFor:{
        type:String,
        // required: true,
    },
    usedBy :{
        type: String, 
        // required: true,  
    },
    usedIn: {
        type: String, 
        // required: true, 
    },


},{timestamps:true});

const Code = mongoose.model('Code',CodeSchema)

module.exports=Code;