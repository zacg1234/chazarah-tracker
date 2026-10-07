import ActivityKit
import AppIntents
import Foundation

// The stopwatch as native code sees it. The Live Activity button changes this while JS may be suspended,
// so the app reads it back (getState) when it comes to the foreground.
@available(iOS 16.2, *)
public enum StopwatchController {
  struct Saved: Codable {
    var key: String
    var title: String
    var isRunning: Bool
    var startTimestamp: Double // ms
    var elapsed: Double        // ms
    var updatedAt: Double      // ms

    func currentElapsed(_ now: Double = Date().timeIntervalSince1970 * 1000) -> Double {
      isRunning ? max(0, now - startTimestamp) : elapsed
    }
  }

  private static let storeKey = "stopwatch_notification_state"
  static var onToggle: (() -> Void)?

  static func load() -> Saved? {
    guard let data = UserDefaults.standard.data(forKey: storeKey) else { return nil }
    return try? JSONDecoder().decode(Saved.self, from: data)
  }

  static func save(_ s: Saved) {
    if let data = try? JSONEncoder().encode(s) { UserDefaults.standard.set(data, forKey: storeKey) }
  }

  static func clear() {
    UserDefaults.standard.removeObject(forKey: storeKey)
    Task { for a in Activity<StopwatchAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) } }
  }

  static func stateDictionary() -> [String: Any]? {
    guard let s = load() else { return nil }
    return ["key": s.key, "isRunning": s.isRunning, "startTimestamp": s.startTimestamp,
            "elapsed": s.currentElapsed(), "updatedAt": s.updatedAt]
  }

  // Renders run one at a time: two overlapping syncs could otherwise both find no activity and both start one
  @MainActor private static var renderChain: Task<Void, Never>?
  @MainActor static func render(_ s: Saved) async {
    let previous = renderChain
    let task = Task { await previous?.value; await performRender(s) }
    renderChain = task
    await task.value
  }

  private static func performRender(_ s: Saved) async {
    let state = StopwatchAttributes.ContentState(
      isRunning: s.isRunning,
      startTimestamp: Date(timeIntervalSince1970: s.startTimestamp / 1000),
      elapsed: s.elapsed / 1000)
    let content = ActivityContent(state: state, staleDate: nil)
    if let existing = Activity<StopwatchAttributes>.activities.first {
      if existing.attributes.key == s.key {
        await existing.update(content)
        return
      }
      await existing.end(nil, dismissalPolicy: .immediate)
    }
    // Live Activities can only be started while the app is in the foreground (JS sync happens there)
    do {
      _ = try Activity<StopwatchAttributes>.request(
        attributes: StopwatchAttributes(key: s.key, title: s.title), content: content, pushType: nil)
    } catch {
      NSLog("StopwatchNotification: could not start Live Activity: \(error)")
    }
  }

  // Pause <-> resume (the Live Activity button)
  public static func toggle() async {
    guard var s = load() else { return }
    let now = Date().timeIntervalSince1970 * 1000
    if s.isRunning {
      s.elapsed = s.currentElapsed(now)
      s.isRunning = false
    } else {
      s.startTimestamp = now - s.elapsed
      s.isRunning = true
    }
    s.updatedAt = now
    save(s)
    await render(s)
    onToggle?()
  }
}
