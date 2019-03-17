'use strict';

const net = require('net');
const SEPERATOR = require('./seperator')();

class tcpClient {
    constructor(host, port, onCreate, onRead, onEnd, onError) {
        this.options = {
            host: host,
            port: port
        };
        this.onCreate = onCreate;
        this.onRead = onRead;
        this.onEnd = onEnd;
        this.onError = onError;
    }

    connect() {
        this.client = net.connect(this.options, () => {
            if (this.onCreate) {
                this.onCreate(this.options);
            }
        });

        this.client.on('data', (data) => { // 하나의 데이터가 두번이상으로 들어오는경우
            const sz = this.merge ? this.merge + data.toString() : data.toString();
            const arr = sz.split(SEPERATOR);

            for (const n in arr) { // n is index
                if (sz.charAt(sz.length - 1) !== SEPERATOR && n === arr.length - 1) { // 마지막 글자가 구분자가 아니고 인덱스가 마지막이면 (한번에 못받아오고 짤린거)
                    this.merge = arr[n];
                    break;
                } else if (arr[n] === '') {
                    break;
                } else {
                    this.onRead(this.options, JSON.parse(arr[n])); // 만들어진 데이터 콜백
                }
            }
        });

        this.client.on('close', () => {
            if (this.onEnd) {
                this.onEnd(this.options);
            }
        });

        this.client.on('error', (err) => {
            if (this.onError) {
                this.onError(this.options, err);
            }
        });
    }

    write(packet) {
        this.client.write(`${JSON.stringify(packet)}${SEPERATOR}`);
    }
}

module.exports = tcpClient;