'use strict';

const map = {};
const SEPERATOR = require('./seperator')();

class distributor extends require('./server') {
    constructor () {
        super('distributor', 9000, ['POST/distributes', 'GET/distributes']);
    }

    makeKey(socket) {
        return `${socket.remoteAddress}:${socket.remotePort}`;
    }

    onCreate(socket) {
        console.log('onCreate', socket.remoteAddress, socket.remotePort);
        this.sendInfo(socket);
    }

    onClose(socket) {
        const key = this.makeKey(socket);
        console.log('onClose', socket.remoteAddress, socket.remotePort);
        delete map[key];
        this.sendInfo();
    }

    onRead(socket, json) {
        const key = this.makeKey(socket);
        console.log('onRead', socket.remoteAddress, socket.remotePort, json);

        if (json.uri === '/distributes' && json.method === 'POST') {
            map[key] = { // 각 서비스
                socket: socket, // 소켓
                info: json.params // 사용가능한 API (context)
            };
            map[key].info.host = socket.remoteAddress; // 프로퍼티 추가
            this.sendInfo();
        }
    }

    write(socket, packet) {
        socket.write(`${JSON.stringify(packet)}${SEPERATOR}`);
    }

    sendInfo(socket) {
        const packet = {
            uri: '/distributes',
            method: 'GET',
            key: 0,
            params: []
        };

        for (const n in map) {
            packet.params.push(map[n].info);
        }

        if (socket) {
            this.write(socket, packet); // 특정 클라이언트에게 현재 가용되는 API목록을 전달, 고로 각 노드가 무엇을 하는지 알수있음 노드 간 복합 로직이 가능해짐
        } else {
            for (const n in map) { // map에 있는 모든 노드들에게 전달 (노드 등록, 해제)
                this.write(map[n].socket, packet);
            }
        }
    }
}

new distributor();