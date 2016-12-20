// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";
// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';
// Port where we'll run the websocket server
const webSocketsServerPort = 1337;
const mongoDbPort = process.env.PORT || 7082; // used to create, sign, and verify tokens
// websocket and http servers
const webSocketServer = require('websocket').server;
const http = require('http');



/**
 * Global variables
 */
let history = [];
// list of currently connected clients (users)
const clients = [];
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');
const serve = serveStatic("./");
/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Array with some colors
var colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
// ... in random order
colors.sort(function(a, b) { return Math.random() > 0.5; });

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    var done = finalhandler(request, response);
    serve(request, response, done);
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on mongoDbPort " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    console.log('server Port = ' + webSocketsServerPort + '. MongoDbPort = ' + mongoDbPort);
    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify({ type: 'history', data: history }));
    }

    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            if (userName === false) { // first message sent by user is their name
                // remember user name
                userName = htmlEntities(message.utf8Data);
                // get random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type: 'color', data: userColor }));
                console.log((new Date()) + ' User is known as: ' + userName +
                    ' with ' + userColor + ' color.');

            } else { // log and broadcast the message
                console.log((new Date()) + ' Received Message from ' +
                    userName + ': ' + message.utf8Data);

                // we want to keep history of all sent messages
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor
                };
                history.push(obj);
                history = history.slice(-100);

                // broadcast message to all connected clients
                var json = JSON.stringify({ type: 'message', data: obj });
                for (var i = 0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer " +
                connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });

});




























// =================================================================
// get the packages we need ========================================
// =================================================================
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const morgan = require('morgan');
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const jws = require('jws');
const config = require('./config'); // get our config file
const User = require('./models/user'); // get our mongoose model
const CryptBuffer = require("./crypto/crypto-buffer");
const aesDecryptUtil = new CryptBuffer(config.encryptPayloadKey); // get our config file

// =================================================================
// configuration ===================================================
// =================================================================

mongoose.connect('mongodb://localhost:27017/test'); // connect to database
app.set('sharedSecretKey', config.sharedSecretKey); // sharedSecretKey string
app.set('encryptPayloadKey', config.encryptPayloadKey); // encryptPayloadKey string
app.set('tokenSigningKey', config.tokenSigningKey); // tokenSigningKey string
app.set('tokenHeader', config.tokenHeader);
// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =================================================================
// routes ==========================================================
// =================================================================

// basic route (http://localhost:1337)
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + mongoDbPort + '/api');
});

// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
const apiRoutes = express.Router();


app.post('/save', function(req, res) {
    // TODO verifies secret and checks exp

    let user = new User({
        "id": req.body.id,
        "username": req.body.username,
        "email": req.body.email,
        "password": req.body.password,
        "token": req.header(app.get('tokenHeader')),
        "authorities": req.body.authorities
    });

    // save the user
    user.save(function(err) {
        if (err){
            res.json({ success: false , message : 'err = ' + err});
            throw err; }
        else if( typeof user !== 'undefined' && user ){
            req.decoded =  user;
            // res.setHeader(app.get('tokenSigningKey'), "Bearer " + token );
            return res.status(200).send(user);
        }

        res.json({ success: true , message : 'userFromToken = ' + userFromToken});
    });
});

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost:8080/api/authenticate
apiRoutes.post('/authenticate', function(req, res) {

    // find the user
    User.findOne({
        id: req.body.id
    }, function(err, user) {

        if (err) throw err;

        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {

            // check if password matches
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, app.get('tokenSigningKey'), {
                    expiresIn: 86400 // expires in 24 hours
                });

                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }

    });
});

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    const token = req.body.token || req.param('token') || req.headers[app.get('tokenHeader')];
    // decode token
    if (token) {

        // var token1 = jwt.substring("Bearer ".length(), jwt.length());
        // verifies secret and checks exp
        // var ok = jws.verify(token, 'HS256', app.get('tokenSigningKey'));
        // if(ok){
        //     var decodedToken = jws.decode(token);
        //      userFromToken = aesDecryptUtil.decrypt(decodedToken);
        //     req.decoded = userFromToken;
        // }
        jwt.verify(token, app.get('tokenSigningKey'), function(err, encodedBody) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = aesDecryptUtil.decrypt(encodedBody);
                next();
            }
        });
    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }

});

function getQueryVariable(encodedBodyString) {

    let pair = encodedBodyString.split(':');
    const iv = new Buffer(pair[0], 'base64');
    const encodedString = new Buffer(pair[0], 'base64');

    const encryptedString = new Buffer(pair[1], 'base64');
    for (let i = 0; i < vars.length; i++) {
        pair = vars[i].split(':');
        const img = new Buffer(pair[0], 'base64');
        if (decodeURIComponent(pair[0]) == encodedBodyString) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', encodedBodyString);
}



// ---------------------------------------------------------
// authenticated routes
// ---------------------------------------------------------
apiRoutes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the coolest API on earth!' });
});

apiRoutes.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        res.json(users);
    });
});

apiRoutes.get('/check', function(req, res) {
    res.json(req.decoded);
});

app.use('/api', apiRoutes);

// =================================================================
// start the server ================================================
// =================================================================
app.listen(mongoDbPort);
console.log('Magic happens at http://localhost:' + mongoDbPort);