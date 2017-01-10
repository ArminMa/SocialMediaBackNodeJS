// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";
/**Global variables*/
process.title = 'node-chat';




var connectedUsers = [];
var groups = [];
var UserGroups = require('./models/db_groups'); // get our mongoose model
var User = require('./models/user'); // get our mongoose model
var UserInfo = require('./models/UserInfo');
var Group = require('./models/Group');
const http = require('http');
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

const webSocketsServerGroupPort = 5091;
const webSocketGroupServerServer = require('websocket').server;

/**WebSocket serverGroup 5091*/
var serverGroup = http.createServer(function(request, response) {
    var done = finalhandler(request, response);
    serve(request, response, done);
});
var wsGroupServer = new webSocketGroupServerServer({
    // WebSocket serverChat is tied to a HTTP serverChat. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: serverGroup
});
serverGroup.listen(webSocketsServerGroupPort, function() {
    console.log((new Date()) + " Server is listening on webSocketsServerChatPort " + webSocketsServerGroupPort);
});


// This callback function is called every time someone
// tries to connect to the WebSocket serverChat
wsGroupServer.on('request', function(request) {

    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    var connection = request.accept(null, request.origin);
    console.log('Connection accepted, users.length = ' + connectedUsers.length);
    // user sent some message

    // user send a message
    connection.on('message', function(message) {
        console.log("received data from client: " + JSON.stringify(message));

        // var isTheUserRegisterd = users[index].getUsername();
        var sender = getUserBySocketHandler(connection);
        // register user if not in memory
        if(sender == null) {
            try {
                console.log("message.utf8Data: " + message.utf8Data);
                var mynewJsonObject = JSON.parse(message.utf8Data);
                var userInformation = new UserInfo(mynewJsonObject.username);
                userInformation.setPassword(mynewJsonObject.password);
                userInformation.setSocket(connection);
                connectedUsers.push(userInformation);
                console.log("connectedUsers size = " + connectedUsers.length);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ' + message.utf8Data);
                return;
            }
        }else{ // user registered assume wanting to create group
            var userNameToChatWith = JSON.parse(message.utf8Data);


            var group =  new UserGroups({
                'users': [{"username":sender.getUsername()},{"username":userNameToChatWith.username} ]

            });
            group.save(function(err, result) {
                if(err){console.log('EEEEEEEEEEEEEEEEEERRRRRRRRRRRRRRROOOOOOOORRRRRR when trying to save the userGrup');}
                if (!result) return null;
                else{
                    console.log('User saved successfully result._id = '+ result._id);
                    var newGroupId = result._id;
                    console.log('newGroupId after saveGroup = '+ newGroupId);
                    connection.sendUTF(JSON.stringify({ 'groupid': newGroupId }));
                    var mynewJsonObject = JSON.parse(message.utf8Data);
                    var userNameObject = new UserInfo(mynewJsonObject.username);
                    console.log('user to chat with = ' + userNameObject.getUsername());
                    for(var index=0; index < connectedUsers.length; index++ ){
                        var userObject = connectedUsers[index];
                        console.log('in the loop. userObject.getUsername() = ' + userObject.getUsername());
                        if(userObject.getUsername() == userNameObject.getUsername()){
                            console.log('in the if. equals successfull. userObject.getUsername() = ' + userObject.getUsername());
                            userObject.getSocket().sendUTF(JSON.stringify({ 'groupid': newGroupId }));
                        }

                    }
                }
            });
        }
    });

    // user disconnected
    connection.on('close', function(event) {
        var closer = getUserBySocketHandler(connection);
        for(var index = 0; index < connectedUsers.length; index++){
            if(connectedUsers[index].getSocket() == closer.getSocket()){
                console.log("in the close if ");
                connectedUsers.splice(index, 1);
            }
        }

        console.log("removed user: connectedUsers = " + connectedUsers.length);
    });

    connection.onerror = function(){
        console.log("Error connection.onerror??????")
    };

});



function getUserBySocketHandler(socket) {
    var index;
    if(connectedUsers.length == 0){return null}
    else{
        for (index = 0; index < connectedUsers.length; ++index) {

            if(connectedUsers[index].getSocket() == socket )
            {
                return connectedUsers[index];
            }
        }
        return null;
    }

}


