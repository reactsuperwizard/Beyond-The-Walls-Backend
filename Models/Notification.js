'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');


var Notification = new Schema({
    message:{type: String, default: null},
    userId:{type: Schema.ObjectId, ref: 'Users'},
    gameId:{type: Schema.ObjectId, ref: 'Users'},
    isRead:{type: Boolean, default: false, required: true},
    isDeleted:{type: Boolean, default: false, required: true},
    date: {type: Date, default: Date.now, required: true},

});

module.exports = mongoose.model('Notification', Notification);