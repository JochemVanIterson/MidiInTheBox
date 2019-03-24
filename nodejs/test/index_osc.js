var MidiPlayer = require('midi-player-js');

var osc = require("osc");

var udpPort = new osc.UDPPort({
  localAddress: "127.0.0.1",
  localPort: 57121,
  metadata: true
});

// Initialize player and register event handler
var Player = new MidiPlayer.Player(function(event){});

// Load a MIDI file
Player.loadFile('./Mii-Channel-Theme.mid');

Player.on('midiEvent', function(event) {
  var type = event.name.toLowerCase().replace(/ /g, "_");
  var args = [];
  args.push({type: "s", value:type});
  args.push({type: "i", value:event.track});
  if(type==="controller_change"){
    args.push({type: "i", value:event.channel});
    args.push({type: "i", value:event.number});
    args.push({type: "i", value:event.value});
  } else if(type==="pitch_bend"){

  } else if(type==="program_change"){
    args.push({type: "i", value:event.channel});
    args.push({type: "i", value:event.value});
  } else if(type==="note_on"){
    args.push({type: "i", value:event.noteNumber});
    args.push({type: "i", value:event.velocity});
    args.push({type: "i", value:event.channel});
  } else if(type==="note_off"){
    args.push({type: "i", value:event.noteNumber});
    args.push({type: "i", value:0});
    args.push({type: "i", value:event.channel});
  }
  sendOSC("/midievent", args);
  console.log("event", event);
});

udpPort.open();

udpPort.on("ready", function () {
  Player.play();
  setTimeout(function() {
//    Player.setTempo(200);
  }, 2000);
});

console.log("Working on NodeJS");

function sendOSC(id, args){
  udpPort.send({
    address: id,
    args: args
  }, "127.0.0.1", 57110);
}
