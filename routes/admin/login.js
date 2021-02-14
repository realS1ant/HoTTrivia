const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    if (req.session.admin === true) {
        res.status(200).json({
            admin: true,
            redirectTo: '/admin/dashboard'
        });
    } else {
        res.render('adminlogin.ejs');
    }
});

module.exports = router;