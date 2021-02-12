const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  // if (req.session.loggedIn) {
  //   res.render('game.js');
  // } else {
  //   res.redirect('/login');
  // }
  res.render('game.js');
});

module.exports = router;