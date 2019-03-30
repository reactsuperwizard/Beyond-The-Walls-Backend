/**
 * Created by cbl102 on 26/12/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var Challenges=new Schema({

    gameId:{type: Schema.ObjectId, ref:'Game'},
    name:{type: String, required:true},
    details:{type: String, required:true},
    hint:{type: String},
    points:{type: Number, required:true,default:0},
    createdAt: {type: Date, default: Date.now},
    is_deleted:{type: Boolean, default: false, required: true},
    is_active:{type: Boolean, default: true, required: true},
    challengeOrder:{type: Number, required:true,default:0},
    completedBy:[{type: Schema.ObjectId, ref:'UsersGames'}],
    hints:[{
        name:{type: String},
        hintType:{
            type: String,
            required:true,
            enum: [
                Config.APP_CONSTANTS.DATABASE.HINT_TYPE.EASY_HINT,
                Config.APP_CONSTANTS.DATABASE.HINT_TYPE.HARD_HINT,
                Config.APP_CONSTANTS.DATABASE.HINT_TYPE.TOO_TOUGH_HINT
            ]
        },
        points:{type: Number, required:true,default:0},
    }],
    isEasy:{type: Boolean, default: false,required:true},
    isHard:{type: Boolean, default: false,required:true},
    isTootough:{type: Boolean, default: false,required:true},
    isCompleted:{type: Boolean, default: false, required: true},
    isKeyword:{type: Boolean,default: false,required: true},
    isOpen:{type: Boolean, default: false, required: true},
    location:{type: String, trim: true, default: 'default location'},
    latitute:{type: String, trim: true, default: ''},
    longitute:{type: String, trim: true, default: ''},
    distanceDiff:{type: String,default: ''},//in metres
    challengeType:{
        type: String,
        required:true,
        enum: [
            Config.APP_CONSTANTS.DATABASE.GAME_TYPE.IMAGE,
            Config.APP_CONSTANTS.DATABASE.GAME_TYPE.LOCATION,
            Config.APP_CONSTANTS.DATABASE.GAME_TYPE.QRCODE,
            Config.APP_CONSTANTS.DATABASE.GAME_TYPE.TEXT,
            Config.APP_CONSTANTS.DATABASE.GAME_TYPE.VIDEO,
        ]
    },
    qrCode:{type: String},

    keywords:[{type: String}],

    textAnswer:[{type: String}],

    isShown:{type: Boolean, default: true, required: true},

    timerStatus:{type: Boolean, default: false, required: true},

    customDialog : {
        title: {type: String, default: ''},
        description: {type: String, default: ''}
    },

    orderId:{type:Number,default:0},

    timer:{type:Number,default:0},

    challengeImage:{
        original:{type:String,default:""},
        thumbnail:{type:String,default:""}
    },
    descriptionImage:{
        descOriginal:{type:String,default:""},
        descThumbnail:{type:String,default:""}
    },
    depended:[{
        dependUpon:  {type:Schema.ObjectId, ref:'Challenges'},
        dependUponChallengeName:{type:String, default:""},
    }],

    possibleAttemp:{
       type:Number
    },

    pointEarnedByUser:{ type:Array,default:null },
    onOff :{ type:Boolean,default:false },
    toughonOff:{ type:Boolean,default:false },
    hardonOff:{ type:Boolean,default:false },
    easyUsed:{type: Boolean, default: false,required:true},
    hardUsed:{type: Boolean, default: false,required:true},
    tootoughUsed:{type: Boolean, default: false,required:true},

});

module.exports = mongoose.model('Challenges', Challenges);
