'use strict';

var Service = require('../Services');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var async = require('async');
var md5 = require('md5');
var UploadManager = require('../Lib/UploadManager');
var TokenManager = require('../Lib/TokenManager');
var NotificationManager = require('../Lib/NotificationManager');
var CodeGenerator = require('../Lib/CodeGenerator');
var Config = require('../Config');
var baseFolder = Config.awsS3Config.s3BucketCredentials.folder + '/';
var baseURL = Config.awsS3Config.s3BucketCredentials.s3URL + '/' + baseFolder;
var moment = require('moment');
var Models = require('../Models');
const Game = require('../Models/Games')
const PasswordLogs = require('../Models/passwordLogs');
const EarnedPoint = require('../Models/pointsEarned')

var _ = require('lodash');
var crypto = require('crypto');

function userLogin(payloadData, callback) {
    var id;
    var user = [];
    async.auto({
        checkAdmin: function (cb) {
            var criteria = {
                email: payloadData.email,
                password: md5(payloadData.password),
                is_active: true,
                is_delete: false

            };
            var projection = {
                feeds: 0
            };
            Service.UserService.getUser(criteria, projection, {}, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {

                    if (result.length) {

                        if (result[0].is_block == true) {
                            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.BLOCKED_BY_ADMIN);
                        }
                        else if (result[0].profileComplete == false) {
                            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PROFILEINCOMPLETE)
                        }
                        else {
                            user = result;
                            cb(null)
                        }

                    }
                    else {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_USER_PASS);
                    }
                }
            });
        },
        updateAccessToken: ['checkAdmin', function (cb) {
            var tokenData = {
                id: user[0]._id,
                type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.USER
            };
            TokenManager.setToken(tokenData, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    user[0].accessToken = result.accessToken
                    cb(null);
                }
            })
        }],
        updateDeviceToken: ['checkAdmin', function (cb) {
            var criteria = {
                _id: user[0]._id
            };
            var dataToUpdate = {
                deviceType: payloadData.deviceType,
                deviceToken: payloadData.deviceToken
            };
            Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {

                if (err) {
                    //      console.log(err,'error data')
                    cb(err);
                }
                else {
                    cb(null);
                }
            })
        }]
    },
        function (err, result) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, user[0]);
            }
        })
}

function SignUpOne(payloadData, callback) {
    var id;
    var flag = 0;
    var data = {};
    var dataToSave = payloadData;
    // dataToSave.sortName = (payloadData.name).toString();
    async.auto({
        checkEmail: function (cb) {
            var criteria = {
                email: payloadData.email,
                is_delete: false
            };
            var projection = {};
            Service.UserService.getUser(criteria, projection, {}, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {

                    if (result.length) {
                        if (result[0].profileComplete == false) {
                            data = result[0]
                            flag = 1;
                            cb(null)
                        }
                        else {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_EXIST)
                        }

                    }
                    else {
                        cb(null)
                    }
                }
            });
        },
        insertData: ['checkEmail', function (cb) {
            if (flag == 1) {
                var criteria = {
                    email: payloadData.email,

                };
                var dataToUpdate = {
                    password: md5(payloadData.password),
                    deviceType: payloadData.deviceType,
                    deviceToken: payloadData.deviceToken

                }
                Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {
                    if (err) {
                        //console.log(".d..d..d.d")
                        cb(err);
                    }
                    else {
                        id = result._id
                        cb(null);
                    }
                })
            }
            else {
                dataToSave.password = md5(payloadData.password);

                Service.UserService.saveUser(dataToSave, function (err, result) {
                    if (err) {

                        cb(err)
                    }
                    else {
                        id = result._id;

                        cb(null)
                    }
                })
            }

        }],
        updateAccessToken: ['insertData', function (cb) {
            var tokenData = {
                id: id,
                type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.USER
            };
            TokenManager.setToken(tokenData, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    data = result;
                    cb(null);
                }
            })
        }],
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}

function SignUpTwo(payloadData, callback) {
    var id, original, thumbnail;
    var data = {};
    //console.log(".,,..,.,..", payloadData);
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    //console.log("....err...", err);
                    callback(err);
                }
                else {
                    id = result[0]._id;
                    cb(null)

                }
            })
        },
        uploadImage: ['checkToken', function (cb) {
            if (payloadData.profilePic && payloadData.profilePic.filename) {
                UploadManager.uploadFileToS3WithThumbnail(payloadData.profilePic, id, function (err, uploadedInfo) {
                    if (err) {
                        cb(err)
                    } else {
                        original = baseURL + uploadedInfo.original;
                        thumbnail = baseURL + uploadedInfo.thumbnail;
                        cb(null);
                    }
                })

            }
            else {
                cb(null);
            }
        }],
        updateProfile: ['uploadImage', function (cb) {
            if (payloadData.profilePic && payloadData.profilePic.filename) {
                var dataToSet = {
                    "profilePic.original": original,
                    "profilePic.thumbnail": thumbnail,
                    name: payloadData.name,
                    sortName: (payloadData.name).toLowerCase(),
                    location: payloadData.location,
                    latitute: payloadData.latitute,
                    longitute: payloadData.longitute,
                    profileComplete: true
                };
            }
            else {
                var dataToSet = {
                    name: payloadData.name,
                    sortName: (payloadData.name).toLowerCase(),
                    location: payloadData.location,
                    latitute: payloadData.latitute,
                    longitute: payloadData.longitute,
                    profileComplete: true
                };
            }
            var criteria = {
                _id: id
            };

            Service.UserService.updatePlayer(criteria, dataToSet, { new: true }, function (err, result) {
                if (err) {
                    //console.log("err.....", err);
                    callback(err);
                }
                else {
                    data = result;
                    cb(null);
                }
            })

        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}

function facebookLogin(payloadData, callback) {
    var id;
    var flag = 0;
    var user = {};
    var user1 = {};
    var data = [];
    //   dataToSave.sortName = (payloadData.name).toString();
    // console.log(".........pay******", payloadData);
    async.auto({
        checkId: function (cb) {
            var criteria = {
                facebookId: payloadData.facebookId,
                is_delete: false
            }
            var projection = {};
            Service.UserService.getUser(criteria, projection, {}, function (err, result) {
                if (err) {
                    cb(err)
                }
                else {
                    if (result.length) {
                        /* if (result[0].profileComplete == false) {
                         data = result;
                         cb(null);
                         }
                         else {*/
                        flag = 1;
                        data = result;
                        cb(null);
                        //}
                    }
                    else {
                        cb(null);
                    }


                }
            })
        },
        InsertData: ['checkId', function (cb) {
            if (data.length == 0) {
                var dataToSave = {
                    facebookId: payloadData.facebookId,
                    "profilePic.original": payloadData.imageLink,
                    "profilePic.thumbnail": payloadData.imageLink,
                    email: payloadData.email,
                    deviceType: payloadData.deviceType,
                    deviceToken: payloadData.deviceToken,
                    name: payloadData.name,
                    sortName: (payloadData.name).toLowerCase(),
                    location: payloadData.location,
                    latitute: payloadData.latitute,
                    longitute: payloadData.longitute,
                    profileComplete: true
                };

                Service.UserService.saveUser(dataToSave, function (err, result) {
                    if (err) {
                        //console.log("...e..e..e.e..e", err);
                        cb(err);
                    }
                    else {
                        user = result;
                        cb(null)
                    }
                })
            }
            else {

                if (data[0].is_delete == true) {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DELETED_BY_ADMIN);
                }
                else if (data[0].is_block == true) {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.BLOCKED_BY_ADMIN);
                }
                else {
                    user = data[0];
                    cb(null);
                }

            }
        }],
        updateAccessToken: ['InsertData', function (cb) {

            var tokenData = {
                id: user._id,
                type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.USER
            };
            TokenManager.setToken(tokenData, function (err, result) {
                if (err) {
                    cb(err);
                } else {

                    user = result;
                    cb(null);
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            user1.is_registered = flag;
            user1._id = user._id;
            user1.accessToken = user.accessToken;
            user1.totalGameStarted = user.totalGameStarted;
            user1.totalChallengeCompeleted = user.totalChallengeCompeleted;
            user1.totalPoints = user.totalPoints;
            user1.longitute = user.longitute;
            user1.latitute = user.latitute;
            user1.location = user.location;
            user1.profileComplete = user.profileComplete;
            user1.deviceToken = user.deviceToken;
            user1.deviceType = user.deviceType;
            user1.is_active = user.is_active;
            user1.registrationDate = user.registrationDate;
            user1.email = user.email;
            user1.profilePic = user.profilePic;
            user1.name = user.name;
            callback(null, user1);
        }
    })
}

function twitterLogin(payloadData, callback) {
    var id;
    var flag = 0;
    var user = {};
    var user1 = {};
    var data = [];

    async.auto({
        checkId: function (cb) {
            var criteria = {
                twitterId: payloadData.twitterId
            };
            var projection = {};
            Service.UserService.getUser(criteria, projection, {}, function (err, result) {
                if (err) {
                    cb(err)
                }
                else {
                    if (result.length) {

                        flag = 1;
                        data = result;
                        cb(null);

                    }
                    else {
                        cb(null);
                    }


                }
            })
        },
        InsertData: ['checkId', function (cb) {
            if (data.length == 0) {
                var dataToSave = {
                    twitterId: payloadData.twitterId,
                    "profilePic.original": payloadData.imageLink,
                    "profilePic.thumbnail": payloadData.imageLink,
                    email: payloadData.email,
                    deviceType: payloadData.deviceType,
                    deviceToken: payloadData.deviceToken, name: payloadData.name,
                    sortName: (payloadData.name).toLowerCase(),
                    location: payloadData.location,
                    latitute: payloadData.latitute,
                    longitute: payloadData.longitute,
                    profileComplete: true

                };

                Service.UserService.saveUser(dataToSave, function (err, result) {
                    if (err) {

                        cb(err);
                    }
                    else {
                        user = result;
                        cb(null)
                    }
                })
            }
            else {

                if ((data[0].is_block == true) || (data[0].is_delete == true) || (data[0].is_active == false)) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_USER_PASS)
                }
                else {
                    user = data[0];
                    cb(null);
                }

            }
        }],
        updateAccessToken: ['InsertData', function (cb) {
            var tokenData = {
                id: user._id,
                type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.USER
            };
            TokenManager.setToken(tokenData, function (err, result) {
                if (err) {
                    cb(err);
                } else {

                    user = result;
                    cb(null);
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            user1.is_registered = flag;
            user1.accessToken = user.accessToken;
            user1.totalGameStarted = user.totalGameStarted;
            user1.totalChallengeCompeleted = user.totalChallengeCompeleted;
            user1.totalPoints = user.totalPoints;
            user1.longitute = user.longitute;
            user1.latitute = user.latitute;
            user1.location = user.location;
            user1.profileComplete = user.profileComplete;
            user1.deviceToken = user.deviceToken;
            user1.deviceType = user.deviceType;
            user1.is_active = user.is_active;
            user1.registrationDate = user.registrationDate;
            user1.email = user.email;
            user1.profilePic = user.profilePic;
            user1.name = user.name;
            user1._id = user._id;
            callback(null, user1);
        }
    })
}

function searchGame(payloadData, callback) {
    var userId = 0;
    var data = [];
    var data1 = [];
    var date = moment().format();
    var search = (payloadData.searchText);

    search = '\"' + search + '\"';

    var skip = 0;
    if (payloadData.startLimit >= 0) {
        skip = parseInt(payloadData.startLimit)
    }
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)

                }
            })
        },
        searchGame: ['checkToken', function (cb) {

            Models.Games.aggregate([
                {
                    $match: {
                        $text: { $search: search },
                        "is_deleted": false,
                        "is_active": true
                    }

                },
                {
                    $sort: { createdAt: -1 }
                },
                { $skip: skip },
                { $limit: 10 }
            ], function (err, result) {

                if (err) {
                    cb(err)
                }
                else {

                    data = result;
                    cb(null)
                }
            })

        }],
        setData: ['searchGame', function (cb) {
            if (data.length) {
                for (var i = 0; i < data.length; i++) {
                    (function (i) {
                        data1.push({
                            _id: data[i]._id,
                            totalUserCompleted: data[i].totalUserCompleted,
                            is_protected: data[i].is_protected,
                            gameImage: data[i].gameImage,
                            details: data[i].details,
                            password: data[i].password,
                            name: data[i].name,
                            startDate: moment(data[i].startDate).format("D MMM"),
                            endDate: moment(data[i].endDate).format("D MMM")
                        });
                        if (i == (data.length - 1)) {
                            cb(null);
                        }
                    }(i))
                }
            }
            else {
                cb(null)
            }
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data1)
        }
    })
}







