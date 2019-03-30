var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const passwordLogs=new Schema({
    gameId:{ type:Schema.ObjectId,ref:'Game' },
    userId:{ type:Schema.ObjectId,ref:'User' },
    password:{ type:String,default:"" }
});

module.exports=mongoose.model('passwordLogs',passwordLogs);