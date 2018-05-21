const getDevSelectOrganisation = (req, res) => {
  res.render('oidc/views/select-organisation', { uuid: req.params.uuid });
};

module.exports = getDevSelectOrganisation;