function gameList(payloadData, callback) {
    var userId = 0;
    var data = [];
    var data1 = [];
    var skip = 0;
    var games = [];
    var date = moment();
    var lat;
    var long;
    if (payloadData.startLimit >= 0) {
        skip = parseInt(payloadData.startLimit);     //////////////////Apply type check coming from frontend  ('all','nearBy')
    }
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)

                }
            })
        },
        gameList: ['checkToken', function (cb) {
            lat = parseFloat(payloadData.latitute);
            long = parseFloat(payloadData.longitute);

            //  console.log("..payloadData.type.....",payloadData.type);
            if (payloadData.type == 'nearBy') {
                var criteria = {
                    is_deleted: false,
                    is_active: true,
                    startDate: { $lte: date },
                    endDate: { $gte: date },
                    location: {
                        $nearSphere: {
                            $geometry: {
                                type: "Point",
                                coordinates: [long, lat]
                            }
                        }
                    }
                };
                var options = {
                    limit: 10,
                    skip: skip
                }
            }
            else {
                var criteria = {
                    is_deleted: false,
                    is_active: true,
                    startDate: { $lte: date },
                    endDate: { $gte: date },

                };


                var options = {
                    limit: 10,
                    skip: skip,
                    sort: {
                        is_featured: -1,
                        createdAt: -1
                    }
                }
            }


            if (payloadData.cityName) {
                criteria.levelThree = payloadData.cityName
            }
            var projection = {
                name: 1,
                details: 1,
                is_featured: 1,
                gameImage: 1,
                is_protected: 1,
                startDate: 1,
                endDate: 1,
                totalUserCompleted: 1,
                password: 1,
                cityName: 1,
                stateName: 1,
                timer: 1,
                timerStatus: 1,
                paused: 1
            };
            Service.UserService.getGame(criteria, projection, options, function (err, result) {
                if (err) {

                    cb(err)
                }
                else {
                    data = result;
                    cb(null);
                }
            })
        }],
        userGames: ['checkToken', function (cb) {
            userId = userId.toString();
            var criteria = {
                member: { $in: [userId] }
            };
            var projection = {
                gameId: 1
            };
            Service.UserService.getUsersGames(criteria, projection, {}, function (err, result) {

                if (err) {
                    cb(err);
                }
                else {

                    if (result.length) {
                        for (var i = 0; i < result.length; i++) {
                            (function (i) {
                                var str = (result[i].gameId).toString();
                                games.push(str);
                                if (i == (result.length - 1)) {
                                    cb(null)
                                }
                            }(i))
                        }
                    }
                    else {
                        cb(null)
                    }
                }
            })
        }],
        setData: ['gameList', 'userGames', function (cb) {
            if (data.length) {
                for (var i = 0; i < data.length; i++) {
                    (function (i) {
                        if (games.length) {
                            var ele = (data[i]._id).toString();
                            if (games.indexOf(ele) >= 0) {
                                data1.push({
                                    _id: data[i]._id,
                                    totalUserCompleted: data[i].totalUserCompleted,
                                    is_protected: data[i].is_protected,
                                    password: data[i].password,
                                    gameImage: data[i].gameImage,
                                    details: data[i].details,
                                    name: data[i].name,
                                    startDate: moment(data[i].startDate).format("D MMM"),
                                    endDate: moment(data[i].endDate).format("D MMM"),
                                    isJoined: true,
                                    is_featured: data[i].is_featured,
                                    cityName: data[i].cityName,
                                    stateName: data[i].stateName,
                                    timer: data[i].timer,
                                    timerStatus: data[i].timerStatus,
                                    paused: data[i].paused
                                });
                                if (i == (data.length - 1)) {
                                    cb(null);
                                }
                            }
                            else {
                                data1.push({
                                    _id: data[i]._id,
                                    totalUserCompleted: data[i].totalUserCompleted,
                                    is_protected: data[i].is_protected,
                                    password: data[i].password,
                                    gameImage: data[i].gameImage,
                                    details: data[i].details,
                                    name: data[i].name,
                                    startDate: moment(data[i].startDate).format("D MMM"),
                                    endDate: moment(data[i].endDate).format("D MMM"),
                                    isJoined: false,
                                    is_featured: data[i].is_featured,
                                    cityName: data[i].cityName,
                                    stateName: data[i].stateName,
                                    timer: data[i].timer,
                                    timerStatus: data[i].timerStatus,
                                    paused: data[i].paused
                                });
                                if (i == (data.length - 1)) {
                                    cb(null);
                                }
                            }
                        }
                        else {
                            data1.push({
                                _id: data[i]._id,
                                totalUserCompleted: data[i].totalUserCompleted,
                                is_protected: data[i].is_protected,
                                password: data[i].password,
                                gameImage: data[i].gameImage,
                                details: data[i].details,
                                name: data[i].name,
                                startDate: moment(data[i].startDate).format("D MMM"),
                                endDate: moment(data[i].endDate).format("D MMM"),
                                isJoined: false,
                                is_featured: data[i].is_featured,
                                cityName: data[i].cityName,
                                stateName: data[i].stateName,
                                timer: data[i].timer,
                                timerStatus: data[i].timerStatus,
                                paused: data[i].paused

                            });
                            if (i == (data.length - 1)) {
                                cb(null);
                            }
                        }

                    }(i))
                }
            }
            else {
                cb(null)
            }
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data1)
        }
    })
}



function gameDescrption(payloadData, callback) {


    // console.log(".......game Description..................................................",payloadData);

    var userId = 0;
    var flag = 0;
    var id = 0;
    var data = [];
    var data2 = [];
    var chall = [];
    var chall1 = [];
    var chall2 = [];
    var chall3 = [];
    var chall4 = [];
    var lastChal = [];
    var id1 = 0;
    var k = 0;
    var takeTime = 0;
    var userGameStartTime = 0;
    var gamePaused = false;
    var leftTime = 0;
    var completeGame = false;
    var delayTimer;
    var timerStart = false;
    let memberIds = [];
    var points = [];


    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },

        isProtected: ['checkToken', function (cb) {

            if (payloadData.isProtected) {
                var criteria = {
                    _id: payloadData.gameId,
                    password: payloadData.password
                };

                var projection = {
                    _id: 1
                };

                Service.UserService.getGame(criteria, projection, {}, function (err, result) {
                    if (err) {
                        cb(err);
                    }
                    else {
                        if (result.length) {
                            cb(null)
                        } else {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INCORRECT_PASSWORD);
                        }
                    }
                })
            } else {
                cb(null)
            }
        }],
        checkGame: ['isProtected', function (cb) {
            userId = userId.toString();

            var criteria = {
                member: { $in: [userId] },
                gameId: payloadData.gameId
            };

            Service.UserService.getUsersGames(criteria, {}, {}, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    if (result.length) {
                        memberIds = result[0].member;
                        id1 = result[0]._id;
                        chall1 = result[0].challengeId;
                        lastChal = result[0].lastChallenge;
                        chall2 = result[0].easyHintChallengesId;
                        chall3 = result[0].hardHintChallengesId;
                        chall4 = result[0].toughHintChallengesId;
                        takeTime = result[0].takeTime;
                        userGameStartTime = result[0].startTime;
                        completeGame = result[0].completeGame;
                        delayTimer = result[0].delayTimer;
                        timerStart = result[0].timerStart

                        if (result[0].pause == true) {
                            leftTime = result[0].takeTime
                        } else {
                            leftTime = (+new Date()) - userGameStartTime;
                            leftTime = leftTime + takeTime;
                        }

                        if (result[0].timerStart == false) {
                            leftTime = 0
                        }

                        gamePaused = result[0].pause
                        cb(null)
                    } else {
                        cb(null)
                    }
                }
            })
        }],
        gameDesc: ['checkGame', function (cb) {

            var criteria = {
                _id: payloadData.gameId
            };

            var projections = {
                is_deleted: 0,
                codes: 0
            };

            var populateArray = [
                {
                    path: 'challenges',
                    match: { is_deleted: false },
                    select: ' ',
                    options: {
                        sort: { _id: 1 }
                    }
                }
            ];


            Service.UserService.gameDetails(criteria, projections, { lean: true }, populateArray, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    chall = result[0].challenges;
                    var criteria = {
                        gameId: payloadData.gameId,
                        userId: userId
                    };
                    var options = {};
                    var projection = {};
                    Service.UserService.getManualScore(criteria, projection, options, function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            points = result;
                            cb(null);
                        }
                    });

                    var saveTime = result[0].timer - leftTime;
                    if (saveTime < 0) {
                        saveTime = 0
                    }
                    data.push({
                        _id: result[0]._id,
                        totalUserCompleted: result[0].totalUserCompleted,
                        is_protected: result[0].is_protected,
                        gameImage: result[0].gameImage,
                        details: result[0].details,
                        name: result[0].name,
                        maxPlayer: result[0].maxPlayer,
                        minPlayer: result[0].minPlayer,
                        startDate: moment(result[0].startDate).format("D MMM"),
                        endDate: moment(result[0].endDate).format("D MMM"),
                        isOrderLock: result[0].isOrderLock,
                        possibleAttemp: result[0].possibleAttemp,
                        timer: saveTime,
                        timerStatus: result[0].timerStatus,
                        whenStart: userGameStartTime,
                        gamePaused: gamePaused,
                        paused: result[0].paused,
                        completeGame: completeGame,
                        delayTimer: result[0].delayTimer,
                        timerStart: timerStart
                    });
                    cb(null);
                }
            })
        }],
        challengeCompleted: ['gameDesc', function (cb) {
            if (id1) {
                data[0].isJoined = true;
                if (data[0].isOrderLock == true) {
                    if (chall1.length) {
                        let flag = 0
                        let len = chall.length
                        for (let i = 0; i < chall.length; i++) {

                            let criteria = {
                                $or: [
                                    { userId: { $in: memberIds } },
                                    { userId: userId },
                                ],
                                gameId: payloadData.gameId,
                                challengeId: chall[i]._id
                            }

                            Service.UserService.countAttempts(criteria, function (err, result) {
                                if (err) {
                                    cb(err)
                                } else {
                                    flag++;
                                    chall[i].attepCount = result;
                                    chall[i].lastChallenge = false;

                                    if (lastChal.indexOf(chall[i]._id) >= 0) {
                                        chall[i].lastChallenge = true;
                                    }

                                    if (chall1.indexOf(chall[i]._id) >= 0) {
                                        chall[i].isCompleted = true;
                                        if (chall[i + 1]) {
                                            chall[i + 1].isOpen = true;
                                        }
                                    }

                                    if (chall2.indexOf(chall[i]._id) >= 0) {
                                        chall[i].points = (chall[i].points - chall[i].hints[0].points);
                                        chall[i].isEasy = true;
                                    }

                                    if (chall3.indexOf(chall[i]._id) >= 0) {
                                        chall[i].points = (chall[i].points - chall[i].hints[1].points);
                                        chall[i].isHard = true;
                                    }

                                    if (chall4.indexOf(chall[i]._id) >= 0) {
                                        chall[i].points = (chall[i].points - chall[i].hints[2].points);
                                        chall[i].isTootough = true;
                                    }

                                    if (flag == len) {
                                        data[0].challenges = chall;
                                        cb(null);
                                    }
                                }
                            })
                        }
                    }
                    else {
                        if (chall2.length || chall3.length || chall4.length) {

                            if (chall2.length) {
                                // console.log(".................chall2..........chall2", chall2.length);
                                let criteria = {
                                    $or: [
                                        { userId: { $in: memberIds } },
                                        { userId: userId },
                                    ],
                                    gameId: payloadData.gameId,
                                    challengeId: chall[0]._id
                                }
                                Service.UserService.countAttempts(criteria, function (err, result) {
                                    // console.log("....------------------------------------------......................", err, result);

                                    if (err) {
                                        cb(err);
                                    } else {
                                        chall[0].attepCount = result;
                                        chall[0].isOpen = true;
                                        chall[0].points = (chall[0].points - chall[0].hints[0].points);
                                        chall[0].isEasy = true;
                                    }
                                })
                            }
                            if (chall3.length) {
                                // console.log(".................chall3..........chall3", chall3.length);
                                let criteria = {
                                    $or: [
                                        { userId: { $in: memberIds } },
                                        { userId: userId },
                                    ],
                                    //userId:userId,
                                    gameId: payloadData.gameId,
                                    challengeId: chall[0]._id
                                }

                                Service.UserService.countAttempts(criteria, function (err, result) {

                                    // console.log("....99999999999999999999999999999999999999........................", err, result);
                                    if (err) {
                                        cb(err);
                                    } else {
                                        chall[0].attepCount = result;
                                        chall[0].isOpen = true;
                                        chall[0].points = (chall[0].points - chall[0].hints[1].points);
                                        chall[0].isHard = true;
                                    }
                                })
                            }
                            if (chall4.length) {

                                // console.log(".................chall4..........chall4", chall4.length);

                                let criteria = {
                                    $or: [
                                        { userId: { $in: memberIds } },
                                        { userId: userId },
                                    ],
                                    //userId:userId,
                                    gameId: payloadData.gameId,
                                    challengeId: chall[0]._id
                                }

                                Service.UserService.countAttempts(criteria, function (err, result) {

                                    // console.log("....88.88888888.....8888888888888........................", err, result);
                                    if (err) {
                                        cb(err);
                                    } else {
                                        chall[0].attepCount = result;
                                        chall[0].isOpen = true;
                                        chall[0].points = (chall[0].points - chall[0].hints[2].points);
                                        chall[0].isTootough = true;
                                        data[0].challenges = chall;
                                        cb(null)
                                    }
                                })
                            }
                        }
                        else {
                            //     console.log(".....else..........countAttempts....countAttempts....countAttempts....");

                            Service.UserService.countAttempts({ userId: userId, gameId: payloadData.gameId, challengeId: chall[0]._id }, function (err, result) {
                                // console.log("....222222222222222222222222222222222222222222222222............", err, result);

                                if (err) {
                                    cb(err)
                                } else {
                                    chall[0].isOpen = true;
                                    data[0].challenges = chall;
                                    chall[0].attepCount = result;
                                    cb(null);
                                }
                            })
                        }
                    }
                }
                else {
                    data[0].challenges = chall;
                    if (chall1.length) {
                        let flag = 0
                        let len = chall1.length
                        for (let i = 0; i < chall.length; i++) {

                            let criteria = {
                                $or: [
                                    { userId: { $in: memberIds } },
                                    { userId: userId },
                                ],
                                gameId: payloadData.gameId,
                                challengeId: chall[i]._id
                            }

                            Service.UserService.countAttempts(criteria, function (err, result) {

                                // console.log("....333333333333333333333333333333333333333333333...........", err, result);

                                if (err) {
                                    cb(err)
                                } else {

                                    flag++

                                    chall[i].attepCount = result;
                                    chall[i].isOpen = true;
                                    chall[i].lastChallenge = false;

                                    if (lastChal.indexOf(chall[i]._id) >= 0) {
                                        chall[i].lastChallenge = true;
                                    }

                                    if (chall1.indexOf(chall[i]._id) >= 0) {
                                        chall[i].isCompleted = true;
                                    }

                                    if (chall2.indexOf(chall[i]._id) >= 0) {
                                        chall[i].points = (chall[i].points - chall[i].hints[0].points);
                                        chall[i].isEasy = true;
                                    }

                                    if (chall3.indexOf(chall[i]._id) >= 0) {
                                        //            console.log(chall[i]._id,'id inside challenge three')
                                        chall[i].points = (chall[i].points - chall[i].hints[1].points);
                                        chall[i].isHard = true;
                                    }

                                    if (chall4.indexOf(chall[i]._id) >= 0) {
                                        //           console.log(chall[i]._id,'id inside challenge four')
                                        chall[i].points = (chall[i].points - chall[i].hints[2].points);
                                        chall[i].isTootough = true;
                                    }
                                    if (flag == len) {
                                        data[0].challenges = chall;
                                        cb(null);
                                    }
                                }
                            })
                        }
                    }
                    else {
                        let flag = 0
                        let len = chall.length

                        for (let i = 0; i < chall.length; i++) {
                            let criteria = {
                                $or: [
                                    { userId: { $in: memberIds } },
                                    { userId: userId },
                                ],
                                gameId: payloadData.gameId,
                                challengeId: chall[i]._id
                            }



                            Service.UserService.countAttempts(criteria, function (err, result) {
                                if (err) {
                                    cb(err)
                                } else {
                                    // console.log("....55555555555555555555555555555555555555555555555...........", err, result);

                                    flag++

                                    chall[i].attepCount = result;
                                    chall[i].isOpen = true;
                                    chall[i].lastChallenge = false;

                                    if (lastChal.indexOf(chall[i]._id) >= 0) {
                                        chall[i].lastChallenge = true;
                                    }

                                    if (chall1.indexOf(chall[i]._id) >= 0) {
                                        chall[i].isCompleted = true;
                                    }

                                    if (chall2.indexOf(chall[i]._id) >= 0) {
                                        chall[i].points = (chall[i].points - chall[i].hints[0].points);
                                        chall[i].isEasy = true;
                                    }

                                    if (chall3.indexOf(chall[i]._id) >= 0) {
                                        chall[i].points = (chall[i].points - chall[i].hints[1].points);
                                        chall[i].isHard = true;
                                    }

                                    if (chall4.indexOf(chall[i]._id) >= 0) {
                                        chall[i].points = (chall[i].points - chall[i].hints[2].points);
                                        chall[i].isTootough = true;
                                    }

                                    if (flag == len) {
                                        cb(null)
                                    }
                                }
                            })
                        }
                    }
                }
            }
            else {
                let dataToSend = []
                data[0].isJoined = false;
                let len = chall.length;
                let flag = 0
                // console.log("..................challenge........................",chall);
                for (let i = 0; i < chall.length; i++) {
                    let jsonDataToSend = new Object();
                    jsonDataToSend = chall[i];

                    let criteria = {
                        $or: [
                            { userId: { $in: memberIds } },
                            { userId: userId },
                        ],
                        gameId: payloadData.gameId,
                        challengeId: chall[i]._id
                    }

                    Service.UserService.countAttempts(criteria, function (err, result) {
                        console.log("....6666666666666666666666666666666666666666..........", err, result);

                        if (err) {
                            cb(err)
                        } else {
                            flag++
                            jsonDataToSend['isOpen'] = false;
                            jsonDataToSend['attepCount'] = result;
                            dataToSend.push(jsonDataToSend);
                            if (flag == len) {
                                data[0].challenges = dataToSend;
                                cb(null)
                            }
                        }
                    })
                }
            }
        }],
        checkGameTimer: ['challengeCompleted', function (cb) {

            let challenges = data[0].challenges;

            let len = challenges.length;

            if (len == 0) {
                cb(null)
            }

            for (let i = 0; i < len; i++) {
                (function (i) {
                    challengeStatus1(data[0].challenges[i], userId, memberIds, function (err, result) {
                        if (err) {
                            cb(err)
                        } else {
                            data[0].challenges[i].isTimer = result;
                            console.log("...............data[0].challenges[i].isTimer.........", data[0].challenges[i].isTimer);
                            if (i == (len - 1)) {
                                cb(null)
                            }
                        }
                    })
                }(i))
            }
        }]

    }, function (err, result) {

        if (err) {
            callback(err)
        } else {
            let d = data[0].challenges.sort(function(a, b) {
                return a["_id"] > b["_id"];
            });
            data[0].challenges = d;
            data[0].points = points;
            for (var i = 0; i < data[0].challenges.length; i++) {
                for (var j = 0; j < points.length; j ++) {
                    if (points[j].challengeId.toString() == data[0].challenges[i]._id.toString()) {
                        data[0].challenges[i].points = points[j].score;
                    }
                }
            }
            
            callback(null, data[0])
        }
    })
}


