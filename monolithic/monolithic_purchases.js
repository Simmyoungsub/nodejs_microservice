const mysql = require('mysql');
const conn = {
    host: '192.168.122.128',
    port: '3306',
    user: 'monolithic',
    password: 'monolithic',
    database: 'monolithic'
};

const redis = require('redis').createClient(6379, '192.168.122.128');

redis.on('error', (err) => {
    console.log(`Redis Error ${err}`);
});

exports.onRequest = ((res, method, pathname, params, cb) => {
    switch (method) {
        case 'POST':
            return register(method, pathname, params, (response) => {
                process.nextTick(cb, res, response);
            });
        case 'GET':
            return inquiry(method, pathname, params, (response) => {
                process.nextTick(cb, res, response);
            });
        default:
            return process.nextTick(cb, res, null);
    }
});

const register = ((method, pathname, params, cb) => {
    const response = {
        key: params.key,
        errorcode: 0,
        errormessage: 'success'
    };

    console.log(params.userid, params.goodsid);
    
    if (params.userid === null || params.goodsid === null) {
        response.errorcode = 1;
        response.errormessage = 'Invalid Parameters';
        cb(response);
    } else {
        redis.get(params, goodsid, (err, result) => {
            if (err || result === null) {
                response.errorcode = 1;
                response.errormessage = "Redis failure";
                cb(response);
                return;
            }
            
            const connection = mysql.createConnection(conn);
            connection.connect();
            connection.query('insert into purchases (userid, goodsid) values (?, ?)',
            [params.userid, params.goodsid],
            (error, results, fields) => {
                if (error) {
                    response.errorcode = 1;
                    response.errormessage = error;
                }

                cb(response);
            });
            connection.end();
        });
    }
});

const inquiry = ((method, pathname, params, cb) => {
    const response = {
        key: params.key,
        errorcode: 0,
        errormessage: 'success'
    };

    if (params.userid === null) {
        response.errorcode = 1;
        response.errormessage = 'Invalid Parameters';
        cb(response);
    } else {
        const connection = mysql.createConnection(conn);
        connection.connect();
        connection.query('select id, goodsid, date from purchases where userid = ?',
        [params.userid],
        (error, results, fields) => {
            if (error) {
                response.errorcode = 1;
                response.errormessage = error;
            }else {
                response.userid = results;
            }

            cb(response);
        });
        connection.end();
    }
});