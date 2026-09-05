package dev.timeframe.collector.block

import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import dev.timeframe.collector.notify.BlockNotifications
import kotlinx.coroutines.*

class BlockSessionService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var isSamplingRunning = false

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, BlockNotifications.CHANNEL_SESSION)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Focus run in progress")
            .setContentText("Focus run · 00:00")
            .setOngoing(true)
            .build()

        startForeground(BlockNotifications.NOTIFICATION_ID_SESSION, notification)

        if (!isSamplingRunning) {
            isSamplingRunning = true
            startSamplingLoop()
        }

        return START_STICKY
    }

    private fun startSamplingLoop() {
        serviceScope.launch {
            var elapsedSec = 0
            while (isActive && isSamplingRunning) {
                delay(10_000L) // 10s in-block tick
                elapsedSec += 10
                val mm = String.format("%02d", elapsedSec / 60)
                val ss = String.format("%02d", elapsedSec % 60)

                val updatedNotification = NotificationCompat.Builder(this@BlockSessionService, BlockNotifications.CHANNEL_SESSION)
                    .setSmallIcon(android.R.drawable.ic_media_play)
                    .setContentTitle("Focus run in progress")
                    .setContentText("Focus run · $mm:$ss")
                    .setOngoing(true)
                    .build()

                val nm = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
                nm.notify(BlockNotifications.NOTIFICATION_ID_SESSION, updatedNotification)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isSamplingRunning = false
        serviceScope.cancel()
        stopForeground(STOP_FOREGROUND_REMOVE)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
