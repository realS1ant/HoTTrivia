const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    if (req.session.loggedIn) {
        if (req.session.userType === 'admin') {
            res.redirect('/admin');
        } else {
            res.redirect('/play')
        }
    } else {
        res.render('login.ejs');
    }
});

module.exports = router;