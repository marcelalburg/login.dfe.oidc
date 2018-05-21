const getDevSelectOrganisation = (req, res) => {
  const data = [
    {
      id: 'A06716EA-4867-41F0-8F04-68564175E1CA',
      name: 'ABBEY & RINGBACK UTILITIES LIMITED',
      uid: '16858',
      category: {
        id: '010',
        name: 'Multi-Academy Trust',
      },
    },
    {
      id: '93713257-D7D7-4AF4-87E9-D27D48ADC264',
      name: 'Ab Kettleby Community Primary School',
      urn: '140696',
      ukprn: '10045668',
      category: {
        id: '001',
        name: 'Establishment',
      },
      type: {
        id: '34',
        name: 'Academy Converter',
      },
    },
  ];
  res.render('oidc/views/select-organisation', { org1: JSON.stringify(data[0]), org2: JSON.stringify(data[1]), uuid: req.params.uuid });
};

module.exports = getDevSelectOrganisation;
