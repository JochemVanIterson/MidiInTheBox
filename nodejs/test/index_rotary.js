const Gpio = require('onoff').Gpio;
const button1 = new Gpio(22, 'in', 'both');
const button2 = new Gpio(22, 'in', 'both');

var buttonstate1 = false;
var buttonstate2 = false;
var armed = false;

var lastTick = process.hrtime();
var elapsedTime = 0;

console.log("Running");


button1.watch((err, value) => {
  buttonstate1 = value;
  checkDirection();
});
button2.watch((err, value) => {
  buttonstate2 = value;
  checkDirection();
});

function checkDirection(){
  if (buttonstate1 == buttonstate2 && !buttonstate1){
    armed = true;
  } else if (armed){
    armed = false;
    console.log("Armed");
    console.log("button1", buttonstate1);
    console.log("button2", buttonstate2);
    elapsedTime = process.hrtime(lastTick);
    lastTick = process.hrtime();
    console.log("elapsedTime", elapsedTime[0]+elapsedTime[1]/1000000000);
  }
}
