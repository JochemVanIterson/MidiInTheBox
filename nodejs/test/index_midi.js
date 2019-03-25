var Gpio = require('onoff').Gpio;

var RotaryA = new Gpio(22, 'in', 'both');
var RotaryB = new Gpio(27, 'in', 'both');

RotaryA.watch(function (err, value) { //Watch for hardware interrupts on pushButton GPIO, specify callback function
  if (err) { //if an error
    console.error('There was an error', err); //output error message to console
    return;
  }
  console.log("RotaryA", value);
});

RotaryB.watch(function (err, value) { //Watch for hardware interrupts on pushButton GPIO, specify callback function
  if (err) { //if an error
    console.error('There was an error', err); //output error message to console
    return;
  }
  console.log("RotaryB", value);
});

return; // OUDE CODE

var config = require('./config.json');

var MidiPlayer = require('midi-player-js');
var midi = require('midi');

var MidiOutput = new midi.output();

// Select Output
var count = MidiOutput.getPortCount();
for(var i =0; i< count; i++){
  var name = MidiOutput.getPortName(i);
  if(config.midiOutputName==""){
    console.log("\t"+name);
  }
  if(config.midiOutputName==name){
    config.midiOutputID = i;
    break;
  }
}
if(config.midiOutputName==""){
  return 0;
}
console.log(config);
MidiOutput.openPort(config.midiOutputID);

// Initialize player and register event handler
var Player = new MidiPlayer.Player(function(event){});

// Load a MIDI file
Player.loadFile('./Mii-Channel-Theme.mid');

Player.on('midiEvent', function(event) {
  var type = event.name.toLowerCase().replace(/ /g, "_");
  if(type=="note_on"){
    MidiOutput.sendMessage([143+event.channel,event.noteNumber,event.velocity]);
  } else if(type=="note_off"){
    MidiOutput.sendMessage([127+event.channel,event.noteNumber,event.velocity]);
  }
  console.log("event", event);
});
Player.play();
setTimeout(function() {
  Player.setTempo(60);
}, 2000);
