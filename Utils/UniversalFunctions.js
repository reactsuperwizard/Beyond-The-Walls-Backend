
var Joi = require('joi');
var async = require('async');
var MD5 = require('md5');
var Boom = require('boom');
var CONFIG = require('../Config');
var Models = require('../Models');
var randomstring = require("randomstring");
var GeoPoint = require('geopoint');
var distance = require('google-distance-matrix');
distance.key(CONFIG.APP_CONSTANTS.SERVER.GOOGLE_API_KEY);
var NotificationManager = require('../Lib/NotificationManager');
var validator = require('validator');
var nodemailer = require('nodemailer');

var VALID_ERRAND_STATUS_ARRAY = [];
for (var key in CONFIG.APP_CONSTANTS.DATABASE.ERRANDS_STATUS) {
    if (CONFIG.APP_CONSTANTS.DATABASE.ERRANDS_STATUS.hasOwnProperty(key)) {
        VALID_ERRAND_STATUS_ARRAY.push(CONFIG.APP_CONSTANTS.DATABASE.ERRANDS_STATUS[key])
    }
}

var calculateDeliveryCost = function (originLatlong, destLatLong, callback) {
    var estimatedCost = CONFIG.APP_CONSTANTS.SERVER.BASE_DELIVERY_FEE;
    calculateDistanceViaGoogleDistanceMatrix(originLatlong,destLatLong, function (err, distanceInMiles) {
        console.log('distances',err,distanceInMiles)
        if (err){
            callback(err)
        }else {
            distanceInMiles = distanceInMiles && distanceInMiles.toFixed() || 0;
            estimatedCost = estimatedCost +distanceInMiles * CONFIG.APP_CONSTANTS.SERVER.COST_PER_KM;
            callback(null, estimatedCost)
        }
    })
};

var calculateDistanceViaGoogleDistanceMatrix = function (origin, destination, callback) {
    var origins = [origin];
    var destinations = [destination];
    var duration = null;

    distance.matrix(origins, destinations, function (err, distances) {
        if (err){
            callback(err)
        }else if (distances.status == 'OK' && distances.rows && distances.rows[0] && distances.rows[0].elements
            && distances.rows[0].elements[0] && distances.rows[0].elements[0].duration && distances.rows[0].elements[0].duration.hasOwnProperty('value')) {
            duration = (distances.rows[0].elements[0].duration.value)/60;
        }
        callback(null,duration);
    });
};

