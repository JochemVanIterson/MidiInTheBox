console.log("Running MidiInTheBox");

console.log("(1/5) Config set");
var config = require('./config.json');

console.log("(2/5) Init midi ports");
const { spawn } = require('child_process');
var MidiPlayer = require('midi-player-js');
var midi = require('midi');
var MidiOutput = new midi.output();
var InitMidiPorts = [];
var MidiPorts = [];
initMidiPort();

console.log("(3/5) Setup GPIO");
const Gpio = require('onoff').Gpio;
const button1 = new Gpio(22, 'in', 'both');
const button2 = new Gpio(22, 'in', 'both');
var buttonstate1 = false;
var buttonstate2 = false;
var armed = false;
var lastTick = process.hrtime();
var elapsedTimeDate;
var elapsedTime;
var elapsedTimeSize = config.smoothingSize;
var elapsedTimeArray = [];
var timeoutObj;

button1.watch((err, value) => {
  buttonstate1 = value;
  checkDirection();
});
button2.watch((err, value) => {
  buttonstate2 = value;
  checkDirection();
});

console.log("(4/5) Setup Midi player");
var Player;
initMidiPlayer();

console.log("(5/5) Config file");
console.log(config);
console.log("\nSetup finished, Running...");
function initMidiPlayer(){
  Player = new MidiPlayer.Player(function(event){});

  // Load a MIDI file
  Player.loadFile(config.midiFileFolder+'Mii-Channel-Theme.mid');
  Player.on('midiEvent', function(event) {
    var type = event.name.toLowerCase().replace(/ /g, "_");
    if(type=="note_on"){
      MidiOutput.sendMessage([143+event.channel,event.noteNumber,event.velocity]);
    } else if(type=="note_off"){
      MidiOutput.sendMessage([127+event.channel,event.noteNumber,event.velocity]);
    }
    // console.log("event", event);
  });
  Player.on('endOfFile', function() {
    initMidiPlayer();
    console.log("EOF");
  });
}

function checkDirection(){
  if (buttonstate1 == buttonstate2 && !buttonstate1){
    armed = true;
  } else if (armed){
    armed = false;
    elapsedTimeDate = process.hrtime(lastTick);

    
    elapsedTime = elapsedTimeDate[0]+elapsedTimeDate[1]/1000000000;
    elapsedTimeArray = arr_push_circ(elapsedTimeArray, elapsedTimeSize, elapsedTime);    

    bpm = 4/arr_average(elapsedTimeArray);
    Player.pause();
    Player.setTempo(bpm);
    Player.play();
    if(timeoutObj!=undefined) clearTimeout(timeoutObj);
    timeoutObj = setTimeout(() => {
      Player.setTempo(0);
    }, 100);
    lastTick = process.hrtime();
  }
}

function initMidiPort(){
  // Select Output
  var countBefore = MidiOutput.getPortCount();
  for(var i =0; i< countBefore; i++){
    var name = MidiOutput.getPortName(i);
    InitMidiPorts.push(name);
  }

  const fluidsynth = spawn('/usr/bin/fluidsynth', ['--audio-driver=alsa', '--gain=1', config.soundFile]);

  fluidsynth.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
  });

  while(countBefore==MidiOutput.getPortCount()){}

  var count = MidiOutput.getPortCount();
  for(var i =0; i< count; i++){
    var name = MidiOutput.getPortName(i);
    MidiPorts.push(name);
  }
  var diffArray = arr_diff(MidiPorts, InitMidiPorts);

  var count = MidiOutput.getPortCount();
  for(var i =0; i< count; i++){
    var name = MidiOutput.getPortName(i);
    if(name==diffArray[0]){
      config.midiOutputID = i;
      config.midiOutputName = name;
    }

  }
  MidiOutput.openPort(config.midiOutputID);
}

function arr_diff (a1, a2) {
    var a = [], diff = [];
    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }
    for (var k in a) {
        diff.push(k);
    }
    return diff;
}
function arr_sum(array){
  var amount = 0;
  for(var i = 0; i<array.length; i++){
    amount += array[i];
  }
  return amount;
}
function arr_average(array){
  var amount = 0;
  for(var i = 0; i<array.length; i++){
    amount += array[i];
  }
  return amount/array.length;
}
function arr_push_circ(array, maxSize, value){
  if(array.length<maxSize){
    array.push(value);
  } else {
    array.push(value);
    array = array.slice(-1);
  }
  return array;
}
