package dev.timeframe.android.ui

import android.content.Context
import android.graphics.*
import androidx.core.content.FileProvider
import dev.timeframe.engine.compute.Week
import java.io.File
import java.io.FileOutputStream

object WeekCardRenderer {
    const val WIDTH = 1080
    const val HEIGHT = 1350

    fun renderWeekCard(
        context: Context,
        model: Week.CardModel,
        isPro: Boolean
    ): Bitmap {
        val bitmap = Bitmap.createBitmap(WIDTH, HEIGHT, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Background #0A0C10
        val bgPaint = Paint().apply {
            color = Color.parseColor("#0A0C10")
            style = Paint.Style.FILL
        }
        canvas.drawRect(0f, 0f, WIDTH.toFloat(), HEIGHT.toFloat(), bgPaint)

        // Inset border #262B38
        val borderPaint = Paint().apply {
            color = Color.parseColor("#262B38")
            style = Paint.Style.STROKE
            strokeWidth = 4f
        }
        canvas.drawRect(48f, 48f, (WIDTH - 48).toFloat(), (HEIGHT - 48).toFloat(), borderPaint)

        // Text Paint
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
        }

        val monoPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL)
        }

        // Header label (device_label)
        textPaint.color = Color.parseColor("#94A3B8") // text/tertiary
        textPaint.textSize = 28f
        canvas.drawText(model.label.uppercase(), 96f, 140f, textPaint)

        // Hero: focus-set time
        textPaint.color = Color.parseColor("#F8FAFC") // text/primary
        textPaint.textSize = 96f
        textPaint.typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD)
        canvas.drawText(model.hero, 96f, 260f, textPaint)

        // Stat block: 4 rows
        var y = 380f
        textPaint.typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
        textPaint.textSize = 32f

        for (row in model.stats) {
            textPaint.color = Color.parseColor("#94A3B8")
            canvas.drawText(row.label, 96f, y, textPaint)

            monoPaint.color = Color.parseColor("#F8FAFC")
            monoPaint.textSize = 44f
            val valueWidth = monoPaint.measureText(row.value)
            canvas.drawText(row.value, (WIDTH - 96) - valueWidth, y, monoPaint)

            y += 80f
        }

        // Footer: Tracked D days · phone up ...
        monoPaint.color = Color.parseColor("#64748B")
        monoPaint.textSize = 24f
        canvas.drawText(model.footer, 96f, HEIGHT - 100f, monoPaint)

        // Free watermark
        if (!isPro) {
            textPaint.color = Color.parseColor("#334155") // text/faint
            textPaint.textSize = 24f
            val wm = "Timeframe"
            val wmWidth = textPaint.measureText(wm)
            canvas.drawText(wm, (WIDTH - 96) - wmWidth, HEIGHT - 100f, textPaint)
        }

        return bitmap
    }

    fun saveCardToFile(context: Context, bitmap: Bitmap): File {
        val imagesFolder = File(context.cacheDir, "images").apply { mkdirs() }
        val file = File(imagesFolder, "timeframe_week_card.png")
        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
        return file
    }
}
