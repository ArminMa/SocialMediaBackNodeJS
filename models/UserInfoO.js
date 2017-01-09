

module.exports = new model('UserInfoO', {
    'username': {type: String},
    "email": {type: String},
    "password":{type: String},
    "socket":{type: WebSocket}
});