/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = {
  type: 'widget',
  name: 'StopwatchWidget',
  displayName: 'Chazarah Timer',
  deploymentTarget: '16.2',
  frameworks: ['SwiftUI', 'ActivityKit', 'WidgetKit', 'AppIntents'],
};
