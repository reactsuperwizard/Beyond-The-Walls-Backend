'use strict';


var Controller = require('../Controllers');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var Joi = require('joi');

module.exports = [
    {
        method: 'POST',
        path: '/api/User/login',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................login...............", payloadData);
            Controller.UserController.userLogin(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'Login Via email & Password For  User',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    email: Joi.string().required(),
                    password: Joi.string().required(),
                    deviceType: Joi.string().valid([UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID]),
                    deviceToken: Joi.string().trim()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                   // payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/SignUpOne',
        handler: function (request, reply) {
            var payloadData = request.payload;

            console.log("*8.................SignUpOne...............", payloadData);
            Controller.UserController.SignUpOne(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'User SignUp One',
            tags: ['api', 'User'],
            /* payload: {
             maxBytes: 200000000,
             parse: true,
             output: 'file'
             },*/
            validate: {
                payload: {
                    email: Joi.string().required(),
                    password: Joi.string().required(),
                    deviceType: Joi.string().valid([UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID]),
                    deviceToken: Joi.string().trim()
                    /*name:Joi.string().required(),
                     location:Joi.string().required(),
                     latitute:Joi.string().required(),
                     longitute:Joi.string().required(),
                     profilePic: Joi.any()
                     .meta({swaggerType: 'file'})
                     .optional()
                     .description('image file'),*/
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                  //  payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/SignUpTwo',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................SignUpTwo...............", payloadData);
            Controller.UserController.SignUpTwo(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'User SignUp Two',
            tags: ['api', 'User'],
            payload: {
                maxBytes: 200000000,
                parse: true,
                output: 'file'
            },
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                    name: Joi.string().required(),
                    location: Joi.string().required(),
                    latitute: Joi.string().required(),
                    longitute: Joi.string().required(),
                    profilePic: Joi.any()
                        .meta({swaggerType: 'file'})
                        .optional()
                        .description('image file'),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                 //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/facebookLogin',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................facebookLogin...............", payloadData);
            Controller.UserController.facebookLogin(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Facebook Login',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    facebookId: Joi.string().required(),
                    email: Joi.string().optional(),
                    imageLink: Joi.string().optional(),
                    deviceType: Joi.string().valid([UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID]),
                    deviceToken: Joi.string().trim(),
                    name: Joi.string().optional(),
                    location: Joi.string().required(),
                    latitute: Joi.string().required(),
                    longitute: Joi.string().required(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                 //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/twitterLogin',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................twitterLogin...............", payloadData);
            Controller.UserController.twitterLogin(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Twitter Login',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    twitterId: Joi.string().required(),
                    email: Joi.string().optional(),
                    imageLink: Joi.string().optional(),
                    deviceType: Joi.string().valid([UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID]),
                    deviceToken: Joi.string().trim(),
                    name: Joi.string().optional(),
                    location: Joi.string().required(),
                    latitute: Joi.string().required(),
                    longitute: Joi.string().required(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                 //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/searchGame',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................searchGame...............", payloadData);
            Controller.UserController.searchGame(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'Search Game',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    searchText: Joi.string().required(),
                    startLimit: Joi.string()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/gameListing',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................gameListing...............", payloadData);
            Controller.UserController.gameList(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'Games List',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    startLimit: Joi.string(),
                    latitute: Joi.string(),
                    longitute: Joi.string(),
                    type:Joi.string().required().valid(['nearBy', 'all']),
                    cityName:Joi.string().optional(),
                    id:Joi.string(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                 //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/gameDescrption',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................gameDescrption...............", payloadData);
            Controller.UserController.gameDescrption(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'Game Descrption',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    password: Joi.string().optional(),
                    isProtected: Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                  //  payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/joinGame',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................joinGame...............", payloadData);
            Controller.UserController.joinGame(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Join Game ' +
            'members :["ddsasdsdsdsdsdsdsd","sadsdaasdsadasdasdasasd"]',
            tags: ['api', 'User'],
            payload: {
                maxBytes: 200000000,
                parse: true,
                output: 'file'
            },
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    joinType: Joi.string().required().valid(['Solo', 'Team']),
                    teamName: Joi.string(),
                    members: Joi.array(),
                    iosMembers: Joi.string(),
                    timerGame:Joi.boolean(),
                    gameTime:Joi.number(),
                    teamImage: Joi.any()
                        .meta({swaggerType: 'file'})
                        .optional()
                        .description('image file'),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    //payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/completeChallenges',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log('hello on submit')
            console.log("*8.................completeChallenges...............", payloadData);
            Controller.UserController.completeChallenges(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {

            description: 'Complete Challenges',
            tags: ['api', 'User'],
            payload: {
                maxBytes: 200000000,
                parse: true,
                output: 'file'
            },
            validate:{
                payload:{
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    video: Joi.any()
                        .meta({swaggerType: 'file'})
                        .optional()
                        .description('image file'),
                    image:Joi.any()
                        .meta({swaggerType: 'file'})
                        .optional()
                        .description('image file'),
                    videoThumbnail: Joi.any()
                        .meta({swaggerType: 'file'})
                        .optional()
                        .description('image file'),
                    keywords: Joi.array().optional(),
                    challengeKeywords: Joi.array().optional(),
                    iosKeywords: Joi.array().optional(),
                    textAnswer: Joi.string().optional(),
                    challengeLatitute: Joi.string().optional(),
                    challengeLongitute: Joi.string().optional(),
                    userLatitute: Joi.string().optional(),
                    userLongitute: Joi.string().optional(),
                    qrCode: Joi.string().optional(),
                    distanceDiff: Joi.string().optional(),
                    challengeId: Joi.string().required(),
                    points: Joi.string().required(),
                    isKeyword:Joi.string().required().valid(['true', 'false']),
                    isShown:Joi.string().required().valid(['true', 'false']),
                    isTest:Joi.string().optional().valid(['true', 'false']),

                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/gameFeed',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................gameFeed...............", payloadData);
            Controller.UserController.gameFeed(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Game Feed',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    startLimit: Joi.string()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
               //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: 'POST',
        path: '/api/User/challengeHint',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................challengeHint...............", payloadData);
            Controller.UserController.challengeHint(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Challenge Hint',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                    challengeId: Joi.string().required(),
                    hintType:Joi.string().required().valid(['Easy','Hard','Too tough'])
                    //startLimit: Joi.string()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
               //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: 'POST',
        path: '/api/User/liveStreamFeed',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................liveStreamFeed...............", payloadData);
            Controller.UserController.liveStreamFeed(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'LiveStream Feed',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    startLimit: Joi.string()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
              //      payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/leaderBoard',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................leaderBoard...............", payloadData);
            Controller.UserController.leaderBoard(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'leaderBoard',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    gameId: Joi.string().required(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/userProfile',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................userProfile...............", payloadData);
            Controller.UserController.userProfile(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'own Profile or other Profile',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    id: Joi.string().optional(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
               //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/myGames',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................myGames...............", payloadData);
            Controller.UserController.myGames(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'User Joined Games',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/searchTextAutoComplete',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................searchTextAutoComplete...............", payloadData);
            Controller.UserController.searchTextAutoComplete(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Search Text Auto Complete',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    searchText: Joi.string().required(),
                    accessToken: Joi.string().required(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                 //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/userAutoComplete',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................userAutoComplete...............", payloadData);
            Controller.UserController.userAutoComplete(payloadData, function (err, data) {
                //console.log("err1....",err,data);
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'User Auto Complete',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    searchText: Joi.string().required(),
                    accessToken: Joi.string().required(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
               //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/userLIsting',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................userLIsting...............", payloadData);
            Controller.UserController.userLIsting(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Users LIsting',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
               //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/teamUsersListing',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................teamUsersListing...............", payloadData);
            Controller.UserController.teamUsersListing(payloadData, function (err, data) {
                //console.log("err1....",err,data);
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Team Users Listing',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    teamId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
             //       payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/reported',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................reported...............", payloadData);
            Controller.UserController.reported(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Report the game/feed',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    id: Joi.string().required(),
                    type: Joi.string().required().valid(['Feed', 'Game'])
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/editProfile',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................editProfile...............", payloadData);
            Controller.UserController.editProfile(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Edit Profile',
            tags: ['api', 'User'],
            payload: {
                maxBytes: 200000000,
                parse: true,
                output: 'file'
            },
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    name: Joi.string(),
                    profilePic: Joi.any()
                        .meta({swaggerType: 'file'})
                        .optional()
                        .description('image file')
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/changePassword',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................changePassword...............", payloadData);
            Controller.UserController.changePassword(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.PASSWORDCHANGED, data))

                }
            });
        },
        config: {
            description: 'Change Password',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    newPassword: Joi.string().required(),
                    oldPassword: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                 //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/ownFeedDelete',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................ownFeedDelete...............", payloadData);
            Controller.UserController.feedDelete(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Delete Own Food',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken: Joi.string().required(),
                    feedId: Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
               //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/forgotPassword',
        handler: function (request, reply) {
            console.log("dfffffffffff",request.payload)
            var payloadData = request.payload;
            console.log("*8.................forgotPassword...............", payloadData);
            Controller.UserController.forgotPassword(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'Forgot Password',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    emailId:Joi.string().required(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/UserPointsListing',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................UserPointsListing...............", payloadData);
            Controller.UserController.UserPointsListing(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'User Points Listing',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },


    {
        method: 'POST',
        path: '/api/User/renderGameListforPericularRegion',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................renderGameListforPericularRegion...............", payloadData);
            Controller.UserController.renderGameListforPericularRegion(payloadData, function (err, data) {
                if (err) {
                    console.log(err);
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'User Points Listing',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                    cityName:Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },



    {
        method: 'POST',
        path: '/api/User/findCounty',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................findCounty...............", payloadData);
            Controller.UserController.findCounty(payloadData, function (err, data) {
                if (err) {
                    console.log(err);
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'User Points Listing',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
               //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },


    {
        method: 'POST',
        path: '/api/User/findAllStateName',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................findAllStateName...............", payloadData);
            Controller.UserController.findAllStateName(payloadData, function (err, data) {
                if (err) {
                    console.log(err);
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'User Points Listing',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                    countryName:Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                 //   payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },







    {
        method: 'POST',
        path: '/api/User/findCityName',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................findCityName...............", payloadData);
            Controller.UserController.findCityName(payloadData, function (err, data) {
                if (err) {
                    console.log(err);
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))

                }
            });
        },
        config: {
            description: 'User Points Listing',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                    stateName:Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                  //  payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/makeAttempts',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................makeAttempts...............", payloadData);
            Controller.UserController.makeAttempts(payloadData,function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
            },
        config: {
            description: 'Make attempts',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                    gameId:Joi.string().required(),
                    challengeId:Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                  //  payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/getTotalAteemptsOnChallenge',
        handler: function (request, reply) {
        var payloadData = request.payload;
            console.log("*8.................getTotalAteemptsOnChallenge...............", payloadData);
        Controller.UserController.getTotalAteemptsOnChallenge(payloadData,function (err, data) {
            if (err) {
                reply(UniversalFunctions.sendError(err));
            } else {
                reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
            }
        });
        },
        config: {
            description: 'Make attempts',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                    gameId:Joi.string().required(),
                    challengeId:Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                //    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/checkDependedchallengePlayed',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................checkDependedchallengePlayed...............", payloadData);
            Controller.UserController.checkDependedchallengePlayed(payloadData,function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'Make attempts',
            tags: ['api', 'User'],
            validate: {
            payload: {
                accessToken:Joi.string().required(),
                gameId:Joi.string().required(),
                challengeId:Joi.string().required()
            },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
               //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/pausedGame',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................pausedGame...............", payloadData);
            Controller.UserController.pausedGame(payloadData,function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'Paused Game ',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                    gameId:Joi.string().required(),
                    pause:Joi.boolean().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/usersChallenges',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................usersChallenges...............", payloadData);
            Controller.UserController.usersChallenges(payloadData,function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    console.log("..........err............",data);
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'users Challenges',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                    challengesId:Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/listCategory',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................listCategory...............", payloadData);
            Controller.UserController.listCategory(payloadData,function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    console.log("..........err............",data);
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'list category',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    level:Joi.string().required(),
                    id:Joi.string().optional()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: 'POST',
        path: '/api/User/endGame',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................endGame...............", payloadData);
            Controller.UserController.endGame(payloadData,function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    console.log("..........err............",data);
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'end Game',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    accessToken:Joi.string().required(),
                    gameId:Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/User/tokenUpdate',
        handler: function (request, reply) {
            var payloadData = request.payload;
            console.log("*8.................endGame...............", payloadData);
            Controller.UserController.tokenUpdate(payloadData,function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    console.log("..........err............",data);
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'token Update',
            tags: ['api', 'User'],
            validate: {
                payload: {
                    token:Joi.string().required(),
                    id:Joi.string().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    //     payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
];
