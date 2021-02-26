const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    console.log(req.session);
    if (req.session.admin === true) {
        res.redirect('/admin');
    } else {
        res.render('adminlogin.ejs');
    }
});

module.exports = router;