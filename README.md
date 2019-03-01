# Serial Device App
## About
This project provides application examples written in Node.js which can communicate with [Quectel GSM/NB-IoT EVB Kit](https://www.quectel.com/product/gsmevb.htm) fitted with [BC95-B20](https://www.quectel.com/product/bc95.htm) high-performance NB-IoT module. The communication is realised via Serial port over USB by using AT commands.

Examples **app.js** and **app2.js** can send (dummy) data (UDP packets) to a predefined IP address. Example **app3.js** can further list incoming messages.

![Overview](/doc_images/arch.png)

## Settings
See highlighted `MODIFY ME` section in **app.js** or **app2.js** where one has to correctly set: 
* `_SERIAL_PORT` - serial port as listed within the operating system (e.g. `/dev/tty.usbserial-FT9UFAB6`)
* `_BAUDRATE` - baud rate of serial communication (e.g. `9600`)
* `_DEVICE_ID` - name of the device which is used for the identification as part of the send message, see bellow (`device1`)
* `_IP_ADDRESS` - IP address of the endpoint which can consume UDP packets (e.g. `195.34.89.241` which is echo.ublox.com service)
* `_UDP_PORT` -  L4 port number (e.g. `7`)

## Payload 
Data which are sent by both applications are built within `generatePayload()` function. Individual data fragments are in text format separated by colons. Final string is then converted into hex format and sent. No data coding or optimization is provided.

### Data blocks
Two data blocks are simulated:
* `data1` - random numbers 
* `data2` - sinus-based values

### Message structure
#### app.js and app3.js:
```
_DEVICE_ID:content_type:data1:data2
```
* `_DEVICE_ID` - the device identification which one can modify in `MODIFY ME` section (see above). 
* `content_type` - intended to be used as a distinguisher in case of multiple kinds of messages (right now, the value is fixed to `d`)
* `data1` and `data2` - data blocks (see above)

#### app2.js:
**app2.js** sends the same data blocks as **app.js**, but at the same time, it includes further information about signal quality and network statistics.
```
_DEVICE_ID:content_type:data1:data2:CSQ:SP:TP:TXP:TXT:RXT:CID:ECL:SNR:EARFCN:PCI:RSRQ
```
* `_DEVICE_ID` - the device identificator which one can modify in `MODIFY ME` section (see above). 
* `content_type` - intended to be used as a distinguisher in case of multiple kinds of messages (right now, the value is fixed to `d`)
* `data1` and `data2` - data blocks (see above)
* `CSQ` - -109 dBm <= RSSI of the network <= -53 dBm 
* `SP` - NB-IoT signal power, in tenth of dBm
* `TP` - total power within receive bandwidth, in tenth of dBm
* `TXP` - TX power expressed in tenth of dBm
* `TXT` - elapsed TX time since last power on, in msec
* `RXT` - elapsed RX time since last power on, in msec 
* `CID` - cell ID
* `ECL` - Extended Coverage Level
* `SNR` - Signal to Noise Ratio 30 db to -12 dB
* `EARFCN` - E-UTRA Absolute Radio Frequency Channel Number 
* `PCI` - Physical Cell ID
* `RSRQ` - last Reference Signal Receive Quality Value


## Incoming messages

**app3.js** provides an example of how to read incoming messages. The flow is as follows: 
* Device signalises incoming packet by `+NSONMI:0,16` - the last number (i.e. 16 in this case) represents the length of data.
* We can read the data by sending AT command `AT+NSORF=0,16` - the last number is the length of data we want to read.

