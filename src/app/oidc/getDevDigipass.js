const getDevDigipass = (req, res) => {
  res.render('oidc/views/digipass', { uuid: req.params.uuid });
};

module.exports = getDevDigipass;
