import AppIntents

// Stub: the real work happens in the app, which is where the system runs a LiveActivityIntent.
// This copy only lets the widget show the button. The type name must match the app's copy.
@available(iOS 17.0, *)
struct ToggleStopwatchIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Pause or resume the stopwatch"
  func perform() async throws -> some IntentResult { .result() }
}
