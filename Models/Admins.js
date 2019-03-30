
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var Admins = new Schema({
    name: {type: String, trim: true, default: '',},
    email: {type: String, trim: true, unique: true},
    accessToken: {type: String, trim: true,},
    password: {type: String, required:true},
    passwordResetToken: {type: String, trim: true, unique: true,},
    registrationDate: {type: Date, default: Date.now, required: true},
    lastLogin:{type: Date, default: Date.now},
    isSuperAdmin:{type:Boolean,default:false,required:true},
    isDeleted:{type:Boolean,default:false,required:true},
    isBlocked:{type:Boolean,default:false,required:true}
});

module.exports = mongoose.model('Admins', Admins);