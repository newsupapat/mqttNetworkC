const net = require('net');
const JsonSocket = require('json-socket');

//From Argv Acept only 3
const ip = process.argv[2] || 'localhost';
const topic = process.argv[3] || '/';
const data = process.argv[4] || '';

var port = 1883; //server is listening on
var host = ip;
var socket = new JsonSocket(new net.Socket());

//Define Global Variable
const MAX_TIME_SEND = 3;

let timeout = -1;
socket.connect(port, host);
socket.on('connect', function() {
  //First Send message Type CONN
  socket.sendMessage({ type: 'CONN' });
  socket.on('message', function(message) {
    const { type, messageId } = message;
    if (type === 'PUBACK') {
      console.log(`${new Date()}:Send To Broker complete:  🚀 🍺 `);
      console.log('Topic: ' + topic);
      console.log('Message: ' + data);
      socket.sendEndMessage({ type: 'DISCONN' });
      clearTimeout(timeout);
      timeout = -1;
      return 0;
    } else if (type === 'CONNACK') {
      let count_time = 0;
      const waitPub = () => {
        socket.sendMessage({
          type: 'PUB',
          topic: topic,
          payload: data,
          checkSum: lengthInUtf8Bytes(data),
        });
        count_time++;
        if (count_time == MAX_TIME_SEND) {
          socket.end();
          console.log('Sending Error');
          return 0;
        }
        clearTimeout(timeout);
        timeout = setTimeout(waitPub, 5000);
      };
      if (type != 'PUBACK') {
        waitPub();
      }
    }
  });
});
const lengthInUtf8Bytes = (str) => {
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
};