function challengeStatus(payloadData, userData, callback) {
    let timerStatus = false;
    let timer = 0;
    let status = false;
    let findChallenges = true;
    async.auto({
        getChallengesId: function (cb) {

            var query = {
                _id: payloadData._id
            };

            var options = {
                lean: true
            };

            var projections = {
                timerStatus: 1,
                timer: 1
            }

            Service.AdminService.getChallenges(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {

                    // console.log(".........getChallengesId......", result);
                    if (result && result.length) {
                        timerStatus = result[0].timerStatus;
                        timer = result[0].timer
                        cb(null)
                    } else {
                        cb(null)
                    }
                }
            })
        },
        getUserChallengesId: ['getChallengesId', function (cb) {
            var query = {
                userId: userData,
                challengeId: payloadData._id
            };
            var options = {
                lean: true
            };
            var projections = {
                gameStartTime: 1
            };

            Service.UserchallengesServices.findUsersChalange(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {

                    // console.log(".........getUserChallengesId......", result);
                    if (result && result.length) {
                        findChallenges = true;
                        var currentTime = +new Date();
                        var localtime = currentTime - result[0].gameStartTime;
                        var leftTime = timer - localtime;

                        if (leftTime > 0) {
                            status = true
                        } else {
                            status = false
                        }
                        cb(null)
                    } else {
                        status = true;
                        findChallenges = false;
                        cb(null)
                    }
                }
            })
        }],
    }, function (err, result) {
        if (err) {
            callback(err)
        } else {
            if (timer == false) {
                status = true
            }
            // console.log("......++++++++++++++final result.++++++++++++++", status);
            callback(null, status)
        }
    })
}


function challengeStatus1(payloadData, userData, memberIds, callback) {
    let timerStatus = false;
    let timer = 0;
    let status = false;
    let findChallenges = true;

    async.auto({
        getChallengesId: function (cb) {

            var query = {
                _id: payloadData._id
            };

            var options = {
                lean: true
            };

            var projections = {
                timerStatus: 1,
                timer: 1
            }

            Service.AdminService.getChallenges(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    // console.log(".........getChallengesId......", result);

                    if (result && result.length) {
                        timerStatus = result[0].timerStatus;
                        timer = result[0].timer
                        cb(null)
                    } else {
                        cb(null)
                    }
                }
            })
        },
        getUserChallengesId: ['getChallengesId', function (cb) {

            var query = {
                $or: [
                    { userId: userData },
                    { userId: { $in: memberIds } }
                ],
                challengeId: payloadData._id
            };

            var options = {
                lean: true
            };

            var projections = {
                gameStartTime: 1
            };

            Service.UserchallengesServices.findUsersChalange(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    if (result && result.length) {
                        findChallenges = true;
                        var currentTime = +new Date();
                        var localtime = currentTime - result[0].gameStartTime;
                        var leftTime = timer - localtime;
                        if (leftTime > 0) {
                            status = true
                        } else {
                            status = false
                        }
                        cb(null)
                    } else {
                        status = true;
                        findChallenges = false;
                        cb(null)
                    }
                }
            })
        }],
    }, function (err, result) {
        if (err) {
            callback(err)
        } else {
            if (timer == false) {
                status = true
            }
            callback(null, status)
        }
    })
}





function joinGame(payloadData, callback) {
    var userId = 0;
    var id;
    var data = [];
    var dataToSave = {};
    var original, thumbnail;
    var members = [];
    var name;
    var profilePic;
    var delayTimer = false;

    if (payloadData.iosMembers) {
        members = JSON.parse(payloadData.iosMembers);
    } else {
        members = payloadData.members;
    }

    async.auto({
        checkToken: function (cb) {

            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    if (payloadData.joinType == 'Solo') {
                        profilePic = result[0].profilePic;
                        name = result[0].name;
                        original = profilePic.original;
                        thumbnail = profilePic.thumbnail;
                    } else {
                        name = payloadData.teamName;
                    }
                    cb(null)
                }
            })
        },
        getGames: ['checkToken', function (cb) {

            let query = {
                _id: payloadData.gameId
            }
            let options = { lean: true }
            let projections = {}

            Service.AdminService.getGames(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    // console.log("....members.....", members);
                    if (result && result.length) {
                        if (payloadData.joinType != 'Solo') {
                            let len = members.length;
                            if (len >= result[0].minPlayer && len <= result[0].maxPlayer) {
                                cb(null)
                            } else if (result[0].maxPlayer == 1) {
                                cb({
                                    statusCode: 400,
                                    customMessage: 'Sorry, this cannot be played in team play. Please join as Solo user.',
                                    type: 'LIMIT'
                                });
                            }
                            else {
                                cb({
                                    statusCode: 400,
                                    customMessage: 'Sorry, this game can only be played with a team size of ' + result[0].minPlayer + ' Min Players - ' + result[0].maxPlayer + ' Max Players.',
                                    type: 'LIMIT'
                                });
                            }
                        } else {
                            if (result[0].minPlayer == 1 || result[0].minPlayer == 0) {
                                cb(null)
                            } else {
                                cb({
                                    statusCode: 400,
                                    customMessage: "Sorry, this game can only be played as a team",
                                    type: 'LIMIT'
                                });
                            }
                        }
                    } else {
                        cb(null)
                    }
                }
            })
        }],
        checkMembers: ['getGames', 'checkToken', function (cb) {
            if (payloadData.joinType == 'Solo') {
                cb(null);
            } else {

                if (members.length) {
                    var criteria = {
                        member: { $in: members },
                        gameId: payloadData.gameId
                    };

                    Service.UserService.getUsersGames(criteria, {}, {}, function (err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            if (result.length) {
                                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.ALREADY_JOINED);
                            } else {
                                cb(null)
                            }
                        }
                    })
                } else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MEMBERS);
                }
            }
        }],
        uploadImage: ['checkMembers', function (cb) {
            if (payloadData.teamImage && payloadData.teamImage.filename) {
                UploadManager.uploadFileToS3WithThumbnail(payloadData.teamImage, userId, function (err, uploadedInfo) {
                    if (err) {
                        cb(err)
                    } else {
                        original = baseURL + uploadedInfo.original;
                        thumbnail = baseURL + uploadedInfo.thumbnail;
                        cb(null);
                    }
                })
            }
            else {
                cb(null);
            }
        }],
        registerForGame: ['uploadImage', function (cb) {
            if (payloadData.teamImage && payloadData.teamImage.filename) {
                dataToSave = {
                    gameId: payloadData.gameId,
                    name: name,
                    createBy: userId,
                    type: payloadData.joinType,
                    "teamImage.thumbnail": thumbnail,
                    "teamImage.original": original,
                };
            } else {
                if (payloadData.joinType == 'Solo') {
                    dataToSave = {
                        gameId: payloadData.gameId,
                        name: name,
                        createBy: userId,
                        type: payloadData.joinType,
                        "teamImage.thumbnail": thumbnail,
                        "teamImage.original": original,
                    };
                }

                else {
                    dataToSave = {
                        gameId: payloadData.gameId,
                        name: name,
                        createBy: userId,
                        type: payloadData.joinType,
                    };
                }
            }

            if (payloadData.timerGame) {
                dataToSave.timerGame = true;
                dataToSave.gameTime = payloadData.gameTime;
            }


            Service.UserService.saveTeam(dataToSave, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    id = result._id;
                    cb(null)
                }
            })
        }],
        addMembers: ['registerForGame', function (cb) {
            if (payloadData.joinType == 'Solo') {
                var criteria = {
                    _id: id
                };
                var dataToUpdate = {
                    $push: {
                        member: userId
                    }
                };
                Service.UserService.updateTeam(criteria, dataToUpdate, { new: true }, function (err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null)
                    }
                })
            } else {
                if (members.length) {
                    for (var i = 0; i < members.length; i++) {
                        (function (i) {
                            var criteria = {
                                _id: id
                            };
                            var dataToUpdate = {
                                $push: {
                                    member: members[i]
                                }
                            };
                            Service.UserService.updateTeam(criteria, dataToUpdate, { new: true }, function (err, result) {
                                if (err) {

                                    cb(err);
                                }
                                else {
                                    if (i == (members.length - 1)) {
                                        cb(null)
                                    }
                                }
                            })
                        }(i))

                    }
                }
                else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MEMBERS);
                }
            }

        }],
        updateUser: ['registerForGame', function (cb) {
            if (payloadData.joinType == 'Solo') {

                var criteria = {
                    _id: userId
                };

                var dataToUpdate = {
                    $inc: {
                        totalGameStarted: 1
                    }
                };

                Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null)
                    }
                })
            }
            else {
                if (members.length) {
                    for (var i = 0; i < members.length; i++) {
                        (function (i) {
                            updateMembers(members[i], userId, payloadData.gameId, function (err, result) {
                                if (err) {
                                    cb(err);
                                }
                                else {
                                    if (i == (members.length - 1)) {
                                        cb(null)
                                    }
                                }
                            });

                        }(i))

                    }
                }
                else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MEMBERS);
                }
            }

        }],
        updateGame: ['getGames', 'checkMembers', 'updateUser', function (cb) {
            var criteria = {
                _id: payloadData.gameId
            };
            var dataToUpdate = {
                $inc: {
                    totalUserCompleted: 1
                }

            };
            Service.UserService.updateGames(criteria, dataToUpdate, { new: true }, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {
                    // console.log("..........................update game,............", err, result);

                    if (result.delayTimer == null) {
                        delayTimer = true
                        cb(null)
                    } else {
                        cb(null)
                    }


                }
            })
        }],
        updateUserGame: ['updateGame', 'registerForGame', function (cb) {

            // console.log("..................delay timer..........", delayTimer);

            if (delayTimer == true) {
                let query = {
                    gameId: payloadData.gameId,
                    createBy: userId

                };
                let options = {
                    lean: true
                };
                let setData = {
                    gameStartTime: +new Date(),
                    startTime: +new Date(),
                    timerStart: true
                };


                // console.log("........sdvsfvsvsf..........query..........", query);
                // console.log(".........dcsdvsdvsd.........setData..........", setData);

                Service.UserService.updateTeam(query, setData, options, function (err, result) {
                    // console.log(".............####################.....updateTeam..........", err, result);
                    if (err) {
                        cb(err)
                    } else {
                        cb(null)
                    }
                })
            } else {
                cb(null)
            }


        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, [])
        }
    })
}

