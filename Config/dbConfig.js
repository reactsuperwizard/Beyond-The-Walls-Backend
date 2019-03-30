'use strict';

var mongo = {
    //live server
    //URI: process.env.MONGO_URI || 'mongodb://btw1:vuf7CDARcdzXTZ8PYqSPQk7@18.221.1.76/BTW',   //* server db with beanstalk
    //live server
    //URI: process.env.MONGO_URI || 'mongodb://13.58.236.227/BTW',
    URI:'mongodb://localhost:27017/BTW',   //* server db without beanstalk
    //URI: process.env.MONGO_URI || 'localhost/btw_backup',
    //URI: process.env.MONGO_URI || 'mongodb://52.14.12.206/BTW',
    // URI: process.env.MONGO_URI ||'mongodb://Rajendra:Rajendra@ds143559.mlab.com:43559/rajendrakamal',
    port: 27017
};



module.exports = {
    mongo: mongo
};
