/**
 * Created by cbl102 on 26/12/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var usersChallengeGames=new Schema({
    challengeId:{type: Schema.ObjectId, ref:'Challenges'},
    gameName:{type: String,required:true},
    userId:{type: Schema.ObjectId, ref:'User'},
    gameId:{type: Schema.ObjectId, ref:'Games'},
    gameStartTime:{type: Number,required:true,default:0},
    gameEndTime:{type: Number,required:true,default:0},
    createdAt:{type: Date, default: Date.now},
    gameTimerStatus:{type: Boolean,default:false ,required: true},
    paused:{type: Boolean,default:false ,required: true},
    is_delete:{type: Boolean,default:false ,required: true},
});

module.exports = mongoose.model('usersChallengeGames', usersChallengeGames);