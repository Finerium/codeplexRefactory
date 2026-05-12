// NodeGoat-shaped Express route slice. /admin lacks auth middleware (test case).
'use strict';
const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/', function (req, res) {
  res.render('home');
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.post('/login', passport.authenticate('local'), function (req, res) {
  res.redirect('/dashboard');
});

router.get('/dashboard', passport.authenticate('jwt', { session: false }), function (req, res) {
  res.render('dashboard');
});

// VULNERABLE: /admin lacks auth middleware. Nemesis should flag this.
router.get('/admin', function (req, res) {
  res.render('admin');
});

// VULNERABLE: /admin/users lacks auth middleware too.
router.get('/admin/users', function (req, res) {
  res.render('admin-users');
});

module.exports = router;