function updateMembers(member, userId, game, callback) {
    var user = {};
    var message = 'You have an invitation to join a game';
    async.auto({
        updateUser: function (cb) {

            var criteria = {
                _id: member
            };

            var dataToUpdate = {
                $inc: {
                    totalGameStarted: 1
                }
            };

            Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    user = result;
                    cb(null)
                }
            })
        },
        sendPush: ['updateUser', function (cb) {
            if (member.toString() == userId.toString()) {
                cb(null);
            }
            else {


                // console.log("..............userId......", userId);
                if (user.onOrOffNotification == true) {
                    if (user.deviceType == 'ANDROID') {
                        NotificationManager.sendAndroidPushNotification(user.deviceToken, message, 1, game, function (err, result) {


                            // console.log("...................device token.......android  side..........", err, result);
                            if (err) {
                                cb(null);
                            }
                            else {
                                cb(null)
                            }
                        })
                    }
                    else {

                        // console.log(".....inside,,,,,,,,,,,,io..................", user.deviceToken);
                        NotificationManager.sendIosPushNotification(user.deviceToken, message, 1, game, function (err, result) {

                            // console.log("...................device token.......ios side..........", err, result);
                            if (err) {
                                cb(null);
                            } else {
                                cb(null)
                            }
                        })
                    }
                } else {
                    cb(null);
                }
            }
        }],
        savePush: ['sendPush', function (cb) {
            if (member.toString() == userId.toString()) {
                cb(null);
            }
            else {
                var dataTosave1 = {};
                dataTosave1.message = message;
                dataTosave1.userId = member;
                dataTosave1.gameId = game;
                Service.UserService.createNotification(dataTosave1, function (err, result) {
                    if (err) {
                        cb(err)
                    } else {
                        cb(null)
                    }
                })
            }
        }],
    }, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null)
        }
    })
}

function checkToken(accessToken, callback) {
    var criteria = {
        accessToken: accessToken
    };
    Service.UserService.getUser(criteria, {}, {}, function (err, result) {
        if (err) {

            callback(err);
        }
        else {

            if (result.length) {
                if (result[0].is_delete == true) {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DELETED_BY_ADMIN);
                }
                else if (result[0].is_block == true) {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.BLOCKED_BY_ADMIN);
                }
                else {
                    callback(null, result);
                }
            }
            else {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TOKEN_ALREADY_EXPIRED);
            }
        }
    })
}

function completeChallenges(payloadData, callback) {
    var userId = 0;
    var id = 0;
    var flag = 0;
    var members = [];
    var keyword = [];
    var thumbnail;
    var original;
    var videoThumb;
    var video;
    var media = false;
    var check = 0;
    var id1, id2;
    var c = [];
    var isKeyword = 'true';
    var point;
    let isAttemptSuccess = false;
    let allAttempts = false;
    let possibleAttemp = 0;
    let dependUponKey = null;
    let challengeNameTosend = null
    let tried;
    let timerStatus = false;
    let findDelayChallenge = false;
    let timer = 0;
    let findChallenges;
    let gameMember = [];

    if (payloadData.isKeyword) {
        isKeyword = payloadData.isKeyword;
    }

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    userId = result[0]._id;
                    cb(null)
                }
            });
        },

        getGamesMembers: ['checkToken', function (cb) {
            let query = {
                member: { $in: [userId] }
            }

            let options = { lean: true }
            let projections = { member: 1 }

            Service.UserService.getUsersGames(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    if (result && result.length) {
                        gameMember = result[0].member
                        cb(null)
                    } else {
                        cb(null)
                    }
                }
            })
        }],


        findChallengesPossibleAttempts: ['checkToken', 'getGamesMembers', function (cb) {

            let criteria = {
                _id: payloadData.challengeId
            }

            let projection = {};

            let option = { lean: true }

            Service.UserService.findChallenges(criteria, projection, option, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    possibleAttemp = result[0].possibleAttemp;
                    dependUponKey = result[0].dependUpon;
                    challengeNameTosend = result[0].dependUponChallengeName;
                    cb(null);
                }
            })
        }],

        checkifDependedGamePlayed: ['findChallengesPossibleAttempts', 'getGamesMembers', function (cb) {
            if (dependUponKey) {

                let criteria = {
                    gameId: payloadData.gameId,
                    challengeId: dependUponKey,
                    $or: [
                        { userId: userId },
                        { userId: { $in: gameMember } }
                    ],

                }

                let projection = {};

                let option = {}

                Service.UserService.findAttemptsChallengeGame(criteria, projection, option, function (err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result) {
                            cb(null)
                        } else {
                            callback({
                                statusCode: 400,
                                customMessage: 'This challenge depends upon challenge' + ' "' + challengeNameTosend + '" ' + 'please play it first',
                                type: 'NOT_MULTIPLE_ATTEMPTS'
                            });
                        }
                    }
                })
            } else {
                cb(null)
            }
        }],
        findTotelAttempt: ['checkifDependedGamePlayed', 'getGamesMembers', function (cb) {

            let criteria = {
                gameId: payloadData.gameId,
                $or: [
                    { userId: userId },
                    { userId: { $in: gameMember } }
                ],
                challengeId: payloadData.challengeId
            }

            Service.UserService.countAttempts(criteria, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    if (possibleAttemp) {
                        if (possibleAttemp > result) {
                            tried = result
                            cb(null);
                        } else {
                            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.ATTEMPTED_ALL_POSSIBLE_ATTEMPTS)
                        }
                    }
                    else {
                        cb(null)
                    }
                }
            })
        }],
        createAttempts: ['findTotelAttempt', function (cb) {
            let dataToSave = {
                gameId: payloadData.gameId,
                userId: userId,
                challengeId: payloadData.challengeId
            }
            Service.UserService.createAttempts(dataToSave, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    cb()
                }
            })
        }],
        checkAnswer: ['createAttempts', 'checkToken', 'getGamesMembers', function (cb) {
            if ((payloadData.keywords) && (isKeyword == 'true')) {
                c = _.intersection(payloadData.keywords, payloadData.challengeKeywords);
                if (c.length) {
                    cb(null)
                } else {
                    if ((possibleAttemp - 1) == tried) {
                        completeChallengeOnLastAttempts(payloadData, userId, 0, function (err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.ATTEMPTED_ALL_POSSIBLE_ATTEMPTS);
                            }
                        })
                    } else {
                        isAttemptSuccess = true;
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMAGE_CHALLENGE);
                    }
                }
            }
            else if (payloadData.textAnswer) {
                if (payloadData.isTest == 'true') {
                    cb(null)
                }
                else {
                    var ans = (payloadData.textAnswer).toString();
                    var criteria = {
                        _id: payloadData.challengeId,
                        textAnswer: { $in: [ans] }
                    };
                    Service.UserService.findChallenges(criteria, {}, {}, function (err, result) {
                        if (err) {
                            cb(err)
                        }
                        else {
                            if (result.length) {
                                cb(null);
                            } else {
                                if ((possibleAttemp - 1) == tried) {
                                    completeChallengeOnLastAttempts(payloadData, userId, 0, function (err, result) {
                                        if (err) {
                                            cb(err);
                                        } else {
                                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.ATTEMPTED_ALL_POSSIBLE_ATTEMPTS);
                                        }
                                    })

                                } else {
                                    isAttemptSuccess = true;
                                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TEXT_CHALLENGE);
                                }
                            }
                        }
                    })
                }
            }
            else if (payloadData.qrCode) {
                var criteria = {
                    _id: payloadData.challengeId,
                    qrCode: payloadData.qrCode
                };
                Service.UserService.findChallenges(criteria, {}, {}, function (err, result) {
                    if (err) {

                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            if ((possibleAttemp - 1) == tried) {
                                completeChallengeOnLastAttempts(payloadData, userId, 0, function (err, result) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.ATTEMPTED_ALL_POSSIBLE_ATTEMPTS);
                                    }
                                })
                            } else {
                                isAttemptSuccess = true;
                                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.QRCODE_CHALLENGE);
                            }
                        }
                    }
                })
            }
            else if ((payloadData.challengeLatitute) && (payloadData.challengeLongitute) && (payloadData.userLatitute) && (payloadData.userLongitute)) {
                var obj1 = {
                    lat: parseFloat(payloadData.challengeLatitute),
                    long: parseFloat(payloadData.challengeLongitute)
                };
                var obj2 = {
                    lat: parseFloat(payloadData.userLatitute),
                    long: parseFloat(payloadData.userLongitute)
                };

                var dis = UniversalFunctions.getDistanceBetweenPoints(obj1, obj2);

                dis = dis * 1000;

                var diff = parseFloat(payloadData.distanceDiff);

                if (dis < diff) {
                    cb(null)
                } else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.LOCATION_CHALLENGE);
                    return false;
                }
            } else {
                if (isKeyword == 'false') {
                    cb(null);
                } else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.CHALLENGE_TYPE);
                }
            }
        }],

        saveImage: ['checkAnswer', function (cb) {
            if (payloadData.image) {
                var randomData = Math.floor(Math.random() * 90000) + 10000000;
                UploadManager.uploadFileToS3WithThumbnail(payloadData.image, randomData, function (err, uploadedInfo) {
                    if (err) {
                        cb(err)
                    } else {
                        original = baseURL + uploadedInfo.original;
                        thumbnail = baseURL + uploadedInfo.thumbnail;
                        cb(null);
                    }
                })
            } else {
                cb(null)
            }
        }],

        saveVideo: ['checkAnswer', function (cb) {
            if (payloadData.video) {
                var randomData = Math.floor(Math.random() * 90000) + 10000000;
                UploadManager.uploadVideo(payloadData.video, randomData, function (err, uploadedInfo) {
                    if (err) {
                        cb(err)
                    } else {
                        video = baseURL + uploadedInfo;
                        cb(null);
                    }
                })
            }
            else {
                cb(null)
            }
        }],

        saveVideoThumbnail: ['checkAnswer', function (cb) {

            if (payloadData.videoThumbnail) {
                var randomData = Math.floor(Math.random() * 90000) + 10000000;
                UploadManager.uploadVideo(payloadData.videoThumbnail, randomData, function (err, uploadedInfo) {
                    if (err) {
                        cb(err)
                    } else {
                        videoThumb = baseURL + uploadedInfo;
                        cb(null);
                    }
                })
            } else {
                cb(null)
            }
        }],

        findTeam: ['saveImage', 'saveVideo', 'saveVideoThumbnail', function (cb) {

            userId = userId.toString();

            var criteria = {
                member: { $in: [userId] },
                gameId: payloadData.gameId
            };

            var projection = {};
            Service.UserService.getUsersGames(criteria, projection, {}, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    id = result[0]._id;
                    point = (payloadData.points);
                    cb(null);
                }
            })
        }],

        isCompleted: ['findTeam', function (cb) {

            var criteria = {
                _id: payloadData.challengeId,
                completedBy: { $in: [id] }
            };

            Service.UserService.findChallenges(criteria, {}, {}, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    if (result.length) {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.CHALLENGE_COMPLETED);
                    } else {
                        cb(null)
                    }
                }

            })
        }],
        getChallangetimer: ['isCompleted', 'findTeam', function (cb) {

            var query = {
                _id: payloadData.challengeId
            };

            var options = {
                lean: true
            };

            var projections = {
                timerStatus: 1,
                timer: 1
            }

            Service.AdminService.getChallenges(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {

                    if (result && result.length) {
                        timerStatus = result[0].timerStatus;
                        timer = result[0].timer
                        cb(null)
                    } else {
                        cb(null)
                    }

                }
            })
        }],

        getUserChallengeTimer: ['isCompleted', 'findTeam', 'getChallangetimer', function (cb) {

            // console.log("..................getUserChallengeTimer........................", timer);

            if (timerStatus == true) {

                var query = {
                    userId: userId,
                    challengeId: payloadData.challengeId
                };

                // console.log("................get timer query...............", query);

                var options = {
                    lean: true
                };

                var projections = {
                    gameStartTime: 1
                };


                Service.UserchallengesServices.findUsersChalange(query, projections, options, function (err, result) {
                    if (err) {
                        cb(err)
                    } else {
                        // console.log(".....!!!!!!!!!!!!!!!!!!!!!!....getUserChallengeTimer...............", err, result);
                        if (result && result.length) {
                            findChallenges = true;
                            var currentTime = +new Date();
                            var leftTime = currentTime - result[0].gameStartTime;

                            timer = leftTime;
                            // timer = timer - leftTime // comment for testing
                            cb(null)
                        } else {
                            findChallenges = false;
                            cb(null)
                        }
                    }
                })
            } else {
                cb(null)
            }
        }],

        checkUserGamesForDelay: ['getUserChallengeTimer', function (cb) {

            let query = {
                _id: id
            }

            let options = { lean: true }

            let projections = {
                gameStartTime: 1,
                timerStart: 1
            }

            Service.UserService.getUsersGames(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    if (result && result.length) {
                        if (result[0].timerStart == true) {
                            cb(null)
                        } else {
                            timer = 0;
                            cb(null)
                        }
                    } else {
                        cb(null)
                    }
                }
            })
        }],

        updateUserGames: ['checkUserGamesForDelay', 'isCompleted', 'findTeam', 'getUserChallengeTimer', function (cb) {
            // console.log(".................timer........**********..........", timer);
            var criteria = {
                _id: id
            };

            var dataToUpdate = {
                $push: {
                    challengeId: payloadData.challengeId,
                    logs: {
                        ChallengeId: payloadData.challengeId,
                        userId: userId
                    }
                },
                $inc: {
                    totalPoints: (payloadData.points),
                    usedTime: timer
                }
            };

            Service.UserService.updateTeam(criteria, dataToUpdate, { new: true }, function (err, result) {

                if (err) {
                    cb(err);
                } else {
                    members = result.member;
                    cb(null);
                }
            });

        }],

        updateUser: ['updateUserGames', 'findTeam', function (cb) {

            if (members.length) {

                for (var i = 0; i < members.length; i++) {
                    (function (i) {
                        var criteria = {
                            _id: members[i]
                        };
                        var dataToUpdate = {

                            $inc: {
                                totalPoints: (payloadData.points),
                                totalChallengeCompeleted: 1
                            },
                            $push: {
                                challengeCompeleted: {
                                    challenge: payloadData.challengeId
                                }
                            }


                        };
                        Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {

                            if (err) {
                                cb(err);
                            }
                            else {

                                if (i == (members.length - 1)) {
                                    cb(null)
                                }
                            }
                        })
                    }(i))

                }

            }
            else {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MEMBERS_MISSING);
            }
        }],

        addImageFeed: ['updateUserGames', function (cb) {
            if (payloadData.image) {
                var dataToSave = {
                    gameId: payloadData.gameId,
                    challengeId: payloadData.challengeId,
                    completedBy: id,
                    userId: userId,
                    "image.original": original,
                    "image.thumbnail": original,
                    is_image: true
                };
                if (payloadData.isShown == 'true') {
                    dataToSave.isPublic = true
                }
                else {
                    dataToSave.isPublic = false
                }


                //     console.log("################## add image into save feed ############## image time#######",dataToSave);

                Service.UserService.saveFeed(dataToSave, function (err, result) {
                    if (err) {
                        //          console.log(err,'================================error data==================================')
                        cb(err);

                    }
                    else {
                        id1 = result._id;
                        cb(null)
                    }
                })
            }
            else {
                cb(null)
            }
        }],

        addVideoFeed: ['updateUserGames', function (cb) {
            if (payloadData.video) {

                var dataToSave = {
                    gameId: payloadData.gameId,
                    challengeId: payloadData.challengeId,
                    completedBy: id,
                    userId: userId,
                    video: video,
                    videoThumbnail: videoThumb,
                    is_video: true
                };

                if (payloadData.isShown == 'true') {
                    dataToSave.isPublic = true
                } else {
                    dataToSave.isPublic = false
                }

                //     console.log("################## add image into save feed ############## video time#######",dataToSave);

                Service.UserService.saveFeed(dataToSave, function (err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        id2 = result._id;
                        cb(null)
                    }
                })
            }
            else {
                cb(null)
            }
        }],

        updateChallenge: ['updateUserGames', function (cb) {
            var criteria = {
                _id: payloadData.challengeId
            };
            var dataToUpdate = {
                $push: {
                    completedBy: id
                }
            };
            Service.UserService.updateChallenges(criteria, dataToUpdate, { new: true }, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {
                    cb(null);
                }
            })
        }],

        updateUser1: ['addImageFeed', function (cb) {
            if (payloadData.image) {
                if (members.length) {
                    for (var i = 0; i < members.length; i++) {
                        (function (i) {
                            var criteria = {
                                _id: members[i]
                            };
                            var dataToUpdate = {
                                $push: {
                                    feeds: id1
                                }

                            };
                            Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {

                                if (err) {
                                    cb(err);
                                }
                                else {
                                    if (i == (members.length - 1)) {
                                        cb(null)
                                    }
                                }
                            })
                        }(i))

                    }
                }
                else {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MEMBERS_MISSING);
                }
            }
            else {
                cb(null)
            }
        }],

        updateUser2: ['addVideoFeed', function (cb) {
            if (payloadData.video) {
                if (members.length) {
                    for (var i = 0; i < members.length; i++) {
                        (function (i) {
                            var criteria = {
                                _id: members[i]
                            };
                            var dataToUpdate = {
                                $push: {
                                    feeds: id2
                                }
                            };
                            Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {

                                if (err) {
                                    cb(err);
                                }
                                else {
                                    if (i == (members.length - 1)) {
                                        cb(null)
                                    }
                                }
                            })
                        }(i))

                    }
                }
                else {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MEMBERS_MISSING);
                }
            }
            else {

                //      console.log('clouser to it')
                cb(null);
            }

        }],

        applyUndependent: ['updateUser2', function (cb) {
            if (1) {
                let dataToSave = {
                    userId: userId,
                    gameId: payloadData.gameId,
                    challengeId: payloadData.challengeId,
                    textAnswer: payloadData.textAnswer
                };

                Service.UserService.makeDependencyFree(dataToSave, function (err, result) {
                    if (err) {
                        cb(err)
                    } else {
                        cb(null)
                    }
                })
            } else {
                cb(null)
            }
        }],

        makeChallengeLogWithPoint: ['applyUndependent', function (cb) {
            let criteria = {
                gameId: payloadData.gameId,
                _id: payloadData.challengeId
            }

            let dataToSet = {
                $addToSet: {
                    pointEarnedByUser: { userId: userId, point: payloadData.points }
                }
            }

            let option = {}

            Service.UserService.updateChallenges(criteria, dataToSet, option, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    cb(null)

                }
            })

        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, { points: point })
        }
    })
}










































