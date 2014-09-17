
var config = require('../config/config');
var secret = require('../config/secret');
var extend = require('extend');

module.exports = function() {
    return extend(true, {}, config, secret);
}();