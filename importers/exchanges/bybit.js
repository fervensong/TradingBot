const util = require('../../core/util.js');
const _ = require('lodash');
const moment = require('moment');
const log = require('../../core/log');

const config = util.getConfig();

const dirs = util.dirs();

const QUERY_DELAY = 350;
const BATCH_SIZE = 500;
const SCAN_ITER_SIZE = 20000;
const BATCH_ITER_SIZE = BATCH_SIZE * 1;

const Fetcher = require(dirs.exchanges + 'bybit');
const retry = require(dirs.exchanges + '../exchangeUtils').retry;


Fetcher.prototype.getTrades = function(sinceTid, callback) {
  let lastScan = 0;

  const handle = (err, data) => {
    if (err) return callback(err);
    let result = _.map(data.result, function(trade) {
      return {
        tid: trade.id,
        //amount: Math.round(10000000.0*parseFloat(trade.qty)/ parseFloat(trade.price))*0.0000001,
        amount: parseFloat((parseFloat(trade.qty)/ parseFloat(trade.price)).toFixed(8)),
        date: moment.utc(trade.time).format("X"),
        price: parseFloat(trade.price)
      };
    });
    console.log("import trade");
    console.log("from id:"+sinceTid);
    console.log(_.first(result).tid);
    console.log(_.last(result).tid);
    callback(null, result);
  };

  //const fetch = cb => this.gdax_public.getProductTrades(this.pair, { after: sinceTid, limit: BATCH_SIZE }, this.processResponse('getTrades', cb));
  const fetch = cb =>  this.bybitApiTradeApi.tradeGet({"symbol":this.pair,"from":sinceTid,"limit":BATCH_SIZE}, this.processResponse('getTrades', cb));
  retry(null, fetch, handle);
};

Fetcher.prototype.findFirstTrade = function(sinceTs, callback) {
  let currentId = 0;
  let sinceM = moment(sinceTs).utc();

  log.info(`Scanning for the first trade ID to start batching requests, may take a few minutes ...`);

  const handle = (err, data) => {
    if (err) return callback(err);

    console.log("first trade.");
     var data_result= data.result;

    console.log(_.first(data_result).time);
    //onsole.log(_.last(data_result));

    let m = moment.utc(_.first(data_result).time);

    let ts = m.valueOf();
    console.log(ts);
    console.log("since"+ sinceTs);
    if (ts < sinceTs|| currentId ===_.first(data_result).id) {
      log.info(`First trade ID for batching found ${currentId - SCAN_ITER_SIZE}`);
      let firstID = _.first(data_result).id;
      console.log("first current Id:"+ firstID);
      return callback(undefined, firstID-1);
    }

    currentId = _.first(data_result).id;
    log.debug(`Have trade id ${currentId} for date ${_.first(data_result).time} ${sinceM.from(m, true)} to scan`);

    let nextScanId = currentId - SCAN_ITER_SIZE;
    if (nextScanId <= SCAN_ITER_SIZE) {
      currentId = BATCH_ITER_SIZE;
      log.info(`First trade ID for batching found ${currentId}`);
      return callback(undefined, currentId);
    }
    console.log(`next scan id ${nextScanId}`);
    console.log(`Have trade id ${currentId} for date ${_.first(data_result).time} ${sinceM.from(m, true)} to scan`)
    setTimeout(() => {
      //const fetch = cb => this.gdax_public.getProductTrades(this.pair, { after: nextScanId, limit: 1 }, this.processResponse('getTrades', cb));
      const fetch = cb => this.bybitApiTradeApi.tradeGet({"symbol":this.pair,"from":nextScanId,"limit":1}, this.processResponse('getTrades', cb));
      retry(null, fetch, handle);
    }, QUERY_DELAY);
  }

  const fetch = cb => this.bybitApiTradeApi.tradeGet({"symbol":this.pair,"from":0,"limit":1}, this.processResponse('getTrades', cb));
  retry(null, fetch, handle);
}


util.makeEventEmitter(Fetcher);

let end = false;
let done = false;
let from = false;

let batch = [];
let batchId = false; // Lowest ID for the current a batch

let lastId = false;

let latestId = false;
let latestMoment = false;

let fetcher = new Fetcher(config.watch);

let retryForever = {
  forever: true,
  factor: 1.2,
  minTimeout: 10 * 1000,
  maxTimeout: 120 * 1000
};

let fetch = () => {
  fetcher.import = true;

  // We are in the sub-iteration step for a given batch
  if (lastId) {
    setTimeout(() => {
      fetcher.getTrades(lastId+1, handleFetch);
    }, QUERY_DELAY);
  }
  // We are running the first query, and need to find the starting batch
  else {
    let process = (err, firstBatchId) => {
      if (err) return handleFetch(err);

      batchId = firstBatchId;
      console.log("first bactch id:"+ (batchId+1));
      fetcher.getTrades(batchId + 1, handleFetch);
    }
    fetcher.findFirstTrade(from.valueOf(), process);
  }
}

let handleFetch = (err, trades) => {
  if (err) {
    log.error(`There was an error importing from Bybit ${err}`);
    fetcher.emit('done');
    return fetcher.emit('trades', []);
  }
  //trades = trades.result;
  //console.log("handleFetch");
  //console.log("trade length:"+trades.length);
  //console.log(_.first(trades).tid);
  //console.log(_.last(trades).tid);
  //console.log(_.first(trades).tid);
  if (trades.length) {
    //batch = trades.concat(batch);
    batch = batch.concat(trades);

    let last = moment.unix(_.first(trades).date).utc();
    //console.log(last);

    lastId = _.last(trades).tid;

    let latestTrade = _.last(trades);
    if (!latestId || latestTrade.tid > latestId) {
      latestId = latestTrade.tid;
      latestMoment = moment.unix(latestTrade.date).utc();
    }
    console.log("lastId:"+lastId+" batchId:"+batchId +" last:"+last);
    // still doing sub-iteration in the batch
    if (latestMoment < end && lastId >= (batchId - BATCH_ITER_SIZE) && last >= from)
      return fetch();
  }

  batchId += BATCH_ITER_SIZE;
  lastId = batchId + 1;

  //console.log(end);
  if (latestMoment >= end) {
    fetcher.emit('done');
  }

  let endUnix = end.unix();
  let startUnix = from.unix();
  console.log(moment.unix(_.first(batch).date).utc());
  console.log(moment.unix(_.last(batch).date).utc());
  batch = _.filter(batch, t => t.date >= startUnix && t.date <= endUnix);
  fetcher.emit('trades', batch);
  batch = [];
}

module.exports = function (daterange) {
  from = daterange.from.utc().clone();
  end = daterange.to.utc().clone();

  return {
    bus: fetcher,
    fetch: fetch
  }
}
