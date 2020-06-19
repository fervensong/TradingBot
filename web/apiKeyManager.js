const fs = require('fs');
const _ = require('lodash');
const cache = require('./state/cache');
const broadcast = cache.get('broadcast');

const apiKeysFile = __dirname + '/../SECRET-api-keys.json';
const botConfigFilePath = __dirname + '/../bot-config.json';

// on init:
const noApiKeysFile = !fs.existsSync(apiKeysFile);
const noConfigFile = !fs.existsSync(botConfigFilePath);

if(noApiKeysFile)
  fs.writeFileSync(
    apiKeysFile,
    JSON.stringify({})
  );
if(noConfigFile)
  fs.writeFileSync(botConfigFilePath, JSON.stringify({timeFrame:5}));

const apiKeys = JSON.parse( fs.readFileSync(apiKeysFile, 'utf8') );
const botConfig = JSON.parse(fs.readFileSync(botConfigFilePath, 'utf8'));

module.exports = {
  get: () => {return _.keys(apiKeys);},
  getConfig: () => botConfig,

  // note: overwrites if exists
  add: (exchange, props) => {
    Object.keys(props).forEach(function(key) {
      props[key] = props[key].trim();
    });
    apiKeys[exchange] = props;
    fs.writeFileSync(apiKeysFile, JSON.stringify(apiKeys));

    broadcast({
      type: 'apiKeys',
      exchanges: _.keys(apiKeys)
    });
  },
  remove: exchange => {
    if(!apiKeys[exchange])
      return;

    delete apiKeys[exchange];
    fs.writeFileSync(apiKeysFile, JSON.stringify(apiKeys));

    broadcast({
      type: 'apiKeys',
      exchanges: _.keys(apiKeys)
    });
  },
  setTimeFrame: timeFrame => {
     console.log(botConfig);
      botConfig.timeFrame = timeFrame;
      fs.writeFileSync(botConfigFilePath, JSON.stringify(botConfig));
    broadcast({
      type: 'timeFrame',
      timeFrame: timeFrame
    });
  },
  setDiscordToken: token => {
    console.log(token);
    botConfig.discordToken = token;
    fs.writeFileSync(botConfigFilePath, JSON.stringify(botConfig));
    broadcast({      type: 'discordToken',      discordToken: token    });
  },
  changeSetupTrade: setupParameters => {
    console.log(setupParameters);
    botConfig.setupTrade = setupParameters;
    fs.writeFileSync(botConfigFilePath, JSON.stringify(botConfig));
    broadcast({      type: 'setupTrade',    setupTrade: setupParameters });
  },
  // retrieve api keys
  // this cannot touch the frontend for security reaons.
  _getApiKeyPair: key => apiKeys[key]
}
