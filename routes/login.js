const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    if (req.session.player === true) {
        res.redirect('/play');
    } else if (req.session.admin === true) {
        //res.redirect('/admin');
        console.log('admin');
        res.render('login.ejs');
    } else {
        console.log('normal');
        res.render('login.ejs');
    }
});

module.exports = router;