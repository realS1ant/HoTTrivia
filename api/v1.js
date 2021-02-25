const express = require('express');
const router = express.Router();

const { protectedAdmin, protectedPlayer } = require('./auth.js');

router.post('/auth', (req, res, next) => {
    //do ur checks here for email n the other things.
    // req.session.player = true;
    // req.session.admin = false;
    if (global.globalAllowLogins === true) {
        // req.session.admin = false;
        req.session.player = true;
        req.session.email = email;
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
            error: 'Not admitting players currently!'
        });
    }
});

module.exports = router;