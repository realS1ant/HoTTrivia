const { io, store } = require('./app');
const moment = require('moment');
const { Socket } = require('socket.io');
let defaultTime = 10;

var correct = '';
var roundNumber = 0;
var roundEnd = 0;
var inRound = false;

//Socket code
io.on('connection', async (s) => {
    const socket = socketType(s);
    // const session = await store.get(socket.request.session.id, (err, sess) => { return sess; });
    const session = socket.request.session;

    session.lastSocketId = socket.id;
    store.set(session.id, session, err => { if (err) console.error(err); });

    if (session.status === 'eliminated') socket.emit('eliminate');
    else if (session.status === 'playing');
    else {
        console.log('Someone joined without a (recognized) status! Just making them a player');
        session.status = 'playing';
        store.set(session.id, session, err => { if (err) console.error(err); });
    }

    socket.on('data', data => {
        if (session.status === 'eliminated') {
            socket.emit('eliminate');
            socket.emit('error', 'You were already eliminated!', false, true);
            return;
        }
        if (!(data.choice && data.time) || !(data.choice === 'heads' | data.choice === 'tails')) {
            //Data not valid
            //'error', message, restart
            socket.emit('error', 'Invalid Data!', true, true);
            return;
        }
        if (data.choice === correct && !moment(data.time).isAfter(moment(roundEnd).add(1, 'second'))) {
            session.status = 'playing';
            store.set(session.id, session, err => { if (err) console.error(err); });
            return;
        } else if (moment(data.time).isAfter(moment(roundEnd).add(1, 'second'))) {
            session.status = 'eliminated';
            store.set(session.id, session, err => { if (err) console.error(err); });
        } else {
            session.status = 'eliminated';
            store.set(session.id, session, err => { if (err) console.error(err); });
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
                    players.push({ sessionId: sock.request.session.id, email: sock.request.session.email, name: sock.request.session.name });
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
                store.set(session.id, session, err => { if (err) console.error(err); });
            }
        });
    });

    socket.on('banPlayer', (socketId) => {
        //not sure how to ban from session ID as can't rlly grab session from ID?
        //work out later or just leave it (definitely wouldn't be the end of the world)
        console.log('tried to ban player with id: ')
    });

});

function startRound(roundNum, duration, correctAnswer) {
    var date = moment(new Date()).add(duration, 's').toDate();
    roundNumber = roundNum;
    roundEnd = date;
    correct = correctAnswer;
    io.emit('startRound', roundNum, date);
    let total = 0;
    io.sockets.sockets.forEach(s => {
        if (s.request.session.player === true && s.request.session.status === 'playing') total++;
    });
    io.sockets.sockets.forEach(s => {
        if (s.request.session.admin === true) s.emit('playersLeft', total);
    });
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
