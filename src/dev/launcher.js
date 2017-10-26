'use strict';

const logoutSource = require('./../logout');

const get = (req, res) => {
  res.render('dev/index');
};

const post = (req, res) => {
  res.redirect(`/auth?client_id=${req.body.client_id}&response_type=code&scope=openid&return_uri=${req.body.return_url}`);
};

const logout = async (req, res) => {
  logoutSource(res, '<h1>FORM GOES HERE</h1>');
};

module.exports = {
  get,
  post,
  logout,
};
