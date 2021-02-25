const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    if (req.session.admin === true) {
        res.render('presentationView.ejs');
    } else {
        res.redirect('/admin');
    }
});

module.exports = router;