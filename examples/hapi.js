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

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello!');
    }
});


server.route({
    method: 'GET',
    path: '/exa1',
    handler: function (request, reply) {
        reply('Hello exa1!');
    }
});

server.route({
    method: 'GET',
    path: '/exa2',
    handler: function (request, reply) {
        reply('Hello exa2!');
    }
});



server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});