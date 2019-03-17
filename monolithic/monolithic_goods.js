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
        errorcode: 0,
        errormessage: 'success'
    };

    if (params.name === null || params.category === null || params.price === null || params.description === null) {
        response.errorcode = 1;
        response.errormessage = 'Invalid Parameters';
        cb(response);
    } else {
        const connection = mysql.createConnection(conn);
        connection.connect();
        connection.query('insert into goods (name, category, price, description) values (?, ?, ?, ?)',
        [params.name, params.category, params.price, params.description],
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
        errorcode: 0,
        errormessage: 'success'
    };

    const connection = mysql.createConnection(conn);
        connection.connect();
        connection.query('select * from goods',
        (error, results, fields) => {
            if (error || results.length === 0) {
                response.errorcode = 1;
                response.errormessage = error;
            }else {
                response.results = results;
            }

            cb(response);
        });
        connection.end();
});

const unregister = ((method, pathname, params, cb) => {
    const response = {
        errorcode: 0,
        errormessage: 'success'
    };

    if (params.id === null) {
        response.errorcode = 1;
        response.errormessage = 'Invalid Parameters';
        cb(response);
    } else {
        const connection = mysql.createConnection(conn);
        connection.connect();
        connection.query('delete from goods where id = ?',
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