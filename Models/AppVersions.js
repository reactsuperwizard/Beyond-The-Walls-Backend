
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var AppVersions = new Schema({
    latestIOSVersion : {type: String, required:true},
    latestAndroidVersion : {type: String, required:true},
    criticalAndroidVersion : {type: String, required:true},
    criticalIOSVersion : {type: String, required:true},
    timeStamp: {type: Date, default: Date.now}
});


module.exports = mongoose.model('AppVersions', AppVersions);