/**
 *
 * webSocketChatServer
 *
 *
 *
 */
const webSocketsServerChatPort = 5092;
const webSocketChatServer = require('websocket').server;

/**WebSocket serverChat 5092*/
var serverChat= http.createServer(function(request, response) {
    var done = finalhandler(request, response);
    serve(request, response, done);
});
var wsChatServer = new webSocketChatServer({
    // WebSocket serverChat is tied to a HTTP serverChat. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: serverChat
});
serverChat.listen(webSocketsServerChatPort, function() {
    console.log((new Date()) + " Server is listening on webSocketsServerChatPort " + webSocketsServerChatPort);
});


// This callback function is called every time someone
// tries to connect to the WebSocket serverChat

wsChatServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    var connectionChat = request.accept(null, request.origin);
    console.log('Connection accepted, users.length = ' + connectedUsers.length);
    // user sent some message

    // user send a message
    connectionChat.on('message', function(message) {
        console.log("received data from client: " + JSON.stringify(message));
        var mynewJsonObject = JSON.parse(message.utf8Data);
        var messagePojo = {
            'groupid':mynewJsonObject.groupid,
            'message':mynewJsonObject.message,
            'sendername':mynewJsonObject.sendername
        };


        var group = findGroup(messagePojo.groupid);

        if(group== null){
            // UserGroups.find({"_id": messagePojo.groupid}).lean().exec(function (err, result) {
            //     console.log('JSON.stringify(result) = ' + JSON.stringify(result));
            // });
            console.log('search in Mongo DB messagePojo.groupid = ' + messagePojo.groupid);
            UserGroups.findOne({"_id": messagePojo.groupid }, function(err, result) {

                if (err){
                    console.log('returning result failed');
                    throw err;
                }

                if (!result) {
                    console.log('group not found in DB');
                    return;
                } else {
                    var username1 = result.users[0].username;
                    var username2 = result.users[1].username;
                    var userPojo1 = new UserInfo(username1);
                    var userPojo2 = new UserInfo(username2);

                    var userSender = new UserInfo(messagePojo.sendername);
                    console.log('sender name = ' + messagePojo.sendername);
                    if(userPojo1.getUsername() == userSender.getUsername()){
                        console.log('user1 is sender');
                        userPojo1.setSocket(connectionChat);
                    } else if (userPojo2.getUsername() == userSender.getUsername()){
                        console.log("user2 is sender");
                        userPojo2.setSocket(connectionChat);
                    }
                    var groupToPushInArray = new Group(userPojo1, userPojo2);
                    groupToPushInArray.setId(result._id);
                    console.log('group id = ' + groupToPushInArray.getId());
                    groups.push(groupToPushInArray);
                    console.log('success: group size = ' + groups.length);
                }
            });
        } else {
            var userSender = new UserInfo(messagePojo.sendername);
            if (group.getUserInfo1().getUsername() == userSender.getUsername()) {
                if (group.getUserInfo1().getSocket() == null) {
                    console.log('user1 socket set');
                    group.getUserInfo1().setSocket(connectionChat);
                    return;
                }
            }
            else if(group.getUserInfo2().getUsername() == userSender.getUsername()) {
                if (group.getUserInfo2().getSocket() == null) {
                    console.log('user2 socket set');
                    group.getUserInfo2().setSocket(connectionChat);
                    return;
                }
            }
            group.getUserInfo1().getSocket().sendUTF(messagePojo.sendername +'@ '+ messagePojo.message);
            group.getUserInfo2().getSocket().sendUTF(messagePojo.sendername +'@ '+ messagePojo.message);
        }

    });

    // user disconnected
    connectionChat.on('close', function(event) {
        console.log("user disconnected from group");
        var userSender = new UserInfo("");
        userSender.setSocket(connectionChat);
        for(var index = 0; index < groups.length; index++) {
            if(groups[index].getUserInfo1().getSocket() == userSender.getSocket()){
                groups[index].getUserInfo2().getSocket().sendUTF(groups[index].getUserInfo1().getUsername() +'@ '+ ' has left the chat');
                groups.splice(index, 1);
                console.log("connected groups = " + groups.length);
                return;
            }
            if(groups[index].getUserInfo2().getSocket() == userSender.getSocket()){
                groups[index].getUserInfo1().getSocket().sendUTF(groups[index].getUserInfo2().getUsername() +'@ '+ ' has left the chat');
                groups.splice(index, 1);
                console.log("connected groups = " + groups.length);
                return;
            }
        }


    });

    connectionChat.onerror = function(){
        console.log("Error connection.onerror??????")
    };

});


