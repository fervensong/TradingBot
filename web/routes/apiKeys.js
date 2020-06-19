const cache = require('../state/cache');
const manager = cache.get('apiKeyManager');
//const configManager= cache.get('botConfigManager');

module.exports = {
  get: function *() {
     const key = manager.get();
     const config = manager.getConfig();

    this.body = {key:key, config:config};
  },
  add: function *() {
    const content = this.request.body;

    manager.add(content.exchange, content.values);

    this.body = {
      status: 'ok'
    };
  },
  remove: function *() {
    const exchange = this.request.body.exchange;

    manager.remove(exchange);

    this.body = {
      status: 'ok'
    };
  },
  changeTimeFrame: function *() {
    const content = this.request.body;
    console.log(content);
    manager.setTimeFrame(content.timeFrame);
    //content.timeFrame
    this.body = {
      status: 'ok'
    };
  },
  setDiscordToken: function *() {
    const content = this.request.body;
    console.log(content);
    manager.setDiscordToken(content.discordToken);
    //content.timeFrame
    this.body = {
      status: 'ok'
    };
  },
  changeSetupTrade: function *() {
    const content = this.request.body;
    console.log(content);
    manager.changeSetupTrade(content);
    //content.timeFrame
    this.body = {
      status: 'ok'
    };
  }
}
