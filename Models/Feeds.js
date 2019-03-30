/**
 * Created by cbl102 on 27/12/16.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');



var Feeds=new Schema({
    gameId:{type:Schema.ObjectId, ref: 'Games'},
    challengeId:{type:Schema.ObjectId, ref: 'Challenges'},
    completedBy:{type: Schema.ObjectId, ref:'UsersGames',default:null},
    userId:{type: Schema.ObjectId, ref:'User'},
    createdAt:{type: Date, default: Date.now},
    image:{
        original: {type: String, default: ''},
        thumbnail: {type: String, default: ''}
    },
    video:{type: String, default: ''},
    videoThumbnail:{type: String, default: ''},
    is_image:{type: Boolean,default:false ,required: true},
    is_video:{type: Boolean,default:false ,required: true},
    is_featured:{type: Boolean,default:false ,required: true},
    is_delete:{type: Boolean,default:false ,required: true},
    isPublic:{type: Boolean,default:true ,required: true},
    reports:{type: Number,default:0},
    reportedBy:[{type: Schema.ObjectId, ref:'User'}]


});
module.exports = mongoose.model('Feeds', Feeds);