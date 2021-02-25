const { io } = require('./app');
const moment = require('moment');
const { Socket } = require('socket.io');
let defaultTime = process.env.DEFAULT_ROUND_DURATION;


var correct = '';
var roundNumber = 0;
var roundEnd = 0;
var inRound = false;


//Socket code
io.on('connection', (s) => {
    const socket = socketType(s);
    const session = socket.request.session;

    session.lastSocketId = socket.id;

    if (session.status === 'eliminated') socket.emit('eliminate');
    else session.status = 'playing';

    socket.on('data', data => {
        if (session.status === 'eliminated') {
            socket.emit('eliminate');
            socket.emit('error', 'You were already eliminated!', false, true);
        }
        if (!(data.choice && data.time) || !(data.choice === 'heads' | data.choice === 'tails')) {
            //Data not valid
            //'error', message, restart
            socket.emit('error', 'Invalid Data!', true, true);
            return;
        }
        if (data.choice === correct && !moment(data.time).isAfter(roundEnd)) {
            session.status = 'playing';

        } else if (moment(data.time).isAfter(roundEnd)) {
            session.status = 'eliminated';
        } else {
            session.status = 'eliminated';
        }
    });

    socket.on('setDefaultRoundDuration', time => {
        if (session.admin === true) {
            if (time == 0) return;
            defaultTime = time;
            console.log('defaultTime: ' + defaultTime)
        }
    });

    socket.on('updateLoginSettings', (allowLogins, checkEmails) => {
        if (session.admin === true) {
            if (typeof allowLogins != 'boolean' || typeof checkEmails != 'boolean') {
                global.globalAllowLogins = true;
                global.globalCheckEmails = true;
                console.log('UpdateLoginSettings data not valid');
            } else {
                global.globalAllowLogins = allowLogins;
                global.globalCheckEmails = checkEmails;
            }
        }
    });

    //Admin things
    socket.on('startRound', () => {
        if (session.admin === true) {
            correct = Math.floor(Math.random() * 2) === 1 ? 'heads' : 'tails';
            startRound(++roundNumber, defaultTime, correct);
        }
    });
    socket.on('sendPlayers', () => {
        if (session.admin === true) {
            const players = [];
            io.sockets.sockets.forEach(sock => {
                if (sock.request.session.player === true) {
                    players.push({ sessionId: sock.request.session.id, email: sock.request.sesion.email, name: sock.request.sesion.name });
                }
            });
            socket.emit('allPlayers', players);
        }
    });
    socket.on('sendResults', () => {
        //just sending the correct answer and the clients can validate theirselves, if they remove some code and let themselves 
        //  continue when they send the data they will be stopped.
        if (!session.admin === true) return;
        if (moment(new Date()).isBefore(roundEnd)) return;
        io.sockets.emit('correctAnswer', correct);
    });
    socket.on('reviveEliminated', () => {
        if (!session.admin === true) return;
        io.sockets.sockets.forEach(sock => {
            if (sock.request.session.status === 'eliminated') {
                sock.emit('revive');
                sock.request.session.status = 'playing';
            }
        });
    })

    socket.on('banPlayer', (sessionId) => {
        //not sure how to ban from session ID as can't rlly grab session from ID?
    });

});

function startRound(roundNum, duration, correctAnswer) {
    var date = moment(new Date()).add(duration, 's').toDate();
    roundNumber = roundNum;
    roundEnd = date;
    correct = correctAnswer;
    io.emit('startRound', roundNum, date);
}

//emit 'eliminate' to show the eliminated view.
//emit 'correct' to show the correct answer view.
//emit 'wait' to show the spinner for everyone
//emit 'voting' to show the voting section. (this is automatically done on startRound though.)

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

module.exports = { startRound }
