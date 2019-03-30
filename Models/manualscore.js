var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var manualscore = new Schema({
    challengeId: { type: Schema.ObjectId, ref: 'Challenges' },
    userId: { type: Schema.ObjectId, ref: 'User' },
    gameId: { type: Schema.ObjectId, ref: 'Games' },
    score: { type: Number, default: 0 },
});
module.exports = mongoose.model('manualscore', manualscore);