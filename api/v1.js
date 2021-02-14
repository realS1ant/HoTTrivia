const express = require('express');
const router = express.Router();

const { protectedAdmin, protectedPlayer } = require('./auth.js');

router.get('/:num', (req, res, next) => {
    console.log(`started new round number ${req.params.num} ending 20s from now.`);
});

module.exports = router;