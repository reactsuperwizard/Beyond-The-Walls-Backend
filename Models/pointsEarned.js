var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const pointsEarned=new Schema({
    gameId:{ type:Schema.ObjectId,ref:'Game' },
    challengeId:{type:Schema.ObjectId,ref:'Game'},
    userId:{type:Schema.Types.ObjectId,ref:'User'},
    point:{type:String,default:""},
});

module.exports=mongoose.model('pointsEarned',pointsEarned);