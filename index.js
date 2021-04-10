const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const prettier = require('prettier');

async function getPrettierConfig() {
  const configFilePath = path.join(__dirname, 'prettier/.prettierrc.json');
  const config = await prettier.resolveConfig(configFilePath);
  return config;
}

function getProjectFiles() {
  const files = glob.sync(path.join(process.cwd(), '**/*+(.js|.ts|.json)'), {
    nodir: true,
    ignore: ['**/node_modules/**']
  });
  return files;
}

function getFileInfo(file) {
  const ignorePath = path.join(__dirname, 'prettier/.prettierignore');
  return prettier.getFileInfo(file, {
    ignorePath
  });
}

function processFiles(config, callback) {
  const files = getProjectFiles();
  const promises = files.map(async (file) => {

    const info = await getFileInfo(file);
    if (info.ignored) {
      return;
    }

    config.parser = info.inferredParser;

    const contents = fs.readFileSync(file, { encoding: 'utf-8' });

    return callback(file, contents);
  });

  return Promise.all(promises);
}

module.exports = {
  runCommand: async (command, argv) => {
    if (command === 'format') {
      const config = await getPrettierConfig();

      if (argv.check) {
        try {
          const unformatted = [];
          await processFiles(config, (file, contents) => {
            const isFormatted = prettier.check(contents, config);
            if (!isFormatted) {
              unformatted.push(file.replace(process.cwd(), ''));
            }
          });
          if (unformatted.length) {
            throw new Error(`
*========================================*
| The following files are not formatted: |
*========================================*
  --> ${unformatted.join('\n  --> ')}\n`);
          } else {
            console.log('All files formatted correctly.');
          }
        } catch (err) {
          console.error(err.message);
          process.exit(1);
        }

        return;
      }

      let numFailed = 0;
      let numIgnored = 0;
      let numSucceeded = 0;

      await processFiles(config, (file, contents) => {
        try {
          const formatted = prettier.format(
            contents,
            config
          );

          if (contents !== formatted) {
            fs.writeFileSync(file, formatted, { encoding: 'utf-8' });
            console.log(`Successfully formatted file ${file}`);
            numSucceeded++;
          } else {
            numIgnored++;
            console.log(`File already formatted ${file}`);
          }
        } catch (err) {
          numFailed++;
          console.error(`Failed to format file: ${file}`);
          console.error(err);
        }
      });

      console.log(`
*========================================*
| Format results                         |
*========================================*
  Num. failed:    ${numFailed}
  Num. ignored:   ${numIgnored}
  Num. succeeded: ${numSucceeded}
*----------------------------------------*
`);
    }
  }
};
