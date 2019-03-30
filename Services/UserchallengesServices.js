'use strict';

var Models = require('../Models');


var createUsersChalange = function (objToSave, callback) {
    new Models.usersChallengeGames(objToSave).save(callback)
};


var findUsersChalange=function(criteria,dataToSet,options,callback){

    Models.usersChallengeGames.find(criteria,dataToSet,options,function(err,result){
        callback(null,result);
    });

}




var updateUsersChallange=function(criteria,dataToSet,options,callback){
    Models.usersChallengeGames.update(criteria,dataToSet,options,function(err,result){
        callback(null,result);
    });
}

var findAndUpdateUsersChallange = function(criteria,dataToSet,options,callback){
    Models.usersChallengeGames.findOneAndUpdate(criteria,dataToSet,options,function(err,result){

        console.log("....in services...........",err,result);

        callback(null,result);
    });
}


var getUsersChallangePopulate = function (criteria, projection, options,populateArray, callback) {
    Models.usersChallengeGames.find(criteria, projection,options).populate(populateArray).exec(function (err,result) {
        callback(null,result);
    });
};

module.exports = {
    updateUsersChallange:updateUsersChallange,
    findUsersChalange:findUsersChalange,
    createUsersChalange:createUsersChalange,
    getUsersChallangePopulate:getUsersChallangePopulate,
    findAndUpdateUsersChallange:findAndUpdateUsersChallange

};
