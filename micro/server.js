'use strict';

const net = require('net');
const tcpClient = require('./client');
const SEPERATOR = require('./seperator')();

class tcpServer {
    constructor(name, port, urls) {
        this.logTcpClient = null;

        this.context = {
            port: port,
            name: name,
            urls: urls
        };
        this.merge = {};

        this.server = net.createServer((socket) => {
            this.onCreate(socket);

            socket.on('error', (exception) => {
                this.onClose(socket);
            });

            socket.on('close', () => {
                this.onClose(socket);
            });

            socket.on('data', (data) => {
                const key = `${socket.remoteAddress}:${socket.remotePort}`;
                const sz = this.merge[key] ? this.merge[key] + data.toString() : data.toString();
                const arr = sz.split(SEPERATOR);

                for (const n in arr) {
                    if (sz.charAt(sz.length - 1) !== SEPERATOR && n === arr.length - 1) {
                        this.merge[key] = arr[n];
                    } else if (arr[n] === '') {
                        break;
                    } else {
                        this.writeLog(arr[n]);
                        this.onRead(socket, JSON.parse(arr[n]));
                    }
                }
            });
        });

        this.server.on('error', (err) => {
            console.log(err);
        });

        this.server.listen(port, () => {
            console.log('listen', this.server.address());
        });
    }

    onCreate(socket) {
        console.log('onCreate', socket.remoteAddress, socket.remotePort);
    }

    onClose(socket) {
        console.log('onClose', socket.remoteAddress, socket.remotePort);
    }

    connectToDistributor(host, port, onNoti) {
        const packet = {
            uri: '/distributes',
            method: 'POST',
            key: 0,
            params: this.context
        };

        let isConnectedDistributor = false;

        this.clientDistributor = new tcpClient(host, port,
            (options) => { // 접속 이벤트 콜백
                isConnectedDistributor = true;
                this.clientDistributor.write(packet);
            },
            (options, data) => { // 데이터 수신 콜백
                if (this.logTcpClient === null && this.context.name !== 'logs') {
                    for (const ms of data.params) {
                        if (ms.name === 'logs') {
                            this.connectToLog(ms.host, ms.port);
                            break;
                        }
                    }
                }
                onNoti(data);
            },
            (options) => { // 종료
                isConnectedDistributor = false;
            },
            (options) => { // 에러
                isConnectedDistributor = false;
            }
        );

        setInterval(() => {
            if (!isConnectedDistributor) {
                this.clientDistributor.connect();
            }
        }, 3000); // 주기적 연결
    }

    connectToLog(host, port) {
        this.logTcpClient = new tcpClient(
            host,
            port,
            (options) => {},
            (options) => {this.logTcpClient = null;},
            (options) => {this.logTcpClient = null;}
        );
        this.logTcpClient.connect();
    }

    writeLog(log) {
        if (this.logTcpClient) {
            const packet = {
                uri: 'logs',
                method: 'POST',
                key: 0,
                params: log
            };
            this.logTcpClient.write(packet);
        }else {
            console.log(log);
        }
    }
}

module.exports = tcpServer;