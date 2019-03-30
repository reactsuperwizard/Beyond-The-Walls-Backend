var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

const Attempts=new Schema({

    gameId:{type:Schema.ObjectId,ref:'Game'},
    userId:{type:Schema.ObjectId,ref:'User'},
    challengeId:{type:Schema.ObjectId,ref:'Challenges'}

});

module.exports=mongoose.model('Attempts',Attempts);