function completeChallengeOnLastAttempts(payloadData, userId, pointData, callback) {
    //    console.log("........payloadData........payloadData...**********************.",payloadData);
    let members;
    let id;
    let id1;
    let id2;
    let point;
    let original;
    let thumbnail;
    let video;
    let videoThumb;
    let gameMembers = [];
    async.auto({
        saveImage: function (cb) {
            if (payloadData.image) {
                var randomData = Math.floor(Math.random() * 90000) + 10000000;
                UploadManager.uploadFileToS3WithThumbnail(payloadData.image, randomData, function (err, uploadedInfo) {
                    if (err) {
                        cb(err)
                    } else {

                        original = baseURL + uploadedInfo.original;
                        thumbnail = baseURL + uploadedInfo.thumbnail;
                        cb(null);
                    }
                })
            }
            else {
                cb(null)
            }
        },
        saveVideo: function (cb) {

            if (payloadData.video) {

                var randomData = Math.floor(Math.random() * 90000) + 10000000;
                UploadManager.uploadVideo(payloadData.video, randomData, function (err, uploadedInfo) {

                    if (err) {
                        cb(err)
                    } else {

                        video = baseURL + uploadedInfo;
                        cb(null);
                    }
                })
            }
            else {
                cb(null)
            }
        },
        saveVideoThumbnail: function (cb) {

            if (payloadData.videoThumbnail) {
                var randomData = Math.floor(Math.random() * 90000) + 10000000;
                UploadManager.uploadVideo(payloadData.videoThumbnail, randomData, function (err, uploadedInfo) {
                    if (err) {
                        cb(err)
                    } else {

                        videoThumb = baseURL + uploadedInfo;
                        cb(null);
                    }
                })
            }
            else {
                cb(null)
            }

        },
        findTeam: ['saveImage', 'saveVideo', 'saveVideoThumbnail', function (cb) {
            userId = userId.toString();
            var criteria = {
                member: { $in: [userId] },
                gameId: payloadData.gameId
            };
            var projection = {};
            Service.UserService.getUsersGames(criteria, projection, {}, function (err, result) {

                if (err) {
                    cb(err);
                }
                else {

                    id = result[0]._id;
                    gameMembers = result[0].member;
                    point = pointData;
                    cb(null);

                }
            })

        }],
        isCompleted: ['findTeam', function (cb) {

            var criteria = {
                _id: payloadData.challengeId,
                completedBy: { $in: [id] },

            };
            Service.UserService.findChallenges(criteria, {}, {}, function (err, result) {

                if (err) {
                    cb(err);
                }
                else {
                    if (result.length) {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.CHALLENGE_COMPLETED);
                    }
                    else {
                        cb(null)
                    }
                }
            })
        }],

        updateUserGames: ['isCompleted', 'findTeam', function (cb) {

            var criteria = {
                _id: id
            };
            var dataToUpdate = {
                $push: {
                    challengeId: payloadData.challengeId,
                    lastChallenge: payloadData.challengeId,
                    logs: {
                        ChallengeId: payloadData.challengeId,
                        userId: userId
                    },

                },
                $inc: {
                    totalPoints: pointData
                }

            };


            Service.UserService.updateTeam(criteria, dataToUpdate, { new: true }, function (err, result) {

                if (err) {
                    //    console.log(err,'error data')
                    cb(err);
                }
                else {
                    members = result.member;
                    cb(null);
                }
            });

        }],
        updateUser: ['updateUserGames', 'findTeam', function (cb) {

            if (members.length) {

                for (var i = 0; i < members.length; i++) {
                    (function (i) {
                        var criteria = {
                            _id: members[i]
                        };
                        var dataToUpdate = {

                            $inc: {
                                totalPoints: pointData,
                                totalChallengeCompeleted: 1
                            },
                            $push: {
                                challengeCompeleted: {
                                    challenge: payloadData.challengeId
                                }
                            }


                        };
                        Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {

                            if (err) {
                                cb(err);
                            }
                            else {

                                if (i == (members.length - 1)) {
                                    cb(null)
                                }
                            }
                        })
                    }(i))

                }

            }
            else {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MEMBERS_MISSING);
            }
        }],


        addImageFeed: ['updateUserGames', function (cb) {
            if (payloadData.image) {
                var dataToSave = {
                    gameId: payloadData.gameId,
                    challengeId: payloadData.challengeId,
                    completedBy: id,
                    userId: userId,
                    "image.original": original,
                    "image.thumbnail": original,
                    is_image: true
                };
                if (payloadData.isShown == 'true') {
                    dataToSave.isPublic = true
                }
                else {
                    dataToSave.isPublic = false
                }
                Service.UserService.saveFeed(dataToSave, function (err, result) {
                    if (err) {
                        //      console.log(err,'================================error data==================================')
                        cb(err);

                    }
                    else {
                        id1 = result._id;
                        cb(null)
                    }
                })
            }
            else {
                cb(null)
            }
        }],
        addVideoFeed: ['updateUserGames', function (cb) {
            if (payloadData.video) {
                var dataToSave = {
                    gameId: payloadData.gameId,
                    challengeId: payloadData.challengeId,
                    completedBy: id,
                    userId: userId,
                    video: video,
                    videoThumbnail: videoThumb,
                    is_video: true
                };
                if (payloadData.isShown == 'true') {
                    dataToSave.isPublic = true
                }
                else {
                    dataToSave.isPublic = false
                }
                Service.UserService.saveFeed(dataToSave, function (err, result) {
                    if (err) {

                        cb(err);
                    }
                    else {
                        id2 = result._id;
                        cb(null)
                    }
                })
            }
            else {
                cb(null)
            }
        }],
        updateChallenge: ['updateUserGames', function (cb) {
            var criteria = {
                _id: payloadData.challengeId
            };
            var dataToUpdate = {
                $push: {
                    completedBy: id
                }
            };
            Service.UserService.updateChallenges(criteria, dataToUpdate, { new: true }, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {
                    cb(null);
                }
            })
        }],
        updateUser1: ['addImageFeed', function (cb) {
            if (payloadData.image) {
                if (members.length) {
                    for (var i = 0; i < members.length; i++) {
                        (function (i) {
                            var criteria = {
                                _id: members[i]
                            };
                            var dataToUpdate = {
                                $push: {
                                    feeds: id1
                                }

                            };
                            Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {

                                if (err) {
                                    cb(err);
                                }
                                else {
                                    if (i == (members.length - 1)) {
                                        cb(null)
                                    }
                                }
                            })
                        }(i))

                    }
                }
                else {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MEMBERS_MISSING);
                }
            }
            else {
                cb(null)
            }
        }],
        updateUser2: ['addVideoFeed', function (cb) {
            if (payloadData.video) {
                if (members.length) {
                    for (var i = 0; i < members.length; i++) {
                        (function (i) {
                            var criteria = {
                                _id: members[i]
                            };
                            var dataToUpdate = {
                                $push: {
                                    feeds: id2
                                }
                            };
                            Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {

                                if (err) {
                                    cb(err);
                                }
                                else {
                                    if (i == (members.length - 1)) {
                                        cb(null)
                                    }
                                }
                            })
                        }(i))

                    }
                }
                else {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MEMBERS_MISSING);
                }
            }
            else {

                //    console.log('clouser to it')
                cb(null);
            }

        }],
        applyUndependent: ['updateUser2', function (cb) {


            //   console.log("====================inside the dependencry release=================");



            let dataToSave = {
                userId: userId,
                gameId: payloadData.gameId,
                challengeId: payloadData.challengeId,
                textAnswer: payloadData.textAnswer
            };
            Service.UserService.makeDependencyFree(dataToSave, function (err, result) {
                if (err) {
                    //       console.log(err)
                    cb(err)
                }
                else {
                    //        console.log('result datya',result);
                    cb(null)
                }
            })


        }],
        makeChallengeLogWithPoint: ['applyUndependent', function (cb) {
            let criteria = {
                gameId: payloadData.gameId,
                _id: payloadData.challengeId
            }

            let dataToSet = {
                $addToSet: {
                    pointEarnedByUser: { userId: userId, point: pointData }
                }
            }


            let option = {};

            Service.UserService.updateChallenges(criteria, dataToSet, option, function (err, result) {
                if (err) {
                    //     console.log(ErrorEvent,'erro data')
                    cb(err)
                } else {
                    //   console.log(result,'result data')
                    cb(null)

                }
            })

        }]


    }, function (err, result) {
        if (err) {
            //   console.log("err=====================",err)
            callback(err);
        } else {
            // console.log("err=====================")
            callback(null)
        }
    })
}

































































