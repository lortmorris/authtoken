'use strict';

const Hapi = require('hapi');
const authtoken = require("../index");

const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});


server.register(authtoken.hapi,  (err) => {
    if (err) {
        console.error('Failed to load plugin:', err);
    }
});



server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});