// required indicators
var EMA = require('./EMA.js');

var Indicator = function(config) {
  this.input = 'price';
  this.result = false;
  this.inner = new EMA(config.weight);
  this.outer = new EMA(config.weight);

  this.viz = new Visualization({
    location: "subgraph", // subgraph / primary
    title: "PPO"
  })
  this.viz.addDataset({
    name:"histogram",
    type:"bars",
    range:[100,0],
    colors:["#00ff00","#ff0000"]
  })
  this.viz.addDataset({
    name:"long",
    type:"line",
    range:false,
  })
  this.viz.addDataset({
    name:"short",
    type:"line",
    range:false,
  })
}

// add a price and calculate the EMAs and
// the result
Indicator.prototype.update = function(price) {
  this.inner.update(price);
  this.outer.update(this.inner.result);
  this.result = 2 * this.inner.result - this.outer.result;
  this.viz.addDatapoint("histogram",{
    result:0, // value to chart
    color:0 // color index
  })
  this.viz.addDatapoint("long",{
    result:0
  })
  this.viz.addDatapoint("short",{
    result:0
  })
}

module.exports = Indicator;
