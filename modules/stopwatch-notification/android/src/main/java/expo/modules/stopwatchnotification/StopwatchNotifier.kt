package expo.modules.stopwatchnotification

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.os.SystemClock
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat

object StopwatchNotifier {
  const val ACTION_TOGGLE = "expo.modules.stopwatchnotification.TOGGLE"
  // A channel's importance can't be raised after creation, so the lock-screen-visible channel has a new id
  private const val LEGACY_CHANNEL_ID = "stopwatch"
  private const val CHANNEL_ID = "stopwatch_lockscreen"
  private const val MESSAGE_CHANNEL_ID = "stopwatch_messages"
  private const val NOTIFICATION_ID = 4242
  private const val SCHEME = "chazarahtracker"

  @Volatile private var channelsCreated = false

  private fun manager(context: Context): NotificationManager {
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (!channelsCreated) {
      nm.deleteNotificationChannel(LEGACY_CHANNEL_ID) // was IMPORTANCE_LOW: "silent" notifications are hidden from the lock screen
      // IMPORTANCE_DEFAULT shows on the lock screen; sound and vibration are off so it stays quiet
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Stopwatch", NotificationManager.IMPORTANCE_DEFAULT).apply {
          description = "Shows the running stopwatch, including on the lock screen"
          setShowBadge(false)
          setSound(null, null)
          enableVibration(false)
          lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
      )
      nm.createNotificationChannel(
        NotificationChannel(MESSAGE_CHANNEL_ID, "Session status", NotificationManager.IMPORTANCE_DEFAULT).apply {
          description = "Lets you know when a session was saved on this device"
        }
      )
      channelsCreated = true
    }
    return nm
  }

  private fun appIntent(context: Context, uri: String?, requestCode: Int): PendingIntent {
    val intent = if (uri != null) {
      Intent(Intent.ACTION_VIEW, Uri.parse(uri)).setPackage(context.packageName)
    } else {
      context.packageManager.getLaunchIntentForPackage(context.packageName)!!
    }
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun render(context: Context, s: StopwatchState) {
    val nm = manager(context)
    val toggle = PendingIntent.getBroadcast(
      context, 1,
      Intent(context, StopwatchActionReceiver::class.java).setAction(ACTION_TOGGLE),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    // Submit opens the app on the stopwatch screen, which then runs the normal submit flow (note prompt etc.)
    val submit = appIntent(context, "$SCHEME://chazarah?action=submit", 2)

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stopwatch)
      .setContentTitle(if (s.title.isNotEmpty()) "Chazarah • ${s.title}" else "Chazarah")
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setContentIntent(appIntent(context, null, 0))
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)

    // Big time + small status tag. The header's own chronometer is turned off so the time isn't shown twice.
    val views = RemoteViews(context.packageName, R.layout.notification_stopwatch)
    val elapsed = s.currentElapsed()
    if (s.isRunning) {
      val base = SystemClock.elapsedRealtime() - elapsed
      views.setViewVisibility(R.id.stopwatch_running, View.VISIBLE)
      views.setViewVisibility(R.id.stopwatch_paused, View.GONE)
      views.setChronometer(R.id.stopwatch_running, base, null, true)
      // Just the big time; only a family member's name is worth a small line
      if (s.title.isNotEmpty()) views.setTextViewText(R.id.stopwatch_status, s.title)
      else views.setViewVisibility(R.id.stopwatch_status, View.GONE)
      builder.addAction(0, "Pause", toggle)
    } else {
      views.setViewVisibility(R.id.stopwatch_running, View.GONE)
      views.setViewVisibility(R.id.stopwatch_paused, View.VISIBLE)
      views.setTextViewText(R.id.stopwatch_paused, formatElapsed(elapsed))
      views.setTextViewText(R.id.stopwatch_status, if (s.title.isNotEmpty()) "Paused • ${s.title}" else "Paused")
      builder.addAction(0, "Resume", toggle)
    }
    builder.setUsesChronometer(false).setShowWhen(false)
      .setStyle(NotificationCompat.DecoratedCustomViewStyle())
      .setCustomContentView(views)
    builder.addAction(0, "Submit", submit)
    nm.notify(NOTIFICATION_ID, builder.build())
  }

  fun cancel(context: Context) = manager(context).cancel(NOTIFICATION_ID)

  fun postMessage(context: Context, title: String, body: String) {
    val n = NotificationCompat.Builder(context, MESSAGE_CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stopwatch)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setAutoCancel(true)
      .setContentIntent(appIntent(context, null, 3))
      .build()
    manager(context).notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), n)
  }

  fun formatElapsed(ms: Long): String {
    val total = ms / 1000
    val h = total / 3600
    val m = (total % 3600) / 60
    val sec = total % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, sec) else "%d:%02d".format(m, sec)
  }
}
