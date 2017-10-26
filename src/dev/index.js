'use strict';

const express = require('express');
const launcher = require('./launcher');
const bodyParser = require('body-parser');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', launcher.get);
router.post('/', launcher.post);
router.get('/logout', launcher.logout)

module.exports = router;
