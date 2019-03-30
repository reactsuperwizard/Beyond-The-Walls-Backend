'use strict';

var Models = require('../Models');
var Config = require('../Config');

var getAppVersion = function (criteria, projection, options, callback) {
    Models.AppVersions
        .find(criteria,projection,options)
        .exec(callback)
};

var createAppVersion= function (objToSave, callback) {
    new Models.AppVersions(objToSave).save(callback)
};

var updateAppVersion= function (criteria, dataToSet, options, callback) {
    Models.AppVersions.findOneAndUpdate(criteria, dataToSet, options, callback);
};

module.exports = {
    getAppVersion: getAppVersion,
    updateAppVersion: updateAppVersion,
    createAppVersion: createAppVersion
};

