const express = require('express');
const router = express.Router();

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

    if (global.globalAllowLogins === true) {
        if (global.globalCheckEmail === true) {
            /* if allowed to join */if (req.body.email.includes('sluh.org')) { //TEMP ALL JUST FOR TEST! NEED TO VALIDATE WITH DB HERE!
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
            } else /* Email already used, join in w/ last info */if (req.body.email.includes('sluh.or')) {
                req.session.admin = false;
                req.session.player = true;
                let name = req.body.name; //Get this from the DB when relogging in 
                req.session.accountData = { name, email: req.body.email };
                req.session.status = 'playing'; //Get this from the DB when reloggin
                res.status(200).json({
                    success: true,
                    loggedIn: true,
                    redirectTo: '/play',
                    error: false
                });
            } else {
                res.status(200).json({
                    success: true,
                    loggedIn: false,
                    error: 'Email not found, make sure you registered!'
                });
            }
        } else {
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
        //Bad word filter??
        console.log('oi');

    } else {
        res.status(200).json({
            success: true,
            loggedIn: false,
            error: 'Not admitting players currently!'
        });
    }
});

module.exports = router;