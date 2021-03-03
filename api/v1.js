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
        if (global.globalCheckEmails === true) {
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
                        console.log(r);
                        req.session.admin = false;
                        req.session.player = true;
                        req.session.accountData = { name: req.body.name, email: req.body.email };
                        req.session.status = 'playing';
                        doc.uses -= 1;
                        doc.save();
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
            //Make to sure create user DB object here.
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
        }
    } else {
        res.status(200).json({
            success: true,
            loggedIn: false,
            error: 'Not admitting players currently!'
        });
    }
});

router.post('/search', protectedAdmin, (req, res, next) => {
    if (!req.body.email) {
        res.status(200).json({
            success: false
        });
        return;
    }
    let uses = null;
    AllowedEmail.findOne({ email: req.body.email }).then(doc => {
        if (doc !== null) {
            uses = doc.uses;
        }

        User.find({ email: req.body.email }).then(docs => {
            // console.log(docs);
            if (docs === null || docs.length === 0) {
                if (uses !== null) {
                    res.status(200).json({
                        success: true,
                        uses: uses,
                        email: req.body.email
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    accountFound: false
                });
            } else {
                if (uses === null) {
                    console.log('weird error, no uses found under AllowedEmail, but an account was found under User?');
                    return;
                }
                let response = {
                    success: true,
                    accountFound: true,
                    uses: uses,
                    email: req.body.email,
                    accounts: []
                };
                docs.forEach(doc => {
                    response.accounts.push({
                        email: doc.email,
                        name: doc.name,
                        sessionId: doc.sessionId
                    });
                });
                res.status(200).json(response);
            }
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
