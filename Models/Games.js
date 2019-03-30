/**
 * Created by cbl102 on 17/12/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

/*
var users=new Schema({
    user:{type: Schema.ObjectId, ref:'User'},
    team:{type: Schema.ObjectId, ref:'Team'},
    name:{type: String, required:true},
    isGameComplete:{type: Boolean, default: false, required: true},
    is_deleted:{type: Boolean, default: false, required: true},
    points:{type: Number, required:true,default:0},
    startedAt: {type: Date, default: Date.now},
});
*/




var Games=new Schema({
    name:{type: String, trim: true, index: true, default: 'default', sparse: true},
    details:{type: String, trim: true, default: 'default'},
    gameImage: {
        original: {type: String, default: ''},
        thumbnail: {type: String, default: ''}
    },
    password:{type: String},
    is_protected:{type: Boolean, default: false, required: true},
    is_deleted:{type: Boolean, default: false, required: true},
    is_featured:{type: Boolean, default: false, resquired: true},
    is_active:{type: Boolean, default: true, required: true},
    isOrderLock:{type: Boolean, default: false, required: true},
    startDate: {type: Date, default: Date.now},
    endDate: {type: Date, default: Date.now},
    createdAt: {type: Date, default: Date.now},
    latitute:{type: String, trim: true, default: ''},
    longitute:{type: String, trim: true, default: ''},
    location: { type: [Number], index: '2dsphere' },
    gameLocation:{ type: String, trim: true, default: '' },
    totalUserCompleted:{type: Number, default:0},
    challenges:[{type: Schema.ObjectId, ref:'Challenges'}],
    codes:[{
        name:{type: String},
        is_deleted:{type: Boolean, default: false, required: true},
        is_active:{type: Boolean, default: true, required: true},
    }],
    minPlayer:{type: Number, required:true,default:0},
    maxPlayer:{type: Number, required:true,default:10},
    reports:{type: Number,default:0},
    reportedBy:[{type: Schema.ObjectId, ref:'User'}],
    cityName:{ type:String,default:"",index:true },
    stateName:{ type:String,default:"",index:true },
    countryName:{ type:String,default:"",index:true },
    timer:{type: Number,default:0},
    timerStatus:{type: Boolean, default: false, required: true},
    paused:{type: Boolean, default: false, required: true},
    levelOne:{type: Schema.ObjectId, ref:'Categories'},
    levelTwo:{type: Schema.ObjectId, ref:'Categories'},
    levelThree:{type: Schema.ObjectId, ref:'Categories'},
    levelOneName:{ type:String,default:"" },
    levelTwoName:{ type:String,default:"" },
    levelThreeName:{ type:String,default:"" },
    delayTimer:{type: Schema.ObjectId, ref:'Challenges',default:null}

});



Games.index({'location': "2dsphere"});


Games.index({"name":"text","details":"text"})

//Games.createIndex({'location': "2dsphere"});

module.exports = mongoose.model('Games', Games);