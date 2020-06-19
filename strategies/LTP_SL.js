var settings = {
  wait: 0,
  // advice: 'short'
  advice: 'long'
};

// -------

var _ = require('lodash');
var log = require('../core/log.js');
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const  utils = require('../core/util');
const cache = require('../web/state/cache');
const broadcast = cache.get('broadcast');

const botConfigFilePath = __dirname + '/../bot-config.json';

let bTriggerStatus = "No";    // Now not triggered status ---.//

var gStrategy = undefined;
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  console.log(msg.content);
  const msgTimeFrame = parseInt(msg.content);
  if(msgTimeFrame == botConfig.timeFrame)
  {
    console.log("----From Alert----");
   const msgContentSplit = msg.content.split(":");

   if(msgContentSplit.length>1)
   {
      const SorL = msgContentSplit[1];
      if(SorL==="L"){
        console.log("--Long Position--");
        //bTriggerStatus = "L";
        if(gStrategy)
          gStrategy.advice({
            direction: "long",
            trigger: {
              type: 'trailingStop',
              trailPercentage: botConfig.setupTrade.stopLoss*.01
            }
          });
          console.log("--advice");
      }
      else if(SorL==="S")
      {
        bTriggerStatus = "S";
        console.log("--Short Position--");
      }
   }
  }
});
const botConfig = JSON.parse(fs.readFileSync(botConfigFilePath, 'utf8'));


var i = 0;
var bError = false;
var errorMsg ="";
var method = {
  init: function () {
      console.log("Strategy was loaded.");
      gStrategy = this;

      if(botConfig.discordToken && botConfig.discordToken!=="")
      {
        // try{
        //   client.login(botConfig.discordToken);
        //   console.log(client);
        // }
        // catch (e) {
        //   console.log(e);
        // }

        client.login(botConfig.discordToken).then(data=>{
          console.log("-----data");
            console.log(data);
        }).catch(err => {

            bError = true;
            errorMsg = "Alert is not working for trading. Please input token for alert";
            console.log("---token error");
            this.sendError(errorMsg);
            //throw  err;
          }
        );
      }
      else
      {
        bError = true;
        errorMsg = "Alert is not working for trading. Please input token for alert";
        console.log("---token error");
        this.sendError(errorMsg);
        // broadcast({
        //   type: 'gekko_error', id:0, error: "-----Error---"
        // });

        //return false;
      }


  },
  update: _.noop,
  log: _.noop,
  check: function(candle) {
    console.log("---close: "+ candle.close);
    if(bError)
    {
      console.log(bError);

    }
    if(bTriggerStatus ==="L")
    {
      bTriggerStatus = "No";
      //this.alert({newDirection:"long"});
      //this.advice('long');
      this.advice({
        direction: "long",
        trigger: {
          type: 'trailingStop',
          trailPercentage: botConfig.setupTrade.stopLoss*.01
        }
      });

    }
  }
};

module.exports = method;
