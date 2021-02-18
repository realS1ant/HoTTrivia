const express = require('express');
const router = express.Router();

const { protectedAdmin, protectedPlayer } = require('./auth.js');

router.post('/auth', (req, res, next) => {
    // req.session.player = true;
    // req.session.admin = false;
});

module.exports = router;