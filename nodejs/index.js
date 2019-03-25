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
var midiEvents = [];
var minTickSize;
var tickIndex = -1;
var midiFileIndex = 0;
initMidiPlayer();

console.log("(5/5) Config file");
console.log(config);
console.log("\nSetup finished, Running...");
function initMidiPlayer(){
  Player = new MidiPlayer.Player(function(event){});

  // Load a MIDI file
  tickIndex = -1;
  midiEvents = [];
  Player.loadFile(config.midiFileFolder+config.midiFiles[midiFileIndex]);
  midiFileIndex++;
  if(midiFileIndex>=config.midiFiles.length)midiFileIndex=0;
   
  let division = Player.division;
  minTickSize = division/(config.minEventSize/4);
  let unorderedMidiEvents = Player.getEvents();

  unorderedMidiEvents.forEach(function(track){
    track.forEach(function(event){
      let eventTickID = Math.floor(event.tick/minTickSize);
      if(midiEvents[eventTickID]===undefined)midiEvents[eventTickID]=[];
      midiEvents[eventTickID].push(event);
    });
  });

  Player.on('midiEvent', function(event) {

    if(event.name===undefined)event.name="";
    var type = event.name.toLowerCase().replace(/ /g, "_");
    if(type=="note_on"){
      MidiOutput.sendMessage([143+event.channel,event.noteNumber,event.velocity]);
    } else if(type=="note_off"){
      MidiOutput.sendMessage([127+event.channel,event.noteNumber,event.velocity]);
    } else if(type=="program_change"){
      MidiOutput.sendMessage([191+event.channel,event.value]);
    } else if(type=="controller_change"){
      MidiOutput.sendMessage([175+event.channel,event.value]);
    } else if(type=="pitch_bend"){
      MidiOutput.sendMessage([223+event.channel,event.value]);
    }
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
    tickIndex++;
    if(midiEvents[tickIndex]!==undefined){
      midiEvents[tickIndex].forEach(function(event){
        Player.emitEvent(event);
      });
    }
    if(tickIndex>midiEvents.length){
      if(config.loop)tickIndex=-1;
      else initMidiPlayer();
    }
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
