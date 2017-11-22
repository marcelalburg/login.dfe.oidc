class PlainTextInteractions {
  render(res, name, params) {
    res.type('json').send({
      name,
      params,
    });
  }
}

module.exports = PlainTextInteractions;
