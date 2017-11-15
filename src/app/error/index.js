'use strict';

const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const { promisify } = require('util');

const errorAction = async (ctx, error) => {
  const templatePath = path.resolve(__dirname, 'views', 'error.ejs');

  const readFile = promisify(fs.readFile);
  const template = await readFile(templatePath, 'utf8');

  ctx.body = ejs.render(template, { error: error.error, description: error.error_description, state: error.state });
};

module.exports = errorAction;
