var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMogoose = require('passport-local-mongoose');

var User = new Schema({
    admin:   {
        type: Boolean,
        default: false
    }
});

User.plugin(passportLocalMogoose);

module.exports = mongoose.model('User', User);