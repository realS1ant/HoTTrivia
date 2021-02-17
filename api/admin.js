const express = require('express');
const router = express.Router();

const { protectedAdmin, protectedPlayer } = require('./auth.js');

router.post('/login', (req, res, next) => {
    if (req.body.password === process.env.ADMIN_PASSWORD) {
        req.session.admin = true;
        req.session.player = false;
        res.status(200).json({
            success: true,
            loggedIn: true,
            admin: true,
            redirectTo: '/admin'
        });
    } else {
        req.session.admin = false;
        res.status(200).json({
            success: true,
            admin: false,
            loggedIn: false,
            message: 'Incorrect Password!'
        });
    }
});

router.post('/logout', (req, res, next) => {
    if (req.session.admin === true) {
        req.session.admin = false;
        req.session.player = false;
        res.status(200).json({
            success: true,
            redirectTo: '/'
        })
    }
});

module.exports = router;