const mysql = require('mysql');
const conn = {
    host: '192.168.122.128',
    port: '3306',
    user: 'monolithic',
    password: 'monolithic',
    database: 'monolithic'
};
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
        case 'DELETE':
            return unregister(method, pathname, params, (response) => {
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

    if (params.username === null || params.password === null) {
        response.errorcode = 1;
        response.errormessage = 'Invalid Parameters';
        cb(response);
    } else {
        const connection = mysql.createConnection(conn);
        connection.connect();
        connection.query('insert into members (username, password) values (?, md5(?))',
        [params.username, params.password],
        (error, results, fields) => {
            if (error) {
                response.errorcode = 1;
                response.errormessage = error;
            }

            cb(response);
        });
        connection.end();
    }
});

const inquiry = ((method, pathname, params, cb) => {
    const response = {
        key: params.key,
        errorcode: 0,
        errormessage: 'success'
    };

    if (params.username === null || params.password === null) {
        response.errorcode = 1;
        response.errormessage = 'Invalid Parameters';
        cb(response);
    } else {
        const connection = mysql.createConnection(conn);
        connection.connect();
        connection.query('select id from members where username = ? and password = md5(?)',
        [params.username, params.password],
        (error, results, fields) => {
            if (error) {
                response.errorcode = 1;
                response.errormessage = error ? error : 'Invalid password';
            }else {
                response.userid = results[0].id;
            }

            cb(response);
        });
        connection.end();
    }
});

const unregister = ((method, pathname, params, cb) => {
    const response = {
        key: params.key,
        errorcode: 0,
        errormessage: 'success'
    };

    if (params.username === null) {
        response.errorcode = 1;
        response.errormessage = 'Invalid Parameters';
        cb(response);
    } else {
        const connection = mysql.createConnection(conn);
        connection.connect();
        connection.query('delete from members where username = ?',
        [params.id],
        (error, results, fields) => {
            if (error) {
                response.errorcode = 1;
                response.errormessage = error;
            }

            cb(response);
        });
        connection.end();
    }
});