var uuid = require('uuid')

var writeln = console.log

var fn = () => {
  writeln()
  writeln("test: hello from each locale")
  for (let locale of Locales) {
    on(locale).do(() => writeln("hello from locale", here.id))
  }
}

var fnReturn = () => {
  var results = []
  for (let locale of Locales) {
    on(locale)
      .do(() => here.id)
      .then((result) => results.push(result))
  }
  return results
}

var sessions = {}

function createFnRequest(id, fn) {
  const payload = {
    id: id,
    fn: JSON.stringify(fn.toString())
  }
  sessions[id] = payload
  return JSON.stringify(payload)
}

var socket = require('socket.io-client')('http://localhost:3000');
socket.on('connect', function () {
  writeln("connect")
  socket.emit('event', createFnRequest(uuid.v4(), fn))
  socket.emit('event', createFnRequest(uuid.v4(), fnReturn))
});
socket.on('event', function (data) {
  writeln("event", data)
  if (data.id in sessions) {
    delete sessions[data.id]
  } else {
    writeln("request context not found: ", data.id)
  }
});
socket.on('disconnect', function () {
  writeln("disconnect")
});
