"use strict";

var express = require("../examples/express");
var http = require("http");


function request (headers, url){

    let params = {
        protocol: 'http:',
        host: '127.0.0.1',
        port: 8000,
        method: 'GET',
        path: url || '/',
        headers: headers
    };


    let body = "";

    return new Promise((resolve, reject)=>{
        try{
            let req = http.request(params, (res)=>{
                res.on('data', (s)=>{
                    body=body+s.toString();
                });

                res.on('end', () => {
                    resolve(body);
                });
            });



            req.on('error', (err)=>{   reject(err.toString()); });
            req.end();
        }catch(e){  reject(e.toString()); }

    });
};

describe("testing auth token", function(){

    this.timeout( 5 * 1000 );
    it("init express ", function(done){
        express(8000);
        setTimeout(()=>{
            done();
        }, 2*1000);

    });

    it("request without apikey", function(done, rej){
        request({}, "/")
            .then((body)=>{
                done();
            })
            .catch((err)=>{
                console.log("Cathing: ", err.toString());
                return done(err);
            });

    });


    it("request without apikey to /services", function(done, rej){
        request({}, "/services")
            .then((body)=>{
                var json ={};
                try{
                    json = JSON.parse(body);
                }catch(e){
                    body = {};
                }

                if(json.Error){
                    done();
                }else{
                    done(body);
                }

            })
            .catch((err)=>{
                console.log("Cathing: ", err.toString());
                return done(err);
            });
    });


});

