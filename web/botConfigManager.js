const fs = require('fs');
const _ = require('lodash');
const cache = require('./state/cache');
const broadcast = cache.get('broadcast');

const botConfigFilePath = __dirname + '/../bot-config.json';

// on init:
const noConfigFile = !fs.existsSync(botConfigFilePath);

if(noConfigFile)
  fs.writeFileSync(
    botConfigFilePath,
    JSON.stringify({})
  );

const botConfig = JSON.parse( fs.readFileSync(botConfigFilePath, 'utf8') );

module.exports = {
  get: () => _.keys(botConfig),
  set: (timeframe) =>{

    fs.writeFileSync(botConfigFilePath, JSON.stringify(botConfig));
    broadcast({
  type: 'timeFrame',
  timeframe: timeframe
})
},
// note: overwrites if exists
add: (exchange, props) => {
  apiKeys[exchange] = props;
  fs.writeFileSync(apiKeysFile, JSON.stringify(apiKeys));

  broadcast({
    type: 'apiKeys',
    exchanges: _.keys(apiKeys)
  });
},

  // retrieve api keys
  // this cannot touch the frontend for security reaons.
  _getApiKeyPair: key => apiKeys[key]
}
