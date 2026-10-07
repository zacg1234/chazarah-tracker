package expo.modules.stopwatchnotification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// Handles the Pause / Resume button. Works with the app in the background or not running at all.
class StopwatchActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != StopwatchNotifier.ACTION_TOGGLE) return
    val s = StopwatchStore.load(context) ?: return
    val now = System.currentTimeMillis()
    val next = if (s.isRunning) {
      s.copy(isRunning = false, elapsed = s.currentElapsed(now), updatedAt = now)
    } else {
      s.copy(isRunning = true, startTimestamp = now - s.elapsed, updatedAt = now)
    }
    StopwatchStore.save(context, next)
    StopwatchNotifier.render(context, next)
    StopwatchEvents.listener?.invoke(next) // tell JS if it is alive
  }
}

object StopwatchEvents {
  @Volatile var listener: ((StopwatchState) -> Unit)? = null
}