function gameFeed(payloadData, callback) {
    var userId = 0;
    var skip = 0;
    var data = [];
    if (payloadData.startLimit >= 0) {
        skip = parseInt(payloadData.startLimit)
    }
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)

                }
            })
        },
        fetchFeed: ['checkToken', function (cb) {
            var criteria = {
                gameId: payloadData.gameId,
                is_delete: false,
                isPublic: true
            };
            var projections = {};
            var options = {
                limit: 10,
                skip: skip,
                sort: {

                    createdAt: -1
                }
            };
            var populateArray = [
                {
                    path: 'challengeId',
                    match: {},
                    select: 'name points',
                    options: {}
                },
                {
                    path: 'completedBy',
                    match: {},
                    select: 'name teamImage',
                    options: {}
                }
            ];
            Service.UserService.getFeedDescription(criteria, projections, options, populateArray, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {
                    data = result;
                    cb(null)
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}

function liveStreamFeed(payloadData, callback) {
    var userId = 0;
    var skip = 0;
    var data = [];
    if (payloadData.startLimit >= 0) {
        skip = parseInt(payloadData.startLimit)
    }
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    //console.log("....err...", err);
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)

                }
            })
        },
        fetchFeed: ['checkToken', function (cb) {
            var criteria = {
                is_delete: false,
                isPublic: true
                // is_media: true
            };
            var projections = {};
            var options = {
                limit: 10,
                skip: skip,
                sort: {
                    is_featured: -1,
                    createdAt: -1
                }
            };
            var populateArray = [
                {
                    path: 'challengeId',
                    match: {},
                    select: 'name points',
                    options: {}


                },
                {
                    path: 'gameId',
                    match: {},
                    select: 'name ',
                    options: {}
                },
                {
                    path: 'completedBy',
                    match: {},
                    select: 'name teamImage',
                    options: {}
                }
            ];
            Service.UserService.getFeedDescription(criteria, projections, options, populateArray, function (err, result) {

                //       console.log(".....err.......result.....getFeedDescription..",err,result);
                if (err) {
                    //console.log(".d.d..d....d...", err);
                    cb(err);
                }
                else {
                    data = result
                    cb(null)
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}

function leaderBoard(payloadData, callback) {
    var userId = 0;
    var data = {};
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        fetchFeed: ['checkToken', function (cb) {

            var criteria = {
                gameId: payloadData.gameId,
                is_delete: false,
                totalPoints: { $gt: 0 }
            };

            var projections = {
                name: 1,
                teamImage: 1,
                totalPoints: 1,
                type: 1,
                member: 1,
                createBy: 1,
                takeTime: 1,
                gameStartTime: 1,
                completeGame: 1,
                usedTime: 1
            };

            var options = {
                sort: {
                    totalPoints: -1,
                    takeTime: 1
                }
            };

            var populateArray = [
                {
                    path: 'member',
                    match: {},
                    select: 'name profilePic',
                    options: {}
                }
            ];

            Service.UserService.getUsersGamesDescriptions(criteria, projections, options, populateArray, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    // console.log("......###############>..................leaderBoard...........", err, result);
                    data.leaderBord = result;
                    cb(null)
                }
            })
        }],

        ownRating: ['checkToken', function (cb) {
            var criteria = {
                gameId: payloadData.gameId,
                member: { $in: [userId] },
                is_delete: false,
                totalPoints: { $gt: 0 }
            };

            var projections = {
                _id: 1
            };

            var options = {};

            Service.UserService.getUsersGames(criteria, projections, options, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    // console.log("....err.......result...........", err, result);
                    if (result.length) {
                        data.teamId = result[0]._id;
                        //
                        cb(null)
                    } else {
                        data.teamId = '';
                        //      data.timerGame = result[0].timerGame
                        cb(null)
                    }
                }
            })
        }],
        gettimer: ['ownRating', function (cb) {
            let query = { _id: payloadData.gameId }
            let options = { lean: true }
            let setData = {
                timerStatus: 1
            }

            Service.AdminService.getGames(query, setData, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    data.timerStatus = result[0].timerStatus
                    cb(null)
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        } else {

            // console.log("......leader board data...............", data);
            callback(null, data)
        }
    })
}

function userProfile(payloadData, callback) {
    var userId = 0;
    var data = [];
    var data1 = [];
    //console.log("***********************", payloadData);
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    //console.log("....err...", err);
                    cb(err);
                }
                else {
                    if (payloadData.id) {
                        userId = payloadData.id;
                        cb(null);
                    }
                    else {
                        userId = result[0]._id;
                        cb(null)
                    }


                }
            })
        },
        userDetail: ['checkToken', function (cb) {
            var criteria = {
                _id: userId
            };
            var projections = {
                name: 1,
                profilePic: 1,
                totalPoints: 1,
                totalChallengeCompeleted: 1,
                totalGameStarted: 1,
                location: 1,
                latitute: 1,
                longitute: 1,
                feeds: 1
            };
            var options = {};
            var populateArray = [

                {
                    path: 'feeds',
                    match: {},
                    select: '',
                    options: {}
                },
            ];
            Service.UserService.userDetails(criteria, projections, options, populateArray, function (err, result) {

                if (err) {
                    cb(err);
                }
                else {
                    Models.Feeds.populate(result, [{ path: "feeds.gameId", model: "Games", select: 'name' },
                    {
                        path: "feeds.challengeId", model: "Challenges", select: 'name points',
                        // match:{is_deleted:false}
                    },
                    {
                        path: "feeds.completedBy",
                        model: "UsersGames",
                        select: 'name teamImage'
                    }], function (err, result1) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            data = result1;
                            cb(null)
                        }
                    });

                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            // console.log("................................data from feed........", data[0]);
            callback(null, data[0])
        }
    })
}

function editProfile(payloadData, callback) {
    var userId = 0;
    var data = {};
    var original, thumbnail;
    var dataToUpdate = {};
    if (payloadData.profilePic && payloadData.profilePic.filename) {
        dataToUpdate.profilePic = {
            original: null,
            thumbnail: null
        }
    }

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        uploadImage: ['checkToken', function (cb) {
            if (payloadData.profilePic && payloadData.profilePic.filename) {
                var randomData = Math.floor(Math.random() * 90000) + 10000000;
                UploadManager.uploadFileToS3WithThumbnail(payloadData.profilePic, randomData, function (err, uploadedInfo) {
                    if (err) {
                        cb(err)
                    } else {
                        original = baseURL + uploadedInfo.original;
                        thumbnail = baseURL + uploadedInfo.thumbnail;
                        cb(null);
                    }
                })

            }
            else {
                cb(null);
            }
        }],
        editProfile: ['uploadImage', function (cb) {

            var criteria = {
                _id: userId
            };

            if (payloadData.name) {
                dataToUpdate.name = payloadData.name;
            }

            if (payloadData.profilePic) {
                dataToUpdate.profilePic.original = original;
                dataToUpdate.profilePic.thumbnail = thumbnail;
            }

            Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    data._id = result._id;
                    data.name = result.name;
                    data.profilePic = result.profilePic;
                    cb(null);
                }
            })
        }],
        editUsersGames: ['uploadImage', function (cb) {
            if (payloadData.name) {

                var criteria = {
                    createBy: userId,
                    type: "Solo"
                };

                dataToUpdate.name = payloadData.name;

                Service.UserService.updateTeam(criteria, dataToUpdate, { new: true }, function (err, result) {
                    if (err) {
                        cb(err);
                    }
                    else {
                        cb(null);
                    }
                })
            } else {
                cb(null);
            }

        }],
    }, function (err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, data)
        }
    })
}

function changePassword(payloadData, callback) {
    var userId = 0;
    var oldPass;
    var data = {};

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    oldPass = result[0].password;
                    var pass = md5(payloadData.oldPassword)
                    if (!(oldPass == pass)) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INCORRECT_OLD_PASS);
                    }
                    else {
                        cb(null)
                    }

                }
            })
        },
        editProfile: ['checkToken', function (cb) {
            var criteria = {
                _id: userId
            };
            var dataToUpdate = {
                password: md5(payloadData.newPassword)
            };

            Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {
                if (err) {
                    //console.log("************", err);
                    cb(err);
                }
                else {
                    data = result;
                    cb(null)
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, {})
        }
    })
}

function myGames(payloadData, callback) {
    var userId = 0;
    var data = [];
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    //console.log("....err...", err);
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)

                }
            })
        },
        myGames: ['checkToken', function (cb) {
            var criteria = {
                member: { $in: [userId] }
            };
            var projections = {
                gameId: 1,
                member: 1
            };
            var options = {};
            var populateArray = [
                {
                    path: 'gameId',
                    match: {},
                    select: '',
                    options: {}
                },
            ];
            Service.UserService.getUsersGamesDescriptions(criteria, projections, options, populateArray, function (err, result) {
                if (err) {
                    //console.log(".d.d..d....d...", err);
                    cb(err);
                }
                else {
                    data = result;
                    cb(null)
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}


function searchTextAutoComplete(payloadData, callback) {

    var userId;
    var date = moment();
    var data = [];
    var value = payloadData.searchText;
    value = value.toString();
    //console.log(".....value....", value);
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    //console.log("....err...", err);
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)

                }
            })
        },
        getGameName: ['checkToken', function (cb) {


            //     console.log(date,'date data')
            var criteria = {
                name: { $regex: value, $options: "i" },
                "is_deleted": false,
                "is_active": true,
                startDate: { $lte: date },
                endDate: { $gte: date },
            };



            var projection = { name: 1 };

            Service.UserService.getGame(criteria, projection, {}, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    data = result;
                    cb(null, data)
                }
            });
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    });
}

function userAutoComplete(payloadData, callback) {
    var userId;
    var data = [];
    var value = payloadData.searchText;
    value = value.toString();

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        getGameName: ['checkToken', function (cb) {
            var criteria = {
                name: { $regex: value, $options: "i" },
                "is_delete": false,
                "profileComplete": true,
                "is_active": true,
                "is_block": false,
                _id: { $ne: userId }
            };
            var projection = { name: 1, profilePic: 1 };
            Service.UserService.getUser(criteria, projection, {}, function (err, result) {
                if (err) {

                    callback(err);
                }
                else {

                    data = result;
                    cb(null, data)
                }
            });
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    });
}

function userLIsting(payloadData, callback) {
    var userId;
    var data = [];
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    //console.log("....err...", err);
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)

                }
            })
        },
        getGameName: ['checkToken', function (cb) {
            var criteria = {
                is_delete: false,
                is_block: false,
                is_active: true,
                profileComplete: true
            };
            var projection = {
                name: 1,
                profilePic: 1
            };
            Service.UserService.getUser(criteria, projection, {}, function (err, result) {
                if (err) {
                    //console.log("err.....", err);
                    cb(err);
                }
                else {
                    data = result;
                    cb(null)
                }
            })

        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    });
}

