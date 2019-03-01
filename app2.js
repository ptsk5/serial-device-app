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

// Check the signal quality   
var signalQualityCmd = 'AT+CSQ';
    // > +CSQ:24,99 // -109 dBm <= RSSI of the network <= -53 dBm (>>)

// Check the network statistics
var networkStatCmd = 'AT+NUESTATS';
    // > Signal power:-734 // NB-IoT signal power, in tenth of dBm
    // > Total power:-645 // total P within receive bandwidth, in tenth of dBm
    // > TX power:20 // TX power expressed in tenth of dBm
    // > TX time:807 // elapsed TX time since last power on, in msec
    // > RX time:23720 // elapsed RX time since last power on, in msec 
    // > Cell ID:1103649
    // > ECL:0 //Extended Coverage Level
    // > SNR:66 //Signal to Noise Ratio 30 db to -12 dB
    // > EARFCN:6447 // E-UTRA Absolute Radio Frequency Channel Number 
    // > PCI:89 //Physical Cell ID
    // > RSRQ:-117 // last Reference Signal Receive Quality Value

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
        if(msg.indexOf('+CSQ:') > -1)           { statMap.set('CSQ',            msg.split(':')[1]); return; }
        if(msg.indexOf('Signal power:') > -1)   { statMap.set('Signal power',   msg.split(':')[1]); return; }
        if(msg.indexOf('Total power:') > -1)    { statMap.set('Total power',    msg.split(':')[1]); return; }
        if(msg.indexOf('TX power:') > -1)       { statMap.set('TX power',       msg.split(':')[1]); return; }
        if(msg.indexOf('TX time:') > -1)        { statMap.set('TX time',        msg.split(':')[1]); return; }
        if(msg.indexOf('RX time:') > -1)        { statMap.set('RX time',        msg.split(':')[1]); return; }
        if(msg.indexOf('Cell ID:') > -1)        { statMap.set('Cell ID',        msg.split(':')[1]); return; }
        if(msg.indexOf('ECL:') > -1)            { statMap.set('ECL',            msg.split(':')[1]); return; }
        if(msg.indexOf('SNR:') > -1)            { statMap.set('SNR',            msg.split(':')[1]); return; }
        if(msg.indexOf('EARFCN:') > -1)         { statMap.set('EARFCN',         msg.split(':')[1]); return; }
        if(msg.indexOf('PCI:') > -1)            { statMap.set('PCI',            msg.split(':')[1]); return; }
        if(msg.indexOf('RSRQ:') > -1)           { statMap.set('RSRQ',           msg.split(':')[1]); return; }
    }
});

port.on('error', (err) => {
    console.log("Error: " + err.message);
    process.exit(1);
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
            sendCmd(signalQualityCmd);
            await delay(300);
            sendCmd(networkStatCmd);
            await delay(300);
            sendCmd(udpDataPrefix + generatePayload());
            // for (var key of statMap.keys()) {
            //     console.log(key + " : " + statMap.get(key));
            // }
            statMap.clear();
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
    
    var hexBuff = Buffer.from([deviceId, contentType, data1, data2, networkStats()].join(':'), 'utf8').toString('hex');
    var len = hexBuff.length / 2;

    return len + ',' + hexBuff;
}

function networkStats(){
    var netst = [(statMap.get('CSQ')             || '-'),
                 (statMap.get('Signal power')    || '-'),
                 (statMap.get('Total power')     || '-'),
                 (statMap.get('TX power')        || '-'),
                 (statMap.get('TX time')         || '-'),
                 (statMap.get('RX time')         || '-'),
                 (statMap.get('Cell ID')         || '-'),
                 (statMap.get('ECL')             || '-'),
                 (statMap.get('SNR')             || '-'),
                 (statMap.get('EARFCN')          || '-'), 
                 (statMap.get('PCI')             || '-'), 
                 (statMap.get('RSRQ')            || '-')].join(':');
    //console.log(netst);
    return netst;
}