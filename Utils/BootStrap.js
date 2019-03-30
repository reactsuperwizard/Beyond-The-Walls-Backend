'use strict';

var mongoose = require('mongoose');
var Config = require('../Config');
var SocketManager = require('../Lib/SocketManager');
var Service = require('../Services');
var async = require('async');

//Connect to MongoDB

mongoose.connect(Config.dbConfig.mongo.URI, function (err) {
    if (err) {
        console.log("DB Error: ", err);
        process.exit(1);
    } else {
        console.log('MongoDB Connected');
    }
});

exports.bootstrapAdmin = function (callback) {
    var adminData1 = {
        email: 'admin@btw.com',
        password: 'd8578edf8458ce06fbc5bb76a58c5ca4',
        name: 'BTW Admin',
        isSuperAdmin:true
    };
    var adminData3 = {
        email: 'testing@btw.com',
        password: 'd8578edf8458ce06fbc5bb76a58c5ca4',
        name: 'BTW Admin',
        isSuperAdmin:true
    };
    var adminData4 = {
        email: 'testing1@btw.com',
        password: 'd8578edf8458ce06fbc5bb76a58c5ca4',
        name: 'BTW Admin',
        isSuperAdmin:true
    };

    var adminData5 = {
        email: 'testing2@btw.com',
        password: 'd8578edf8458ce06fbc5bb76a58c5ca4',
        name: 'BTW Admin',
        isSuperAdmin:true
    };

    var adminData2 = {
        email: 'rajendra@btw.com',
        password: 'd8578edf8458ce06fbc5bb76a58c5ca4',
        name: 'BTW Admin',
        isSuperAdmin:true
    };

    async.parallel([
        function (cb) {
            insertData(adminData1.email, adminData1, cb)
        },
        function (cb) {
            insertData(adminData2.email, adminData2, cb)
        },
        function (cb) {
            insertData(adminData3.email, adminData2, cb)
        },
        function (cb) {
            insertData(adminData4.email, adminData2, cb)
        },
        function (cb) {
            insertData(adminData5.email, adminData2, cb)
        },

    ], function (err, done) {
        callback(err, 'Bootstrapping finished');
    })


};

exports.bootstrapAppVersion = function (callback) {
    var appVersion1 = {
        latestIOSVersion: '100',
        latestAndroidVersion: '100',
        criticalAndroidVersion: '100',
        criticalIOSVersion: '100',
        appType: Config.APP_CONSTANTS.DATABASE.USER_ROLES.USER
    };


    async.parallel([
        function (cb) {
            insertVersionData(appVersion1.appType, appVersion1, cb)
        },
    ], function (err, done) {
        callback(err, 'Bootstrapping finished For App Version');
    })


};

function insertVersionData(appType, versionData, callback) {
    var needToCreate = true;
    async.series([
        function (cb) {
        var criteria = {
            appType: appType
        };
        Service.AppVersionService.getAppVersion(criteria, {}, {}, function (err, data) {
            if (data && data.length > 0) {
                needToCreate = false;
            }
            cb()
        })
    }, function (cb) {
        if (needToCreate) {
            Service.AppVersionService.createAppVersion(versionData, function (err, data) {
                cb(err, data)
            })
        } else {
            cb();
        }
    }], function (err, data) {
        console.log('Bootstrapping finished for ' + appType);
        callback(err, 'Bootstrapping finished For Admin Data')
    })
}

function insertData(email, adminData, callback) {
    var needToCreate = true;
    async.series([function (cb) {
        var criteria = {
            email: email
        };
        Service.AdminService.getAdmin(criteria, {}, {}, function (err, data) {
            if (data && data.length > 0) {
                needToCreate = false;
            }
            cb()
        })
    }, function (cb) {
        if (needToCreate) {
            Service.AdminService.createAdmin(adminData, function (err, data) {
                cb(err, data)
            })
        } else {
            cb();
        }
    }], function (err, data) {
        console.log('Bootstrapping finished for ' + email);
        callback(err, 'Bootstrapping finished')
    })
}

//Start Socket Server
exports.connectSocket = SocketManager.connectSocket;


