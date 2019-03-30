"use strict";

var Models = require("../Models");

var updatePlayer = function(criteria, dataToSet, options, callback) {
    Models.User.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var getManualScore = function(criteria, projection, options, callback) {
    Models.ManualScore.find(criteria, projection, options, callback);
};

var updatePlayer2 = function(criteria, dataToSet, options, callback) {
    Models.User.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var getGame = function(criteria, projection, options, callback) {
    Models.Games.find(criteria, projection, options, callback);
};

var getStateCity = function(criteria, projection, options, callback) {
    Models.Games.aggregate(
        [{
            $match: criteria
        }, {
            $group: {
                stateName: "$stateName"
            }
        }],
        function(err, result) {
            if (err) {
                console.log(err);
            } else {
                callback(result);
            }
        }
    );
};

var getUser = function(criteria, projection, options, callback) {
    Models.User.find(criteria, projection, options, callback);
};

var saveUser = function(objToSave, callback) {
    new Models.User(objToSave).save(callback);
};

var saveTeam = function(objToSave, callback) {
    new Models.UsersGames(objToSave).save(callback);
};

var createAttempts = function(objToSave, callback) {
    console.log("in attempts");
    new Models.Attempts(objToSave).save(callback);
};

var countAttempts = function(criteria, callback) {
    Models.Attempts.count(criteria, function(err, result) {
        callback(null, result);
    });
};

var updateTeam = function(criteria, dataToSet, options, callback) {
    console.log(".........err.........criteria.......", criteria);
    console.log(".........err.........dataToSet.......", dataToSet);
    console.log(".........err.........options.......", options);
    Models.UsersGames.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var updateTeam1 = function(criteria, dataToSet, options, callback) {
    Models.UsersGames.update(criteria, dataToSet, options, callback);
};

var updateTeam2 = function(criteria, dataToSet, options, callback) {
    Models.UsersGames.updateMany(criteria, dataToSet, options, callback);
};

var updateGames = function(criteria, dataToSet, options, callback) {
    Models.Games.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var gameDetails = function(
    criteria,
    projection,
    options,
    populateArray,
    callback
) {
    Models.Games.find(criteria, projection, options)
        .populate(populateArray)
        .exec(function(err, result) {
            callback(null, result);
        });
};

var saveFeed = function(objToSave, callback) {
    new Models.Feeds(objToSave).save(callback);
};

var updateChallenges = function(criteria, dataToSet, options, callback) {
    Models.Challenges.findOneAndUpdate(criteria, dataToSet, options, callback);
};
var updateFeeds = function(criteria, dataToSet, options, callback) {
    Models.Feeds.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var updateMultipleFeeds = function(criteria, dataToSet, options, callback) {
    Models.Feeds.update(criteria, dataToSet, options, callback);
};

var getFeedDescription = function(
    criteria,
    projection,
    options,
    populateArray,
    callback
) {
    Models.Feeds.find(criteria, projection, options)
        .populate(populateArray)
        .exec(function(err, result) {
            callback(null, result);
        });
};

var getUsersGames = function(criteria, projection, options, callback) {
    Models.UsersGames.find(criteria, projection, options, callback);
};

var getFeeds = function(criteria, projection, options, callback) {
    Models.Feeds.find(criteria, projection, options, callback);
};
var findChallenges = function(criteria, projection, options, callback) {
    Models.Challenges.find(criteria, projection, options, callback);
};
var findChallenge = function(criteria, projection, options, callback) {
    Models.Challenges.findOne(criteria, projection, options, callback);
};
var userDetails = function(
    criteria,
    projection,
    options,
    populateArray,
    callback
) {
    Models.User.find(criteria, projection, options)
        .populate(populateArray)
        .exec(function(err, result) {
            callback(null, result);
        });
};

var getUsersGamesDescriptions = function(
    criteria,
    projection,
    options,
    populateArray,
    callback
) {
    Models.UsersGames.find(criteria, projection, options)
        .populate(populateArray)
        .exec(function(err, result) {
            callback(null, result);
        });
};

var createNotification = function(objToSave, callback) {
    new Models.Notification(objToSave).save(callback);
};

var findChalange = function(callback) {
    Models.Challenges.find(function(err, result) {
        callback(null, result);
    });
};

var updateChallangeOrder = function(criteria, dataToSet, options, callback) {
    Models.Challenges.update(criteria, dataToSet, options, function(err, result) {
        callback(null, result);
    });
};

var findPerticularChalange = function(
    criteria,
    projections,
    options,
    callback
) {
    Models.Challenges.findOne(criteria, projections, options, function(
        err,
        result
    ) {
        callback(null, result);
    });
};

var makeDependencyFree = function(objToSave, callback) {
    console.log("in dependency");
    new Models.Depends(objToSave).save(callback);
};

var findAttemptsChallengeGame = function(
    criteria,
    projection,
    option,
    callback
) {
    Models.Depends.findOne(criteria, projection, option, function(err, result) {
        callback(null, result);
    });
};

var updateDependencyFree = function(criteria, projection, option, callback) {
    Models.Depends.findOneAndUpdate(criteria, projection, option, function(
        err,
        result
    ) {
        callback(null, result);
    });
};

var CompleteChalengeUserStatus = function(
    criteria,
    projection,
    option,
    callback
) {
    Models.Depends.find(criteria, projection, option, function(err, result) {
        callback(null, result);
    });
};

var getUserGameData = function(criteria, projection, option, callback) {
    Models.UsersGames.find(criteria, projection, option, function(err, result) {
        callback(null, result);
    });
};

module.exports = {
    updatePlayer: updatePlayer,
    updatePlayer2: updatePlayer2,
    getGame: getGame,
    getUser: getUser,
    saveUser: saveUser,
    saveTeam: saveTeam,
    updateTeam: updateTeam,
    updateGames: updateGames,
    gameDetails: gameDetails,
    saveFeed: saveFeed,
    updateChallenges: updateChallenges,
    getUsersGames: getUsersGames,
    getFeedDescription: getFeedDescription,
    userDetails: userDetails,
    getUsersGamesDescriptions: getUsersGamesDescriptions,
    updateTeam1: updateTeam1,
    updateTeam2: updateTeam2,
    findChallenges: findChallenges,
    findChallenge: findChallenge,
    getFeeds: getFeeds,
    updateFeeds: updateFeeds,
    updateMultipleFeeds: updateMultipleFeeds,
    createNotification: createNotification,
    getUserGameData: getUserGameData,

    //////////////rajendra/////////////
    findChalange: findChalange,
    updateChallangeOrder: updateChallangeOrder,
    findPerticularChalange: findPerticularChalange,
    createAttempts: createAttempts,
    countAttempts: countAttempts,
    makeDependencyFree: makeDependencyFree,
    findAttemptsChallengeGame: findAttemptsChallengeGame,
    updateDependencyFree: updateDependencyFree,
    CompleteChalengeUserStatus: CompleteChalengeUserStatus,
    getStateCity: getStateCity,

    ////////////////////////////////////

    getManualScore: getManualScore
};