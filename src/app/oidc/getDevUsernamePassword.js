const getDevUsernamePassword = (req, res) => {
  res.render('oidc/views/usernamepassword', { uuid: req.params.uuid });
};

module.exports = getDevUsernamePassword;