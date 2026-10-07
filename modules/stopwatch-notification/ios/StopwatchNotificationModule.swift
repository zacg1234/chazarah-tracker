import ExpoModulesCore
import UserNotifications

public class StopwatchNotificationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("StopwatchNotification")
    Events("onToggle")

    OnStartObserving {
      if #available(iOS 16.2, *) {
        StopwatchController.onToggle = { [weak self] in
          self?.sendEvent("onToggle", StopwatchController.stateDictionary() ?? [:])
        }
      }
    }
    OnStopObserving {
      if #available(iOS 16.2, *) { StopwatchController.onToggle = nil }
    }

    // Mirror the JS stopwatch into native state and (re)draw the Live Activity
    Function("sync") { (key: String, title: String, isRunning: Bool, startTimestamp: Double, elapsed: Double) in
      guard #available(iOS 16.2, *) else { return }
      let s = StopwatchController.Saved(
        key: key, title: title, isRunning: isRunning, startTimestamp: startTimestamp,
        elapsed: elapsed, updatedAt: Date().timeIntervalSince1970 * 1000)
      StopwatchController.save(s)
      Task { await StopwatchController.render(s) }
    }

    Function("clear") {
      if #available(iOS 16.2, *) { StopwatchController.clear() }
    }

    Function("getState") { () -> [String: Any]? in
      guard #available(iOS 16.2, *) else { return nil }
      return StopwatchController.stateDictionary()
    }

    Function("postMessage") { (title: String, body: String) in
      let content = UNMutableNotificationContent()
      content.title = title
      content.body = body
      content.sound = .default
      let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
      UNUserNotificationCenter.current().add(request)
    }

    AsyncFunction("requestPermission") { () -> Bool in
      (try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])) ?? false
    }
  }
}
