const express = require('express');
const { protectedAdmin } = require('../../api/auth');
const router = express.Router();

router.get('/', protectedAdmin, (req, res, next) => {
    res.render('admin.ejs');
});

module.exports = router;