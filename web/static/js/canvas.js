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
// import "phoenix_html"

// Import local files
//
// Local files can be imported directly using relative
// paths "./socket" or full ones "web/static/js/socket".

// import socket from "./socket"

let Canvas = {
  init(socket, canvas) {
    if (!canvas) return;

    let canvasID = canvas.getAttribute("data-id");
    let pageID = window.pageID;
    let channel = socket.channel(`canvas:${canvasID}`, {});
    channel.join().
      receive("ok", resp => { console.log("Joined successfully", resp); }).
      receive("error", resp => { console.log("Unable to join", resp); });

    var ctx = canvas.getContext("2d");

    // ------------------------
    //  General Input Tracking
    // ------------------------

    var unfinishedStrokes = {};
    var strokes = [];

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

    function drawStroke(stroke) {
      each(stroke, function(point, index) {
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
        each(strokes, drawStroke);
        each(unfinishedStrokes, drawStroke);
        ctx.stroke();
      });
    };

    function strokeStart(points) {
      channel.push("strokeStart", {points: points});
      _strokeStart(points);
    }

    channel.on("strokeStart", payload => {
      _strokeStart(payload.points);
    });

    function _strokeStart(points) {
      each(points, (point, identifier) => {
        unfinishedStrokes[identifier] = [point];
      });
      draw();
    }

    function strokeTo(points) {
      channel.push("strokeTo", {points: points});
      _strokeTo(points);
    }

    channel.on("strokeTo", payload => {
      _strokeTo(payload.points);
    });

    function _strokeTo(points) {
      each(points, (point, identifier) => {
        unfinishedStrokes[identifier].push(point);
      });
      draw();
    }

    function strokeEnd(points) {
      var identifiers = map(points, (_, identifier) => identifier);
      channel.push("strokeEnd", {identifiers: identifiers});
      _strokeEnd(identifiers);
    }

    channel.on("strokeEnd", payload => {
      _strokeEnd(payload.identifiers);
    });

    function _strokeEnd(identifiers) {
      each(identifiers, (identifier) => {
        strokes.push(unfinishedStrokes[identifier]);
        delete unfinishedStrokes[identifier];
      });
      draw();
    }

    function getCanvasCoordinates(map) {
      var rect = canvas.getBoundingClientRect();
      return reduce(map, {}, function(acc, client, identifier){
        acc[identifier] = {
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
      };
    }

    // ----------------
    //  Touch Handling
    // ----------------
    function touchIdentifier(id) {
      return `${pageID}.${id}`;
    }
    let mouseIdentifier = touchIdentifier("m");
    var mouseDown = false;

    canvas.addEventListener('mousedown', haltEventBefore(function(event) {
      mouseDown = true;
      var point = getCanvasCoordinates({[mouseIdentifier]: event});
      strokeStart(point);
    }));

    // We need to be able to listen for mouse ups for the entire document
    document.documentElement.addEventListener('mouseup', function(event) {
      mouseDown = false;
      strokeEnd(getCanvasCoordinates({[mouseIdentifier]: event}));
    });

    canvas.addEventListener('mousemove', haltEventBefore(function(event) {
      if (!mouseDown) return;
      var point = getCanvasCoordinates({[mouseIdentifier]: event});
      strokeTo(point);
    }));

    canvas.addEventListener('mouseleave', haltEventBefore(function(event) {
      if (!mouseDown) return;
      var point = getCanvasCoordinates({[mouseIdentifier]: event});
      strokeTo(point);
      strokeEnd(point);
    }));

    canvas.addEventListener('mouseenter', haltEventBefore(function(event) {
      if (!mouseDown) return;
      var point = getCanvasCoordinates({[mouseIdentifier]: event});
      strokeStart(point);
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
          acc[touchIdentifier(touch.identifier)] = touch;
          return acc;
        });

        func(getCanvasCoordinates(result));
      });
    };

    canvas.addEventListener('touchstart',  handleTouchesWith(strokeStart));
    canvas.addEventListener('touchmove',   handleTouchesWith(strokeTo));
    canvas.addEventListener('touchend',    handleTouchesWith(strokeEnd));
    canvas.addEventListener('touchcancel', handleTouchesWith(strokeEnd));
  }
};
export default Canvas;
