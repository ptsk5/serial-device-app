const SerialPort = require('serialport');
const delay = require('delay');

const parsers = SerialPort.parsers;

//##########################################################
//[START] ############### MODIFY ME ########################
const _SERIAL_PORT = '/dev/tty.usbserial-FT9UFAB6';
const _BAUDRATE = 9600;

const _DEVICE_ID = 'device1';

const _IP_ADDRESS = '195.34.89.241'; //echo.ublox.com service
const _UDP_PORT   = '7'; 
//[END] ################# MODIFY ME ########################
//##########################################################


// Init AT commands
var initCmds = ['AT','AT+CMEE=1','AT+CEREG=5','AT+CSCON=1','AT+NPSMR=1','AT+COPS?','AT+CGDCONT?','AT+CGPADDR'];
    // 'AT+CMEE=1'       //Turn on Modem Error Reporting
    // 'AT+CEREG=5'      //Set the full detail of network registration status
    // 'AT+CSCON=1'      //Turn on signalling connection status message
    // 'AT+NPSMR=1'      //Turn on PSM status report
    // 'AT+COPS?'        //Operator?
    // 'AT+CGDCONT?'     //Show the APN
    // 'AT+CGPADDR'      //Show PDP address of the device
    
// Create UDP socket on port 12345
var createUDPPort = 'AT+NSOCR=DGRAM,17,12345,1';  

var readMsg = 'AT+NSORF=0';//,<len>

// Beginning of AT command to send UDP packet to _IP_ADDRESS:_UDP_PORT
var udpDataPrefix = 'AT+NSOST=0,' + _IP_ADDRESS + ',' + _UDP_PORT + ',';//<bytes_length>,<bytes> 

var statMap = new Map();

var initDelay = 300; //ms
var loopDelay = 10000; //ms

// Use a `\r\n` as a line terminator
const parser = new parsers.Readline({
    delimiter: '\r\n'
});

const port = new SerialPort(_SERIAL_PORT, {
    baudRate: _BAUDRATE
});

port.pipe(parser);

parser.on('data', (msg) => {
    console.log(msg);
    if (msg.length > 0){
        if(msg.indexOf('+NSONMI:') > -1) { 
            readIncomingMsg(msg);
        }
    }
});

port.on('open', function(){
    console.log("Serial port was opened.");

    (async () => {
        for (var i = 0; i < initCmds.length; i++) {
            var cmd = initCmds[i];
            sendCmd(cmd);
            await delay(initDelay);
        }

        await delay(500);
        sendCmd(createUDPPort);

        while(true){
            await delay(loopDelay);
            sendCmd(udpDataPrefix + generatePayload());
        }     
    })();
});

function sendCmd(cmd){
    console.log(cmd);
    port.write(cmd + '\r\n', (err) => {
        if (err) { return console.log('Error: ', err.message) }
    });
}

var angle = 0; //dummy var for the second simulated data

function generatePayload(){
    const deviceId = _DEVICE_ID;
    const contentType = 'd';
    
    var data1 = Math.floor(Math.random() * 100) + 20;

    angle = (angle + 20) % 360;
    var data2 = Math.floor(Math.sin((angle/180 * 3.1415)) * 100);
    
    var hexBuff = Buffer.from([deviceId, contentType, data1, data2].join(':'), 'utf8').toString('hex');
    var len = hexBuff.length / 2;

    return len + ',' + hexBuff;
}

function readIncomingMsg(msg) {
    var len = msg.split(',')[1];
    sendCmd(readMsg + ',' + len);
}