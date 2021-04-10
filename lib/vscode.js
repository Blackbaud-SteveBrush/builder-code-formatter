const fs = require('fs-extra');
const path = require('path');
const merge = require('lodash.mergewith');

function customizer(originalValue, overrideValue) {
  if (Array.isArray(originalValue)) {
    const merged = originalValue.concat(overrideValue);
    return [...new Set(merged)];
  }
}

function mergeWith(original, override) {
  return merge(original, override, customizer);
}

function modifySettingsFile(fileName) {
  const settingsPath = path.join(process.cwd(), '.vscode', fileName);
  if (!fs.existsSync(settingsPath)) {
    fs.createFile(settingsPath);
  }

  const settings = fs.readJsonSync(settingsPath);
  const settingsOverrides = fs.readJsonSync(
    path.resolve(__dirname, '../config/prettier/.vscode', fileName)
  );
  fs.writeJsonSync(settingsPath, mergeWith(settings, settingsOverrides), {
    spaces: 2
  });
}

module.exports = {
  modifySettingsFile
};
