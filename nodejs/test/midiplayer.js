var config = {midiOutputName:"to Max 1"}

//SimpleSynth virtual input

// Set up a new output.
var output = new midi.output();

// Select Output
var count = output.getPortCount();
for(var i =0; i< count; i++){
  var name = output.getPortName(i);
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
output.openPort(config.midiOutputID);

// Send a MIDI message.
// Note on : [144+<channel>, <note>, <velo>]
// Note off: [128+<channel>, <note>, <velo>]
output.sendMessage([128,60,100]);

// Close the port when done.
output.closePort();
