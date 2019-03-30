'use strict';
var Config = require('../Config');
var TokenManager = require('./TokenManager');

exports.connectSocket = function (server) {
    if (!server.app) {
        server.app = {}
    }
    server.app.socketConnections = {};
    var socket = require('socket.io').listen(server.listener);

    socket.on('disconnect', function(){
        console.log('socket disconnected')
    });

    socket.on('connection', function(socket){

        socket.on('messageFromClient', function (data) {
            //Update SocketConnections
            if (data && data.token) {
                TokenManager.decodeToken(data.token, function (err, decodedData) {
                    if (!err && decodedData.id) {
                        if (server.app.socketConnections.hasOwnProperty(decodedData.id)) {
                            server.app.socketConnections[decodedData.id].socketId = socket.id;
                            socket.emit('messageFromServer', { message:'Added To socketConnections',performAction:'INFO'});
                        } else {
                            server.app.socketConnections[decodedData.id] = {
                                socketId: socket.id
                            };
                            socket.emit('messageFromServer', { message:'Socket id Updated',performAction:'INFO'});
                        }
                    } else {
                        socket.emit('messageFromServer', { message:'Invalid Token',performAction:'INFO'});
                    }
                })
            }else {
                console.log('msgFromClient',data)
            }
        });

        socket.emit('messageFromServer', { message:'WELCOME TO BOOHOL', performAction:'INFO'});

        process.on('yourCustomEvent', function (data) {
            if (data['yourConditionHere']){
                var sparkIdToSend = server.app.socketConnections[data['userId'].toString()]
                    && server.app.socketConnections[data['userId']].socketId;
                //GetsocketId
                if (sparkIdToSend) {
                    socket.to(sparkIdToSend).emit('messageFromServer', {
                        message: 'ANY_KIND_OF_MESSAGE_HERE',
                        performAction : 'INFO'
                    });
                } else {
                    console.log('Socket id not found')
                }
            }else {
                console.log('User id not found')
            }

        });

    });
};
