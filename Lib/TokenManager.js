'use strict';
var Config = require('../Config');
var Jwt = require('jsonwebtoken');
var async = require('async');
var Service = require('../Services');


var getTokenFromDB = function (userId, userType,token, callback) {
    var userData = null;
    var criteria = {
        _id: userId,
        accessToken : token
    };
    async.series([
        function (cb) {
            if (userType == Config.APP_CONSTANTS.DATABASE.USER_ROLES.USER){
                Service.CustomerService.getCustomer(criteria,{},{lean:true}, function (err, dataAry) {
                    if (err){
                        cb(err)
                    }else {
                        if (dataAry && dataAry.length > 0){
                            userData = dataAry[0];
                            cb();
                        }else {
                            cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN)
                        }
                    }

                });

            }
            else if (userType == Config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN){
                Service.AdminService.getAdmin(criteria,{},{lean:true}, function (err, dataAry) {
                    if (err){
                        callback(err)
                    }else {
                        if (dataAry && dataAry.length > 0){
                            userData = dataAry[0];
                            cb();
                        }else {
                            callback(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN)
                        }
                    }

                });
            }
            else {
                cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
            }
        }
    ], function (err, result) {
        if (err){
            callback(err)
        }else {
            if (userData && userData._id){
                userData.id = userData._id;
                userData.type = userType;
            }
            callback(null,{userData: userData})
        }

    });
};

var setTokenInDB = function (userId,userType, tokenToSave, callback) {
 var data={};
    var date=new Date()
    var criteria = {
        _id: userId
    };
    var setQuery = {
        accessToken : tokenToSave,
        lastLogin:date
    };
    async.series([
        function (cb) {
            if (userType == Config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN){
                Service.AdminService.updateAdmin(criteria,setQuery,{new:true}, function (err, dataAry) {
                    if (err){
                        cb(err)
                    }else {
                        if (dataAry && dataAry._id){
                            data=dataAry
                            cb();
                        }else {
                            cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                        }
                    }
                });

            }
            else {
                Service.UserService.updatePlayer(criteria,setQuery,{new:true}, function (err, dataAry) {
                    if (err){
                        cb(err)
                    }else {
                        if (dataAry && dataAry._id){
                            data=dataAry
                            cb();
                        }else {
                            cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                        }
                    }

                });

            }
        }
    ], function (err, result) {
        if (err){
            callback(err)
        }else {
            callback(null,data)
        }

    });
};

var expireTokenInDB = function (userId,userType, callback) {
    var criteria = {
        _id: userId
    };
    var setQuery = {
        accessToken : null
    };
    async.series([
        function (cb) {
            if (userType == Config.APP_CONSTANTS.DATABASE.USER_ROLES.DRIVER){
                Service.CustomerService.updateCustomer(criteria,setQuery,{new:true}, function (err, dataAry) {
                    if (err){
                        cb(err)
                    }else {
                        if (dataAry && dataAry.length > 0){
                            cb();
                        }else {
                            cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN)
                        }
                    }
                });

            }
            else if (userType == Config.APP_CONSTANTS.DATABASE.USER_ROLES.DRIVER){
                Service.DriverService.updateDriver(criteria,setQuery,{new:true}, function (err, dataAry) {
                    if (err){
                        cb(err)
                    }else {
                        if (dataAry && dataAry.length > 0){
                            cb();
                        }else {
                            cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN)
                        }
                    }

                });

            }
            else if (userType == Config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN){
                Service.AdminService.updateAdmin(criteria,setQuery,{new:true}, function (err, dataAry) {
                    if (err){
                        callback(err)
                    }else {
                        if (dataAry && dataAry.length > 0){
                            cb();
                        }else {
                            callback(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN)
                        }
                    }

                });
            }else {
                cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
            }
        }
    ], function (err, result) {
        if (err){
            callback(err)
        }else {
            callback()
        }

    });
};


var verifyToken = function (token, callback) {
    var response = {
        valid: false
    };
    Jwt.verify(token, Config.APP_CONSTANTS.SERVER.JWT_SECRET_KEY, function (err, decoded) {
        console.log('jwt err',err,decoded)
        if (err) {
            callback(err)
        } else {
            getTokenFromDB(decoded.id, decoded.type,token, callback);
        }
    });
};

var setToken = function (tokenData, callback) {
    if (!tokenData.id || !tokenData.type) {
        callback(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    } else {
        var tokenToSend = Jwt.sign(tokenData, Config.APP_CONSTANTS.SERVER.JWT_SECRET_KEY);
        setTokenInDB(tokenData.id,tokenData.type, tokenToSend, function (err, data) {
            console.log('token>>>>',err,data);
            callback(err,data /*{accessToken: tokenToSend}*/)
        })
    }
};

var expireToken = function (token, callback) {
    Jwt.verify(token, Config.APP_CONSTANTS.SERVER.JWT_SECRET_KEY, function (err, decoded) {
        if (err) {
            callback(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN);
        } else {
            expireTokenInDB(decoded.id,decoded.type, function (err, data) {
                callback(err, data)
            });
        }
    });
};

var decodeToken = function (token, callback) {
    Jwt.verify(token, Config.APP_CONSTANTS.SERVER.JWT_SECRET_KEY, function (err, decodedData) {
        if (err) {
            callback(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN);
        } else {
            callback(null, decodedData)
        }
    })
};

module.exports = {
    expireToken: expireToken,
    setToken: setToken,
    verifyToken: verifyToken,
    decodeToken: decodeToken
};