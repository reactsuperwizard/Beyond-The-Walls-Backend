var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

const Categories=new Schema({
    name: {type: String, default: ''},
    level:{type: Number, default:1},
    levelOne:{type: Schema.ObjectId, ref:'Categories'},
    levelTwo:{type: Schema.ObjectId, ref:'Categories'},
    isDeleted:{type: Boolean, default:false},
    order:{type: Number, default:1},

});

module.exports=mongoose.model('Categories',Categories);