
'use strict';
var UserRoute = require('./UserRoute');
var AdminRoute = require('./AdminRoute');

var all = [].concat(UserRoute,AdminRoute);

module.exports = all;

