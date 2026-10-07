const { withXcodeProject, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Adds the Live Activity button's intent to the main app target (see the note in the Swift file).
module.exports = function withStopwatchIntent(config) {
  return withXcodeProject(config, (cfg) => {
    const { projectName, platformProjectRoot, projectRoot } = cfg.modRequest;
    const fileName = 'ToggleStopwatchIntent.swift';
    const src = path.join(projectRoot, 'modules/stopwatch-notification/app-target', fileName);
    const destDir = path.join(platformProjectRoot, projectName);
    fs.copyFileSync(src, path.join(destDir, fileName));
    const project = cfg.modResults;
    const filepath = `${projectName}/${fileName}`;
    // addBuildSourceFileToGroup is idempotent
    IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName: projectName, project });
    // Xcode only extracts App Intents metadata for targets that link the framework. Weak-linked because
    // the app still supports iOS versions older than 16.
    const mainTarget = project.getFirstTarget();
    project.addFramework('AppIntents.framework', { target: mainTarget.uuid, weak: true, link: true });
    return cfg;
  });
};
