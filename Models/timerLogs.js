var mongoose = require('mongoose');
var Schema = mongoose.Schema;


const timerLogs=new Schema({
    challengeId:{type: Schema.ObjectId, ref:'Challenges'},
    userGames:{type: Schema.ObjectId, ref:'UsersGames'},
    status:{type:String,default:""},
    startTime:{type:Number,default:""},
    endTime:{type:Number,default:""},
    timeTaken:{type:String,default:""}
});

module.exports=mongoose.model('timerLogs',timerLogs);