var extend = require('extend');
var Winston = require('winston');
var Papertrail = require('winston-papertrail').Papertrail;
var instance;

function Logger(config, program) {

    program = program || 'default';

    var paperTransport = new Papertrail({
        host: config.logger.papertrail.host,
        port: config.logger.papertrail.port,
        program: program,
        colorize: true
    });

    var consoleTransport = new Winston.transports.Console({
        level: 'debug',
        colorize: true,
        timestamp: function() {
            return (new Date()).toLocaleString();
        }
    });

    var logger = new Winston.Logger({
        levels: {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        },
        transports: [
            consoleTransport,
            paperTransport
        ]
    });

    logger.line = function(){
        logger.info('-------------------------------');
    };

    var log = console.log;
    logger.extend(console);
    console.log = log;

    return logger;

}

module.exports = {
    create: function(a, b) {
        instance = new Logger(a, b);
        return instance;
    },
    getInstance: function() {
        return instance;
    }
}