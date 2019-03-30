var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

const depends=new Schema({
    gameId:{type:Schema.ObjectId,ref:'Game'},
    userId:{type:Schema.ObjectId,ref:'User'},
    challengeId:{type:Schema.ObjectId,ref:'Challenges'},
    textAnswer:{ type:String,default:"" },
    point:{type:String,default:""},
    createdAt:{type: Date, default: Date.now}
});

module.exports=mongoose.model('depends',depends);