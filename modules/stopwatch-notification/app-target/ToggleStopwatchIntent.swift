import AppIntents
import StopwatchNotification

// Must be compiled into the MAIN APP target (added by plugins/withStopwatchIntent.js): the system only finds
// and runs a LiveActivityIntent from the app's own sources, not from a static library pod. The widget
// extension has a stub with the same name so it can show the button.
@available(iOS 17.0, *)
struct ToggleStopwatchIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Pause or resume the stopwatch"
  func perform() async throws -> some IntentResult {
    if #available(iOS 16.2, *) { await StopwatchController.toggle() }
    return .result()
  }
}