var sendError = function (data) {
    console.trace('ERROR OCCURED ', data)
    if (typeof data == 'object' && data.hasOwnProperty('statusCode') && data.hasOwnProperty('customMessage')) {
        console.log('attaching resposnetype',data.type)
        var errorToSend = Boom.create(data.statusCode, data.customMessage);
        errorToSend.output.payload.responseType = data.type;
        return errorToSend;
    } else {
        var errorToSend = '';
        if (typeof data == 'object') {
            if (data.name == 'MongoError') {
                errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DB_ERROR.customMessage;
                if (data.code = 11000) {
                    var duplicateValue = data.errmsg && data.errmsg.substr(data.errmsg.lastIndexOf('{ : "') + 5);
                        duplicateValue = duplicateValue.replace('}','');
                    errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DUPLICATE.customMessage + " : " + duplicateValue;
                    if (data.message.indexOf('customer_1_streetAddress_1_city_1_state_1_country_1_zip_1')>-1){
                        errorToSend = CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DUPLICATE_ADDRESS.customMessage;
                    }
                }
            } else if (data.name == 'ApplicationError') {
                errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.APP_ERROR.customMessage + ' : ';
            } else if (data.name == 'ValidationError') {
                errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.APP_ERROR.customMessage + data.message;
            } else if (data.name == 'CastError') {
                errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DB_ERROR.customMessage + CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_ID.customMessage + data.value;
            }
        } else {
            errorToSend = data
        }
        var customErrorMessage = errorToSend;
        if (typeof customErrorMessage == 'string'){
            if (errorToSend.indexOf("[") > -1) {
                customErrorMessage = errorToSend.substr(errorToSend.indexOf("["));
            }
            customErrorMessage = customErrorMessage && customErrorMessage.replace(/"/g, '');
            customErrorMessage = customErrorMessage && customErrorMessage.replace('[', '');
            customErrorMessage = customErrorMessage && customErrorMessage.replace(']', '');
        }
        return Boom.create(400,customErrorMessage)
    }
};

var sendSuccess = function (successMsg, data) {
    successMsg = successMsg || CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT.customMessage;
    if (typeof successMsg == 'object' && successMsg.hasOwnProperty('statusCode') && successMsg.hasOwnProperty('customMessage')) {
        return {statusCode:successMsg.statusCode, message: successMsg.customMessage, data: data || null};

    }else {
        return {statusCode:200, message: successMsg, data: data || null};

    }
};

var checkDuplicateValuesInArray = function (array) {
    console.log('array',array)
    var storeArray = [];
    var duplicateFlag = false;
    if(array && array.length>0){
        for (var i=0; i<array.length;i++){
            if (storeArray.indexOf(array[i]) == -1){
                console.log('push',array[i])
                storeArray.push(array[i])
            }else {
                console.log('break')
                duplicateFlag = true;
                break;
            }
        }
    }
    storeArray = [];
    return duplicateFlag;
};

var failActionFunction = function (request, reply, source, error) {
    var customErrorMessage = '';
    if (error.output.payload.message.indexOf("[") > -1) {
        customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf("["));
    } else {
        customErrorMessage = error.output.payload.message;
    }
    customErrorMessage = customErrorMessage.replace(/"/g, '');
    customErrorMessage = customErrorMessage.replace('[', '');
    customErrorMessage = customErrorMessage.replace(']', '');
    error.output.payload.message = customErrorMessage;
    delete error.output.payload.validation
    return reply(error);
};


var customQueryDataValidations = function (type,key, data, callback) {
    var schema = {};
    switch(type){
        case 'PHONE_NO' : schema[key] = Joi.string().regex(/^[0-9]+$/).length(10);
            break;
        case 'NAME' : schema[key] = Joi.string().regex(/^[a-zA-Z ]+$/).min(2);
            break;
        case 'BOOLEAN' : schema[key] = Joi.boolean();
            break;
    }
    var value = {};
    value[key] = data;

    Joi.validate(value, schema, callback);
};


var authorizationHeaderObj = Joi.object({
    authorization: Joi.string().required()
}).unknown();

var getEmbeddedDataFromMongo = function (dataAry, keyToSearch, referenceIdToSearch, embeddedFieldModelName, variableToAttach, callback) {
    if (!dataAry || !keyToSearch || !variableToAttach || !embeddedFieldModelName || !Models[embeddedFieldModelName]) {
        callback(CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    } else {
        if (dataAry.length > 0) {
            var taskToRunInParallel = [];
            dataAry.forEach(function (dataObj) {
                taskToRunInParallel.push((function (dataObj) {
                    return function (embeddedCB) {
                        if (!dataObj[referenceIdToSearch]) {
                            callback(CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                        } else {
                            var criteria = {};
                            criteria[keyToSearch] = dataObj[referenceIdToSearch];
                            Models[embeddedFieldModelName].find(criteria, function (err, modelDataAry) {
                                if (err) {
                                    embeddedCB(err)
                                } else {
                                    if (modelDataAry) {
                                        dataObj[variableToAttach] = modelDataAry
                                    }
                                    embeddedCB()
                                }
                            })
                        }

                    }
                })(dataObj));
            });

            async.parallel(taskToRunInParallel, function (err, result) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, dataAry)
                }
            })

        } else {
            callback(null, dataAry)
        }
    }
};

var CryptData = function (stringToCrypt) {
    return MD5(MD5(stringToCrypt));
};

var generateRandomString = function () {
    return randomstring.generate(7);
};

var filterArray = function (array) {
    return array.filter(function (n) {
        return n != undefined && n != ''
    });
};

var sanitizeName = function (string) {
    return filterArray(string && string.split(' ') || []).join(' ')
};

var verifyEmailFormat = function (string) {
    return validator.isEmail(string)
};

var getFileNameWithUserId = function (thumbFlag, fullFileName, userId) {
    var prefix = CONFIG.APP_CONSTANTS.DATABASE.PROFILE_PIC_PREFIX.ORIGINAL;
    var ext = fullFileName && fullFileName.length > 0 && fullFileName.substr(fullFileName.lastIndexOf('.') || 0, fullFileName.length);
    if (thumbFlag) {
        prefix = CONFIG.APP_CONSTANTS.DATABASE.PROFILE_PIC_PREFIX.THUMB;
    }
    return prefix + userId + ext;
};

