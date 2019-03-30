"use strict";

var Service = require("../Services");
var UniversalFunctions = require("../Utils/UniversalFunctions");
var async = require("async");
var UploadManager = require("../Lib/UploadManager");
var TokenManager = require("../Lib/TokenManager");
var NotificationManager = require("../Lib/NotificationManager");
var Config = require("../Config");
var baseFolder = Config.awsS3Config.s3BucketCredentials.folder + "/";
var baseURL = Config.awsS3Config.s3BucketCredentials.s3URL + "/" + baseFolder;
var Models = require("../Models");
var md5 = require("md5");
var _ = require("lodash");
var moment = require("moment");

var ObjectID = require("mongodb").ObjectID;

const AnswerData = require("../Models/depends");

var mongoXlsx = require("mongo-xlsx");

function adminLogin(payloadData, callback) {
    var id;
    var admin = [];
    var accessToken = 0;
    async.auto({
            checkAdmin: function(cb) {
                checkAdmin(payloadData.email, payloadData.password, function(
                    err,
                    result
                ) {
                    if (err) {
                        // console.log("*****err*****", err);
                        cb(err);
                    } else {
                        // console.log("****result****", result);
                        if (
                            result.length &&
                            !result[0].isSuperAdmin &&
                            result[0].isBlocked
                        ) {
                            // console.log(result[0].isSuperAdmin, "is super admin");

                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .SUSPENDED_ACOUNT
                            );
                        } else if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .INVALID_USER_PASS
                            );
                        }
                    }
                });
            },

            updateAccessToken: [
                "checkAdmin",
                function(cb) {
                    var tokenData = {
                        id: admin[0]._id,
                        type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN
                    };

                    TokenManager.setToken(tokenData, function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            admin[0].accessToken = result.accessToken;
                            accessToken = result.accessToken;
                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, admin);
            }
        }
    );
}

function createGame(payloadData, callback) {
    // // console.log("......create game ***************...............", payloadData);
    var id;
    var admin = [];
    var dataToSave = {};
    var longitude = parseFloat(payloadData.longitude);
    var latitude = parseFloat(payloadData.latitude);
    var challenge = payloadData.challenges;
    var original;
    var thumbnail;

    console.log("payloadData.challenges = " + payloadData.challenges.length);
    delete payloadData.challenges;
    if (!payloadData.timer) {
        payloadData.timer = 0;
    }

    // console.log("Backend AdminCtrl CreateGame : " + payloadData);

    // console.log(payloadData, "payload adta");
    
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            addGame: [
                "checkToken",
                function(cb) {
                    if (payloadData._id) {
                        let query = { _id: payloadData._id };
                        let options = { lean: true };
                        // // console.log();
                        dataToSave = payloadData;

                        dataToSave.timer = dataToSave.timer * 1000;

                        Service.AdminService.updateGame(
                            query,
                            dataToSave,
                            options,
                            function(err, result) {
                                if (err) {
                                    cb(err);
                                } else {
                                    id = payloadData._id;
                                    cb(null);
                                }
                            }
                        );
                    } else {
                        dataToSave = payloadData;
                        dataToSave.timer = dataToSave.timer * 1000;
                        dataToSave.location = [longitude, latitude];
                        Service.AdminService.createGame(dataToSave, function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                id = result._id;
                                cb(null);
                            }
                        });
                    }
                }
            ],
            addChallenges: [
                "addGame",
                function(cb) {
                    if (challenge.length) {
                        async.eachSeries(
                            challenge,
                            function(file, cb2) {
                                addChallenge(file, id, function(err, result) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        cb2(null);
                                    }
                                });
                            },
                            function(err) {
                                if (err) {
                                    cb(err);
                                } else {
                                    cb(null);
                                }
                            }
                        );
                    } else {
                        cb(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                            .INSERT_CHALLENGES
                        );
                    }
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, {});
            }
        }
    );
}

function uploadImages(payloadData, callback) {
    let thumbnail;
    let original;
    if (payloadData.image && payloadData.image.filename) {
        var randomData = Math.floor(Math.random() * 90000) + 10000000;

        UploadManager.uploadFileToS3WithThumbnail(
            payloadData.image,
            randomData,
            function(err, uploadedInfo) {
                if (err) {
                    callback(err);
                } else {
                    original = baseURL + uploadedInfo.original;
                    thumbnail = baseURL + uploadedInfo.thumbnail;
                    callback(null, { original: original, thumbnail: thumbnail });
                }
            }
        );
    } else {
        callback(
            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.APP_ERROR
        );
    }
}

function editGame(payloadData, callback) {
    var id;
    var admin = [];
    var dataToSave = {};
    var challenge = payloadData.challenges;
    var original;
    var thumbnail;
    var data;

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            uplaodGameImage: [
                "checkToken",
                function(cb) {
                    if (payloadData.gameImage && payloadData.gameImage.filename) {
                        var randomData = Math.floor(Math.random() * 90000) + 10000000;
                        UploadManager.uploadFileToS3WithThumbnail(
                            payloadData.gameImage,
                            randomData,
                            function(err, uploadedInfo) {
                                if (err) {
                                    cb(err);
                                } else {
                                    original = baseURL + uploadedInfo.original;
                                    thumbnail = baseURL + uploadedInfo.thumbnail;
                                    cb(null);
                                }
                            }
                        );
                    } else {
                        cb(null);
                    }
                }
            ],
            addGameImage: [
                "uplaodGameImage",
                function(cb) {
                    var criteria = {
                        _id: payloadData.gameId
                    };
                    var updatedData = {};
                    if (payloadData.gameImage && payloadData.gameImage.filename) {
                        updatedData = {
                            "gameImage.original": original,
                            "gameImage.thumbnail": thumbnail
                        };
                    }
                    if (payloadData.name) {
                        updatedData.name = payloadData.name;
                    }

                    if (payloadData.details) {
                        updatedData.details = payloadData.details;
                    }
                    if (payloadData.startDate) {
                        updatedData.startDate = payloadData.startDate;
                    }
                    if (payloadData.endDate) {
                        updatedData.endDate = payloadData.endDate;
                    }
                    if (payloadData.password) {
                        updatedData.password = payloadData.password;
                    }
                    if (payloadData.is_protected) {
                        updatedData.is_protected = payloadData.is_protected;
                    }
                    if (payloadData.latitude) {
                        updatedData.latitude = payloadData.latitude;
                    }
                    if (payloadData.longitude) {
                        updatedData.longitude = payloadData.longitude;
                    }
                    if (payloadData.gameLocation) {
                        updatedData.gameLocation = payloadData.gameLocation;
                    }
                    Service.AdminService.updateGame(
                        criteria,
                        updatedData, { new: true },
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ],

            addChallenges: [
                "addGameImage",
                function(cb) {
                    if (payloadData.challenges) {
                        if (challenge.length) {
                            async.eachSeries(
                                challenge,
                                function(file, cb1) {
                                    addChallenge(file, payloadData.gameId, function(err, result) {
                                        if (err) {
                                            cb1(err);
                                        } else {
                                            cb1(null);
                                        }
                                    });
                                },
                                function(err) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        cb(null);
                                    }
                                }
                            );
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .INSERT_CHALLENGES
                            );
                        }
                    } else {
                        cb(null);
                    }
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        }
    );
}

function removePlayer(payloadData, callback) {
    var id;
    var admin = [];
    var dataToSave = {};
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            removePlayer: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        _id: payloadData.userId
                    };
                    var dataToUpdate = {
                        is_delete: true
                    };
                    Service.UserService.updatePlayer(
                        criteria,
                        dataToUpdate, { new: true },
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ],
            updateFeed: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        userId: payloadData.userId
                    };
                    var dataToUpdate = {
                        is_delete: true
                    };
                    var option = {
                        multi: true
                    };
                    Service.UserService.updateMultipleFeeds(
                        criteria,
                        dataToUpdate,
                        option,
                        function(err, result) {
                            if (err) {
                                // console.log("..e..r..r...", err);
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ],
            updateUserGame: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        member: { $in: [payloadData.userId] }
                    };
                    var dataToUpdate = {
                        is_delete: true
                    };
                    Service.UserService.updateTeam1(
                        criteria,
                        dataToUpdate, { multi: true },
                        function(err, result) {
                            if (err) {
                                // console.log("...e.e.e..e.", err);
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, {});
            }
        }
    );
}

function removeGame(payloadData, callback) {
    var id;
    var admin = [];
    var dataToSave = {};
    var type = "delete";
    if (payloadData.type) {
        type = payloadData.type;
    }
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            removeGame: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        _id: payloadData.gameId
                    };
                    if (type == "delete") {
                        var dataToUpdate = {
                            is_deleted: true
                        };
                    } else {
                        if (payloadData.status == "true") {
                            var dataToUpdate = {
                                is_featured: true
                            };
                        } else {
                            var dataToUpdate = {
                                is_featured: false
                            };
                        }
                    }
                    Service.AdminService.updateGame(criteria, dataToUpdate, {}, function(
                        err,
                        result
                    ) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, {});
            }
        }
    );
}

