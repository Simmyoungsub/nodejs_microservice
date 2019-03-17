'use strict';

const business = require('../monolithic/monolithic_purchases');
const SEPERATOR = require('./seperator')();
const cluster = require('cluster');

class purchases extends require('./server') {
    constructor () {
        super(
            'purchases',
            process.argv[2] ? process.argv[2] : 9030,
            ['POST/purchases', 'GET/purchases']
        );

        this.connectToDistributor('127.0.0.1', 9000, (data) => {
            console.log('Distributor Notification', data);
        });
    }
    
    onRead(socket, data) {
        console.log('onRead', socket.remoteAddress, socket.remotePort, data);
        console.log(data);
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
} else {
    new purchases();
}