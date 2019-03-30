"use strict";

var Controller = require("../Controllers");
var UniversalFunctions = require("../Utils/UniversalFunctions");
var Joi = require("joi");

module.exports = [{
        method: "POST",
        path: "/api/admin/login",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.adminLogin(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Login Via email & Password For  Admin",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    email: Joi.string().required(),
                    password: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    // payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/createGame",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.createGame(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Create Game" +
                ' challenges:[{_id:"","name":"aaa","details":"dfsfds",timerStatus:"true/False",timer:"123456","hint":"ssdsd","points":10,"customDialog":{"title":"jdfjs","description":"sdffdgfd"},"challengeType":"Image",' +
                ' "longitute":"25","latitute":"45","location":"asdaasda","distanceDiff":"100","qrCode":"code","keywords":["aaaa","bbbbb"]' +
                ' ,"textAnswer":["aaaa","bbbbb"]' +
                'hints:[{"type":"Easy","name":"fdsfd","point":"10"},{"type":"Hard","name":"fdsfd","point":"20"},{"type":"Too tough","name":"fdsfdsda","point":"30"}]' +
                "different type of challengeType :Image,Location,QR code,Text,Video",
            tags: ["api", "admin"],
            payload: {
                maxBytes: 20000000000000,
                parse: true,
                output: "file"
            },
            validate: {
                payload: {
                    _id: Joi.string().optional(),
                    accessToken: Joi.string().required(),
                    levelOne: Joi.string().optional(),
                    levelTwo: Joi.string().optional(),
                    levelThree: Joi.string().optional(),
                    levelOneName: Joi.string().optional(),
                    levelTwoName: Joi.string().optional(),
                    levelThreeName: Joi.string().optional(),
                    delayTimer: Joi.string().optional(),
                    name: Joi.string().required(),
                    details: Joi.string().required(),
                    startDate: Joi.string().required(),
                    endDate: Joi.string().required(),
                    latitude: Joi.string().required(),
                    longitude: Joi.string().required(),
                    gameLocation: Joi.string().required(),
                    gameImage: Joi.object().required(),
                    password: Joi.string().optional(),
                    cityName: Joi.string().required(),
                    stateName: Joi.string().required(),
                    //                    countryName:Joi.string().required(),
                    countryName: Joi.string()
                        .optional()
                        .required(),
                    is_protected: Joi.boolean().optional(),
                    isOrderLock: Joi.boolean().optional(),
                    challenges: Joi.array().required(),
                    maxPlayer: Joi.number().required(),
                    minPlayer: Joi.number().required(),
                    timerStatus: Joi.boolean().required(),
                    timer: Joi.number().optional(),
                    paused: Joi.boolean().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/uploadImage",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.uploadImages(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "upload image",
            tags: ["api", "admin"],
            payload: {
                maxBytes: 200000000,
                parse: true,
                output: "file"
            },
            validate: {
                payload: {
                    image: Joi.any()
                        .meta({ swaggerType: "file" })
                        .optional()
                        .description("image file")
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/removePlayer",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.removePlayer(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Remove Player",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    userId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //  payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/removeGame",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.removeGame(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Delete and Featured Game",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    type: Joi.string()
                        .optional()
                        .valid(["delete", "featured"]),
                    status: Joi.string()
                        .optional()
                        .valid(["true", "false"])
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    // payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/teamListing",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.teamListing(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Team completed Challenge",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    challengeId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/addSubAdmin",
        handler: function(request, reply) {
            Controller.AdminController.addSubAdmin(request.payload, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data));
                }
            });
        },
        config: {
            description: "addSubAdmin",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    name: Joi.string().optional(),
                    email: Joi.string().optional(),
                    password: Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //  payloadType : 'form',
                    responses: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/gameListing",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.gameListing(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Game Listing",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    limit: Joi.string().required(),
                    skip: Joi.string().required(),
                    searchText: Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/playerListing",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.playerListing(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Players Listing",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    limit: Joi.string().required(),
                    skip: Joi.string().required(),
                    searchText: Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/feeds",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.feeds(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Games Feeds",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/setFeaturedorDelete",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.setFeatured(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Set Featured or Delete Feed",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    feedId: Joi.string().required(),
                    status: Joi.string()
                        .required()
                        .valid(["delete", "featured"]),
                    type: Joi.string()
                        .optional()
                        .valid(["true", "false"])
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //  payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/blockOrUnblock",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.blockOrUnblock(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Block Or Unblock",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    userId: Joi.string().required(),
                    status: Joi.string()
                        .required()
                        .valid(["Block", "Unblock"])
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/editGame",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.editGame(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Edit Game" +
                ' challenges:[{"name":"aaa","details":"dfsfds","hint":"ssdsd","points":10,"customDialog":{"title":"jdfjs","description":"sdffdgfd"},"challengeType":"Image",' +
                ' "longitute":"25","latitute":"45","location":"asdaasda","distanceDiff":"100","qrCode":"code","keywords":["aaaa","bbbbb"]' +
                ' ,"textAnswer":["aaaa","bbbbb"]' +
                'hints:[{"type":"Easy","name":"fdsfd","point":"10"},{"type":"Hard","name":"fdsfd","point":"20"},{"type":"Too tough","name":"fdsfdsda","point":"30"}]' +
                "different type of challengeType :Image,Location,QR code,Text,Video",
            tags: ["api", "admin"],
            payload: {
                maxBytes: 200000000,
                parse: true,
                output: "file"
            },
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    name: Joi.string().optional(),
                    details: Joi.string().optional(),
                    startDate: Joi.string().optional(),
                    endDate: Joi.string().optional(),
                    password: Joi.string().optional(),
                    is_protected: Joi.boolean().optional(),
                    latitude: Joi.string().required(),
                    longitude: Joi.string().required(),
                    gameLocation: Joi.string().required(),
                    gameImage: Joi.any()
                        .meta({ swaggerType: "file" })
                        .optional()
                        .description("image file"),
                    challenges: Joi.array().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/resetPassword",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.resetPassword(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Reset Password",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    passwordResetToken: Joi.string().required(),
                    password: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/editChallenge",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.editChallenge(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Edit Challenge"
                /*+
                           ' challenges:[{"name":"aaa","details":"dfsfds","hint":"ssdsd","points":10,"challengeType":"Image",' +
                           ' "longitute":"25","latitute":"45","location":"asdaasda","distanceDiff":"100","qrCode":"code","keywords":["aaaa","bbbbb"]' +
                           ' ,"textAnswer":["aaaa","bbbbb"]}]                  ' +
                           'different type of challengeType :Image,Location,QR code,Text',*/
                ,
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    challengeId: Joi.string().required(),
                    name: Joi.string().optional(),
                    details: Joi.string().optional(),
                    hint: Joi.string().optional(),
                    title: Joi.string().optional(),
                    description: Joi.string().optional(),
                    points: Joi.string().optional(),
                    challengeType: Joi.string().optional(),
                    onOff: Joi.boolean().optional(),
                    toughonOff: Joi.boolean().optional(),
                    hardonOff: Joi.boolean().optional(),
                    original: Joi.string().optional(),
                    thumbnail: Joi.string().optional(),
                    qrCode: Joi.string().optional(),
                    isKeyword: Joi.boolean().optional(),
                    isShown: Joi.boolean().optional(),
                    textAnswer: Joi.array().optional(),
                    keywords: Joi.array().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/changePassword",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.changePassword(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Edit changePassword",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    oldPassword: Joi.string().required(),
                    newPassword: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    // payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/subAdminListing",
        handler: function(request, reply) {
            var payloadData = request.payload;
            // console.log(payloadData, "request data");
            Controller.AdminController.subAdminListing(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "sub Admin Listing",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    limit: Joi.string().required(),
                    skip: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/editSubAdmin",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.editSubAdmin(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Edit Sub Admin",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    name: Joi.string().optional(),
                    email: Joi.string().optional(),
                    password: Joi.string().optional(),
                    delete: Joi.boolean().optional(),
                    block: Joi.boolean().optional(),
                    subAdminId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    /////////////////////////////////rajendra's changes///////////////////////////////////////////////////////////////

    {
        method: "POST",
        path: "/api/admin/usergame",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.userGame(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "User Joined Games",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    userId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/updatepoints",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.UsersTotalPoints(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    // console.log("total chalange");
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "User points update",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    userId: Joi.string().required(),
                    totalPoints: Joi.string().optional(),
                    totalChallengeCompeleted: Joi.string().optional(),
                    totalGameStarted: Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/updateOrder",
        handler: function(request, reply) {
            var payloadData = request.payload;

            Controller.AdminController.updateOrderValue(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "User points update",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/swapOrderOfChallange",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.swapOrderOfChallange(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: 'User points update [{new:"",old:""}]',
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    data: Joi.array().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/MakeUserAsDeleted",
        handler: function(request, reply) {
            var payloadData = request.payload;

            Controller.AdminController.MakeUserAsDeleted(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },

        config: {
            description: "User points update",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    userId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/exportGameCsv",
        handler: function(request, reply) {
            var payloadData = request.payload;

            Controller.AdminController.exportGameCsv(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },

        config: {
            description: "generate export file",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/exportToCsv",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.GenerateExportFile(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },

        config: {
            description: "generate export file",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/uploadImageOnS3",
        handler: function(request, reply) {
            var payloadData = request.payload;

            // console.log(payloadData, "payloadData");

            Controller.AdminController.uploadImageOnS3(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },

        config: {
            description: " upload image file",
            tags: ["api", "admin"],
            payload: {
                maxBytes: 30485760,
                parse: true,
                output: "file",
                allow: "multipart/form-data"
            },
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    challengeImage: Joi.any()
                        .meta({ swaggerType: "file" })
                        .required()
                        .description("image file")
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/deleteChallenge",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.deleteChallenge(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },

        config: {
            description: "delete challenge",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    challengeId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/makeChallengeAsDepended",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.makeChallengeAsDepended(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: '[{whomeChallengeId:"",dependUponChallengeName:""}]',
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    whichChallengeId: Joi.string().required(),
                    depended: Joi.array().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/findUserAnswerForPerticularChallenge",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.findUserAnswerForPerticularChallenge(
                payloadData,
                function(err, data) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err));
                    } else {
                        reply(
                            UniversalFunctions.sendSuccess(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                                .DEFAULT,
                                data
                            )
                        );
                    }
                }
            );
        },

        config: {
            description: "delete challenge",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    challengeId: Joi.string().required(),
                    userId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/getInCompleteChallenges",
        handler: function(request, reply) {
            var payloadData = request.payload;

            // console.log(payloadData, "data to fgdf");

            Controller.AdminController.getInCompleteChallenges(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },

        config: {
            description: "delete challenge",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    userId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/completeUserChallengeForcely",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.completeUserChallengeForcely(
                payloadData,
                function(err, data) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err));
                    } else {
                        reply(
                            UniversalFunctions.sendSuccess(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                                .DEFAULT,
                                data
                            )
                        );
                    }
                }
            );
        },
        config: {
            description: "complete Challenge by admin challenge",
            tags: ["api", "admin"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    challengeId: Joi.string().required(),
                    gameId: Joi.string().required(),
                    userId: Joi.string().required(),
                    points: Joi.number().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/gameDescrptionToAdmin",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.gameDescrptionToAdmin(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Game Descrption",
            tags: ["api", "User"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().optional(),
                    userId: Joi.string().optional(),
                    challengeIds: Joi.array().required(),
                    password: Joi.string().optional(),
                    isProtected: Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/listGamesWithFilter",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.listGamesWithFilter(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    // // console.log(",,,,,,data..............", data);
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "List Games with filters",
            tags: ["api", "User"],
            validate: {
                payload: {
                    accessToken: Joi.string().required()
                    // paused: Joi.boolean().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: "POST",
        path: "/api/admin/challengeEditPoint",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.challengeEditPoint(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    // // console.log(",,,,,,data..............", data);
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "List Games with filters",
            tags: ["api", "User"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    // userId: Joi.string().optional(),
                    challengeId: Joi.string().optional(),
                    newPoints: Joi.number().optional(),
                    oldPoints: Joi.number().optional(),
                    gameId: Joi.string().optional(),
                    playerId: Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        // handler: function(request, reply) {
        //   var payloadData = request.payload;
        //   Controller.AdminController.gameDescrptionToAdmin(payloadData, function(
        //     err,
        //     data
        //   ) {
        //     if (err) {
        //       reply(UniversalFunctions.sendError(err));
        //     } else {
        //       reply(
        //         UniversalFunctions.sendSuccess(
        //           UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
        //             .DEFAULT,
        //           data
        //         )
        //       );
        //     }
        //   });
        // },
        // config: {
        //   description: "Game Descrption",
        //   tags: ["api", "User"],
        //   validate: {
        //     payload: {
        //       accessToken: Joi.string().required(),
        //       gameId: Joi.string().optional(),
        //       userId: Joi.string().optional(),
        //       password: Joi.string().optional(),
        //       isProtected: Joi.string().optional()
        //     },
        //     failAction: UniversalFunctions.failActionFunction
        //   },
        //   plugins: {
        //     "hapi-swagger": {
        //       payloadType: "form",
        //       responseMessages:
        //         UniversalFunctions.CONFIG.APP_CONSTANTS
        //           .swaggerDefaultResponseMessages
        //     }
        //   }
        // }
        method: "POST",
        path: "/api/admin/usersCompletedGame",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.usersCompletedGame(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions, sendError(err));
                } else {
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "Users Completed Game-All Challenges of this Game",
            tags: ["api", "User"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().optional()
                }
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/userChallengePointListing",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.userChallengePointListing(
                payloadData,
                function(err, data) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err));
                    } else {
                        // console.log(",,,,,,data..............", data);
                        reply(
                            UniversalFunctions.sendSuccess(
                                UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                                .DEFAULT,
                                data
                            )
                        );
                    }
                }
            );
        },
        config: {
            description: "List Games with filters",
            tags: ["api", "User"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    userId: Joi.string().optional(),
                    gameId: Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/addEditCategory",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.addEditCategory(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    // console.log(",,,,,,data..............", data);
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "addEditCategory",
            tags: ["api", "User"],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    id: Joi.string().optional(),
                    levelOne: Joi.string().optional(),
                    levelTwo: Joi.string().optional(),
                    name: Joi.string().required(),
                    level: Joi.number()
                        .required()
                        .allow("1", "2", "3")
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/listCategory",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.listCategory(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    // console.log(",,,,,,data..............", data);
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "listCategory",
            tags: ["api", "User"],
            validate: {
                payload: {
                    level: Joi.number()
                        .required()
                        .allow("1", "2", "3"),
                    id: Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/unsetDependValue",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.unsetDependValue(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    // console.log(",,,,,,data..............", data);
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "listCategory",
            tags: ["api", "User"],
            validate: {
                payload: {
                    id: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/deleteCategory",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.deleteCategory(payloadData, function(
                err,
                data
            ) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    // console.log(",,,,,,data..............", data);
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "delete Category",
            tags: ["api", "User"],
            validate: {
                payload: {
                    id: Joi.string().required(),
                    level: Joi.number().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/admin/timerStartIn",
        handler: function(request, reply) {
            var payloadData = request.payload;
            Controller.AdminController.timerStartIn(payloadData, function(err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    // console.log(",,,,,,data..............", data);
                    reply(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                            .DEFAULT,
                            data
                        )
                    );
                }
            });
        },
        config: {
            description: "timer Start In",
            tags: ["api", "User"],
            validate: {
                payload: {
                    gameId: Joi.string().required(),
                    id: Joi.string().optional(),
                    reset: Joi.boolean().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-swagger": {
                    payloadType: "form",
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS
                        .swaggerDefaultResponseMessages
                }
            }
        }
    }
];