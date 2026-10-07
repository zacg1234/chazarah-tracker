import ActivityKit
import Foundation

// NOTE: keep identical to targets/widget/StopwatchAttributes.swift (the app and the widget extension
// must agree on this type to talk to each other).
@available(iOS 16.2, *)
struct StopwatchAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var isRunning: Bool
    var startTimestamp: Date   // when running: the (virtual) start, so the system can tick the timer itself
    var elapsed: TimeInterval  // when paused: the time on the clock
  }
  var key: String
  var title: String
}
