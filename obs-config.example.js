// OBS overlay settings for this computer only. Copy this file to obs-config.js (gitignored, so the
// password never reaches GitHub), fill it in, then refresh the dashboard and the overlay.
//
// The Dice tab and overlay.html talk through OBS's built-in WebSocket server (OBS 28+):
// Tools > WebSocket Server Settings > Enable WebSocket server. Copy the port and password from
// "Show Connect Info" into the fields below.
window.NCD_OBS_CONFIG = {
  host: "localhost",
  port: 4455,
  password: "",     // OBS WebSocket password ("" if authentication is turned off)
  side: "left",     // which side of the screen the overlay panel sits on: "left" or "right"
};
