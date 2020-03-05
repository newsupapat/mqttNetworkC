const net = require('net');
const JsonSocket = require('json-socket');

//From Argv Acept only 3
const ip = process.argv[2] || 'localhost';
const topic = process.argv[3] || '';
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
    const { type, payload, msgId } = message;
    if (type === 'PUB') {
      console.log(
        `Message(${convertTime(parseInt(msgId.substring(1)))}):${payload}`
      );
      socket.sendMessage({
        type: 'PUBACK',
        msgId: msgId,
      });
    } else if (type === 'SUBACK') {
      console.log(`Sub Topic :${topic} complete`);
      clearInterval(timeout);
    } else if (type === 'CONNACK') {
      let count_time = 0;
      const SubtoServer = () => {
        socket.sendMessage({
          type: 'SUB',
          topic: topic,
        });
        count_time++;
        if (count_time == MAX_TIME_SEND) {
          socket.end();
          console.log('Sending Error');
          clearInterval(this);
        }
      };
      timeout = setInterval(SubtoServer, 2000);
    }
  });
});
const lengthInUtf8Bytes = (str) => {
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
};
const convertTime = (timestamp) => {
  var date = new Date(timestamp * 1000);
  // Hours part from the timestamp
  var hours = date.getHours();
  // Minutes part from the timestamp
  var minutes = '0' + date.getMinutes();
  // Seconds part from the timestamp
  var seconds = '0' + date.getSeconds();

  // Will display time in 10:30:23 format
  var formattedTime =
    hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
  return formattedTime;
};
