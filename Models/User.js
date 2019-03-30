var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var User = new Schema({
    name: {type: String, trim: true, default: '' },
    sortName: {type: String, trim: true, default: '' },
    profilePic: {
        original: {type: String, default: ''},
        thumbnail: {type: String, default: ''}
    },
    email: {type: String,default:''},
    accessToken: {type: String},
    facebookId: {type: String, default: '', trim: true},
    twitterId: {type: String, default: '', trim: true},
    password: {type: String},
    passwordResetToken: {type: String, trim: true},
    registrationDate: {type: Date, default: Date.now, required: true},
    is_delete:{type: Boolean,default:false ,required: true},
    is_block:{type: Boolean,default:false ,required: true},
    is_active:{type: Boolean,default:true ,required: true},
    profileComplete:{type: Boolean,default:false ,required: true},
    deviceToken: {type: String,default:'token'},
    deviceType: {
        type: String,
        default : Config.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID,
        enum: [
            Config.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS,
            Config.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID
        ]
    },
    location:{type: String, trim: true, default: 'default location',required:true},
    latitute:{type: String, trim: true, default: ''},
    longitute:{type: String, trim: true, default: ''},
  /*  gamesStarted:[{
        game:{type: Schema.ObjectId, ref:'Games'},
        isCompleted:{type: Boolean,default:false ,required: true},
        totalChallengeCompleted:{type: Number, default:0}
    }],*/
    totalPoints:{type: Number, required:true,default:0},
    totalChallengeCompeleted:{type: Number, required:true,default:0},
    totalGameStarted:{type: Number, required:true,default:0},
    challengeCompeleted:[{
        challenge:{type: Schema.ObjectId, ref:'Challenges'},
        completedAt:{type: Date, default: Date.now},
    }],
    onOrOffNotification:{type: Boolean, default: true, required: true},
    feeds:[{type: Schema.ObjectId, ref:'Feeds'}]
});



module.exports = mongoose.model('User', User);