function teamListing(payloadData, callback) {
    var id;
    var admin = [];
    var data = [];
    var dataToSave = {};
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        // console.log("*****err*****", err);
                        cb(err);
                    } else {
                        // console.log("****result****", result);
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            teamListing: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        gameId: payloadData.gameId,
                        // challengeId: payloadData.challengeId,
                        // challengeId: { $in: [payloadData.challengeId] },
                        is_delete: false
                    };
                    // console.log(criteria.gameId);
                    var projection = {};
                    var populateArray = [{
                            path: "gameId",
                            match: {},
                            select: "name",
                            options: {}
                        },
                        {
                            path: "challengeId",
                            match: {},
                            select: "name",
                            options: {}
                        },
                        {
                            path: "member",
                            match: {},
                            select: "name",
                            options: {}
                        }
                    ];
                    Service.UserService.getUsersGamesDescriptions(
                        criteria,
                        projection, {},
                        populateArray,
                        function(err, result) {
                            if (err) {
                                // console.log("..e..r..r...", err);
                                cb(err);
                            } else {
                                data = result;
                                // console.log("result.************", result);
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function checkAdmin(email, password, callback) {
    var criteria = {
        email: email,
        isDeleted: false,
        password: md5(password)
    };
    Service.AdminService.getAdmin(criteria, {}, {}, function(err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

function checkToken(accessToken, callback) {
    var criteria = {
        accessToken: accessToken
    };
    Service.AdminService.getAdmin(criteria, {}, {}, function(err, result) {
        // // console.log("________sdaas", err, result);
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

function addChallenge(challenge, id, callback) {
    var id1;

    var dataToUpdate = {
        gameId: id,
        name: challenge.name,
        details: challenge.details,
        points: challenge.points,
        $inc: { challengeOrder: 1 },
        challengeType: challenge.challengeType,
        location: challenge.location,
        longitute: challenge.longitute,
        latitute: challenge.latitute,
        qrCode: challenge.qrCode,
        distanceDiff: challenge.distanceDiff,
        challengeImage: {
            original: challenge.original,
            thumbnail: challenge.thumbnail
        },
        descriptionImage: {
            descOriginal: challenge.descOriginal,
            descThumbnail: challenge.descThumbnail
        },
        possibleAttemp: challenge.possibleAttemp,
        onOff: challenge.onOff,
        toughonOff: challenge.toughonOff,
        hardonOff: challenge.hardonOff,
        timerStatus: challenge.timerStatus
    };

    if (challenge.isKeyword) {
        dataToUpdate.isKeyword = challenge.isKeyword;
    } else {
        dataToUpdate.isKeyword = false;
    }

    if (challenge.timer) {
        dataToUpdate.timer = challenge.timer * 1000;
    }

    if (Object.keys(challenge.customDialog).length) {
        dataToUpdate["customDialog.title"] = challenge.customDialog.title;
        dataToUpdate["customDialog.description"] =
            challenge.customDialog.description;
    }

    if (challenge.isShown == false) {
        dataToUpdate.isShown = challenge.isShown;
    } else {
        dataToUpdate.isShown = true;
    }
    async.auto({
            unsetValue: function(cb) {
                if (challenge._id) {
                    var criteria = {
                        _id: challenge._id
                    };
                    var updatedData = {
                        $unset: {
                            hints: "",
                            keywords: "",
                            textAnswer: ""
                        }
                    };
                    Service.UserService.updateChallenges(
                        criteria,
                        updatedData, { new: true },
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                } else {
                    cb(null);
                }
            },
            getTotalChallange: [
                "unsetValue",
                function(cb) {
                    if (!challenge._id) {
                        Service.AdminService.countTotalChallange(function(err, result) {
                            if (err) {
                                // console.log("dddddddddd", err);
                                cb(err);
                            } else {
                                dataToUpdate.orderId = result;
                                cb(null);
                            }
                        });
                    } else {
                        cb(null);
                    }
                }
            ],
            addChallenge: [
                "getTotalChallange",
                "unsetValue",
                function(cb) {
                    if (!challenge._id) {
                        Service.AdminService.createChallenges(dataToUpdate, function(
                            err,
                            result
                        ) {
                            if (err) {
                                // console.log("dddddddddd", err);
                                cb(err);
                            } else {
                                id1 = result._id;
                                cb(null);
                            }
                        });
                    } else {
                        let query = {
                            _id: challenge._id
                        };

                        let options = { lean: true };

                        Service.AdminService.updateChallenges(
                            query,
                            dataToUpdate,
                            options,
                            function(err, result) {
                                if (err) {
                                    cb(err);
                                } else {
                                    id1 = challenge._id;
                                    cb(null);
                                }
                            }
                        );
                    }
                }
            ],
            updateGame: [
                "addChallenge",
                "unsetValue",
                function(cb) {
                    if (!challenge._id) {
                        var criteria = {
                            _id: id
                        };
                        var updatedData = {
                            $push: {
                                challenges: id1
                            }
                        };
                        Service.UserService.updateGames(
                            criteria,
                            updatedData, { new: true },
                            function(err, result) {
                                if (err) {
                                    cb(err);
                                } else {
                                    cb(null);
                                }
                            }
                        );
                    } else {
                        cb(null);
                    }
                }
            ],
            updateChallengeKeywords: [
                "addChallenge",
                "unsetValue",
                function(cb) {
                    if (challenge.keywords) {
                        var key = challenge.keywords;
                        for (var i = 0; i < key.length; i++) {
                            (function(i) {
                                var criteria = {
                                    _id: id1
                                };
                                var updatedData = {
                                    $push: {
                                        keywords: key[i]
                                    }
                                };
                                Service.UserService.updateChallenges(
                                    criteria,
                                    updatedData, { new: true },
                                    function(err, result) {
                                        if (err) {
                                            cb(err);
                                        } else {
                                            if (i == key.length - 1) {
                                                cb(null);
                                            }
                                        }
                                    }
                                );
                            })(i);
                        }
                    } else {
                        if (challenge.isKeyword == "true") {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .YOU_PASSED_AN_EMPTY_ARRAY
                            );
                        } else {
                            cb(null);
                        }
                    }
                }
            ],
            updateChallengetext: [
                "addChallenge",
                "unsetValue",
                function(cb) {
                    if (challenge.textAnswer) {
                        var textAnswer = challenge.textAnswer;
                        for (var i = 0; i < textAnswer.length; i++) {
                            (function(i) {
                                var criteria = {
                                    _id: id1
                                };
                                var updatedData = {
                                    $push: {
                                        textAnswer: textAnswer[i]
                                    }
                                };
                                Service.UserService.updateChallenges(
                                    criteria,
                                    updatedData, { new: true },
                                    function(err, result) {
                                        if (err) {
                                            cb(err);
                                        } else {
                                            if (i == textAnswer.length - 1) {
                                                cb(null);
                                            }
                                        }
                                    }
                                );
                            })(i);
                        }
                    } else {
                        cb(null);
                    }
                }
            ],
            updatehints: [
                "addChallenge",
                "unsetValue",
                function(cb) {
                    if (challenge.hints) {
                        var hints = challenge.hints;
                        async.eachSeries(
                            hints,
                            function(file, cb2) {
                                var criteria = {
                                    _id: id1
                                };
                                var updatedData = {
                                    $push: {
                                        hints: {
                                            name: file.name,
                                            hintType: file.type,
                                            points: file.point
                                        }
                                    }
                                };
                                Service.UserService.updateChallenges(
                                    criteria,
                                    updatedData, { new: true },
                                    function(err, result) {
                                        if (err) {
                                            cb2(err);
                                        } else {
                                            cb2(null);
                                        }
                                    }
                                );
                            },
                            function(err) {
                                if (err) {
                                    cb(err);
                                } else {
                                    // console.log("sdasadsadhints");
                                    cb(null);
                                }
                            }
                        );
                    } else {
                        cb(null);
                    }
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

function editChallenge(payloadData, callback) {
    var admin = [];
    var id;
    var data;
    // console.log("payload******************", payloadData);
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            saveChallenge: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        _id: payloadData.challengeId
                    };
                    var option = {
                        new: true
                    };

                    var dataToSave = {};
                    if (payloadData.name) {
                        dataToSave.name = payloadData.name;
                    }
                    if (payloadData.details) {
                        dataToSave.details = payloadData.details;
                    }
                    if (payloadData.qrCode) {
                        dataToSave.qrCode = payloadData.qrCode;
                    }
                    if (payloadData.hint) {
                        dataToSave.hint = [];
                    }
                    if (payloadData.original) {
                        dataToSave["challengeImage.original"] = payloadData.original;
                    }

                    if (payloadData.thumbnail) {
                        dataToSave["challengeImage.thumbnail"] = payloadData.thumbnail;
                    }

                    if (payloadData.title) {
                        dataToSave["customDialog.title"] = payloadData.title;
                    }
                    if (payloadData.description) {
                        dataToSave["customDialog.description"] = payloadData.description;
                    }
                    if (payloadData.points) {
                        dataToSave.points = payloadData.points;
                    }

                    if (payloadData.challengeType) {
                        dataToSave.challengeType = payloadData.challengeType;
                    }

                    if (payloadData.isKeyword == false) {
                        dataToSave.isKeyword = payloadData.isKeyword;
                    }

                    if (payloadData.isKeyword == true) {
                        dataToSave.isKeyword = payloadData.isKeyword;
                    }

                    if (payloadData.onOff == true || payloadData.onOff == false) {
                        dataToSave.onOff = payloadData.onOff;
                    }

                    if (
                        payloadData.toughonOff == true ||
                        payloadData.toughonOff == false
                    ) {
                        dataToSave.toughonOff = payloadData.toughonOff;
                    }

                    if (payloadData.hardonOff == true || payloadData.hardonOff == false) {
                        dataToSave.hardonOff = payloadData.hardonOff;
                    }

                    if (payloadData.isShown == true) {
                        dataToSave.isShown = payloadData.isShown;
                    }

                    if (payloadData.isShown == false) {
                        dataToSave.isShown = payloadData.isShown;
                    }

                    Service.UserService.updateChallenges(
                        criteria,
                        dataToSave,
                        option,
                        function(err, result) {
                            if (err) {
                                // console.log("error is", err);
                                cb(err);
                            } else {
                                data = result;
                                id = result._id;
                                cb(null);
                            }
                        }
                    );
                }
            ],
            updateChallengeKeywords: [
                "saveChallenge",
                function(cb) {
                    if (payloadData.keywords && payloadData.keywords.length > 0) {
                        var key = payloadData.keywords;
                        for (var i = 0; i < key.length; i++) {
                            (function(i) {
                                var criteria = {
                                    _id: payloadData.challengeId
                                };
                                var updatedData = {
                                    $push: {
                                        keywords: key[i]
                                    }
                                };
                                Service.UserService.updateChallenges(
                                    criteria,
                                    updatedData, { new: true },
                                    function(err, result) {
                                        if (err) {
                                            // console.log("dddddgggggggggeeeddddd", err);
                                            cb(err);
                                        } else {
                                            if (i == key.length - 1) {
                                                cb(null);
                                            }
                                        }
                                    }
                                );
                            })(i);
                        }
                    } else {
                        // console.log("****", payloadData.isKeyword);
                        if (payloadData.isKeyword == "true") {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .YOU_PASSED_AN_EMPTY_ARRAY
                            );
                        } else {
                            cb(null);
                        }
                    }
                }
            ],
            updateChallengetext: [
                "updateChallengeKeywords",
                function(cb) {
                    // console.log(
                    //     "*****challenge.textAnswer***********",
                    //     payloadData.textAnswer,
                    //     typeof payloadData.textAnswer
                    // );
                    if (payloadData.textAnswer && payloadData.textAnswer.length > 0) {
                        var textAnswer = payloadData.textAnswer;
                        for (var i = 0; i < textAnswer.length; i++) {
                            (function(i) {
                                var criteria = {
                                    _id: payloadData.challengeId
                                };
                                var updatedData = {
                                    $push: {
                                        textAnswer: textAnswer[i]
                                    }
                                };
                                Service.UserService.updateChallenges(
                                    criteria,
                                    updatedData, { new: true },
                                    function(err, result) {
                                        if (err) {
                                            cb(err);
                                        } else {
                                            if (i == textAnswer.length - 1) {
                                                cb(null);
                                            }
                                        }
                                    }
                                );
                            })(i);
                        }
                    } else {
                        cb(null);
                    }
                }
            ],
            updatehints: [
                "updateChallengetext",
                function(cb) {
                    if (payloadData.hint) {
                        var hints = JSON.parse(payloadData.hint);
                        async.eachSeries(
                            hints,
                            function(file, cb2) {
                                var criteria = {
                                    _id: payloadData.challengeId
                                };
                                var updatedData = {
                                    $push: {
                                        hints: {
                                            name: file.name,
                                            hintType: file.hintType,
                                            points: file.points
                                        }
                                    }
                                };
                                Service.UserService.updateChallenges(
                                    criteria,
                                    updatedData, { new: true },
                                    function(err, result) {
                                        if (err) {
                                            cb2(err);
                                        } else {
                                            // console.log(
                                            //     result,
                                            //     "========================update hints========================="
                                            // );
                                            // cb2(null);
                                        }
                                    }
                                );
                            },
                            function(err) {
                                if (err) {
                                    cb(err);
                                } else {
                                    cb(null);
                                }
                            }
                        );
                    } else {
                        cb(null);
                    }
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function gameListing(payloadData, callback) {
    var id;
    var admin = [];
    var data = {};
    var dataToSave = {};

    // // console.log(".......gameListing...........", payloadData);

    if (payloadData.searchText) {
        var value = payloadData.searchText;
        value = value.toString();
    }

    var limit = parseInt(payloadData.limit);
    var skip = parseInt(payloadData.skip);

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            gameListing: [
                "checkToken",
                function(cb) {
                    if (payloadData.searchText) {
                        var criteria = {
                            name: { $regex: value, $options: "i" },
                            is_deleted: false,
                            endDate: { $gte: new Date() }
                        };
                        var projection = {
                            is_deleted: 0
                        };
                        var populateArray = [{
                            path: "challenges",
                            match: { is_deleted: false },
                            select: "",
                            options: { sort: { orderId: 1 } }
                        }];
                        var options = {
                            limit: limit,
                            skip: skip
                        };
                    } else {
                        var criteria = {
                            is_deleted: false,
                            endDate: { $gte: new Date() }
                        };

                        var projection = {
                            is_deleted: 0
                        };

                        var populateArray = [{
                            path: "challenges",
                            match: { is_deleted: false },
                            select: "",
                            options: { sort: { orderId: 1 } }
                        }];

                        var options = {
                            limit: limit,
                            skip: skip
                        };
                    }

                    Service.UserService.gameDetails(
                        criteria,
                        projection,
                        options,
                        populateArray,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                // console.log(result);
                                data.list = result;
                                cb(null);
                            }
                        }
                    );
                }
            ],
            totalCount: [
                "checkToken",
                function(cb) {
                    if (payloadData.searchText) {
                        var criteria = {
                            name: { $regex: value, $options: "i" },
                            is_deleted: false,
                            endDate: { $gte: new Date() }
                        };
                    } else {
                        var criteria = {
                            is_deleted: false,
                            endDate: { $gte: new Date() }
                        };
                    }

                    Models.Games.count(criteria, function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            data.totalCount = result;
                            cb(null, result);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function playerListing(payloadData, callback) {
    var id;
    var admin = [];
    var data = {};
    var limit = parseInt(payloadData.limit);
    var skip = parseInt(payloadData.skip);
    var dataToSave = {};
    if (payloadData.searchText) {
        var value = payloadData.searchText;
        value = value.toString();
    }
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        // console.log("*****err*****", err);
                        cb(err);
                    } else {
                        // // console.log("============result data=============", result);

                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            playersListing: [
                "checkToken",
                function(cb) {
                    if (payloadData.searchText) {
                        var criteria = {
                            $or: [
                                { name: { $regex: value, $options: "i" } },
                                { email: { $regex: value, $options: "i" } }
                            ],
                            is_delete: false
                        };
                    } else {
                        var criteria = {
                            is_delete: false
                        };
                    }
                    var projection = {};
                    var options = {
                        limit: limit,
                        skip: skip
                    };
                    Service.UserService.getUser(criteria, projection, options, function(
                        err,
                        result
                    ) {
                        if (err) {
                            // console.log("..e..r..r...", err);
                            cb(err);
                        } else {
                            data.list = result;
                            cb(null);
                        }
                    });
                }
            ],
            totalCount: [
                "checkToken",
                function(cb) {
                    if (payloadData.searchText) {
                        var criteria = {
                            $or: [
                                { name: { $regex: value, $options: "i" } },
                                { email: { $regex: value, $options: "i" } }
                            ],
                            is_delete: false
                        };
                    } else {
                        var criteria = {
                            is_delete: false
                        };
                    }
                    Models.User.count(criteria, function(err, result) {
                        if (err) {
                            // console.log("**********", err);
                            cb(err);
                        } else {
                            //  data.push({"totalCount":result});
                            data.totalCount = result;
                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function feeds(payloadData, callback) {
    var userId = 0;
    var data = [];
    var data1 = [];
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        // console.log("....err...", err);
                        cb(err);
                    } else {
                        userId = result[0]._id;
                        cb(null);
                    }
                });
            },
            fetchFeed: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        is_delete: false
                            //is_media: true
                    };
                    var projections = {};
                    var options = {
                        sort: {
                            // is_featured:1,
                            createdAt: -1
                        }
                    };
                    var populateArray = [{
                            path: "challengeId",
                            match: {},
                            select: "name points",
                            options: {}
                        },
                        {
                            path: "gameId",
                            match: {},
                            select: "name",
                            options: {}
                        },
                        {
                            path: "completedBy",
                            match: {},
                            select: "name teamImage",
                            options: {}
                        }
                    ];
                    Service.UserService.getFeedDescription(
                        criteria,
                        projections,
                        options,
                        populateArray,
                        function(err, result) {
                            if (err) {
                                // console.log(".d.d..d....d...", err);
                                cb(err);
                            } else {
                                data = result;
                                // console.log("fdfdssssss", data);
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function setFeatured(payloadData, callback) {
    var id;
    var admin = [];
    var dataToSave = {};
    var type = "true";
    if (payloadData.type) {
        type = payloadData.type;
    }
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        // console.log("*****err*****", err);
                        cb(err);
                    } else {
                        // console.log("****result****", result);
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            changeToFeatured: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        _id: payloadData.feedId
                    };
                    if (payloadData.status == "delete") {
                        var dataToUpdate = {
                            is_delete: true
                        };
                        Service.UserService.updateFeeds(
                            criteria,
                            dataToUpdate, {},
                            function(err, result) {
                                //// console.log("...err.....", err, result);
                                if (err) {
                                    // console.log("**************feed**************", err);
                                    cb(err);
                                } else {
                                    cb(null);
                                }
                            }
                        );
                    } else {
                        if (type == "true") {
                            var dataToUpdate = {
                                is_featured: true
                            };
                        } else {
                            var dataToUpdate = {
                                is_featured: false
                            };
                        }
                        Service.UserService.updateFeeds(
                            criteria,
                            dataToUpdate, {},
                            function(err, result) {
                                //// console.log("...err.....", err, result);
                                if (err) {
                                    // console.log("**************feed**************", err);
                                    cb(err);
                                } else {
                                    cb(null);
                                }
                            }
                        );
                    }
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, {});
            }
        }
    );
}

function blockOrUnblock(payloadData, callback) {
    var id;
    var admin = [];
    var dataToSave = {};
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        // console.log("*****err*****", err);
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            removePlayer: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        _id: payloadData.userId
                    };
                    if (payloadData.status == "Block") {
                        var dataToUpdate = {
                            is_block: true
                        };
                    } else {
                        var dataToUpdate = {
                            is_block: false
                        };
                    }

                    Service.UserService.updatePlayer(
                        criteria,
                        dataToUpdate, { new: true },
                        function(err, result) {
                            if (err) {
                                // console.log("..e..r..r...", err);
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ],
            updateFeed: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        userId: payloadData.userId
                    };
                    var dataToUpdate = {
                        is_delete: true
                    };
                    var option = {
                        multi: true
                    };
                    Service.UserService.updateMultipleFeeds(
                        criteria,
                        dataToUpdate,
                        option,
                        function(err, result) {
                            if (err) {
                                // console.log("..e..r..r...", err);
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ],
            updateUserGame: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        member: { $in: [payloadData.userId] }
                    };
                    var dataToUpdate = {
                        is_delete: true
                    };
                    Service.UserService.updateTeam1(
                        criteria,
                        dataToUpdate, { multi: true },
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, {});
            }
        }
    );
}

function changePassword(payloadData, callback) {
    var adminId;
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            if (payloadData.oldPassword) {
                                if (result[0].password === md5(payloadData.oldPassword)) {
                                    if (payloadData.newPassword) {
                                        adminId = result[0]._id;
                                        cb(null);
                                    } else {
                                        callback(
                                            Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_NEW_PASSWORD
                                        );
                                    }
                                } else {
                                    callback(
                                        Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_PASSWORD
                                    );
                                }
                            } else {
                                callback(
                                    Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_OLD_PASSWORD
                                );
                            }
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            changePassword: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        _id: adminId
                    };
                    var dataToUpdate = {
                        password: md5(payloadData.newPassword)
                    };

                    Service.AdminService.updateAdmin(
                        criteria,
                        dataToUpdate, { new: true },
                        function(err, result) {
                            if (err) {
                                // console.log("..e..r..r...", err);
                                cb(err);
                            } else {
                                // console.log("result.************", result);
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

const resetPassword = function(payloadData, callback) {
    var data = {};
    async.auto({
            UpdatePassword: function(cb) {
                var criteria = {
                    passwordResetToken: payloadData.passwordResetToken
                };
                var projection = {
                    password: md5(payloadData.password)
                };
                var option = {
                    new: true
                };
                Service.UserService.updatePlayer(criteria, projection, option, function(
                    err,
                    result
                ) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .INVALID_PASSWORD_RESET_TOKEN
                            );
                        }
                    }
                });
            }
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
};

const addSubAdmin = function(payloadData, callback) {
    // console.log("========", payloadData);
    async.auto({
            checkSubAdmin: function(cb) {
                var obj = {};
                obj.name = payloadData.name;
                obj.email = payloadData.email;
                obj.superAdmin = false;
                Service.AdminService.getAdmin(obj, {}, {}, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result && result.length) {
                            callback(Config.APP_CONSTANTS.STATUS_MSG.ERROR.DUPLICATE_ADMIN);
                        } else {
                            cb(null);
                        }
                    }
                });
            },
            addPromo: [
                "checkSubAdmin",
                function(cb) {
                    var obj = {};
                    obj.name = payloadData.name;
                    obj.email = payloadData.email;
                    obj.password = md5(payloadData.password);
                    obj.superAdmin = false;
                    Service.AdminService.createAdmin(obj, function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
};

function subAdminListing(payloadData, callback) {
    var admin = [];
    var data = {};
    var limit = parseInt(payloadData.limit);
    var skip = parseInt(payloadData.skip);
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length && result[0].isSuperAdmin == true) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            gameListing: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        isSuperAdmin: false,
                        isDeleted: false
                    };

                    var projection = {};

                    var options = {
                        limit: limit,
                        skip: skip
                    };
                    Service.AdminService.getAdmin(criteria, projection, options, function(
                        err,
                        result
                    ) {
                        if (err) {
                            cb(err);
                        } else {
                            data.list = result;
                            cb(null);
                        }
                    });
                }
            ],
            totalCount: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        isSuperAdmin: false,
                        isDeleted: false
                    };

                    Models.Admins.count(criteria, function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            data.totalCount = result;
                            cb(null, result);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function editSubAdmin(payloadData, callback) {
    var admin = [];
    var id;
    var data;

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length && result[0].isSuperAdmin == true) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            saveSubAdmin: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        _id: payloadData.subAdminId,
                        isSuperAdmin: false
                    };
                    var option = {
                        new: true
                    };

                    var dataToSave = {};
                    if (payloadData.name) {
                        dataToSave.name = payloadData.name;
                    }
                    if (payloadData.email) {
                        dataToSave.email = payloadData.email;
                    }
                    if (payloadData.password) {
                        dataToSave.password = md5(payloadData.password);
                    }
                    if (payloadData.delete) {
                        dataToSave.isDeleted = payloadData.delete;
                        dataToSave.accessToken = null;
                    }

                    if (payloadData.block === true || payloadData.block === false) {
                        (dataToSave.isBlocked = payloadData.block),
                        (dataToSave.accessToken = null);
                    }

                    Service.AdminService.updateAdmin(
                        criteria,
                        dataToSave,
                        option,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                data = result;
                                id = result._id;
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                // console.log("result iss", result);
                callback(null, data);
            }
        }
    );
}

//////////////////////////rajendra's task//////////////////////////////////////////

function userGame(payloadData, callback) {
    let i = 0;
    var userId = 0;
    var data = [];
    let admin;
    let dataToSend = [];
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            userGames: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        $or: [
                            { member: { $in: [payloadData.userId] } },
                            { createBy: payloadData.userId }
                        ],
                        // member: payloadData.userId
                        is_delete: false
                    };
                    // console.log(payloadData.userId);

                    var projections = {};
                    var options = {};
                    var populateArray = [{
                            path: "gameId",
                            match: {},
                            select: "",
                            options: {}
                        },
                        {
                            path: "challengeId",
                            model: "Challenges",
                            match: { is_deleted: false },
                            select: "",
                            options: {}
                        }
                    ];

                    Service.UserService.getUsersGamesDescriptions(
                        criteria,
                        projections,
                        options,
                        populateArray,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                result.forEach(elem => {
                                    if (elem.gameId.endDate > new Date()) data.push(elem);
                                });
                                // console.log(data.length);
                                // data = result;
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function UsersTotalPoints(payloadData, callback) {
    let admin;
    let data;

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            updatepoints: [
                "checkToken",
                function(cb) {
                    let criteria = {
                        _id: payloadData.userId
                    };
                    let options = {
                        lean: true,
                        new: true
                    };

                    let dataToSet = {};

                    if (
                        payloadData.totalPoints != null ||
                        payloadData.totalPoints != ""
                    ) {
                        dataToSet["totalPoints"] = payloadData.totalPoints;
                    }

                    if (
                        payloadData.totalChallengeCompeleted != null ||
                        payloadData.totalChallengeCompeleted != ""
                    ) {
                        dataToSet["totalChallengeCompeleted"] =
                            payloadData.totalChallengeCompeleted;
                    }

                    if (
                        payloadData.totalGameStarted != null ||
                        payloadData.totalGameStarted != ""
                    ) {
                        dataToSet["totalGameStarted"] = payloadData.totalGameStarted;
                    }

                    let dataToUpdate = { $set: dataToSet };

                    Service.UserService.updatePlayer(
                        criteria,
                        dataToUpdate,
                        options,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                data = result;
                                // console.log(data, "users game data");
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function updateOrderValue(payloadData, callback) {
    let data;
    let admin;
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            findChallangeData: [
                "checkToken",
                function(cb) {
                    Service.UserService.findChalange(function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            data = result;
                            // console.log(result.length);
                            cb(null);
                        }
                    });
                }
            ],

            updateOrderStatus: [
                "findChallangeData",
                function(cb) {
                    let i = 0;
                    data.forEach(function(value) {
                        let criteria = {
                            _id: value._id
                        };
                        let options = {
                            lean: true,
                            new: true
                        };
                        let dataToSet = {
                            $set: { orderId: i++ }
                        };
                        Service.UserService.updateChallangeOrder(
                            criteria,
                            dataToSet,
                            options,
                            function(err, result) {
                                if (err) {
                                    // console.log(err);
                                } else {
                                    if (i === data.length) {
                                        // console.log("go back man");
                                        cb(null);
                                    }
                                }
                            }
                        );
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function swapOrderOfChallange(payloadData, callback) {
    let fromId;
    let toId;
    let data;

    // console.log("............ .......... payload data.......", payloadData);

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            updateChallenge: [
                "checkToken",
                function(cb) {
                    var data = payloadData.data;
                    var len = data.length;

                    for (var i = 0; i < len; i++) {
                        (function(i) {
                            updateChallengeOrderId(data[i], function(err, result) {
                                if (err) {
                                    cb(err);
                                } else {
                                    if (i == len - 1) {
                                        cb(null);
                                    }
                                }
                            });
                        })(i);
                    }
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                // console.log(data, "game data");
                callback(null, data);
            }
        }
    );
}

function updateChallengeOrderId(data, callback) {
    let id;

    // console.log(".......data.........", data);

    async.auto({
            updateValue1: function(cb) {
                var query = {
                    _id: data.id
                };

                var options = {
                    lean: true
                };

                var setData = {
                    challengeOrder: data.new,
                    orderId: data.new
                };

                // console.log(".......query...query...query...", query);

                // console.log(".......query...query...query...", query);

                Service.AdminService.updateChallengesUpdate(
                    query,
                    setData,
                    options,
                    function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null);
                        }
                    }
                );
            }
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

function MakeUserAsDeleted(payloadData, callback) {
    let data;

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            makeUserAsDeleted: [
                "checkToken",
                function(cb) {
                    let criteria = {
                        _id: payloadData.userId
                    };

                    let dataToSet = {
                        isDeleted: true
                    };

                    let options = {
                        lean: true,
                        new: true
                    };

                    Service.AdminService.updateAdmin(
                        criteria,
                        dataToSet,
                        options,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                // console.log(data, "game data");
                callback(null, data);
            }
        }
    );
}

function GenerateExportFile(payloadData, callback) {
    let data;
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            getDataOfUser: [
                "checkToken",
                function(cb) {
                    let criteria = {
                        is_delete: false
                    };

                    let projection = {
                        name: 1,
                        email: 1,
                        registrationDate: 1,
                        totalPoints: 1,
                        is_active: 1,
                        deviceType: 1,
                        location: 1,
                        totalChallengeCompeleted: 1,
                        totalGameStarted: 1
                    };

                    let options = {
                        lean: true
                    };

                    Service.UserService.getUser(criteria, projection, options, function(
                        err,
                        result
                    ) {
                        if (err) {
                            cb(err);
                        } else {
                            data = result;
                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                // console.log(data, "user data");
                callback(null, data);
            }
        }
    );
}

function exportGameCsv(payloadData, callback) {
    let data;
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            getGameData: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        is_deleted: false
                    };

                    var projection = {
                        name: 1,
                        details: 1,
                        minPlayer: 1,
                        maxPlayer: 1,
                        totalUserCompleted: 1,
                        isOrderLock: 1,
                        is_protected: 1,
                        startDate: 1,
                        endDate: 1,
                        is_active: 1
                    };

                    var options = {
                        lean: true
                    };

                    Service.UserService.getGame(criteria, projection, options, function(
                        err,
                        result
                    ) {
                        if (err) {
                            cb(err);
                        } else {
                            // console.log(result, "game data");

                            data = result;

                            // console.log(data, "game data");

                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                // console.log(data, "user data");
                callback(null, data);
            }
        }
    );
}

function uploadImageOnS3(payloadData, callback) {
    let data = {};

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            uploadImage: [
                "checkToken",
                function(cb) {
                    // console.log("Here");

                    if (
                        payloadData.challengeImage &&
                        payloadData.challengeImage.filename
                    ) {
                        var randomData = Math.floor(Math.random() * 90000) + 10000000;
                        UploadManager.uploadFileToS3WithThumbnail(
                            payloadData.challengeImage,
                            randomData,
                            function(err, uploadedInfo) {
                                if (err) {
                                    cb(err);
                                } else {
                                    data = {
                                        original: baseURL + uploadedInfo.original,
                                        thumbnail: baseURL + uploadedInfo.thumbnail
                                    };
                                    cb(null);
                                }
                            }
                        );
                    } else {
                        cb(null);
                    }
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                // console.log(data, "user data");
                callback(null, data);
            }
        }
    );
}

function deleteChallenge(payloadData, callback) {
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            deleteChallenge: [
                "checkToken",
                function(cb) {
                    let criteria = {
                        _id: payloadData.challengeId
                    };

                    let options = {
                        lean: true,
                        new: true
                    };

                    let dataToSent = {
                        is_deleted: true
                    };

                    let dataToUpdate = { $set: dataToSent };

                    Service.UserService.updateChallenges(
                        criteria,
                        dataToUpdate,
                        options,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

function makeChallengeAsDepended(payloadData, callback) {
    // console.log(payloadData, "payloadData");

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            makeDependency: [
                "checkToken",
                function(cb) {
                    let dataToSet = {
                        depended: payloadData.depended
                    };

                    let criteria = {
                        _id: payloadData.whichChallengeId
                    };

                    let option = {
                        lean: true,
                        new: true
                    };

                    Service.UserService.updateChallenges(
                        criteria,
                        dataToSet,
                        option,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

function findUserAnswerForPerticularChallenge(payloadData, callback) {
    let data;
    // console.log(payloadData, "payloadData");

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            makeDependency: [
                "checkToken",
                function(cb) {
                    let criteria = {
                        userId: payloadData.userId,
                        challengeId: payloadData.challengeId,
                        gameId: payloadData.gameId
                    };
                    let projection = {};
                    let option = {
                        lean: true
                    };

                    AnswerData.findOne(criteria, projection, option, function(
                        err,
                        result
                    ) {
                        
                        if (err) {
                            cb(err);
                        } else {
                            data = result;
                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function getInCompleteChallenges(payloadData, callback) {
    let data;
    let completed = [];
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            findCompletedChallengesBYUser: [
                "checkToken",
                function(cb) {
                    let criteria = {
                        gameId: payloadData.gameId,
                        userId: payloadData.userId
                            // member:{$in:[payloadData.userId]}
                    };

                    let projection = { challengeId: 1 };

                    let option = {
                        lean: true
                    };

                    Service.UserService.CompleteChalengeUserStatus(
                        criteria,
                        projection,
                        option,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                if (result && result.length) {
                                    for (let i = 0; i < result.length; i++) {
                                        completed.push(result[i].challengeId);
                                        if (i == result.length - 1) {
                                            cb(null);
                                        }
                                    }
                                } else {
                                    cb(null);
                                }
                            }
                        }
                    );

                    //    Service.UserService.getUserGameData(criteria,projection,option,function(err,result){
                    //         if(err){
                    //             cb(err)
                    //         }
                    //         else{

                    //             // console.log(result,'=================result data rajendra================');

                    //             if(result && (result.length>0)&&(result[0].logs)&& result[0].logs.length>0){
                    //             for(let i=0;i<result[0].logs.length;i++){
                    //                 if(result[0].logs[i].userId==payloadData.userId){
                    //                     completed.push(result[0].logs[i].challengeId);
                    //                 }

                    //                 if(i==(result.length-1)){
                    //                     cb(null)
                    //                 }
                    //             }
                    //             }
                    //             else{
                    //                 cb(null)
                    //             }
                    //         }
                    //     })
                }
            ],

            findInCompleteChallengeOfGame: [
                "findCompletedChallengesBYUser",
                function(cb) {
                    let criteria = {
                        gameId: payloadData.gameId,
                        _id: { $nin: completed }
                    };

                    let projection = {};
                    let options = {};
                    Service.UserService.findChallenges(
                        criteria,
                        projection,
                        options,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                data = result;
                                cb(null);
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
}

function completeUserChallengeForcely(payloadData, callback) {
    let data;
    let id;
    let completed = [];
    let members;
    let point = 0;
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            findTeam: [
                "checkToken",
                function(cb) {
                    var criteria = {
                        member: { $in: [payloadData.userId] },
                        gameId: payloadData.gameId
                    };

                    var projection = {};

                    Service.UserService.getUsersGames(criteria, projection, {}, function(
                        err,
                        result
                    ) {
                        // console.log(".......err...............", err, result);
                        if (err) {
                            cb(err);
                        } else {
                            id = result[0]._id;
                            point = payloadData.points;
                            cb(null);
                        }
                    });
                }
            ],

            isCompleted: [
                "findTeam",
                function(cb) {
                    var criteria = {
                        _id: payloadData.challengeId,
                        completedBy: { $in: [id] }
                    };
                    Service.UserService.findChallenges(criteria, {}, {}, function(
                        err,
                        result
                    ) {
                        if (err) {
                            cb(err);
                        } else {
                            if (result.length) {
                                callback(
                                    UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                    .CHALLENGE_COMPLETED
                                );
                            } else {
                                cb(null);
                            }
                        }
                    });
                }
            ],
            updateUserGames: [
                "isCompleted",
                "findTeam",
                function(cb) {
                    var criteria = {
                        _id: id
                    };

                    var dataToUpdate = {
                        $push: {
                            challengeId: payloadData.challengeId,
                            logs: {
                                ChallengeId: payloadData.challengeId,
                                userId: payloadData.userId
                            }
                        },
                        $inc: {
                            totalPoints: payloadData.points
                        }
                    };
                    Service.UserService.updateTeam(
                        criteria,
                        dataToUpdate, { new: true },
                        function(err, result) {
                            if (err) {
                                // console.log(err, "error data");
                                cb(err);
                            } else {
                                members = result.member;
                                cb(null);
                            }
                        }
                    );
                }
            ],

            updateUser: [
                "updateUserGames",
                function(cb) {
                    if (members.length) {
                        for (var i = 0; i < members.length; i++) {
                            (function(i) {
                                var criteria = {
                                    _id: members[i]
                                };
                                var dataToUpdate = {
                                    $inc: {
                                        totalPoints: payloadData.points,
                                        totalChallengeCompeleted: 1
                                    },
                                    $push: {
                                        challengeCompeleted: {
                                            challenge: payloadData.challengeId
                                        }
                                    }
                                };
                                Service.UserService.updatePlayer(
                                    criteria,
                                    dataToUpdate, { new: true },
                                    function(err, result) {
                                        if (err) {
                                            cb(err);
                                        } else {
                                            if (i == members.length - 1) {
                                                cb(null);
                                            }
                                        }
                                    }
                                );
                            })(i);
                        }
                    } else {
                        callback(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                            .MEMBERS_MISSING
                        );
                    }
                }
            ],

            updateChallenge: [
                "updateUser",
                function(cb) {
                    var criteria = {
                        _id: payloadData.challengeId
                    };
                    var dataToUpdate = {
                        $push: {
                            completedBy: id
                        }
                    };
                    Service.UserService.updateChallenges(
                        criteria,
                        dataToUpdate, { new: true },
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null);
                            }
                        }
                    );
                }
            ],

            applyUndependent: [
                "updateChallenge",
                function(cb) {
                    
                    let dataToSave = {
                        userId: payloadData.userId,
                        gameId: payloadData.gameId,
                        challengeId: payloadData.challengeId,
                        textAnswer: payloadData.textAnswer
                    };
                    Service.UserService.makeDependencyFree(dataToSave, function(
                        err,
                        result
                    ) {
                        if (err) {
                            // console.log(err);
                            cb(err);
                        } else {
                            // console.log("result datya", result);
                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

function gameDescrptionToAdmin(payloadData, callback) {
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
    var id1 = 0;
    var k = 0;

    var points = [];

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            isProtected: [
                "checkToken",
                function(cb) {
                    if (payloadData.isProtected) {
                        var criteria = {
                            _id: payloadData.gameId,
                            password: payloadData.password
                        };
                        var projection = { _id: 1 };
                        Service.UserService.getGame(criteria, projection, {}, function(
                            err,
                            result
                        ) {
                            if (err) {
                                cb(err);
                            } else {
                                if (result.length) {
                                    cb(null);
                                } else {
                                    cb(
                                        UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                        .INCORRECT_PASSWORD
                                    );
                                }
                            }
                        });
                    } else {
                        cb(null);
                    }
                }
            ],

            checkGame: [
                "isProtected",
                function(cb) {
                    userId = payloadData.userId;
                    var criteria = {
                        member: { $in: [userId] },
                        gameId: payloadData.gameId
                    };
                    Service.UserService.getUsersGames(criteria, {}, {}, function(
                        err,
                        result
                    ) {
                        if (err) {
                            cb(err);
                        } else {
                            // console.log("request data to send", "fhduhfuhdufhudfhuhuh");

                            if (result.length) {
                                id1 = result[0]._id;
                                chall1 = result[0].challengeId;
                                chall2 = result[0].easyHintChallengesId;
                                chall3 = result[0].hardHintChallengesId;
                                chall4 = result[0].toughHintChallengesId;

                                cb(null);
                            } else {
                                cb(null);
                            }
                        }
                    });
                }
            ],

            // findCompletedChallengeId:['isProtected',function(cb){

            //     let criteria={
            //         userId:payloadData.userId,
            //         gameId:payloadData.gameId
            //     }
            //     let projection={challengeId:1};
            //     let option={
            //         lean:true
            //     }

            //     AnswerData.find(criteria,projection,option,function(err,result){
            //         if(err){
            //             cb(err)
            //         }
            //         else{
            //             if(result.length>0){
            //                 for(let i=0;i<result.length;i++){

            //                 completedChallenge.push(result[i].challengeId)

            //                 if(i==(result.length)-1){
            //                     cb(null)
            //                 }

            //                 }
            //             }else{
            //                 cb(null)
            //             }

            //         }
            //     })
            // }],

            gameDesc: [
                "checkGame",
                function(cb) {
                    var criteria = {
                        _id: payloadData.gameId
                    };
                    var projections = {
                        is_deleted: 0,
                        codes: 0
                    };
                    var populateArray = [{
                        path: "challenges",
                        match: { is_deleted: false },
                        select: " ",
                        options: {}
                    }];

                    Service.UserService.gameDetails(
                        criteria,
                        projections, { lean: true },
                        populateArray,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                (chall = result[0].challenges),
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
                                    possibleAttemp: result[0].possibleAttemp
                                });
                                cb(null);
                            }
                        }
                    );
                }
            ],

            challengeCompleted: [
                "gameDesc",
                function(cb) {
                    if (id1) {
                        // console.log("inside id data");

                        data[0].isJoined = true;

                        if (data[0].isOrderLock == true) {
                            // console.log("inside is order ");

                            if (chall1.length) {
                                // console.log("inside order when order is greater");
                                let flag = 0;
                                let len = chall.length;
                                for (let i = 0; i < chall.length; i++) {
                                    let criteria = {
                                        userId: userId,
                                        gameId: payloadData.gameId,
                                        challengeId: chall[i]._id
                                    };

                                    Service.UserService.countAttempts(criteria, function(
                                        err,
                                        result
                                    ) {
                                        if (err) {
                                            // console.log(err);
                                        } else {
                                            flag++;
                                            chall[i].attepCount = result;
                                            if (chall1.indexOf(chall[i]._id) >= 0) {
                                                // // console.log()

                                                chall[i].isCompleted = true;
                                                // }
                                                // else {

                                                //     if (k == 0) {
                                                // if(i<chall.length){
                                                if (chall[i + 1]) {
                                                    chall[i + 1].isOpen = true;
                                                }

                                                // }else{
                                                //     chall[chall.length-1].isOpen = true;
                                                // }

                                                // }

                                                // k++;
                                            }
                                            if (chall2.indexOf(chall[i]._id) >= 0) {
                                                chall[i].points =
                                                    chall[i].points - chall[i].hints[0].points;
                                                chall[i].isEasy = true;
                                            }
                                            if (chall3.indexOf(chall[i]._id) >= 0) {
                                                chall[i].points =
                                                    chall[i].points - chall[i].hints[1].points;
                                                chall[i].isHard = true;
                                            }
                                            if (chall4.indexOf(chall[i]._id) >= 0) {
                                                chall[i].points =
                                                    chall[i].points - chall[i].hints[2].points;
                                                chall[i].isTootough = true;
                                            }

                                            if (flag == len) {
                                                data[0].challenges = chall;
                                                cb(null);
                                            }
                                        }
                                    });
                                }
                            } else {
                                // // console.log( "here after plyaing taking hint=============================");
                                if (chall2.length || chall3.length || chall4.length) {
                                    if (chall2.length) {
                                        // // console.log( "here  1111111 vafter plyaing taking hint=============================" );

                                        let criteria = {
                                            userId: userId,
                                            gameId: payloadData.gameId,
                                            challengeId: chall[0]._id
                                        };
                                        Service.UserService.countAttempts(criteria, function(
                                            err,
                                            result
                                        ) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                chall[0].attepCount = result;
                                                chall[0].isOpen = true;
                                                chall[0].points =
                                                    chall[0].points - chall[0].hints[0].points;
                                                chall[0].isEasy = true;
                                            }
                                        });
                                    }
                                    if (chall3.length) {
                                        // // console.log( "here  222222222 vafter plyaing taking hint=============================" );
                                        // // console.log(chall3.length, "challenge 3 length");

                                        // // console.log(" inside challenge 1,2,3  ");

                                        let criteria = {
                                            userId: userId,
                                            gameId: payloadData.gameId,
                                            challengeId: chall[0]._id
                                        };

                                        Service.UserService.countAttempts(criteria, function(
                                            err,
                                            result
                                        ) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                chall[0].attepCount = result;
                                                chall[0].isOpen = true;
                                                chall[0].points =
                                                    chall[0].points - chall[0].hints[1].points;
                                                chall[0].isHard = true;
                                            }
                                        });
                                    }
                                    if (chall4.length) {
                                        // // console.log( "here  33333333333 vafter plyaing taking hint=============================" );
                                        // // console.log(chall4.length, "challenge 4 length");

                                        // // console.log(" inside challenge 1,2,3  ");

                                        let criteria = {
                                            userId: userId,
                                            gameId: payloadData.gameId,
                                            challengeId: chall[0]._id
                                        };

                                        Service.UserService.countAttempts(criteria, function(
                                            err,
                                            result
                                        ) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                // // console.log(result, "===========================result count ========================");

                                                chall[0].attepCount = result;
                                                chall[0].isOpen = true;
                                                chall[0].points =
                                                    chall[0].points - chall[0].hints[2].points;
                                                chall[0].isTootough = true;
                                            }
                                        });
                                    }
                                } else {
                                    // // console.log( "here  44444444444 vafter plyaing taking hint=============================" );
                                    Service.UserService.countAttempts({
                                            userId: userId,
                                            gameId: payloadData.gameId,
                                            challengeId: chall[0]._id
                                        },
                                        function(err, result) {
                                            if (err) {
                                                // console.log(err);
                                            } else {
                                                chall[0].isOpen = true;
                                                data[0].challenges = chall;
                                                chall[0].attepCount = result;
                                                cb(null);
                                            }
                                        }
                                    );
                                }
                            }
                        } else {
                            // console.log("inside other function");

                            data[0].challenges = chall;
                            if (chall1.length) {
                                // console.log(chall1.length, "challenge 3 length");
                                let flag = 0;
                                let len = chall1.length;

                                for (let i = 0; i < chall.length; i++) {
                                    let criteria = {
                                        userId: userId,
                                        gameId: payloadData.gameId,
                                        challengeId: chall[i]._id
                                    };

                                    Service.UserService.countAttempts(criteria, function(
                                        err,
                                        result
                                    ) {
                                        if (err) {
                                            // console.log(err, "error data");
                                        } else {
                                            flag++;

                                            chall[i].attepCount = result;

                                            // // console.log(chall[i].attepCount, "attempt count");

                                            chall[i].isOpen = true;
                                            if (chall1.indexOf(chall[i]._id) >= 0) {
                                                // // console.log(chall[i]._id, "id inside challenge one");
                                                chall[i].isCompleted = true;
                                            }
                                            if (chall2.indexOf(chall[i]._id) >= 0) {
                                                // // console.log(chall[i]._id, "id inside challenge two");
                                                chall[i].points =
                                                    chall[i].points - chall[i].hints[0].points;
                                                chall[i].isEasy = true;
                                            }
                                            if (chall3.indexOf(chall[i]._id) >= 0) {
                                                // // console.log(chall[i]._id, "id inside challenge three");
                                                chall[i].points =
                                                    chall[i].points - chall[i].hints[1].points;
                                                chall[i].isHard = true;
                                            }
                                            if (chall4.indexOf(chall[i]._id) >= 0) {
                                                // // console.log(chall[i]._id, "id inside challenge four");
                                                chall[i].points =
                                                    chall[i].points - chall[i].hints[2].points;
                                                chall[i].isTootough = true;
                                            }
                                            if (flag == len) {
                                                data[0].challenges = chall;
                                                cb(null);
                                            }
                                        }
                                    });
                                }
                            } else {
                                let flag = 0;
                                let len = chall.length;

                                for (let i = 0; i < chall.length; i++) {
                                    let criteria = {
                                        userId: userId,
                                        gameId: payloadData.gameId,
                                        challengeId: chall[i]._id
                                    };

                                    Service.UserService.countAttempts(criteria, function(
                                        err,
                                        result
                                    ) {
                                        if (err) {
                                            // console.log(err);
                                        } else {
                                            flag++;

                                            chall[i].attepCount = result;

                                            chall[i].isOpen = true;

                                            if (chall2.indexOf(chall[i]._id) >= 0) {
                                                chall[i].points =
                                                    chall[i].points - chall[i].hints[0].points;
                                                chall[i].isEasy = true;
                                            }
                                            if (chall3.indexOf(chall[i]._id) >= 0) {
                                                chall[i].points =
                                                    chall[i].points - chall[i].hints[1].points;
                                                chall[i].isHard = true;
                                            }
                                            if (chall4.indexOf(chall[i]._id) >= 0) {
                                                chall[i].points =
                                                    chall[i].points - chall[i].hints[2].points;
                                                chall[i].isTootough = true;
                                            }
                                            if (flag == len) {
                                                cb(null);
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    } else {
                        let dataToSend = [];
                        data[0].isJoined = false;

                        let len = chall.length;
                        let flag = 0;
                        for (let i = 0; i < chall.length; i++) {
                            let jsonDataToSend = new Object();
                            jsonDataToSend = chall[i];

                            let criteria = {
                                userId: userId,
                                gameId: payloadData.gameId,
                                challengeId: chall[i]._id
                            };
                            Service.UserService.countAttempts(criteria, function(
                                err,
                                result
                            ) {
                                if (err) {
                                    // console.log(err);
                                    cb(err);
                                } else {
                                    flag++;
                                    jsonDataToSend["isOpen"] = false;
                                    jsonDataToSend["attepCount"] = result;
                                    dataToSend.push(jsonDataToSend);
                                    if (flag == len) {
                                        data[0].challenges = dataToSend;
                                        cb(null);
                                    }
                                }
                            });
                        }
                    }
                }
            ],
            loadManualScore: [
                "challengeCompleted",
                function(cb) {
                    // console.log(data[0].challenges.length);
                    
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
                            if (result != null) {
                                points = result;
                            }
                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
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
                callback(null, data[0]);
            }
        }
    );
}

function showPointTakenByUser(payloadData, callback) {
    let data;
    let userPoint;
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },

            getData: [
                "checkToken",
                function(err, cb) {
                    let criteria = {
                        gameId: payloadData.gameId,
                        _id: payloadData.challengeId
                    };
                    let option = {};
                    let projection = {
                        pointEarnedByUser: 1
                    };
                    Service.UserService.findPerticularChalange(
                        criteria,
                        projection,
                        option,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                if (result && result.pointEarnedByUser) {
                                    for (let i = 0; i < result.pointEarnedByUser.length; i++) {
                                        if (
                                            payloadData.userId == result.pointEarnedByUser[i].userId
                                        ) {
                                            userPoint = result.pointEarnedByUser[i].point;
                                        }

                                        if (i == result.pointEarnedByUser.length - 1) {
                                            cb(null);
                                        }
                                    }
                                } else {
                                    cb(null);
                                }
                            }
                        }
                    );
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, userPoint);
            }
        }
    );
}

//////////////////////////rajendra's task//////////////////////////////////////////

const listGamesWithFilter = function(payloadData, callback) {
    var data = [];
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            listUserGames: [
                "checkToken", function (cb) {
                    var criteria = {
                        // is_delete: false,
                        completeGame: false,
                        timerGame:true
                    };
                    var populateArray = [
                        {
                            path:"createBy",
                            match:{},
                            select:"",
                            options: {}
                        },
                        {
                            path: "member",
                            match: {},
                            select: "",
                            options: {}
                        },
                        {
                            path: "gameId",
                            match: {},
                            select: "",
                            options: {}
                        }
                    ];
                    Service.UserService.getUsersGamesDescriptions(criteria, {}, {}, populateArray, function (err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            // console.log(result.length);
                            if (result.length) {
                                result.forEach(ugame => {
                                    if (ugame.gameId.is_deleted == false) {
                                        var aliveTeamMembers = [];
                                        for (var i = 0; i < ugame.member.length; i ++) {
                                            if (ugame.member[i].is_delete == false) {
                                                aliveTeamMembers.push(ugame.member[i]);
                                            }
                                        }
                                        if (aliveTeamMembers.length == 0) {}
                                        else {
                                            var leftTime = 0;
                                            var usedTime = 0;
                                            if (ugame.pause == true) {
                                                usedTime = ugame.takeTime;
                                            } else {
                                                usedTime = ugame.takeTime + new Date().getTime() - ugame.startTime;
                                            } 
                                            if (ugame.timerStart == false) {
                                                leftTime = 0;
                                            }
                                            leftTime = ugame.gameTime - usedTime;
                                            // console.log("Here --- : " + usedTime + " " + ugame.gameId.timer + " : " + ugame.gameTime);
                                            if(leftTime < 0)
                                            {
                                                leftTime = 0;
                                            }
                                            
                                            // console.log("--------------------",leftTime,ugame.startTime,ugame.takeTime);
                                            data.push({
                                                teamImage: ugame.teamImage,
                                                username: ugame.name,
                                                gamename: ugame.gameId.name,
                                                pause: ugame.pause,
                                                startTime: ugame.gameStartTime,
                                                timeLeft: leftTime
                                            });
                                        }
                                        
                                    }
                                });
                                cb(null);
                            }
                            else {
                                cb(null);
                            }
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
};

const usersCompletedGame = function(payloadData, callback) {
    var users = [];
    var challenges = [];
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        // console.log("*****err*****", err);
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            challengesOfGame: [
                "checkToken",
                function(cb) {
                    var criteria = { _id: payloadData.gameId, is_deleted: false };
                    var projection = {};
                    var options = {};
                    Service.UserService.getGame(
                        criteria,
                        projection,
                        options,
                        function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                result[0].challenges.forEach(challenge => {
                                    // console.log(challenge);
                                    var criteria = {
                                        _id: challenge,
                                        gameId: payloadData.gameId,
                                        is_deleted: false
                                    };
                                    var options = {};
                                    var projection = {};
                                    Service.UserService.findChallenge(criteria, projection, options, function(err, res) {
                                        if (err) {
                                            cb(err);
                                        } else {
                                            if (res != null) {
                                                challenges.push(res);
                                            }
                                            cb(null);
                                        }
                                    });
                                });
                                cb(null);
                            }
                        }
                    );
                }
            ],
            usersCompletedAllChallenges: [
                "challengesOfGame",
                function(cb) {
                    // console.log(challenges);
                    challenges.forEach(challenge => {
                        // var criteria = {};
                        // console.log("Here");
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, users);
            }
        }
    );
};

const challengeEditPoint = function(payloadData, callback) {
    var id;
    var admin = [];
    var data = [];
    var dataToSave = {};

    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        // console.log("*****err*****", err);
                        cb(err);
                    } else {
                        // console.log("****result****", result);
                        if (result.length) {
                            admin = result;
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            updateUserChallengePoints:[
                "checkToken",
                function (cb) {
                    var criteria = {
                        challengeId:payloadData.challengeId,
                        gameId:payloadData.gameId,
                        userId:payloadData.playerId
                    };
                    var option = {};
                    var projection = {};
                    Service.UserService.getManualScore(criteria, projection, option, function (err, result) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            if (result.length == 0) {
                                var objToSave = {
                                    challengeId: payloadData.challengeId,
                                    gameId: payloadData.gameId,
                                    userId: payloadData.playerId,
                                    score: payloadData.newPoints
                                };
                                Service.AdminService.createManualScore(objToSave, function(err, result) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        // console.log("created");
                                        cb(null);
                                    }
                                });
                            }
                            else {
                                var criteria = {
                                    challengeId: payloadData.challengeId,
                                    gameId: payloadData.gameId,
                                    userId: payloadData.playerId
                                }
                                var option = {
                                    new: true
                                }
                                var setData = {
                                    score: payloadData.newPoints
                                }
                                Service.AdminService.updateManualScore(criteria, setData, option, function (err, result) {
                                    if (err) {
                                        cb(err);
                                    } else {

                                        cb(null);
                                    }
                                })
                            }
                            cb(null);
                        }
                    });
                }
            ],
            updateTPointsAtTeamList: [
              "updateUserChallengePoints",
              function(cb) {
                  var query = {
                    member: { $in: payloadData.playerId },
                    gameId: payloadData.gameId,
                    challengeId: payloadData.challengeId
                  };

                  var options = {
                    new: true
                  };

                  var deltaPoints =
                    parseInt(payloadData.newPoints) - parseInt(payloadData.oldPoints);
                  var dataToSet = { $inc: { totalPoints: deltaPoints } };
                  Service.UserService.updateTeam2(query, dataToSet, options, function(
                    err,
                    result
                  ) {
                    if (err) {
                      cb(err);
                    } else {
                      cb(null);
                    }
                  });
              }
            ],
            updateTPointsAtPlayerList: [
              "updateTPointsAtTeamList",
              function(cb) {
                  var query = {
                    is_delete: false,
                    _id: payloadData.playerId
                  };
                  var options = {
                    new: true
                  };
                  var deltaPoints =
                    parseInt(payloadData.newPoints) - parseInt(payloadData.oldPoints);
                  var dataToSet = { $inc: { totalPoints: deltaPoints } };
                  Service.UserService.updatePlayer2(
                    query,
                    dataToSet,
                    options,
                    function(err, result) {
                      if (err) {
                        cb(err);
                      } else {
                        // console.log("Ok");
                        cb(null);
                      }
                    }
                  );
              }
            ],
            updateEarnedPointsInChallengeList:[
                "updateTPointsAtPlayerList",
                function (cb) {
                    var query = {
                        _id: payloadData.challengeId
                    };
                    var projection = {};
                    var options = {};
                    Service.AdminService.getChallenges(query, projection, options, function (err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            var solvedUsers = result[0].pointEarnedByUser;
                            for (var i = 0; i < solvedUsers.length; i ++) {
                                if (solvedUsers[i].userId === payloadData.playerId) {
                                    var criteria = {
                                        _id: payloadData.challengeId,
                                        pointEarnedByUser : {
                                            userId: {$in: payloadData.playerId}
                                        }
                                    };
                                    var deltaPoints = parseInt(payloadData.newPoints) - parseInt(payloadData.oldPoints);
                                    var dataToSet = {
                                        $inc: {
                                            pointEarnedByUser:{
                                                point: deltaPoints
                                            }
                                        }
                                    };
                                    var options = {
                                        new: true
                                    };
                                    Service.AdminService.updateChallenge(criteria, dataToSet, options, function (err, result){
                                        if (err) {
                                            cb(err);
                                        } else {
                                            cb(null);
                                        }
                                    });
                                }
                            }
                            cb(null);
                        }
                    });
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
};

const userChallengePointListing = function(payloadData, callback) {
    var data;

    async.auto({
            getListing: function(cb) {
                var query = {
                    member: { $in: payloadData.userId },
                    gameId: payloadData.gameId
                };

                var options = { lean: true };
                var projections = {
                    _id: 1
                };
                Service.UserService.getUsersGames(query, projections, options, function(
                    err,
                    result
                ) {
                    if (err) {
                        cb(err);
                    } else {
                        data = result;
                        cb(null);
                    }
                });
            }
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        }
    );
};

const addEditCategory = function(payloadData, callback) {
    async.auto({
            checkToken: function(cb) {
                checkToken(payloadData.accessToken, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (result.length) {
                            cb(null);
                        } else {
                            cb(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .TOKEN_ALREADY_EXPIRED
                            );
                        }
                    }
                });
            },
            getLevelOne: [
                "checkToken",
                function(cb) {
                    if (payloadData.level == 3) {
                        let query = {
                            _id: payloadData.levelTwo
                        };
                        let options = { lean: true };
                        let projections = {
                            levelOne: 1
                        };
                        Service.AdminService.getCategories(
                            query,
                            projections,
                            options,
                            function(err, result) {
                                if (err) {
                                    cb(err);
                                } else {
                                    if (result && result.length) {
                                        payloadData.levelOne = result[0].levelOne;
                                        cb(null);
                                    } else {
                                        cb(null);
                                    }
                                }
                            }
                        );
                    } else {
                        cb(null);
                    }
                }
            ],
            addNew: [
                "checkToken",
                "getLevelOne",
                function(cb) {
                    if (payloadData.id) {
                        cb(null);
                    } else {
                        var query = {
                            name: payloadData.name,
                            level: payloadData.level,
                            $inc: { order: 1 }
                        };
                        query.levelOne = payloadData.levelOne;
                        query.levelTwo = payloadData.levelTwo;

                        Service.AdminService.createCategories(query, function(err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null);
                            }
                        });
                    }
                }
            ],
            updateCategory: [
                "checkToken",
                function(cb) {
                    if (payloadData.id) {
                        var query = {
                            _id: payloadData.id
                        };

                        var options = { lean: true };

                        var setData = {
                            name: payloadData.name,
                            level: payloadData.level
                        };

                        setData.levelOne = payloadData.levelOne;

                        setData.levelTwo = payloadData.levelTwo;

                        Service.AdminService.updateCategories(
                            query,
                            setData,
                            options,
                            function(err, result) {
                                if (err) {
                                    cb(err);
                                } else {
                                    cb(null);
                                }
                            }
                        );
                    } else {
                        cb(null);
                    }
                }
            ]
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
};
const listCategory = function(payloadData, callback) {
    var query = {
        level: payloadData.level,
        isDeleted: false
    };
    if (payloadData && payloadData.id && payloadData.level == 2) {
        query = {
            $or: [{ levelOne: payloadData.id }],
            level: 2,
            isDeleted: false
        };
    }

    if (payloadData && payloadData.id && payloadData.level == 3) {
        query = {
            $or: [{ levelTwo: payloadData.id }],
            level: 3,
            isDeleted: false
        };
    }

    var options = { lean: true };

    var projections = {};

    var populateArray = [{
            path: "levelOne",
            match: {},
            select: "",
            options: {}
        },
        {
            path: "levelTwo",
            match: {},
            select: "",
            options: {}
        }
    ];

    Service.AdminService.getCategoriesPopulate(
        query,
        projections,
        options,
        populateArray,
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        }
    );
};

const unsetDependValue = function(payloadData, callback) {
    async.auto({
            unsetDepend: function(cb) {
                let query = {
                    _id: payloadData.id
                };

                let options = {
                    lean: true
                };

                let setData = {
                    $unset: {
                        depended: 1
                    }
                };

                Service.AdminService.updateChallenges(query, setData, options, function(
                    err,
                    result
                ) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null);
                    }
                });
            }
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
};

const deleteCategory = function(payloadData, callback) {
    async.auto({
            deleteCategory: function(cb) {
                var query = {
                    $or: [{ level: payloadData.id }, { levelOne: payloadData.id }]
                };

                if (payloadData.level == 1) {
                    query = {
                        $or: [{ levelOne: payloadData.id }, { _id: payloadData.id }]
                    };
                } else if (payloadData.level == 2) {
                    query = {
                        $or: [{ levelTwo: payloadData.id }, { _id: payloadData.id }]
                    };
                } else if (payloadData.level == 3) {
                    query = {
                        _id: payloadData.id
                    };
                }

                let options = {
                    multi: true
                };

                let setData = {
                    isDeleted: true
                };

                Service.AdminService.updateCategories(query, setData, options, function(
                    err,
                    result
                ) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null);
                    }
                });
            }
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
};

const timerStartIn = function(payloadData, callback) {
    async.auto({
            setTimer: function(cb) {
                if (payloadData.reset == true) {
                    var query = { _id: payloadData.gameId };
                    var options = { lean: true };
                    var setData = {
                        delayTimer: null
                    };
                } else {
                    var query = { _id: payloadData.gameId };
                    var options = { lean: true };
                    var setData = {
                        delayTimer: payloadData.id
                    };
                }

                Service.AdminService.updateGame(query, setData, options, function(
                    err,
                    result
                ) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null);
                    }
                });
            }
        },
        function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
};

module.exports = {
    adminLogin: adminLogin,
    createGame: createGame,
    editGame: editGame,
    removePlayer: removePlayer,
    removeGame: removeGame,
    teamListing: teamListing,
    gameListing: gameListing,
    playerListing: playerListing,
    feeds: feeds,
    setFeatured: setFeatured,
    blockOrUnblock: blockOrUnblock,
    resetPassword: resetPassword,
    editChallenge: editChallenge,
    changePassword: changePassword,
    addSubAdmin: addSubAdmin,
    subAdminListing: subAdminListing,
    editSubAdmin: editSubAdmin,
    userGame: userGame,
    UsersTotalPoints: UsersTotalPoints,
    updateOrderValue: updateOrderValue,
    swapOrderOfChallange: swapOrderOfChallange,
    MakeUserAsDeleted: MakeUserAsDeleted,
    GenerateExportFile: GenerateExportFile,
    exportGameCsv: exportGameCsv,
    uploadImageOnS3: uploadImageOnS3,
    deleteChallenge: deleteChallenge,
    makeChallengeAsDepended: makeChallengeAsDepended,
    findUserAnswerForPerticularChallenge: findUserAnswerForPerticularChallenge,
    completeUserChallengeForcely: completeUserChallengeForcely,
    getInCompleteChallenges: getInCompleteChallenges,
    gameDescrptionToAdmin: gameDescrptionToAdmin,
    showPointTakenByUser: showPointTakenByUser,
    listGamesWithFilter: listGamesWithFilter,
    uploadImages: uploadImages,
    challengeEditPoint: challengeEditPoint,
    usersCompletedGame: usersCompletedGame,
    userChallengePointListing: userChallengePointListing,
    addEditCategory: addEditCategory,
    listCategory: listCategory,
    unsetDependValue: unsetDependValue,
    deleteCategory: deleteCategory,
    timerStartIn: timerStartIn
};