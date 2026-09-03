package dev.timeframe.collector.notify

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import dev.timeframe.engine.ports.InterruptNotifier
import dev.timeframe.engine.ports.KillerName

class BlockNotifications(private val context: Context) : InterruptNotifier {

    companion object {
        const val CHANNEL_INTERRUPT = "block_interrupt"
        const val CHANNEL_SESSION = "block_session"
        const val NOTIFICATION_ID_INTERRUPT = 1001
        const val NOTIFICATION_ID_SESSION = 1002
    }

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    init {
        createChannels()
    }

    private fun createChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val interruptChannel = NotificationChannel(
                CHANNEL_INTERRUPT,
                "Block Interruption",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Fires once when a focus block is broken by a sink app"
            }

            val sessionChannel = NotificationChannel(
                CHANNEL_SESSION,
                "Focus Block Session",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live focus block progress"
            }

            notificationManager.createNotificationChannel(interruptChannel)
            notificationManager.createNotificationChannel(sessionChannel)
        }
    }

    override fun blockBroken(killer: KillerName) {
        val body = if (killer.isPrivate) {
            "A private app was open 5s"
        } else {
            "${killer.label} was open 5s"
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_INTERRUPT)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("Block broken")
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(NOTIFICATION_ID_INTERRUPT, notification)
    }
}
