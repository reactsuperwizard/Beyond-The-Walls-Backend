var Config = require('../Config');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var async = require('async');
var Path = require('path');
var knox = require('knox');
var fsExtra = require('fs-extra');


var baseFolder = Config.awsS3Config.s3BucketCredentials.folder.profilePicture + '/';
var baseURL = Config.awsS3Config.s3BucketCredentials.s3URL + '/' + baseFolder;

function uploadFileToS3WithThumbnail(fileData, userId, callbackParent) {

    var profilePicURL = {
        original: null,
        thumbnail: null
    };
    var originalPath = null;
    var thumbnailPath = null;
    var dataToUpload = [];

    async.series([
        function (cb) {
           
            if (!userId || !fileData || !fileData.filename) {
                console.log('in upload file to s3', userId, fileData)
                cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
            } else {
                cb(null);
            }
        },
        function (cb) {
       
            profilePicURL.original = UniversalFunctions.getFileNameWithUserId(false, fileData.filename, userId);
            profilePicURL.thumbnail = UniversalFunctions.getFileNameWithUserId(true, fileData.filename, userId);
            cb(null);
        },
        function (cb) {
            //Save File
            var path = Path.resolve(".") + "/uploads/" + profilePicURL.original;
            console.log("...path....", path);
            saveFile(fileData.path, path, function (err, data) {
                cb(err, data)
            })
        },
        function (cb) {
            //Create Thumbnail
            originalPath = Path.resolve(".") + "/uploads/" + profilePicURL.original;
            thumbnailPath = Path.resolve(".") + "/uploads/" + profilePicURL.thumbnail;
            createThumbnailImage(originalPath, thumbnailPath, function (err, data) {
                dataToUpload.push({
                    originalPath: originalPath,
                    nameToSave: profilePicURL.original
                });
                dataToUpload.push({
                    originalPath: thumbnailPath,
                    nameToSave: profilePicURL.thumbnail
                });
                cb(err, data)
            })
        },
        function (cb) {
            //Upload both images on S3
            //  console.log("*******!11")
            parallelUploadTOS3(dataToUpload, cb);
        }
    ], function (err, result) {
        console.log(",,,,,,,,,,,,,,,,,,", profilePicURL);
        //console.log(",,,,,,,,,result,,,,,,,,,", result);
        callbackParent(err, profilePicURL)
    });
}

function uploadFile(fileData, userId, type, callbackParent) {
    //Verify File Data
    var imageURL = {
        original: null,
        thumbnail: null
    };
    var logoURL = {
        original: null,
        thumbnail: null
    };
    var documentURL = null;

    var originalPath = null;
    var thumbnailPath = null;
    var dataToUpload = [];

    async.series([
        function (cb) {
            //Validate fileData && userId
            if (!userId || !fileData || !fileData.filename) {
                console.log('in upload file to s3', userId, fileData)
                cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
            } else {
                // TODO Validate file extensions
                cb();
            }
        }, function (cb) {
            //Set File Names
            imageURL.original = UniversalFunctions.getFileNameWithUserIdWithCustomPrefix(false, fileData.filename, type, userId);
            imageURL.thumbnail = UniversalFunctions.getFileNameWithUserIdWithCustomPrefix(true, fileData.filename, type, userId);
            cb();
        },
        function (cb) {
            //Save File
            var path = Path.resolve(".") + "/uploads/" + imageURL.original;
            saveFile(fileData.path, path, function (err, data) {
                cb(err, data)
            })
        },
        function (cb) {
            //Create Thumbnail if its a logo
            originalPath = Path.resolve(".") + "/uploads/" + imageURL.original;
            dataToUpload.push({
                originalPath: originalPath,
                nameToSave: imageURL.original
            });
            if (type == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.FILE_TYPES.LOGO) {
                thumbnailPath = Path.resolve(".") + "/uploads/" + imageURL.thumbnail;
                createThumbnailImage(originalPath, thumbnailPath, function (err, data) {
                    dataToUpload.push({
                        originalPath: thumbnailPath,
                        nameToSave: imageURL.thumbnail
                    });
                    cb(err, data)
                })
            } else {
                cb();
            }

        },
        function (cb) {
            //Upload both images on S3
            parallelUploadTOS3(dataToUpload, cb);
        }
    ], function (err, result) {
        callbackParent(err, imageURL)
    });
}


