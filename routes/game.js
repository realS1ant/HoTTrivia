const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  if (req.session.banned === true) {
    res.redirect('/');
    return;
  }
  if (req.session.player === true) {
    res.render('game.ejs');
  } else if (req.session.admin === true) {
    res.redirect('/admin');
  } else {
    res.redirect('/');
  }
});

module.exports = router;