function findGroup(groupid) {
    var theGroup = new Group();
    theGroup.setId(groupid);
    for(var index=0; index < groups.length; index++){
        if(groups[index].getId() == theGroup.getId()){
            return groups[index];
        }
    }
    return null;
}




















// =================================================================
// MongoDB the packages we need ========================================
// =================================================================
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const morgan = require('morgan');
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const jws = require('jws');
const config = require('./config'); // get our config file


// =================================================================
// configuration ===================================================
// =================================================================

mongoose.connect('mongodb://localhost:27017/DEFAULT_DB'); // connect to database
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


function saveGroup(groupObject) {

    // call the built-in save method to save to the database


}



// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
const apiRoutes = express.Router();


app.post('/save', function(req, res) {
    // TODO verifies secret and checks exp

    // let user = new User({
    //     "id": req.body.id,
    //     "username": req.body.username,
    //     "email": req.body.email,
    //     "password": req.body.password,
    //     "token": req.header(app.get('tokenHeader')),
    //     "authorities": req.body.authorities,
    //     "index": -1,
    //     "online":false
    //
    // });







    var query = { "username": req.body.username },
        update = {         "id": req.body.id,
            "username": req.body.username,
            "email": req.body.email,
            "password": req.body.password,
            "token": req.header(app.get('tokenHeader')),
            "authorities": req.body.authorities,
            "index": -1,
            "online":false },
        options = { upsert: true };

    User.findOneAndUpdate(query, update, options, function(error, result) {
        if (!error) {
            // If the document doesn't exist
            if (!result) {
                // Create it
                result = new User({
                    "id": req.body.id,
                    "username": req.body.username,
                    "email": req.body.email,
                    "password": req.body.password,
                    "token": req.header(app.get('tokenHeader')),
                    "authorities": req.body.authorities,
                    "index": -1,
                    "online":false
                });


            }
            // Save the document
            result.save(function(err) {
                if (err){
                    res.json({ success: false , message : 'err = ' + err});
                    throw err; }
                else if( typeof result !== 'undefined' && result ){
                    req.decoded =  result;
                    // res.setHeader(app.get('tokenSigningKey'), "Bearer " + token );
                    return res.status(200).send({ success: true , message : 'userFromToken = ' + result.toString()});
                }
            });
        }
    });
});
//
//     // save the user
//     user.save(function(err) {
//         if (err){
//             res.json({ success: false , message : 'err = ' + err});
//             throw err; }
//         else if( typeof user !== 'undefined' && user ){
//             req.decoded =  user;
//             // res.setHeader(app.get('tokenSigningKey'), "Bearer " + token );
//             return res.status(200).send(user);
//         }
//
//         res.json({ success: true , message : 'userFromToken = ' + userFromToken});
//     });
// });

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost:8080/api/authenticate
apiRoutes.post('/authenticate', function(req, res) {

    // find the user
    User.findOne({"id": req.body.id}, function(err, user) {

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

function findOneUserByUserName(userName) {

    // find the user
    User.findOne({"username": userName}, function(err, user) {
        if (err) return undefined;
        if (!user) {
            return undefined;
        } else if (user) {return user;}

    });


}

function updateUserIndex(userName, index) {

    // find the user
    User.findOne({"username": userName}, function(err, user) {
        if (!user) {
            return undefined;
        } else if (user) {
            user.index = index;
        }

        user.save(function(err) {
            if (err)
                console.log('error')
            else
                console.log('success')
        });

    });


}

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

}


