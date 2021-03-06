const express = require('express');
const router = express.Router();
const AllowedEmail = require('../schemas/allowedEmail.js');
const User = require('../schemas/user.js');

const { protectedAdmin, protectedPlayer } = require('./auth.js');

router.post('/auth', (req, res, next) => {
    //do ur checks here for email n the other things.
    // req.session.player = true;
    // req.session.admin = false;
    if (!req.body.email || !req.body.name) {
        res.status(200).json({
            success: true,
            loggedIn: false,
            error: 'Incorrect data body.'
        });
        return;
    }

    if (req.session.banned === true) {
        res.status(200).json({
            success: true,
            loggedIn: false,
            error: 'You are banned!'
        });
        return;
    }

    if (global.globalAllowLogins === true) {
        //if (global.globalCheckEmails === true) { iSNT WORKING INSIDE OF PRODUCTION ENVIRONMENT (I DONT HAVE MEANS OF TESTING EITHER)
        if (false) {//will allow any emails in.
            /* if allowed to join */
            AllowedEmail.findOne({ email: req.body.email }).then(doc => {
                if (doc && typeof doc.uses === 'number' && doc.uses >= 1) {
                    User.create({ email: req.body.email, name: req.body.name, sessionId: req.sessionID }).then(() => {
                        req.session.admin = false;
                        req.session.player = true;
                        req.session.accountData = { name: req.body.name, email: req.body.email };
                        req.session.status = 'playing';
                        doc.uses -= 1;
                        doc.save();
                        res.status(200).json({
                            success: true,
                            loggedIn: true,
                            redirectTo: '/play',
                            error: false
                        });
                        return;
                    }).catch(r => {
                        console.log('Failed to create user object in the database. ');
                        console.error(r);
                        res.status(200).json({
                            success: true,
                            loggedIn: false,
                            error: 'Server error.'
                        });
                        return;
                    });
                } else {
                    res.status(200).json({
                        success: true,
                        loggedIn: false,
                        error: 'Email not found, make sure you registered!'
                    });
                }
            });
        } else {
            //if not checking emails (let in anyone)
            User.create({ email: req.body.email, name: req.body.name, sessionId: req.sessionID }).then(() => {
                req.session.admin = false;
                req.session.player = true;
                req.session.accountData = { name: req.body.name, email: req.body.email };
                req.session.status = 'playing';
                res.status(200).json({
                    success: true,
                    loggedIn: true,
                    redirectTo: '/play',
                    error: false
                });
                return;
            }).catch(r => {
                console.log('Failed to create user object in the database. ');
                console.error(r);
                res.status(200).json({
                    success: true,
                    loggedIn: false,
                    error: 'Server error.'
                });
                return;
            });
            return;
        }
    } else {
        //Not allowing any other logins
        res.status(200).json({
            success: true,
            loggedIn: false,
            error: 'Not admitting players currently!'
        });
    }
});

router.post('/search', protectedAdmin, (req, res, next) => {
    //Make sure it doesn't error anymore when no AllowedEmail but there is a user. (log in w/o email checking)
    if (!req.body.email) {
        res.status(200).json({
            success: false
        });
        return;
    }
    let response = {
        success: true,
        email: req.body.email,
        uses: 0,
        error: false,
        accounts: []
    };
    /*account = {
        name,
        email,
        sid
    }*/

    AllowedEmail.findOne({ email: req.body.email }).then(allowedEmailDoc => {
        if (allowedEmailDoc && typeof (allowedEmailDoc.uses) === 'number') {
            response.uses = allowedEmailDoc.uses;
        }

        User.find({ email: req.body.email }).then(users => {
            if (!users || users.length === 0) {
                res.status(200).json(response);
                return;
            }

            users.forEach(doc => {
                response.accounts.push({
                    name: doc.name,
                    email: doc.email,
                    sid: doc.sessionId
                });
            });
            res.status(200).json(response);
        }).catch(r => {
            console.log('Failed to create user object in the database. ');
            console.error(r);
            res.status(200).json({
                success: true,
                error: 'Server error.'
            });
        });

    }).catch(r => {
        console.log('Failed to create user object in the database. ');
        console.error(r);
        res.status(200).json({
            success: true,
            error: 'Server error.'
        });
    });
});

router.post('/addUse', protectedAdmin, (req, res, next) => {
    if (!req.body.email) {
        res.status(200).json({
            success: true,
            error: 'Email invalid'
        });
        return;
    }
    AllowedEmail.findOne({ email: req.body.email }).then(doc => {
        if (doc !== null) {
            doc.uses += 1;
            doc.save();
            res.status(200).json({
                success: true,
                newUses: doc.uses
            });
        } else {
            AllowedEmail.create({ email: req.body.email, uses: 1 }).then(doc => {
                res.status(200).json({
                    success: true,
                    newUses: doc.uses
                });
            });
        }
    });
});

module.exports = router;
