'use strict';

const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const { promisify } = require('util');

const logoutAction = async (ctx, form) => {
  const templatePath = path.resolve(__dirname, 'views', 'logout.ejs');

  const readFile = promisify(fs.readFile);
  const template = await readFile(templatePath, 'utf8');

  ctx.body = ejs.render(template, { form });
};

module.exports = logoutAction;