function reported(payloadData, callback) {
    var data = {};
    var userId = 0;
    var name;

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    //    console.log("....err...", err);
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        reportCheck: ['checkToken', function (cb) {
            if (payloadData.type == 'Game') {
                userId = userId.toString();

                var criteria = {
                    reportedBy: { $in: [userId] }
                };

                var projection = {};

                Service.UserService.getGame(criteria, projection, {}, function (err, result) {
                    if (err) {
                        cb(err)
                    } else {
                        if (result.length) {
                            name = result[0].name;
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.YOU_ALREADY_REPORT_GAME)
                        }
                        else {
                            cb(null)
                        }
                    }
                })
            }
            else {
                userId = userId.toString();
                var criteria = {
                    _id: payloadData.id,
                    reportedBy: { $in: [userId] }
                };
                var projection = {};
                Service.UserService.getFeeds(criteria, projection, {}, function (err, result) {
                    //   console.log("...checkerr.....", err, result);
                    if (err) {
                        cb(err)
                    }
                    else {
                        if (result.length) {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.YOU_ALREADY_REPORT_FEED)
                        }
                        else {
                            cb(null)
                        }

                    }
                })
            }
        }],
        reportGame: ['reportCheck', function (cb) {
            if (payloadData.type == 'Game') {
                var criteria = {
                    _id: payloadData.id
                };
                var dataToUpdate = {
                    $inc: {
                        reports: 1
                    },
                    $push: {
                        reportedBy: userId
                    }
                };
                Service.UserService.updateGames(criteria, dataToUpdate, {}, function (err, result) {
                    //    console.log("...err.....", err, result);
                    if (err) {
                        cb(err)
                    }
                    else {
                        cb(null)
                    }
                })
            }
            else {
                var criteria = {
                    _id: payloadData.id
                };
                var dataToUpdate = {
                    $inc: {
                        reports: 1
                    },
                    $push: {
                        reportedBy: userId
                    }
                };
                Service.UserService.updateFeeds(criteria, dataToUpdate, {}, function (err, result) {
                    //    console.log("...err.....", err, result);
                    if (err) {
                        cb(err)
                    }
                    else {
                        cb(null)
                    }
                })
            }

        }],
        sendEmail: ['reportGame', function (cb) {
            var sub = 'Beyond The Walls Password Report Issue';
            if (payloadData.type == 'Game') {
                var content = 'You are receiving this because you (or someone else) has reported this game ' + name;
            }
            else {
                var content = 'You are receiving this because you (or someone else) has reported this feed';
            }
            UniversalFunctions.sendMailthroughSMTP(sub, 'admin@getbeyondthewalls.com', content, 1, function (err, result) {
                //   console.log("...err...", err, result);
                if (err) {
                    cb(err)
                }
                else {
                    cb(null)
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, data)
        }
    })
}

function teamUsersListing(payloadData, callback) {
    var data = [];
    var userId = 0;
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        teamMembers: ['checkToken', function (cb) {

            var criteria = {
                _id: payloadData.teamId
            };

            var projection = {
                member: 1
            }

            var populateArray = [
                {
                    path: 'member',
                    match: {},
                    select: 'name profilePic',
                    options: {}
                }
            ];

            Service.UserService.getUsersGamesDescriptions(criteria, projection, {}, populateArray, function (err, result) {
                if (err) {
                    cb(err)
                }
                else {
                    data = result;
                    cb(null)
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, data)
        }
    })
}

function feedDelete(payloadData, callback) {
    var userId = 0;
    var admin = [];
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        changeToFeatured: ['checkToken', function (cb) {
            var criteria = {
                _id: payloadData.feedId
            };
            var dataToUpdate = {
                is_delete: true
            };
            Service.UserService.updateFeeds(criteria, dataToUpdate, {}, function (err, result) {
                if (err) {
                    cb(err)
                }
                else {
                    cb(null)
                }
            })
        }]
    },
        function (err, result) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, {});
            }
        })
}

function UserPointsListing(payloadData, callback) {
    var userId = 0;
    var data = [];
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        pointsList: ['checkToken', function (cb) {
            var criteria = {
                is_delete: false,
                is_block: false,
                is_active: true,
                profileComplete: true
            };
            var dataToUpdate = {
                name: 1, profilePic: 1, totalPoints: 1
            };
            var options = {
                sort: {
                    totalPoints: -1
                }
            }
            Service.UserService.getUser(criteria, dataToUpdate, options, function (err, result) {
                if (err) {

                    cb(err)
                }
                else {
                    data = result;
                    cb(null)
                }
            })


        }],
    },
        function (err, result) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, data);
            }
        })
}

function forgotPassword(payloadData, callback) {
    var userId = 0;
    var user = {};
    var token;
    async.auto({
        checkEmail: function (cb) {
            var criteria = {
                email: payloadData.emailId,
                is_delete: false,
                is_active: true,
                profileComplete: true,
                is_block: false
            };
            Service.UserService.getUser(criteria, {}, {}, function (err, result) {
                if (err) {

                    cb(err);
                }
                else {
                    if (result.length) {

                        userId = result[0]._id
                        cb(null);
                    }
                    else {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_NOT_FOUND);
                    }
                }
            })
        },
        genrateToken: ['checkEmail', function (cb) {
            crypto.randomBytes(40, function (err, buf) {
                if (err) {
                    //console.log("***********Ddd", err)
                    cb(err);
                }
                else {
                    token = buf.toString('hex');
                    //console.log("********", token);
                    var criteria = {
                        _id: userId
                    };
                    var dataToUpdate = {
                        passwordResetToken: token
                    };
                    Service.UserService.updatePlayer(criteria, dataToUpdate, { new: true }, function (err, result) {
                        if (err) {
                            //console.log("***********Ddd", err);
                            cb(err);
                        }
                        else {
                            user = result;
                            cb(null)
                        }
                    })
                }

            });
        }],
        sendEmail: ['genrateToken', function (cb) {
            var sub = 'Beyond The Walls Password Reset';
            var content = 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://18.217.79.229/beyondthewalls/forgetPassword.html?token=' + token + '\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n';
            UniversalFunctions.sendMailthroughSMTP(sub, payloadData.emailId, content, 1, function (err, result) {
                //console.log("...err...", err, result);
                if (err) {
                    cb(err)
                } else {
                    cb(null)
                }
            })
        }]
    },
        function (err, result) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, {});
            }
        })
}


function challengeHint(payloadData, callback) {

    // console.log("payloadData*********challengeHint*********", payloadData);

    var userId;
    var id;
    var flag = 0;
    var flag1 = 0;
    var data1 = {};

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        findTeam: ['checkToken', function (cb) {
            var criteria = {
                member: { $in: [userId] },
                gameId: payloadData.gameId
            };
            var projection = {};
            Service.UserService.getUsersGames(criteria, projection, {}, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    id = result[0]._id;
                    cb(null);
                }
            })
        }],
        isCompleted: ['findTeam', function (cb) {
            var criteria = {
                _id: payloadData.challengeId,
                completedBy: { $in: [id] }
            };
            Service.UserService.findChallenges(criteria, {}, {}, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    if (result.length) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.CHALLENGE_COMPLETED);
                    }
                    else {
                        flag1 = 1;
                        cb(null)
                    }
                }
            })
        }],
        getHint: ['isCompleted', function (cb) {
            if (flag1 == 1) {

                var criteria = { _id: payloadData.challengeId };

                var projection = {
                    hints: 1
                };

                var option = {
                    lean: true
                };

                Service.UserService.findChallenges(criteria, projection, option, function (err, data) {
                    if (err) {
                        cb(err)
                    }
                    else {
                        if (payloadData.hintType == 'Easy') {
                            data1.hint = data[0].hints[0].name;
                        }
                        if (payloadData.hintType == 'Hard') {
                            data1.hint = data[0].hints[1].name;
                        }
                        if (payloadData.hintType == 'Too tough') {
                            data1.hint = data[0].hints[2].name;
                        }
                        cb(null)
                    }
                })
            }
            else {
                cb(null)
            }
        }],
        checkHint: ['getHint', function (cb) {
            if (flag1 == 1) {
                if (payloadData.hintType == 'Easy') {
                    var criteria = {
                        gameId: payloadData.gameId,
                        member: { $in: [userId] },
                        easyHintChallengesId: { $in: [payloadData.challengeId] },
                    };
                }
                if (payloadData.hintType == 'Hard') {
                    var criteria = {
                        gameId: payloadData.gameId,
                        member: { $in: [userId] },
                        hardHintChallengesId: { $in: [payloadData.challengeId] },
                    };

                }
                if (payloadData.hintType == 'Too tough') {
                    var criteria = {
                        gameId: payloadData.gameId,
                        member: { $in: [userId] },
                        toughHintChallengesId: { $in: [payloadData.challengeId] },
                    };

                }
                var projection = { _id: 1 };
                var options = { lean: true };
                Service.UserService.getUsersGames(criteria, projection, options, function (err, data) {
                    if (err) {
                        cb(err)
                    }
                    else {
                        if (data.length) {
                            flag = 1;
                            cb(null)
                        }
                        else {
                            cb(null);
                        }

                    }
                })
            }
            else {
                cb(null)
            }
        }],
        updateHint: ['checkHint', function (cb) {
            if (flag1 == 1) {
                if (flag == 1) {
                    cb(null)
                }
                else {
                    var criteria = {
                        gameId: payloadData.gameId,
                        member: { $in: [userId] }
                    };

                    var dataToUpdate = {};
                    if (payloadData.hintType == 'Easy') {
                        dataToUpdate = {
                            $push: {
                                easyHintChallengesId: payloadData.challengeId
                            },
                            easyUsed: true

                        }
                    }
                    if (payloadData.hintType == 'Hard') {
                        dataToUpdate = {
                            $push: {
                                hardHintChallengesId: payloadData.challengeId
                            },
                            hardUsed: true

                        }
                    }
                    if (payloadData.hintType == 'Too tough') {
                        dataToUpdate = {
                            $push: {
                                toughHintChallengesId: payloadData.challengeId
                            },
                            tootoughUsed: true
                        }
                    }

                    var options = { new: true };
                    Service.UserService.updateTeam(criteria, dataToUpdate, options, function (err, result) {
                        if (err) {

                            cb(err)
                        }
                        else {
                            cb(null);
                        }
                    })
                }
            }
            else {
                cb(null)
            }
        }]

    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data1)
        }
    })
}

function makeAttempts(payloadData, callback) {
    let data;
    let count;
    let userId;
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },


        findTotelAttempts: ['checkToken', function (err, result) {

            let criteria = {
                gameId: payloadData.gameId,
                userId: userId,
                challengeId: payloadData.challengeId
            }

            Service.UserService.countAttempts(criteria, function (err, result) {
                if (err) {
                    cb(err)
                }
                else {
                    count = result
                    cb(null)
                }
            })
        }]

    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}



function getTotalAteemptsOnChallenge(payloadData, callback) {

    let data;
    let userId;
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },

        findTotelAttempts: ['checkToken', function (err, result) {

            let criteria = {
                gameId: payloadData.gameId,
                userId: userId,
                challengeId: payloadData.challengeId
            }
            Service.UserService.countAttempts(criteria, function (err, cb) {
                if (err) {
                    cb(err)
                }
                else {
                    data = result
                    cb(null)
                }
            })
        }],
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}



function checkDependedchallengePlayed(payloadData, callback) {
    let userId;
    let data;

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },

        findTotelAttempts: ['checkToken', function (err, cb) {

            let criteria = {
                gameId: payloadData.gameId,
                userId: userId,
                challengeId: { $in: [payloadData.challengeId] }
            }
            Service.UserService.findAttemptsChallengeGame(criteria, function (err, result) {
                if (err) {
                    cb(err)
                }
                else {
                    data = result
                    cb(null)
                }
            })
        }],
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}


function renderGameListforPericularRegion(payloadData, callback) {
    let userId;
    let data;
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },

        getGameList: ['checkToken', function (cb) {

            let date = moment()

            let criteria = {
                $and: [
                    {
                        $or: [
                            { cityName: payloadData.cityName },
                            { cityName: new RegExp(payloadData.cityName, 'i') }
                        ]
                    },
                    {
                        is_deleted: false
                    },
                    {
                        is_active: true
                    },
                    {
                        startDate: { $lte: date }
                    },
                    {
                        endDate: { $gte: date }
                    }
                ]
            }


            //   console.log(criteria,'criteria')


            let projection = {
                name: 1,
                details: 1,
                is_featured: 1,
                gameImage: 1,
                is_protected: 1,
                startDate: 1,
                endDate: 1,
                totalUserCompleted: 1,
                password: 1,
                cityName: 1,
                stateName: 1
            };

            let option = {
                lean: true
            }

            Service.UserService.getGame(criteria, projection, option, function (err, result) {
                if (err) {
                    cb(err)
                }
                else {
                    data = result
                    //    console.log(data)
                    cb(null)
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}



function findAllStateName(payloadData, callback) {

    let userId;
    let data = [];

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },


        findAllStateName: ['checkToken', function (cb) {

            let criteria = {
                $and: [
                    { $or: [{ stateName: { $ne: null } }, { stateName: { $ne: null } }] },
                    { countryName: payloadData.countryName }
                ]
            };

            Game.aggregate([
                { $match: criteria },
                { $group: { _id: "$stateName" } },
                { $sort: { stateName: 1 } }
            ], function (err, result) {
                if (err) {
                    cb(err)
                }
                else {
                    let i = 0;

                    for (i = 0; i < result.length; i++) {

                        if (result[i]._id && (result[i]._id != 'undefined')) {
                            data.push(result[i]);
                        }

                        if (i == (result.length - 1)) {
                            //   console.log(data,'result data')
                            cb(null)
                        }
                    };
                }
            });
        }]

    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}


function findCityName(payloadData, callback) {
    let userId;
    let data = [];



    //  console.log(payloadData,'payloadData');

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },


        findAllStateName: ['checkToken', function (cb) {
            let criteria = {
                $and: [
                    { $or: [{ cityName: { $ne: null } }, { cityName: { $ne: "" } }] },
                    { stateName: payloadData.stateName },
                    { stateName: new RegExp(payloadData.stateName, 'i') }
                ]
            };

            Game.aggregate([
                { $match: criteria },
                { $group: { _id: "$cityName" } }
            ], function (err, result) {
                if (err) {
                    cb(err)
                }
                else {


                    let i = 0;

                    for (i = 0; i < result.length; i++) {

                        if (result[i]._id && (result[i]._id != 'undefined')) {
                            data.push(result[i]);
                        }

                        if (i == (result.length - 1)) {
                            //    console.log(data,'result data')
                            cb(null)
                        }
                    };
                }
            });

        }]


    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}


function findCounty(payloadData, callback) {
    let userId;
    let data = [];



    // console.log(payloadData,'payloadData');

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },


        findAllStateName: ['checkToken', function (cb) {
            let criteria = {
                $or: [
                    { countryName: { $ne: "" } },
                    { countryName: { $ne: null } },
                ]

            };

            Game.aggregate([
                { $match: criteria },
                { $group: { _id: "$countryName" } },
            ], function (err, result) {
                if (err) {
                    //    console.log(".....country list...................",err,result);
                    cb(err)
                }
                else {
                    let i = 0;

                    for (i = 0; i < result.length; i++) {

                        if (result[i]._id && (result[i]._id != 'undefined')) {
                            data.push(result[i]);
                        }

                        if (i == (result.length - 1)) {
                            //    console.log(data,'result data')
                            cb(null)
                        }
                    };

                }
            });

        }]


    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, data)
        }
    })
}









