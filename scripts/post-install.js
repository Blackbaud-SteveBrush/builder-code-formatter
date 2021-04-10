const fs = require('fs-extra');
const path = require('path');
const merge = require('lodash.mergewith');

function customizer(originalValue, overrideValue) {
  if (Array.isArray(originalValue)) {
    const merged = originalValue.concat(overrideValue);
    return [...new Set(merged)];
  }
}

const mergeWith = function (original, override) {
  return merge(original, override, customizer);
};

function modifyVsCodeSettingsFile(fileName) {
  const vsCodeSettingsPath = path.join(process.cwd(), '.vscode', fileName);
  if (!fs.existsSync(vsCodeSettingsPath)) {
    fs.createFile(vsCodeSettingsPath);
  }

  const vsCodeSettings = fs.readJsonSync(vsCodeSettingsPath);
  const vsCodeSettingsOverrides = fs.readJsonSync(
    path.resolve(__dirname, '../prettier/.vscode', fileName)
  );
  fs.writeJsonSync(
    vsCodeSettingsPath,
    mergeWith(vsCodeSettings, vsCodeSettingsOverrides),
    { spaces: 2 }
  );
}

function modifyFiles() {
  modifyVsCodeSettingsFile('settings.json');
  modifyVsCodeSettingsFile('extensions.json');
}

modifyFiles();
