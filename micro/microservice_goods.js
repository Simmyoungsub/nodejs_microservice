'use strict';

const business = require('../monolithic/monolithic_goods');
const cluster = require('cluster');
const SEPERATOR = require('./seperator')();

class goods extends require('./server') {
    constructor () {
        super(
            'goods',
            process.argv[2] ? Number(process.argv[2]) : 9010,
            ['POST/goods', 'GET/goods', 'DELETE/goods']
        );

        this.connectToDistributor('127.0.0.1', 9000, (data) => {
            console.log('Distributor Notification', data);
        });
    }

    onRead(socket, data) {
        console.log('onRead', socket.remoteAddress, socket.remotePort, data);
        business.onRequest(socket, data.method, data.uri, data.params, (s, packet) => {
            socket.write(`${JSON.stringify(packet)}${SEPERATOR}`);
        });
    }
}

if (cluster.isMaster) {
    cluster.fork();

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
}else {
    new goods();
}