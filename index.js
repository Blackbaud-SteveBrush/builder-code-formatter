const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const prettier = require('prettier');

module.exports = {
  runCommand: async (command) => {
    if (command === 'format') {
      const configFilePath = path.join(__dirname, 'prettier/.prettierrc.json');
      const ignorePath = path.join(__dirname, 'prettier/.prettierignore');
      const config = await prettier.resolveConfig(configFilePath);

      console.log('Finding all project files.');
      const files = glob.sync(path.join(process.cwd(), '**/*+(.js|.ts|.json)'), {
        nodir: true,
        ignore: ['**/node_modules/**']
      });
      console.log(`Done. Found ${files.length} files.`);

      let numIgnored = 0;
      let numFailed = 0;
      let numSuccess = 0;

      const promises = files.map(async (file) => {
        const info = await prettier.getFileInfo(file, {
          ignorePath
        });

        if (info.ignored) {
          console.log(`Ignoring file ${file}`);
          numIgnored++;
          return;
        }

        config.parser = info.inferredParser;

        try {
          const contents = fs.readFileSync(file, { encoding: 'utf-8' });
          const formatted = prettier.format(
            contents,
            config
          );

          if (contents !== formatted) {
            fs.writeFileSync(file, formatted, { encoding: 'utf-8' });
            console.log(`Successfully formatted file ${file}`);
            numSuccess++;
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

      await Promise.all(promises);

      console.log(`
====================================
 SKY UX Format Results:
====================================
 Num. failed:    ${numFailed}
 Num. ignored:   ${numIgnored}
 Num. succeeded: ${numSuccess}
------------------------------------
`);
    }
  }
};
