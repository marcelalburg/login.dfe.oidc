'use strict';

const get = (req, res) => {
  res.render('dev/index');
};

const post = (req, res) => {
  res.redirect(`/auth?client_id=${req.body.client_id}&response_type=code&scope=openid&return_uri=${req.body.return_url}`);
};

module.exports = {
  get,
  post,
};
