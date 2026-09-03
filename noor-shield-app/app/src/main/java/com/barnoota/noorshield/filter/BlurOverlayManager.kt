package com.barnoota.noorshield.filter

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import com.barnoota.noorshield.R

/**
 * Draws a full-screen opaque cover (a "blur/blank" shield) over whatever is
 * currently on screen when [ScreenGuardAccessibilityService] flags a frame as
 * explicit, and removes it once the screen is clean again. Requires the
 * "Display over other apps" permission (SYSTEM_ALERT_WINDOW).
 */
class BlurOverlayManager(private val context: Context) {

    private val windowManager = context.getSystemService(Context.WINDOW_MANAGER_SERVICE) as WindowManager
    private var overlayView: LinearLayout? = null

    fun canDrawOverlays(): Boolean = Settings.canDrawOverlays(context)

    fun show(reminder: String) {
        if (overlayView != null) return
        if (!canDrawOverlays()) return

        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.rgb(10, 26, 20))
            setPadding(64, 64, 64, 64)
        }
        val icon = TextView(context).apply {
            text = context.getString(R.string.overlay_title)
            setTextColor(Color.WHITE)
            textSize = 22f
            gravity = Gravity.CENTER
        }
        val message = TextView(context).apply {
            text = reminder
            setTextColor(Color.parseColor("#D9D9D9"))
            textSize = 16f
            gravity = Gravity.CENTER
            setPadding(0, 32, 0, 0)
        }
        layout.addView(icon)
        layout.addView(message)

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_SYSTEM_ALERT
        }
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.OPAQUE,
        )

        windowManager.addView(layout, params)
        overlayView = layout
    }

    fun hide() {
        overlayView?.let {
            runCatching { windowManager.removeView(it) }
            overlayView = null
        }
    }

    val isShowing: Boolean get() = overlayView != null
}
