package expo.modules.stopwatchnotification

import android.content.Context

// The stopwatch as native code sees it. Notification buttons change this while JS may not be running,
// so the app reads it back (getState) when it comes to the foreground.
data class StopwatchState(
  val key: String,
  val title: String,
  val isRunning: Boolean,
  val startTimestamp: Long, // when running: the (virtual) start, i.e. now - elapsed at the last resume
  val elapsed: Long,        // when paused: the time on the clock
  val updatedAt: Long,
) {
  fun currentElapsed(now: Long = System.currentTimeMillis()) =
    if (isRunning) (now - startTimestamp).coerceAtLeast(0) else elapsed
}

object StopwatchStore {
  private const val PREFS = "stopwatch_notification"

  fun load(context: Context): StopwatchState? {
    val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val key = p.getString("key", null) ?: return null
    return StopwatchState(
      key = key,
      title = p.getString("title", "") ?: "",
      isRunning = p.getBoolean("isRunning", false),
      startTimestamp = p.getLong("startTimestamp", 0),
      elapsed = p.getLong("elapsed", 0),
      updatedAt = p.getLong("updatedAt", 0),
    )
  }

  fun save(context: Context, s: StopwatchState) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putString("key", s.key).putString("title", s.title)
      .putBoolean("isRunning", s.isRunning)
      .putLong("startTimestamp", s.startTimestamp).putLong("elapsed", s.elapsed)
      .putLong("updatedAt", s.updatedAt)
      .apply()
  }

  fun clear(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
  }
}
