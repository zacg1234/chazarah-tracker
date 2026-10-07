import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

@main
struct StopwatchWidgetBundle: WidgetBundle {
  var body: some Widget {
    StopwatchLiveActivity()
  }
}

private func format(_ seconds: TimeInterval) -> String {
  let total = Int(max(0, seconds))
  let h = total / 3600, m = (total % 3600) / 60, s = total % 60
  return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
}

// Running: the system ticks the timer itself (works with the screen off). Paused: static text.
private struct TimerText: View {
  let state: StopwatchAttributes.ContentState
  var body: some View {
    if state.isRunning {
      Text(state.startTimestamp, style: .timer).monospacedDigit()
    } else {
      Text(format(state.elapsed)).monospacedDigit()
    }
  }
}

private struct Buttons: View {
  let state: StopwatchAttributes.ContentState
  var body: some View {
    HStack(spacing: 10) {
      if #available(iOS 17.0, *) {
        Button(intent: ToggleStopwatchIntent()) {
          Label(state.isRunning ? "Pause" : "Resume", systemImage: state.isRunning ? "pause.fill" : "play.fill")
            .font(.subheadline.weight(.semibold))
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .tint(.gray)
      }
      Link(destination: URL(string: "chazarahtracker://chazarah?action=submit")!) {
        Label("Submit", systemImage: "checkmark")
          .font(.subheadline.weight(.semibold))
          .frame(maxWidth: .infinity)
          .padding(.vertical, 6)
          .background(Color.red, in: Capsule())
          .foregroundStyle(.white)
      }
    }
  }
}

struct StopwatchLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: StopwatchAttributes.self) { context in
      VStack(alignment: .leading, spacing: 10) {
        HStack {
          Image(systemName: "hourglass").foregroundStyle(.red)
          Text(context.attributes.title.isEmpty ? "Chazarah" : "Chazarah • \(context.attributes.title)")
            .font(.subheadline).foregroundStyle(.secondary)
          Spacer()
          if !context.state.isRunning { Text("Paused").font(.caption).foregroundStyle(.secondary) }
        }
        TimerText(state: context.state)
          .font(.system(size: 40, weight: .semibold, design: .rounded))
          .foregroundStyle(.red)
        Buttons(state: context.state)
      }
      .padding(16)
      .activityBackgroundTint(Color(.systemBackground))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Image(systemName: "hourglass").foregroundStyle(.red)
        }
        DynamicIslandExpandedRegion(.center) {
          TimerText(state: context.state)
            .font(.system(size: 32, weight: .semibold, design: .rounded))
            .foregroundStyle(.red)
        }
        DynamicIslandExpandedRegion(.bottom) {
          Buttons(state: context.state)
        }
      } compactLeading: {
        Image(systemName: "hourglass").foregroundStyle(.red)
      } compactTrailing: {
        TimerText(state: context.state).frame(width: 52).foregroundStyle(.red)
      } minimal: {
        Image(systemName: "hourglass").foregroundStyle(.red)
      }
    }
  }
}
