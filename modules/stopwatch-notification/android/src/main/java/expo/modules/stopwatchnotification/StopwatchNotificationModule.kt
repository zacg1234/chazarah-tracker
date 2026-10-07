package expo.modules.stopwatchnotification

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StopwatchNotificationModule : Module() {
  private val context get() = appContext.reactContext ?: throw Exception("React context is not available")

  private fun toMap(s: StopwatchState) = mapOf(
    "key" to s.key,
    "isRunning" to s.isRunning,
    "startTimestamp" to s.startTimestamp.toDouble(),
    "elapsed" to s.currentElapsed().toDouble(),
    "updatedAt" to s.updatedAt.toDouble(),
  )

  override fun definition() = ModuleDefinition {
    Name("StopwatchNotification")
    Events("onToggle")

    OnStartObserving { StopwatchEvents.listener = { s -> sendEvent("onToggle", toMap(s)) } }
    OnStopObserving { StopwatchEvents.listener = null }

    // Mirror the JS stopwatch into native state and (re)draw the notification
    Function("sync") { key: String, title: String, isRunning: Boolean, startTimestamp: Double, elapsed: Double ->
      val s = StopwatchState(key, title, isRunning, startTimestamp.toLong(), elapsed.toLong(), System.currentTimeMillis())
      StopwatchStore.save(context, s)
      StopwatchNotifier.render(context, s)
    }

    Function("clear") {
      StopwatchStore.clear(context)
      StopwatchNotifier.cancel(context)
    }

    Function("getState") { StopwatchStore.load(context)?.let { toMap(it) } }

    Function("postMessage") { title: String, body: String ->
      StopwatchNotifier.postMessage(context, title, body)
    }
  }
}
