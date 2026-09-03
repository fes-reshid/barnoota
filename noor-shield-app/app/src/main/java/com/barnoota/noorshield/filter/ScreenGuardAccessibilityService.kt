package com.barnoota.noorshield.filter

import android.accessibilityservice.AccessibilityService
import android.graphics.Bitmap
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import androidx.annotation.RequiresApi
import com.barnoota.noorshield.R
import com.barnoota.noorshield.reminders.HadithRepository
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * System-wide screen watcher: on Android 11+ it periodically takes a
 * screenshot of the currently focused window (via the platform
 * [AccessibilityService.takeScreenshot] API, the only sanctioned way for an
 * app to see another app's rendered pixels) and runs it through
 * [NsfwClassifier]. A positive match blanks the screen with
 * [BlurOverlayManager] and swaps in a Hadith reminder + istighfar prompt
 * instead of the flagged content.
 *
 * On Android 8-10 (API 26-29), `takeScreenshot` doesn't exist, so this
 * service falls back to DNS-level blocking only (see BlockVpnService) for
 * those OS versions — it cannot inspect on-screen pixels there.
 */
class ScreenGuardAccessibilityService : AccessibilityService() {

    private val classifier: NsfwClassifier by lazy { HeuristicSkinToneClassifier() }
    private val overlay: BlurOverlayManager by lazy { BlurOverlayManager(applicationContext) }
    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val scanInFlight = AtomicBoolean(false)
    private var lastScanAtMs = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return // takeScreenshot needs API 30+
        val now = System.currentTimeMillis()
        if (now - lastScanAtMs < SCAN_INTERVAL_MS) return
        if (!scanInFlight.compareAndSet(false, true)) return
        lastScanAtMs = now
        requestScreenshot()
    }

    override fun onInterrupt() {
        overlay.hide()
    }

    @RequiresApi(Build.VERSION_CODES.R)
    private fun requestScreenshot() {
        takeScreenshot(
            android.view.Display.DEFAULT_DISPLAY,
            executor,
            object : TakeScreenshotCallback {
                override fun onSuccess(result: ScreenshotResult) {
                    val bitmap = try {
                        Bitmap.wrapHardwareBuffer(result.hardwareBuffer, result.colorSpace)
                            ?.copy(Bitmap.Config.ARGB_8888, false)
                    } catch (e: Exception) {
                        Log.w(TAG, "failed to decode screenshot: ${e.message}")
                        null
                    } finally {
                        result.hardwareBuffer.close()
                    }
                    scanInFlight.set(false)
                    if (bitmap != null) handleFrame(bitmap)
                }

                override fun onFailure(errorCode: Int) {
                    scanInFlight.set(false)
                }
            },
        )
    }

    private fun handleFrame(bitmap: Bitmap) {
        executor.execute {
            val result = runCatching { classifier.classify(bitmap) }.getOrNull()
            mainHandler.post {
                if (result?.isExplicit == true) {
                    overlay.show(HadithRepository.randomLowerGazeReminder(applicationContext))
                } else if (overlay.isShowing) {
                    overlay.hide()
                }
            }
        }
    }

    companion object {
        private const val TAG = "ScreenGuardService"
        private const val SCAN_INTERVAL_MS = 1200L
    }
}
