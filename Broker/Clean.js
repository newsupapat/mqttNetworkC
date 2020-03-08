const net = require('net');
const { uuid } = require('uuidv4');
const JsonSocket = require('json-socket');

var port = 1883;
var server = net.createServer();
const arg0 = process.argv[2] || '';
const debug = arg0 === '--debug';

let topicList = {};
let Mqttlist = {};

const MAX_TIME_SEND = 3;

server.listen(port, () => {
  //   console.log('port 1883 (MQTT) listening');
  console.log(`${new Date()}: 🚀 🍺 Server has been started on ${port}`);
  if (debug) console.log('Debug mode on');
});


server.on('connection', function(socket) {
  const socketId = uuid();
  if (debug) {
    print_detail(server, socket);
  }
  socket = new JsonSocket(socket);
  const Mqtt = new MQTT(socket, socketId);
  Mqttlist[socketId] = Mqtt;
  socket.on('message', (message) => {
    try {
      Mqtt.translate(message);
    } catch (error) {
      console.error('decode', error.message);
      socket.destroy();
    }
  });
  socket.on('end', () => {
    // if (debug) console.log('end');
    for (const k in topicList) {
      topicList[k].sub = topicList[k].sub.filter((m) => m !== socketId);
    }
    if (debug) console.log('socket id:', socketId, 'is ended');
  });
  socket.on('close', (error) => {
    // if (debug) console.log('close isError:', error);
    // if (debug) console.log('socket id:', socketId, 'is closed');
  });
  socket.on('timeout', () => {
    if (debug) console.log('timeout');
    if (debug) console.log('socket id:', socketId, 'is timeout');
  });
  socket.on('error', (error) => {
    if (debug) console.error('socket id:', socketId, 'error!');
    console.error('error', error.name, error.message);
  });
});
class MQTT {
  constructor(socket = new net.Socket(), uid = '') {
    this.socket = socket;
    this.socketId = uid;
    this.pubStack = {};
  }
  translate(json = {}) {
    // if (debug) console.log('Decoding Form', this.socketId);
    const { type, topic, payload, checkSum, msgId } = json;
    if (type === 'CONN') {
      if (debug) console.log('CONN', this.socketId);
      return this.CONNACK();
    } else if (type === 'PUB') {
      const localcheckSum = lengthInUtf8Bytes(payload);
      if (debug) console.log('PUB', this.socketId);
      console.log(`BROKER => TOPIC: "${topic}" => MESSAGE: "${payload}"`);
      //Error Control
      if (localcheckSum === checkSum) {
        this.PUBACK();
        return pubToSub(topic, payload);
      }
      return pubToSub(topic, payload);
    } else if (type === 'DISCONN') {
      if (debug) console.log('DISCONN', this.socketId);
      return this.END();
    } else if (type === 'SUB') {
      if (debug) console.log('SUB', this.socketId);
      console.log(this.socketId, 'START SUBSCRIBE TO TOPIC:', topic);
      if (!topicList[topic]) topicList[topic] = { sub: [] };
      if (!topicList[topic]['sub'].includes(this.socketId))
        topicList[topic]['sub'].push(this.socketId);
      console.log(topicList);

      return this.SUBACK();
    } else if (type === 'PUBACK') {
      if (debug) console.log('Type: PUBACK');
      if (debug) console.log('Message ID:', msgId);
      clearTimeout(this.pubStack[msgId].time);
      delete this.pubStack[msgId];
      console.log(this.pubStack);
      if (debug) console.log('PUBACK Complete');
      if (debug) console.log('===== PUBACK END =====');
      return null;
    }
  }
  CONNACK() {
    if (debug) console.log('CONNACK BACK', this.socketId);
    if (debug) console.log('===== CONNACK END =====');
    return this.socket.sendMessage({ type: 'CONNACK' });
  }
  PUBACK(messageId = '') {
    if (debug) console.log('PUBACK', this.socketId);
    if (debug) console.log('===== PUBACK END =====');
    return this.socket.sendMessage({ type: 'PUBACK', messageId });
  }
  SUBACK() {
    if (debug) console.log('SUBACK', this.socketId);
    if (debug) console.log('===== SUBACK END =====');
    return this.socket.sendMessage({ type: 'SUBACK' });
  }
  PUB(pubData = {}) {
    const msgId = pubData.msgId;
    if (!this.pubStack[msgId]) this.pubStack[msgId] = { count: 0, time: -1 };
    this.pubStack[msgId].count += 1;
    if (this.pubStack[msgId].count == MAX_TIME_SEND) {
      console.log(this.socketId, 'No Response PUBACK...');
      if (this.pubStack[msgId].time) clearInterval(this.pubStack[msgId].time);
      delete this.pubStack[msgId];
      this.END();
      return null;
    }
    if (debug) console.log('PUB', this.socketId);
    if (debug)
      console.log('Message ID:', msgId, '(' + this.pubStack[msgId].count + ')');
    this.waitPUBACK(pubData, msgId);
    if (debug) console.log('===== PUB END =====');
    return this.socket.sendMessage(pubData);
  }
  waitPUBACK(pubData = {}, messageId) {
    const msgId = messageId;
    if (this.pubStack[msgId].time) clearInterval(this.pubStack[msgId].time);
    this.pubStack[msgId].time = setInterval(() => {
      this.PUB(pubData);
    }, 10000);
  }
  END() {
    if (debug) console.log('===== END SOCKET =====');
    delete Mqttlist[this.socketId];
    for (const k in topicList) {
      topicList[k].sub.filter((m) => m !== this.socketId);
    }
    this.socket.sendEndMessage({ type: 'DISCONNACK' });
  }
}
const lengthInUtf8Bytes = (str) => {
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
};

const topicMatchCheck = (topic = '', target = '') => {
  topic += '/';
  target += '/';
  const topicRes = new RegExp(replaceRegExp(topic));
  const targetRes = new RegExp(replaceRegExp(target));
  return topicRes.test(target) || targetRes.test(topic);
};
const replaceRegExp = (text = '') => {
  return '^' + text.replace(/\+/g, '[^/]+').replace('#/', '.+') + '$';
};
const pubToSub = (topic = '', payload = '') => {
  let list_socketkey = [];
  console.log('list', topicList);
  for (const key in topicList) {
    if (topicMatchCheck(topic.toLocaleLowerCase(), key.toLocaleLowerCase())) {
      const subArrays = topicList[key]['sub'];
      subArrays.map((sub) => list_socketkey.push(sub));
    }
  }
  console.log(list_socketkey);
  if (list_socketkey.length > 0) {
    list_socketkey.map((ls_key) => {
      const thisMqtt = Mqttlist[ls_key];
      if (thisMqtt) {
        thisMqtt.PUB({
          type: 'PUB',
          payload,
          msgId: 'm' + Math.floor(Date.now() / 1000),
        });
      }
    });
  }
};
const print_detail = (server, socket) => {
  const address = server.address();
  const port = address.port;
  const family = address.family;
  const ipaddr = address.address;
  console.log('------------remote client info --------------');
  const rport = socket.remotePort;
  const raddr = socket.remoteAddress;
  console.log('REMOTE Socket is listening at port ' + rport);
  console.log('REMOTE Socket ip :' + raddr);
  console.log('--------------------------------------------');
};
