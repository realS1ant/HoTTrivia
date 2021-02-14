const { io } = require('./app');
const moment = require('moment');
const { Socket } = require('socket.io');

var correct = '';
var roundNumber = 0;
var roundEnd = 0;

//Socket code
io.on('connection', (socket) => {
    console.log(`User connected. ID: ${socket.id}\n Sockets: ${io.sockets.sockets.size}`);
    socket.on('data', data => {
        console.log(`Data incoming:\n - ${data.choice}\n - ${data.time}`);
        if (data.choice == 'tails') {
            eliminate(socket.id);
            console.log('Eliminated this socket!')
        }
    });
});

function startRound(roundNum, duration, correctAnswer) {
    var date = moment(new Date()).add(duration, 's').toDate();
    roundNumber = roundNum;
    roundEnd = date;
    correct = correctAnswer;
    io.emit('startRound', roundNum, date);
}

function eliminate(socketId) {
    io.socket(socketId).emit('eliminate');
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

module.exports = { startRound, }