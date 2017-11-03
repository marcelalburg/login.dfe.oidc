'use strict';

const logoutSource = require('./../logout/index');

const get = (req, res) => {
  res.render('dev/views/index');
};

const post = (req, res) => {
  res.redirect(`/auth?client_id=${req.body.client_id}&response_type=code&scope=openid&redirect_uri=${req.body.return_url}`);
};

const logout = async (req, res) => {
  logoutSource(res, '<h1>FORM GOES HERE</h1>');
};

module.exports = {
  get,
  post,
  logout,
};
