

var crypto = require('crypto');
const decipher = crypto.createDecipher('aes256', '8j/2Bs9KyUYnLYsjGkWspA==');
var password;

// Constructor1
function EncryptoBuffer(password) {
    // always initialize all instance properties
    this.password = password;
}
EncryptoBuffer.prototype.encrypt = function (buffer, password){
    var cipher = crypto.createCipher(algorithm,password);
    var crypted = Buffer.concat([cipher.update(buffer),cipher.final()]);
    return crypted;
}

// Constructor1
function DecryptoBuffer(password) {
    // always initialize all instance properties
    this.password = password;

}
DecryptoBuffer.prototype.decrypt = function (encrypted){
    var decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log(decrypted);
    return decrypted;
}

// export the class
module.exports = EncryptoBuffer;
// export the class
module.exports = DecryptoBuffer;

/*
var hw = encrypt(new Buffer("hello world", "utf8"))
// outputs hello world
console.log(decrypt(hw).toString('utf8'));
*/
