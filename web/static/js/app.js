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

// ------------------------
//  General Input Tracking
// ------------------------

var lines = [];
var linesInProgress = {};

function reduce(_enum, start, transform) {
  var acc = start;
  each(_enum, function(value, index){
    acc = transform(acc, value, index);
  });
  return acc;
};

function map(enumerator, f) {
  var result = [];
  each(enumerator, function(value, index) {
    result.push(f(value, index));
  });
  return result;
}

function each(enumerator, f) {
  if (Array.isArray(enumerator)) {
    for (var i = 0; i < enumerator.length ; i++) {
      f(enumerator[i], i);
    };
  }
  else {
    for (var key in enumerator) {
      if (!enumerator.hasOwnProperty(key))
        continue;
      f(enumerator[key], key);
    }
  }
}

function drawLine(line) {
  each(line, function(point, index) {
    if (index === 0)
      ctx.moveTo(point.x, point.y);
    else
      ctx.lineTo(point.x, point.y);
  });
}

var drawingQueued = false;
function draw() {
  if (drawingQueued) return;
  drawingQueued = true;
  window.requestAnimationFrame(function(){
    drawingQueued = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    each(lines, drawLine);
    each(linesInProgress, drawLine);
    ctx.stroke();
  });
};

function lineStart(points) {
  channel.push("lineStart", {points: points, canvas_id: window.canvasID});
  _lineStart(points);
}

channel.on("lineStart", payload => {
  _lineStart(payload.points)
})

function _lineStart(points) {
  each(points, (point, identifier) => {
    linesInProgress[identifier] = [point];
  });
  draw();
}

function lineTo(points) {
  channel.push("lineTo", {points: points, canvas_id: window.canvasID});
  _lineTo(points);
}

channel.on("lineTo", payload => {
  _lineTo(payload.points)
})

function _lineTo(points) {
  each(points, (point, identifier) => {
    linesInProgress[identifier].push(point);
  });
  draw();
}

function lineEnd(points) {
  var identifiers = map(points, (_, identifier) => identifier);
  channel.push("lineEnd", {identifiers: identifiers, canvas_id: window.canvasID});
  _lineEnd(identifiers);
}

channel.on("lineEnd", payload => {
  _lineEnd(payload.identifiers)
})

function _lineEnd(identifiers) {
  each(identifiers, function(identifier) {
    var line = linesInProgress[identifier];
    lines.push(line);
    delete linesInProgress[identifier];
  });
  draw();
}

function lineID(identifier) {
  return `${window.canvasID}:${identifier}`
};

function getCanvasCoordinates(map) {
  var rect = canvas.getBoundingClientRect();
  return reduce(map, {}, function(acc, client, identifier){
    acc[lineID(identifier)] = {
      x: client.clientX - rect.left,
      y: client.clientY - rect.top
    };
    return acc;
  });
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
  var point = getCanvasCoordinates({"mouse" : event});
  lineStart(point);
}));

// We need to be able to listen for mouse ups for the entire document
document.documentElement.addEventListener('mouseup', function(event) {
  mouseDown = false;
  lineEnd(getCanvasCoordinates({"mouse" : event}));
});

canvas.addEventListener('mousemove', haltEventBefore(function(event) {
  if (!mouseDown) return;
  var point = getCanvasCoordinates({"mouse" : event});
  lineTo(point);
}));

canvas.addEventListener('mouseleave', haltEventBefore(function(event) {
  if (!mouseDown) return;
  var point = getCanvasCoordinates({"mouse" : event});
  lineTo(point);
  lineEnd(point);
}));

canvas.addEventListener('mouseenter', haltEventBefore(function(event) {
  if (!mouseDown) return;
  var point = getCanvasCoordinates({"mouse" : event});
  lineStart(point);
}));

// ----------------
//  Touch Handling
// ----------------

function touchesFromTouchList(touchList) {
  var touches = [];
  for (var i = 0; i < touchList.length; i++) {
    var touch = touchList.item(i);
    touches.push(touch);
  }
  return touches;
}

function handleTouchesWith(func) {
  return haltEventBefore(function(event) {
    var result = reduce(touchesFromTouchList(event.changedTouches), {}, function(acc, touch){
      acc[touch.identifier] = touch;
      return acc;
    });

    func(getCanvasCoordinates(result));
  });
};

canvas.addEventListener('touchstart',  handleTouchesWith(lineStart));
canvas.addEventListener('touchmove',   handleTouchesWith(lineTo));
canvas.addEventListener('touchend',    handleTouchesWith(lineEnd));
canvas.addEventListener('touchcancel', handleTouchesWith(lineEnd));
