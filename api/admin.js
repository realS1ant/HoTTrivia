const express = require('express');
const router = express.Router();

const { protectedAdmin, protectedPlayer } = require('./auth.js');

router.post('/login', (req, res, next) => {
    if (req.body.password === process.env.ADMIN_PASSWORD) {
        req.session.admin = true;
        res.status(200).json({
            success: true,
            loggedIn: true,
            admin: true,
            redirectTo: '/admin/dashboard'
        });
    } else {
        req.session.admin = false;
        res.status(200).json({
            success: true,
            logeedIn: false,
            admin: false,
            message: 'Incorrect Password!',
            redirectTo: '/admin'
        });
    }
});

module.exports = router;