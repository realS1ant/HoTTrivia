const express = require('express');
const router = express.Router();

const { protectedAdmin, protectedPlayer } = require('./auth.js');

router.post('/auth', (req, res, next) => {
});

module.exports = router;