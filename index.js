const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const prettier = require('prettier');

module.exports = {
  runCommand: async (command) => {
    const configFilePath = path.join(__dirname, 'prettier/.prettierrc.json');
    const ignorePath = path.join(__dirname, 'prettier/.prettierrc.json');
    const config = await prettier.resolveConfig(configFilePath);

    if (command === 'format') {
      const files = glob.sync('*.js,*.ts,*.json', {
        nodir: true
      });

      files.forEach(file => {
        const info = prettier.getFileInfo(file, {
          ignorePath
        });

        if (info.ignored) {
          return;
        }

        const formatted = prettier.format(
          fs.readFileSync(file, { encoding: 'utf-8' }),
          config
        );

        fs.writeFileSync(file, formatted, { encoding: 'utf-8' });
      });
    }
    // "format-all": "npx prettier --write ."
  }
};
