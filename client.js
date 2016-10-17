var writeln = console.log

var socket = require('socket.io-client')('http://localhost:3000');
socket.on('connect', function () {
  writeln("connect")
});
socket.on('event', function (data) {
  writeln("event")
});
socket.on('disconnect', function () {
  writeln("disconnect")
});
