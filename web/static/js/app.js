// Brunch automatically concatenates all files in your
// watched paths. Those paths can be configured at
// config.paths.watched in "brunch-config.js".
//
// However, those files will only be executed if
// explicitly imported. The only exception are files
// in vendor, which are never wrapped in imports and
// therefore are always executed.

// Import dependencies
//
// If you no longer want to use a dependency, remember
// to also remove its path from "config.paths.watched".
import "phoenix_html"

// Import local files
//
// Local files can be imported directly using relative
// paths "./socket" or full ones "web/static/js/socket".

import socket from "./socket"

let channel = socket.channel("room:drawing", {})
channel.join()
  .receive("ok", resp => { console.log("Joined successfully", resp) })
  .receive("error", resp => { console.log("Unable to join", resp) })

var canvas = document.getElementById("draw-canvas");
var ctx = canvas.getContext("2d");

function _drawLines(lines) {
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    
    ctx.moveTo(line.from.x, line.from.y);
    ctx.lineTo(line.to.x, line.to.y);
    ctx.stroke();
  }
}

function drawLines(lines) {
  _drawLines(lines);

  // If we send our canvasID, the server won't waste bandwidth sending
  // us our own drawLines messages.
  channel.push("drawLines", {lines: lines, canvas_id: window.canvasID});
}

// Draw whatever we receive
channel.on("drawLines", payload => {
  _drawLines(payload.lines)
})

// ------------------------
//  General Input Tracking
// ------------------------

var lastPoints = {};

function moveToCoordinates(map) {
  for (var identifier in map) {
    if (map.hasOwnProperty(identifier)) {
      var point = map[identifier];
      lastPoints[identifier] = point;
    }
  }  
}

function lineToCoordinates(map) {
  var lines = [];
  for (var identifier in map) {
    if (!map.hasOwnProperty(identifier))
      continue;

    var point = map[identifier];
    if (lastPoints[identifier]) {
      lines.push({from:lastPoints[identifier], to: point});
    }
    lastPoints[identifier] = point;
  }
  drawLines(lines);
}

function getCanvasCoordinates(map) {
  var rect = canvas.getBoundingClientRect();
  var returnValue = {};

  for (var identifier in map) {
    if (!map.hasOwnProperty(identifier))
      continue;

    var client = map[identifier];
    returnValue[identifier] = {
      x: client.clientX - rect.left,
      y: client.clientY - rect.top
    };
  }  
  return returnValue;
}

function haltEventBefore(handler) {
  return function(event) {
    event.stopPropagation();
    event.preventDefault();
    handler(event);
  }
}

// ----------------
//  Touch Handling
// ----------------

var mouseDown = false;

canvas.addEventListener('mousedown', haltEventBefore(function(event) {
  mouseDown = true;
  moveToCoordinates(getCanvasCoordinates({"mouse" : event}));
}));

// We need to be able to listen for mouse ups for the entire document
document.documentElement.addEventListener('mouseup', function(event) {
  mouseDown = false;
});

canvas.addEventListener('mousemove', haltEventBefore(function(event) {
  if (!mouseDown) return;
  lineToCoordinates(getCanvasCoordinates({"mouse" : event}));
}));

canvas.addEventListener('mouseleave', haltEventBefore(function(event) {
  if (!mouseDown) return;
  lineToCoordinates(getCanvasCoordinates({"mouse" : event}));
}));

canvas.addEventListener('mouseenter', haltEventBefore(function(event) {
  if (!mouseDown) return;
  moveToCoordinates(getCanvasCoordinates({"mouse" : event}));
}));

// ----------------
//  Touch Handling
// ----------------

function handleTouchesWith(func) {
  return haltEventBefore(function(event) {
    var map = {};
    for (var i = 0; i < event.changedTouches.length; i++) {
      var touch = event.changedTouches[i];
      map[touch.identifier] = touch;
    }
    func(getCanvasCoordinates(map));
  });
};

canvas.addEventListener('touchstart',  handleTouchesWith(moveToCoordinates));
canvas.addEventListener('touchmove',   handleTouchesWith(lineToCoordinates));
canvas.addEventListener('touchend',    handleTouchesWith(lineToCoordinates));
canvas.addEventListener('touchcancel', handleTouchesWith(moveToCoordinates));
