class PlainTextInteractions {
  render(res, name, params) {
    res.type('json').send({
      name: name,
      params: params
    });
  }
}

module.exports = PlainTextInteractions;