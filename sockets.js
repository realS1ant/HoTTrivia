const { io, store } = require('./app');
const moment = require('moment');
const { Socket } = require('socket.io');
let defaultTime = 10;
let playerThreshold = 15; //Number of players when it starts saving so it can revive if everyone votes the wrong answer and gets out.

var correct = '';
var roundNumber = 0;
var roundEnd = 0;
var inRound = false;
var adminSockets = [];
var newHeadsVotes = 0;
var newTailsVotes = 0;
var presentView = '';
var playersLeft = 0;
var lastRoundPlayers = [];
let preGame = true;
var gameOver = false;

//Socket code
io.on('connection', (s) => {
    const socket = socketType(s);
    // const session = await store.get(socket.request.session.id, (err, sess) => { return sess; });
    const session = socket.request.session;

    if (session.banned === true) {
        socket.emit('error', 'You are banned!', true, true);
        socket.disconnect();
    }

    session.lastSocketId = socket.id;
    store.set(session.id, session, err => { if (err) console.error(err); });

    if (session.status === 'eliminated') {
        socket.emit('eliminate');
        if (preGame) playersLeft++;
    }
    else if (session.status === 'playing') {
        playersLeft++;
        adminSockets.forEach(a => {
            a.emit('newPlayer', playersLeft, session.id, session.accountData.email, session.accountData.email);
        });
    }
    else if (session.admin === true);
    else {
        console.log('Someone joined without a (recognized) status! Just making them a player');
        session.status = 'playing';
        store.set(session.id, session, err => { if (err) console.error(err); });
        playersLeft++;
        adminSockets.forEach(a => {
            a.emit('newPlayer', playersLeft, session.id, session.accountData.email, session.accountData.email);
        });
    }
    if (preGame) {
        adminSockets.forEach(a => {
            a.emit('playerCount', playersLeft);
        });
    }

    socket.on('disconnect', () => {
        if (session.admin) return;
        playersLeft--;
        adminSockets.forEach(a => {
            a.emit('removePlayer', playersLeft, session.id);
        });
    });

    if (socket.request.session.admin === true) {
        adminSockets.push(socket);
        socket.emit('currentInfo', roundNumber, roundEnd);
        socket.emit('playerCount', playersLeft);
    }

    if (inRound) io.emit('startRound', roundNumber, roundEnd);

    socket.on('data', data => {
        if (session.banned === true) {
            socket.emit('error', 'You are banned!', true, true);
            socket.disconnect();
        }

        if (session.status === 'eliminated') {
            socket.emit('eliminate');
            socket.emit('error', 'You were already eliminated!', false, true);
            return;
        }
        if (!(data.choice && data.time) || !(data.choice === 'heads' | data.choice === 'tails')) {
            //Data not valid
            //'error', message, restart, red color
            socket.emit('error', 'Invalid Data!', true, true);
            return;
        }

        if (data.choice === 'heads') newHeadsVotes++;
        else if (data.choice === 'tails') newTailsVotes++;

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

    //Admin Things
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

    socket.on('startRound', () => {
        if (session.admin === true) {
            if (checkInRound()) {
                socket.emit('error', 'Round already in progress.');
                return;
            }
            startRound();
        }
    });
    socket.on('sendPlayers', () => {
        if (session.admin === true) {
            let players = [];
            let pLeft = 0;
            io.sockets.sockets.forEach(sock => {
                if (sock.request.session.player === true) {
                    if (sock.request.session.status === 'playing') pLeft++;
                    players.push({ sessionId: sock.request.session.id, email: sock.request.session.accountData.email, name: sock.request.session.accountData.name });
                }
            });
            socket.emit('allPlayers', players, pLeft);
        }
    });
    socket.on('sendResults', () => {
        if (session.admin !== true) return;
        if (checkInRound()) {
            socket.emit('error', 'Still in round!');
            return;
        }
        if (moment(new Date()).isBefore(roundEnd)) return;

        playersLeft = 0;
        let player = [];
        io.sockets.sockets.forEach(sock => {
            if (sock.request.session.status === 'playing') {
                playersLeft++;
                player = { name: sock.request.session.accountData.name, sid: sock.id };
            }
        });
        io.sockets.emit('correctAnswer', correct);
        if (playersLeft === 1) {
            //one person won.
            // console.log(player);
            // console.log(getSocketById(player.sid));
            // console.log(io.sockets.sockets); Isn't working for some very weird reason????? (may have a hard time veryifying winner, could ask for email and see if it matches name.)
            getSocketById(player.sid).emit('won');
            io.sockets.sockets.forEach(sock => {
                if (sock.request.session.admin === true) {
                    sock.emit('winner', player.name);
                    sock.emit('presentView', 'game-over');
                }
            });
            presentView = 'game-over';
            gameOver = true;
            console.log(`Set present view to: game-over`);
        } else if (playersLeft === 0) {
            console.log('everyone got out.');
            lastRoundPlayers.forEach(sid => {
                let sess = getSocketById(sid).request.session;
                sess.status = 'playing';
                store.set(sid, sess, err => { if (err) console.error(err); });
                getSocketById(sid).emit('revive', false);
            });
        }


        socket.emit('playersLeft', playersLeft);
        if (playersLeft > playerThreshold) lastRoundPlayers = [];
    });
    socket.on('reviveEliminated', () => {
        if (session.admin !== true) return;
        io.sockets.sockets.forEach(sock => {
            let sess = sock.request.session;
            if (sess.status === 'eliminated') {
                sock.emit('revive', true);
                sess.status = 'playing';
                store.set(sess.id, sess, err => { if (err) console.error(err); });
            }
        });
    });

    socket.on('nextRndNum', num => {
        if (session.admin !== true) return;
        roundNumber = num;
    });

    socket.on('banPlayer', sid => {
        if (session.admin !== true) return;
        //not sure how to ban from session ID as can't rlly grab session from ID?
        //work out later or just leave it (definitely wouldn't be the end of the world)
        // console.log('tried to ban player with id: ' + sessionId);
        store.get(sid, (err, sess) => {
            //     sess.player = false;
            //     sess.admin = false;
            //     sess.banned = true;
            // // error: wasnt getting the socket I believe.
            //     getSocketById(sess.lastSocketId).emit('error', 'You have been banned!', false, true); 
            //     getSocketById(sess.lastSocketId).disconnect();
            // console.log(`lastSocketId: ${sess.lastSocketId}`);

            //Thought of new way to ban (even though this feature shouldn't matter too much would be good to make sure we have a sort of bad word filter in place.)
            sess.player = false;
            sess.admin = false;
            sess.banned = true;
            store.set(sid, sess);
        });

    });

    //Presentation View Management
    socket.on('setPresentationView', view => {
        if (session.admin !== true) return;
        if (!['game-over', 'pre-game', 'playing'].includes(view)) {
            console.log(`No handling for presentation view: ${view}`);
            return;
        }
        if (presentView === view) {
            socket.emit('error', `Already in ${view} view!`);
            return;
        }
        if (inRound) {
            socket.emit('error', 'Currently in a round!');
            return;
        }

        if (view === 'pre-game') {
            adminSockets.forEach(a => {
                a.emit('playerCount', playersLeft);
            });
        }

        presentView = view;
        adminSockets.forEach(sock => {
            sock.emit('presentView', view);
        });
        console.log(`Set present view to: ${view}`);
    });

    socket.on('boxHeight', h => {
        if (session.admin !== true) return;
        if (typeof (h) !== Number) {
            if (typeof (h) === 'string') h = +h;
            else {
                console.log('tried to set box height to: ' + h);
                console.log(typeof (h));
                return;
            }
        }
        adminSockets.forEach(sock => {
            sock.emit('boxHeight', h);
        });
    });
});

//Send out votes to admins.
setInterval(() => {
    if (checkInRound()) {
        if (newHeadsVotes + newTailsVotes > 0) {
            adminSockets.forEach(s => {
                s.emit('updateVotes', newHeadsVotes, newTailsVotes);
            });
            newHeadsVotes = 0;
            newTailsVotes = 0;
        }

    }
}, 1000);

function startRound() {
    if (gameOver) {
        gameOver = false;
        roundNumber = 0;
    }
    roundNumber++;
    roundEnd = moment(new Date()).add(defaultTime, 's').toDate();
    inRound = true;
    correct = Math.floor(Math.random() * 2) === 1 ? 'heads' : 'tails';
    io.emit('startRound', roundNumber, roundEnd);
    lastRoundPlayers = [];
    io.sockets.sockets.forEach(sock => {
        if (sock.request.session.player === true && sock.request.session.status === 'playing') lastRoundPlayers.push(sock.id);
    });
    adminSockets.forEach(sock => {
        sock.emit('playersLeft', lastRoundPlayers.length);
    });
    if (lastRoundPlayers.length >= playerThreshold) lastRoundPlayers = []; //Save memory, couldn't think of a better way to do this and running out of time.
}

function checkInRound() {
    if (inRound) {
        if (moment(new Date()).isAfter(moment(roundEnd))) {
            inRound = false;
            awaitingResults = true;
            return false;
        } else return true;
    } else return inRound;
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
    return io.sockets.sockets.get(id);
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
