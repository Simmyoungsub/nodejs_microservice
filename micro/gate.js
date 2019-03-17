'use strict';

const http = require('http');
const url = require('url');
const querystring = require('querystring');
const tcpClient = require('./client');

const mapClients = {};
const mapUrls = {};
const mapResponse = {};
const mapRR = {};
let index = 0;

const server = http.createServer((req, res) => {
    const method = req.method;
    const uri = url.parse(req.url, true);
    const pathname = uri.pathname;

    if (['POST', 'PUT'].includes(method)) {
        let body = '';

        req.on('data', (data) => {
            body += data;
        });

        req.on('end', () => {
            let params;

            if (req.headers['content-type'] === 'application/json') {
                params = JSON.parse(body);
            }else {
                params = querystring.parse(body);
            }
        
            onRequest(res, method, pathname, params);
        });
    }else {
        onRequest(res, method, pathname, uri.query);
    }
}).listen(8000, () => {
    console.log('listen', server.address());

    const packet = {
        uri: '/distributes',
        method: 'POST',
        key: 0,
        params: {
            port: 8000,
            name: 'gate',
            urls: []
        }
    };
    let isConnectDistributor = false;

    this.clientDistributor = new tcpClient(
        '127.0.0.1',
        9000,
        (options) => {
            isConnectDistributor = true;
            this.clientDistributor.write(packet);
        },
        (options, data) => {
            onDistribute(data);
        },
        (options) => {
            isConnectDistributor = false;
        },
        (options) => {
            isConnectDistributor = false;
        }
    );

    setInterval(() => {
        if (!isConnectDistributor) {
            this.clientDistributor.connect();
        }
    }, 3000);
});

const onRequest = ((res, method, pathname, params) => {
    const key = method + pathname;
    const client = mapUrls[key];
    if (!client) {
        res.writeHead(404);
        res.end();
        return ;
    }

    params.key = index;
    const packet = {
        uri: pathname,
        method: method,
        params: params
    };

    mapResponse[index] = res;
    index++;

    if (!(mapRR[key])) {
        mapRR[key] = 0;
    }

    mapRR[key]++;
    client[mapRR[key] % client.length].write(packet); // 동일한 API 서버가 여러대 떠있는 경우 RR(라운드로빈)형식으로 돌아가면서 사용
});

const onDistribute = ((data) => {
    console.log(data);
    for (const n in data.params) {
        const node = data.params[n];
        const key = `${node.host}:${node.port}`;

        if (!(mapClients[key]) && node.name !== 'gate') {
            const client = new tcpClient(node.host, node.port, onCreateClient, onReadClient, onEndClient, onErrorClient);
            mapClients[key] = {
                client: client,
                info: node
            };
            
            for (const m in node.urls) {
                const k = node.urls[m];
                if (!(mapUrls[k])) {
                    mapUrls[k] = [];
                }
                mapUrls[k].push(client);
            }
            
            client.connect();
        }
    }
});

const onCreateClient = ((options) => {
    console.log('onCreateClient');
});

const onReadClient = ((options, packet) => {
    console.log('onReadClient', packet);
    mapResponse[packet.key].writeHead(200, {'Content-Type': 'application/json'});
    mapResponse[packet.key].end(JSON.stringify(packet));
    delete mapResponse[packet.key];
});

const onEndClient = ((options) => {
    const key = `${options.host}:${options.port}`;
    console.log('onEndClient', mapClients[key]);

    for (const n in mapClients[key].info.urls) {
        const node = mapClients[key].info.urls[n];
        delete mapUrls[node];
    }
    delete mapClients[key];
});

const onErrorClient = ((options) => {
    console.log('onErrorClient');
})