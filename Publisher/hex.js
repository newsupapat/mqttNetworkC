const list = ['48', '0', '4', '1', '47', '43', '3'];
const parsehexToD = (list = []) => {
  return list.map((l) => {
    return parseInt(l, 16);
  });
};
console.log(parsehexToD(list));

const list_D = [ 80, 0, 12, 4, 110, 101, 119, 50, 210, 215, 116, 101, 115, 116, 50];
const parseDToHex = (list = []) => {
  return list.map((l) => {
    return l.toString(16);
  });
};
//Decimal to hex
console.log(parseDToHex(list_D));
console.log((32).toString(16));

//Decode message
console.log(String.fromCharCode(110));
