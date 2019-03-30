'use strict';

var Service = require('../Services');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var async = require('async');

var getAppVersion = function (appType, callback) {
    var appVersionData = null;
    async.series([
        function (cb) {
            //Insert into DB
            Service.AppVersionService.getAppVersion({appType: appType},{__v:0,_id:0,timeStamp:0},{lean:true}, function (err, data) {
                if (err){
                    cb(err)
                }else {
                    appVersionData = data[0];
                    cb();
                }
            })
        }
    ], function (err, result) {
        if (err){
            callback(err)
        }else {
            callback(null,appVersionData)
        }
    })
};

var updateAppVersion = function (payload, callback) {
    if (!payload.deviceType || !payload.appType){
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }else {
        var dataToUpdate = {};
        var updatedVersionData = null;
        async.series([
            function (cb) {
                //Check if latest updated version and critical version is there
                if (!payload.latestCriticalVersion && !payload.latestUpdatedVersion){
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.APP_VERSION_ERROR);
                }else {
                    cb();
                }
            },
            function (cb) {
                if (payload.deviceType == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS){
                    if (payload.latestUpdatedVersion){
                        dataToUpdate.latestIOSVersion = payload.latestUpdatedVersion
                    }
                    if (payload.latestCriticalVersion){
                        dataToUpdate.criticalIOSVersion = payload.latestCriticalVersion
                    }
                }else if (payload.deviceType == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID){
                    if (payload.latestUpdatedVersion){
                        dataToUpdate.latestAndroidVersion = payload.latestUpdatedVersion
                    }
                    if (payload.latestCriticalVersion){
                        dataToUpdate.criticalAndroidVersion = payload.latestCriticalVersion
                    }
                }
                cb();
            },
            function (cb) {
                //Update Version here
                var criteria = {
                    appType : payload.appType
                };
                console.log('setting data',dataToUpdate)
                Service.AppVersionService.updateAppVersion(criteria,{$set:dataToUpdate},{new:true}, function (err, data) {
                    if (err){
                        cb(err)
                    }else {
                        updatedVersionData = data || null;
                        cb();
                    }
                })
            }
        ], function (err, result) {
            if (err){
                callback(err)
            }else {
                callback(null,updatedVersionData)
            }
        })
    }

};

module.exports = {
    getAppVersion : getAppVersion,
    updateAppVersion : updateAppVersion
};