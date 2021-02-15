const { io } = require('./app');
const moment = require('moment');
const { Socket } = require('socket.io');

var correct = '';
var roundNumber = 0;
var roundEnd = 0;
var inRound = false;

//Socket code
io.on('connection', (s) => {
    const socket = socketType(s);
    socket.on('data', data => {
        if (!(data.choice && data.time) || !(data.choice === 'heads' | data.choice === 'tails')) {
            //Data not valid
            //'error', message, restart
            socket.emit('error', 'Invalid Data!', true);
            return;
        }
        if (data.choice == correct && !moment(data.time).isAfter(roundEnd)) {
            socket.emit('correct');
        } else if (moment(data.time).isAfter(roundEnd)) {
            eliminate(socket);
        } else {
            eliminate(socket);
        }
    });
    socket.on('startRound', (num, time, answer) => {
        if (socket.request.session.admin === true) startRound(num, time, answer);
    });
});

function startRound(roundNum, duration, correctAnswer) {
    var date = moment(new Date()).add(duration, 's').toDate();
    roundNumber = roundNum;
    roundEnd = date;
    correct = correctAnswer;
    io.emit('startRound', roundNum, date);
}

function eliminate(socket) {
    socket.emit('eliminate');
}

function correct(socket) {
    socket.emit('correct');
}

/**
 * 
 * @param {String} id 
 * 
 * @returns {Socket}
 */
function getSocketById(id) {
    io.sockets.sockets[id];
}


/**
 * 
 * @param {Socket} socket
 * 
 * @returns {Socket} 
 */
function socketType(socket) {
    return socket;
}

// app.get('/hello/:num/:seconds', (req, res, next) => {
//     console.log('starting new round ' + req.params.num);
//     // var date = new Date();
//     // date.setSeconds(date.getSeconds() + 15);
//     // date.setSeconds(date.getSeconds() + req.params.time);
//     var date = moment(new Date()).add(req.params.seconds, 's').toDate();
//     console.log(new Date())
//     console.log(date)
//     io.emit('startRound', req.params.num, date);
// });

module.exports = { startRound }