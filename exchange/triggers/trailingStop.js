const EventEmitter = require('events');
const fs = require('fs');
const botConfigFilePath = __dirname + '/../../bot-config.json';

// Note: as of now only supports trailing the price going up (after
// a buy), on trigger (when the price moves down) you should sell.


// @param initialPrice: initial price, preferably buy price
// @param trail: fixed offset from the price
// @param onTrigger: fn to call when the stop triggers
class TrailingStop extends EventEmitter {
  constructor({trail, initialPrice, onTrigger}) {
    console.log("---TrailingStop!--");
    const botConfig = JSON.parse(fs.readFileSync(botConfigFilePath, 'utf8'));
    super();
    this.trail = trail;
    this.isLive = true;
    this.onTrigger = onTrigger;

    this.previousPrice = initialPrice;
    this.initialPrice = initialPrice;
    this.trailingPoint = initialPrice - this.trail;
    this.takeProfitPoint = initialPrice *( 1  +  botConfig.setupTrade.takeProfit*.0001);
    this.initialProfitPoint = this.takeProfitPoint;
    this.takeLadderInc  = botConfig.setupTrade.ladderInc;
    this.ladderDropBack = botConfig.setupTrade.ladderDrop;
    this.currentLadderStepPoint = 0;

    // console.log("----trailing SLb: Initial Price  " + this.initialPrice);
    // console.log("-----Init: trailingPoint  "+ this.trailingPoint );
    // console.log("-----Init: trail          "+ this.trail );
    // console.log("-----Init: takeProfit     "+ this.takeProfitPoint);
    // console.log("-----Init: ladderStep     "+ this.currentLadderStepPoint);
  }

  updatePrice(price) {
    if(!this.isLive) {
      return;
    }

    if(price > this.trailingPoint + this.trail) {
      this.trailingPoint = price - this.trail;
    }
    //-------------- Ladder TP ------------------//
    //console.log("--- take profit before changed: "+ this.takeProfitPoint);
    if(price > this.takeProfitPoint)
    {
         if(this.currentLadderStepPoint<this.ladderDropBack)
        {
            this.currentLadderStepPoint = this.currentLadderStepPoint + parseFloat(this.takeLadderInc);
            this.takeProfitPoint = this.initialProfitPoint +  this.currentLadderStepPoint;

             // console.log("TP active! "+ this.takeProfitPoint);
             // console.log("-----LTP: ladderStep      " + this.currentLadderStepPoint);
             // console.log("-----LTP: updateTakeProfitPoint " + this.takeProfitPoint  );
        }
        else {
            this.trigger();
            return;
        }
    }
    this.previousPrice = price;

    // console.log("-----trailing SL: takeProfit "+ this.takeProfitPoint );
    // console.log("-----trailing SL: LD Step Point "+ this.currentLadderStepPoint );
    console.log("-----trailing SL: trailingPoint "+ this.trailingPoint );

    //---------------- SL ---------------//
    if(price <= this.trailingPoint) {
      this.trigger();
    }
  }

  updateTrail(trail) {
    if(!this.isLive) {
      return;
    }

    this.trail = trail;
    this.trailingPoint = this.previousPrice - this.trail;
    // recheck whether moving the trail triggered.
    this.updatePrice(this.previousPrice);
  }

  trigger() {
    if(!this.isLive) {
      return;
    }

    this.isLive = false;
    console.log("-----trailingStop: trigger---");
    if(this.onTrigger) {
      this.onTrigger(this.previousPrice);
    }
    this.emit('trigger', this.previousPrice);
  }
}

module.exports = TrailingStop;
