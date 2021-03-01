const express = require('express');
const router = express.Router();
const AllowedEmail = require('../schemas/allowedEmail.js');

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
            error: 'You were banned!'
        });
        return;
    }

    if (global.globalAllowLogins === true) {
        if (global.globalCheckEmails === true) {
            /* if allowed to join */
            AllowedEmail.findOne({ email: req.body.email }).then(doc => {
                if (doc && typeof doc.uses === 'number' && doc.uses >= 1) {
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
                    doc.uses -= 1;
                    doc.save();
                    return;
                } else {
                    res.status(200).json({
                        success: true,
                        loggedIn: false,
                        error: 'Email not found, make sure you registered!'
                    });
                }
            });
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
    } else {
        res.status(200).json({
            success: true,
            loggedIn: false,
            error: 'Not admitting players currently!'
        });
    }
});

module.exports = router;