var getFileNameWithUserIdWithCustomPrefix = function (thumbFlag, fullFileName,type, userId) {
    var prefix = '';
    if (type == CONFIG.APP_CONSTANTS.DATABASE.FILE_TYPES.LOGO){
        prefix = CONFIG.APP_CONSTANTS.DATABASE.LOGO_PREFIX.ORIGINAL;
    }else if (type == CONFIG.APP_CONSTANTS.DATABASE.FILE_TYPES.DOCUMENT){
        prefix = CONFIG.APP_CONSTANTS.DATABASE.DOCUMENT_PREFIX;
    }
    var ext = fullFileName && fullFileName.length > 0 && fullFileName.substr(fullFileName.lastIndexOf('.') || 0, fullFileName.length);
    if (thumbFlag && type == CONFIG.APP_CONSTANTS.DATABASE.FILE_TYPES.LOGO) {
        prefix = CONFIG.APP_CONSTANTS.DATABASE.LOGO_PREFIX.THUMB;
    }
    return prefix + userId + ext;
};

var getDistanceBetweenPoints = function (origin, destination) {
    var start = new GeoPoint(origin.lat, origin.long);
    var end = new GeoPoint(destination.lat, destination.long);
    return  start.distanceTo(end, true);
};

var validateLatLongValues = function (lat, long) {
    var valid = true;
    if (lat < -90 || lat>90){
        valid = false;
    }
    if (long <-180 || long > 180){
        valid = false;
    }
    return valid;
};
var deleteUnnecessaryUserData = function (userObj) {
    console.log('deleting>>',userObj)
    delete userObj['__v'];
    delete userObj['password'];
    delete userObj['accessToken'];
    delete userObj['emailVerificationToken'];
    delete userObj['passwordResetToken'];
    delete userObj['registrationDate'];
    delete userObj['OTPCode'];
    delete userObj['facebookId'];
    delete userObj['codeUpdatedAt'];
    delete userObj['deviceType'];
    delete userObj['deviceToken'];
    delete userObj['appVersion'];
    delete userObj['isBlocked'];
    console.log('deleted',userObj)
    return userObj;
};

var getFileNameWithUserIdForVideo = function (fullFileName, userId) {
    var prefix = CONFIG.APP_CONSTANTS.DATABASE.VIDEO.ORIGINAL;
    var ext = fullFileName && fullFileName.length > 0 && fullFileName.substr(fullFileName.lastIndexOf('.') || 0, fullFileName.length);
    if(ext == 'o'){
        return prefix + userId + '.mp4';
    }
    else{
        return prefix + userId + ext;
    }

};


var sendMailthroughSMTP = function (subject,receiversEmail,content,type,callback) {

    var transporter = nodemailer.createTransport("SMTP", {
        service: "Gmail",
        auth: {
            user:CONFIG.APP_CONSTANTS.SERVER.SUPPORT_EMAIL,
            pass: CONFIG.APP_CONSTANTS.SERVER.PASSWORD,
        }
    });

    if(type==0)
    {
        var mailOptions = {
            from: CONFIG.APP_CONSTANTS.SERVER.SUPPORT_EMAIL,
            to: receiversEmail, // list of receivers
            subject: subject, // Subject line
            html: content  // plaintext body
        };
    }
    else{
        var mailOptions = {
            from: CONFIG.APP_CONSTANTS.SERVER.SUPPORT_EMAIL,
            to: receiversEmail, // list of receivers
            subject: subject, // Subject line
            text: content // plaintext body
        };
    }
    transporter.sendMail(mailOptions, function (error, info) {
        console.log("************sendMail**************",error,info)
        if (error) {
            console.log("err",error);
            callback(null)
        } else {
            console.log('Message sent: ' + JSON.stringify(info));
            callback(null);
        }

    });

}

module.exports = {
    sendError: sendError,
    sendSuccess: sendSuccess,
    calculateDeliveryCost: calculateDeliveryCost,
    checkDuplicateValuesInArray: checkDuplicateValuesInArray,
    CryptData: CryptData,
    failActionFunction: failActionFunction,
    NotificationManager: NotificationManager,
    authorizationHeaderObj: authorizationHeaderObj,
    getEmbeddedDataFromMongo: getEmbeddedDataFromMongo,
    verifyEmailFormat: verifyEmailFormat,
    sanitizeName: sanitizeName,
    deleteUnnecessaryUserData: deleteUnnecessaryUserData,
    getDistanceBetweenPoints: getDistanceBetweenPoints,
    validateLatLongValues: validateLatLongValues,
    filterArray: filterArray,
    CONFIG: CONFIG,
    VALID_ERRAND_STATUS_ARRAY: VALID_ERRAND_STATUS_ARRAY,
    generateRandomString: generateRandomString,
    getFileNameWithUserId : getFileNameWithUserId,
    getFileNameWithUserIdWithCustomPrefix : getFileNameWithUserIdWithCustomPrefix,
    customQueryDataValidations : customQueryDataValidations,
    getFileNameWithUserIdForVideo:getFileNameWithUserIdForVideo,
    sendMailthroughSMTP:sendMailthroughSMTP
};