function showPointTakenByUser(payloadData, callback) {

    let data;
    let userPoint;
    let userId;
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })

        },

        getData: ['checkToken', function (err, cb) {
            let criteria = {
                gameId: payloadData.gameId,
                _id: payloadData.challengeId
            };
            let option = {

            };
            let projection = {
                pointEarnedByUser: 1
            }
            Service.UserService.findPerticularChalange(criteria, projection, option, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    if (result && result.pointEarnedByUser) {

                        for (let i = 0; i < result.pointEarnedByUser.length; i++) {
                            if (payloadData.userId == result.pointEarnedByUser[i].userId) {
                                userPoint = result.pointEarnedByUser[i].point
                            }

                            if (i == (result.pointEarnedByUser.length - 1)) {
                                cb(null)
                            }
                        }
                    } else {
                        cb(null)
                    }
                }
            })
        }]

    }, function (err, result) {
        if (err) {
            callback(err)
        }
        else {
            callback(null, userPoint)
        }
    })
}

const pausedGame = function (payloadData, callback) {
    let userId;
    let startTime;
    let userGameId;
    let usedTime = 0;

    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        pausedGame: ['checkToken', function (cb) {

            var query = {
                gameId: payloadData.gameId,
                member: { $in: [userId] }
            };

            var options = {
                lean: true
            };

            var setData = {
                pause: payloadData.pause
            }

            if (payloadData.pause == false) {
                setData.startTime = +new Date()
            }

            // console.log("..........in paused game....update team..pausedGame.......", query, setData, options);

            Service.UserService.updateTeam(query, setData, options, function (err, result) {

                // console.log("..........in paused game......pausedGame.......", err, result);
                if (err) {
                    cb(err)
                }
                else {
                    if (result) {
                        userGameId = result._id;
                        startTime = result.startTime
                        usedTime = result.takeTime
                        cb(null);
                    } else {
                        cb(null)
                    }
                }
            })
        }],
        calculatedTakeTime: ['pausedGame', function (cb) {

            if (payloadData.pause == true) {

                var currentTime = +new Date();

                var takeTime = parseInt(currentTime) - parseInt(startTime)

                takeTime = takeTime + usedTime;

                var query = {
                    _id: userGameId
                }

                var options = { lean: true }

                var setData = {
                    takeTime: takeTime
                }

                // console.log(".........takeTime..............", takeTime);

                Service.UserService.updateTeam(query, setData, options, function (err, result) {
                    if (err) {
                        cb(err)
                    } else {
                        cb(null)
                    }
                })
            } else {

                var query = {
                    _id: userGameId
                }

                var options = {
                    lean: true
                }

                var setData = {
                    startTime: +new Date()
                }

                // console.log("......calculatedTakeTime...............", query, setData, options);

                Service.UserService.updateTeam(query, setData, options, function (err, result) {
                    if (err) {
                        cb(err)
                    } else {
                        cb(null)
                    }
                })
            }
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null)
        }
    })
}

const usersChallenges = function (payloadData, callback) {

    let userId;
    let timerStatus = false;
    let timer = 0;
    let findChallenges = false;
    let paused = false;
    let gameTimerStatus = false;
    let gameName = '';
    let gameId;
    let findOff = false;
    let gameIds;
    let delayTimer = false;
    let isTimer = true;
    let memberIds = [];
    let gameLeftTime = 0;
    let gameTimer = 0;

    async.auto({

        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        getDelayChallengeId: function (cb) {

            var query = {
                challenges: { $in: [payloadData.challengesId] }
            }

            var options = {
                lean: true
            }

            var projections = {};

            Service.AdminService.getGames(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    if (result && result.length) {
                        gameIds = result[0]._id;
                        if (result[0].delayTimer == null) {
                            delayTimer = true;
                            cb(null)
                        } else if (result[0].delayTimer == payloadData.challengesId) {
                            gameIds = result[0]._id;
                            findOff = true;
                            cb(null)
                        } else {
                            delayTimer = false;
                            findOff = false;
                            cb(null)
                        }
                    } else {
                        findOff = false;
                        cb(null)
                    }
                }
            })
        },
        getMemberIds: ['checkToken', 'getDelayChallengeId', function (cb) {
            let query = {
                gameId: gameIds,
                $or: [
                    { createBy: userId },
                    { member: { $in: [userId] } }
                ]
            }



            // console.log(".......getMemberIds..................query.............", query);





            Service.UserService.getUsersGames(query, { member: 1 }, { lean: true }, function (err, result) {

                // console.log(".......getMemberIds..................getMemberIds.............", err, result);
                if (err) {
                    cb(err)
                } else {
                    if (result.length) {
                        memberIds = result[0].member;
                        cb(null)
                    } else {
                        memberIds = [];
                        cb(null)
                    }
                }
            })

        }],
        updateDelayTimeInUserChallenge: ['getDelayChallengeId', 'getMemberIds', function (cb) {
            if (delayTimer == true || findOff == true) {
                var query = {

                    $or: [
                        { member: { $in: [userId] } },
                        { member: { $in: memberIds } }
                    ],
                    gameId: gameIds,
                    gameStartTime: 0,
                    startTime: 0,
                    timerStart: false
                };

                var options = {
                    multi: true,
                    new: true
                };

                var setData = {
                    gameStartTime: +new Date(),
                    startTime: +new Date(),
                    timerStart: true
                };

                Service.UserService.updateTeam(query, setData, options, function (err, result) {

                    // console.log("..........errrrrrrrr..................", err, result);
                    if (err) {
                        cb(err)
                    } else {
                        cb(null)
                    }
                })
            } else {
                cb(null)
            }

        }],
        getGamesDetails: ['updateDelayTimeInUserChallenge', function (cb) {

            var query = {
                challenges: payloadData.challengesId
            };

            var projections = {
                paused: 1,
                timerStatus: 1,
                name: 1,
                _id: 1,
                timer: 1
            };

            var options = {
                lean: true
            };

            Service.AdminService.getGames(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    if (result && result.length) {
                        paused = result[0].paused;
                        gameTimerStatus = result[0].timerStatus;
                        gameName = result[0].name
                        gameId = result[0]._id;
                        gameTimer = result[0].timer

                        cb(null)
                    } else {
                        cb(null)
                    }
                }
            })
        }],
        getChallengesId: ['getGamesDetails', function (cb) {

            var query = {
                _id: payloadData.challengesId
            };

            var options = {
                lean: true
            };

            var projections = {
                timerStatus: 1,
                timer: 1
            }

            Service.AdminService.getChallenges(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    if (result && result.length) {
                        timerStatus = result[0].timerStatus;
                        timer = result[0].timer
                        cb(null)
                    } else {
                        cb(null)
                    }
                }
            })
        }],
        getUserChallengesId: ['checkToken', 'getChallengesId', 'getMemberIds', function (cb) {

            var query = {
                $or: [
                    { userId: { $in: [userId] } },
                    { userId: { $in: memberIds } }
                ],
                challengeId: payloadData.challengesId
            };

            var options = {
                lean: true
            };

            var projections = {
                gameStartTime: 1
            };

            Service.UserchallengesServices.findUsersChalange(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    if (result && result.length) {

                        findChallenges = true;
                        var currentTime = +new Date();
                        var leftTime = currentTime - result[0].gameStartTime;
                        timer = timer - leftTime
                        cb(null)

                    } else {
                        findChallenges = false;
                        cb(null)

                    }
                }
            })
        }],
        updateChallenges: ['getUserChallengesId', 'getGamesDetails', function (cb) {
            if (findChallenges == false) {
                var query = {
                    challengeId: payloadData.challengesId,
                    userId: userId,
                    gameStartTime: +new Date(),
                    paused: paused,
                    gameTimerStatus: gameTimerStatus,
                    gameName: gameName,
                    gameId: gameId
                }

                Service.UserchallengesServices.createUsersChalange(query, function (err, result) {
                    if (err) {
                        cb(err)
                    } else {
                        cb(null)
                    }
                })
            } else {
                cb(null)
            }
        }],
        isTimerAdd: ['updateChallenges', function (cb) {
            challengeStatus1(payloadData.challengesId, userId, memberIds, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    isTimer = result;
                    cb(null)
                }
            })
        }],
        findGameTime: ['isTimerAdd', function (cb) {

            let query = {
                $or: [
                    { member: { $in: [userId] } },
                    { member: { $in: memberIds } }
                ],
                gameId: gameIds,
            };

            let options = {
                lean: true
            };

            let projections = {
                takeTime: 1,
                pause: 1,
                startTime: 1
            }

            Service.UserService.getUsersGames(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {

                    if (result[0].pause == true) {
                        gameLeftTime = result[0].takeTime;
                        gameLeftTime = gameLeftTime - gameTimer;
                        cb(null)
                    } else {
                        gameLeftTime = (+new Date()) - result[0].startTime;
                        gameLeftTime = gameLeftTime + result[0].takeTime;
                        gameLeftTime = gameTimer - gameLeftTime;
                        cb(null)
                    }

                    if (result[0].timerStart == false) {
                        gameLeftTime = 0
                        cb(null)
                    }
                }
            })
        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        } else {

            if (timer < 0) {
                timer = 0
            }

            // console.log(".........gameLeftTime-----------------------------------------------......", gameLeftTime);

            callback(null, { data: timer, isTimer: isTimer, timer: gameLeftTime })
        }
    })
}

const listCategory = function (payloadData, callback) {

    let data;
    async.auto({
        listCategory: function (cb) {

            var query = {
                level: parseInt(payloadData.level),
                isDeleted: false
            };

            if (2 == parseInt(payloadData.level) && payloadData.id) {
                query.levelOne = payloadData.id
            }

            if (3 == parseInt(payloadData.level) && payloadData.id) {
                query.levelTwo = payloadData.id
            }

            var options = {
                lean: true
            };

            var projections = {};

            Service.AdminService.getCategories(query, projections, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    data = result;
                    cb(null)
                }
            })
        }
    }, function (err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, data)
        }
    })
}

const endGame = function (payloadData, callback) {
    let userId;
    let taketime = 0;
    let startTime = 0;
    let currentTime = +new Date();
    let id = null;
    async.auto({
        checkToken: function (cb) {
            checkToken(payloadData.accessToken, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    userId = result[0]._id;
                    cb(null)
                }
            })
        },
        endGame: ['checkToken', function (cb) {

            var query = {
                gameId: payloadData.gameId,
                member: { $in: [userId] },
                gameEndTime: 0
            };

            var options = {
                new: true
            };

            var setData = {
                gameEndTime: +new Date()
            };

            Service.UserService.updateTeam(query, setData, options, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    if (result) {
                        id = result._id;
                        taketime = result.takeTime;
                        startTime = result.startTime;
                        var diffTime = parseInt(currentTime) - parseInt(startTime)
                        taketime = diffTime + taketime;
                        cb(null)
                    } else {
                        cb(null)
                    }
                }
            })
        }],
        updateTime: ['endGame', function (cb) {

            if (id != null) {
                let query = {
                    _id: id
                }

                // console.log("...................query........end Game........", query);

                let options = { lean: true }

                let setData = {
                    takeTime: taketime,
                    completeGame: true
                }

                Service.UserService.updateTeam(query, setData, options, function (err, result) {
                    if (err) {
                        cb(err)
                    } else {
                        cb(null)
                    }
                })
            } else {
                cb(null)
            }

        }]
    }, function (err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null)
        }
    })
}


const tokenUpdate = function (payloadData, callback) {

    let query = { _id: payloadData.id }

    let options = { lean: true }

    let setData = {
        deviceToken: payloadData.token
    }

    Service.UserService.updatePlayer(query, setData, options, function (err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null)
        }
    })
}



module.exports = {
    userLogin: userLogin,
    SignUpOne: SignUpOne,
    SignUpTwo: SignUpTwo,
    facebookLogin: facebookLogin,
    searchGame: searchGame,
    gameDescrption: gameDescrption,
    joinGame: joinGame,
    completeChallenges: completeChallenges,
    challengeHint: challengeHint,
    gameFeed: gameFeed,
    leaderBoard: leaderBoard,
    userProfile: userProfile,
    myGames: myGames,
    twitterLogin: twitterLogin,
    gameList: gameList,
    searchTextAutoComplete: searchTextAutoComplete,
    userLIsting: userLIsting,
    reported: reported,
    liveStreamFeed: liveStreamFeed,
    userAutoComplete: userAutoComplete,
    editProfile: editProfile,
    teamUsersListing: teamUsersListing,
    changePassword: changePassword,
    feedDelete: feedDelete,
    forgotPassword: forgotPassword,
    UserPointsListing: UserPointsListing,
    makeAttempts: makeAttempts,
    getTotalAteemptsOnChallenge: getTotalAteemptsOnChallenge,
    checkDependedchallengePlayed: checkDependedchallengePlayed,
    renderGameListforPericularRegion: renderGameListforPericularRegion,
    findCityName: findCityName,
    findAllStateName: findAllStateName,
    findCounty: findCounty,
    pausedGame: pausedGame,
    usersChallenges: usersChallenges,
    listCategory: listCategory,
    endGame: endGame,
    tokenUpdate: tokenUpdate
};