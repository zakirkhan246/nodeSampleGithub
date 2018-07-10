var express = require('express');
var githubCtrl = require('./githubController');

var router = express.Router();

router.route('/').get(githubCtrl.home);
router.route('/repo/:ownerId/:repoId').get(githubCtrl.list);
router.route('/login').get(githubCtrl.login);
router.route('/logout').get(githubCtrl.logout);

module.exports = router;