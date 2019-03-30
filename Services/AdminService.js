"use strict";

var Models = require("../Models");

//Get Users from DB
var getAdmin = function(criteria, projection, options, callback) {
    Models.Admins.find(criteria, projection, options, callback);
};

//Insert User in DB
var createAdmin = function(objToSave, callback) {
    new Models.Admins(objToSave).save(callback);
};

//Create Game
var createGame = function(objToSave, callback) {
    new Models.Games(objToSave).save(callback);
};

//Update User in DB
var updateAdmin = function(criteria, dataToSet, options, callback) {
    Models.Admins.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var updateGame = function(criteria, dataToSet, options, callback) {
    Models.Games.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var getGames = function(criteria, projection, options, callback) {
    Models.Games.find(criteria, projection, options, callback);
};

var getGame = function(criteria, projection, options, callback) {
    Models.Games.findOne(criteria, projection, options, callback);
};

var createChallenges = function(objToSave, callback) {
    new Models.Challenges(objToSave).save(callback);
};

var updateChallenges = function(criteria, dataToSet, options, callback) {
    Models.Challenges.update(criteria, dataToSet, options, callback);
};

var updateChallenge = function(criteria, dataToSet, options, callback) {
    Models.Challenges.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var getChallenges = function(criteria, projection, options, callback) {
    Models.Challenges.find(criteria, projection, options, callback);
};

var countTotalChallange = function(callback) {
    Models.Challenges.count(callback);
};

var createCategories = function(objToSave, callback) {
    new Models.Categories(objToSave).save(callback);
};

var updateCategories = function(criteria, dataToSet, options, callback) {
    Models.Categories.update(criteria, dataToSet, options, callback);
};

var updateChallengesUpdate = function(criteria, dataToSet, options, callback) {
    Models.Challenges.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var getCategories = function(criteria, projection, options, callback) {
    Models.Categories.find(criteria, projection, options, callback);
};

var createManualScore = function(objToSave, callback) {
    new Models.ManualScore(objToSave).save(callback);
};

var updateManualScore = function (criteria, dataToSet, options, callback) {
    Models.ManualScore.findOneAndUpdate(criteria, dataToSet, options, callback);
}

var getCategoriesPopulate = function(
    criteria,
    projection,
    options,
    populateArray,
    callback
) {
    Models.Categories.find(criteria, projection, options)
        .populate(populateArray)
        .exec(function(err, result) {
            callback(null, result);
        });
};

module.exports = {
    getAdmin: getAdmin,
    createAdmin: createAdmin,
    updateAdmin: updateAdmin,
    createGame: createGame,
    updateGame: updateGame,
    createChallenges: createChallenges,
    updateChallenges: updateChallenges,
    updateChallenge: updateChallenge,
    countTotalChallange: countTotalChallange,
    getChallenges: getChallenges,
    getGames: getGames,
    getGame: getGame,
    createCategories: createCategories,
    updateCategories: updateCategories,
    getCategories: getCategories,
    getCategoriesPopulate: getCategoriesPopulate,
    updateChallengesUpdate: updateChallengesUpdate,
    createManualScore: createManualScore,
    updateManualScore:updateManualScore
};