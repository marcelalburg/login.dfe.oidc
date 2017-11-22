const config = require('./../Config');
module.exports = (config && config.hotConfig && config.hotConfig.url) ? require('./HotConfigApiAdapter') : require('./HotConfigFileAdapter');