function parallelUploadTOS3(filesArray, callback) {
    //Create S3 Client
    var client = knox.createClient({
          key: Config.awsS3Config.s3BucketCredentials.accessKeyId
        , secret: Config.awsS3Config.s3BucketCredentials.secretAccessKey
        , bucket: Config.awsS3Config.s3BucketCredentials.bucket
    });
    var s3ClientOptions = {'x-amz-acl': 'public-read'};
    var taskToUploadInParallel = [];
    filesArray.forEach(function (fileData) {
        taskToUploadInParallel.push((function (fileData) {
            return function (internalCB) {
                if (!fileData.originalPath || !fileData.nameToSave) {
                    internalCB(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                } else {
                    //  console.log("*******!1qsasasas1as",fileData);
                    client.putFile(fileData.originalPath, fileData.nameToSave, s3ClientOptions, function (err, result) {
                        //console.log("ASsdsasad",result);
                        deleteFile(fileData.originalPath);
                        internalCB(err, result);
                    })
                }
            }
        })(fileData))
    });

    async.parallel(taskToUploadInParallel, callback)
}

function parallelVideoUploadTOS3(filesArray, callback) {
    //Create S3 Client
    //console.log("****************",filesArray);
    var client = knox.createClient({
        key: Config.awsS3Config.s3BucketCredentials.accessKeyId
        , secret: Config.awsS3Config.s3BucketCredentials.secretAccessKey
        , bucket: Config.awsS3Config.s3BucketCredentials.bucket
    });
    var s3ClientOptions = {'x-amz-acl': 'public-read'};
    client.putFile(filesArray[0].originalPath, filesArray[0].nameToSave, s3ClientOptions, function (err, result) {
        deleteFile(filesArray[0].originalPath);
        callback(err, result);
    });
}

function uploadVideo(fileData, userId, callbackParent) {
    var videoUrl = null;
    var dataToUpload = [];
    async.series([
        function (cb) {
            //Validate fileData && userId
            if (!userId || !fileData || !fileData.filename) {
                console.log('in upload file to s3', userId, fileData)
                cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
            } else {
                // TODO Validate file extensions
                cb();
            }
        }, function (cb) {
            //Set File Names
            videoUrl = UniversalFunctions.getFileNameWithUserIdForVideo(fileData.filename, userId);
            cb();
        },
        function (cb) {
            //Save File
            console.log("****ssdsdsdds**********",videoUrl);
            var path = Path.resolve(".") + "/uploads/" + videoUrl;
            console.log("********path***************",path);
            dataToUpload.push({
                originalPath: path,
                nameToSave: videoUrl
            });
           saveFile(fileData.path, path, function (err, data) {
                cb(err, data)
            })
        },
        function (cb) {
            console.log("***********dataToUpload***********",dataToUpload);
            //Upload both images on S3
            parallelVideoUploadTOS3(dataToUpload, cb);
        }
    ], function (err, result) {
        console.log(",,,,,,,,,,videoUrl,,,,,,,,", videoUrl);
        callbackParent(err, videoUrl)
    });
}


/*
 Save File on the disk
 */
function saveFile(fileData, path, callback) {
    fsExtra.copy(fileData, path, callback);
}

function deleteFile(path) {
    fsExtra.delete(path, function (err) {
        console.log('error deleting file>>', err)
    });
}

/*
 Create thumbnail image using graphics magick
 */

function createThumbnailImage(originalPath, thumbnailPath, callback) {
    var gm = require('gm').subClass({imageMagick: true});
    gm(originalPath)
        .resize(Config.APP_CONSTANTS.SERVER.THUMB_WIDTH, Config.APP_CONSTANTS.SERVER.THUMB_HEIGHT, "!")
        .autoOrient()
        .write(thumbnailPath, function (err, data) {
            callback(err)
        })
}


module.exports = {
    uploadFileToS3WithThumbnail: uploadFileToS3WithThumbnail,
    uploadFile: uploadFile,
    uploadVideo: uploadVideo
};
