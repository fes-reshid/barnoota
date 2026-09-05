package com.barnoota.noorshield.filter

import android.graphics.Bitmap

/** Result of scanning a captured frame for explicit content. */
data class NsfwResult(val isExplicit: Boolean, val confidence: Float)

/**
 * Classifies a screen capture as explicit or not. Swap [HeuristicSkinToneClassifier]
 * for a real on-device model before shipping this to real users — see README
 * "Upgrading the classifier" for how to plug in a TensorFlow Lite model
 * (e.g. an open, on-device-licensed NSFW MobileNet such as the ones used by
 * NSFWJS, converted to .tflite) via [TfliteNsfwClassifier].
 */
interface NsfwClassifier {
    fun classify(bitmap: Bitmap): NsfwResult
}

/**
 * PLACEHOLDER, not production-grade. Flags frames with an unusually high
 * proportion of skin-tone-range pixels. This produces real false positives
 * (beach photos, portraits, certain furniture/wood tones) and real false
 * negatives (explicit content that isn't skin-dominant, or where skin
 * tone detection is tuned for a narrow set of tones) — it exists only so
 * the detection -> blur -> log pipeline can be built, tested, and swapped
 * out for a trained model without changing any other component.
 *
 * DO NOT ship this as the sole classifier in a public release.
 */
class HeuristicSkinToneClassifier(
    private val threshold: Float = 0.42f,
) : NsfwClassifier {

    override fun classify(bitmap: Bitmap): NsfwResult {
        val sampleStep = 4 // sample every 4th pixel in each dimension for speed
        var skinPixels = 0
        var sampled = 0

        var y = 0
        while (y < bitmap.height) {
            var x = 0
            while (x < bitmap.width) {
                val pixel = bitmap.getPixel(x, y)
                val r = (pixel shr 16) and 0xFF
                val g = (pixel shr 8) and 0xFF
                val b = pixel and 0xFF
                if (isSkinTone(r, g, b)) skinPixels++
                sampled++
                x += sampleStep
            }
            y += sampleStep
        }

        val ratio = if (sampled == 0) 0f else skinPixels.toFloat() / sampled
        return NsfwResult(isExplicit = ratio >= threshold, confidence = ratio)
    }

    private fun isSkinTone(r: Int, g: Int, b: Int): Boolean {
        // Classic RGB skin-tone heuristic (Kovac et al.), intentionally loose.
        val max = maxOf(r, g, b)
        val min = minOf(r, g, b)
        return r > 95 && g > 40 && b > 20 &&
            (max - min) > 15 &&
            kotlin.math.abs(r - g) > 15 &&
            r > g && r > b
    }
}

/**
 * Stub for a real TFLite-backed classifier. Load a .tflite model from
 * assets/, run it against a resized (e.g. 224x224) copy of the bitmap, and
 * return the model's explicit-content score here. Left unimplemented
 * deliberately: bundling a specific trained model is a licensing and
 * accuracy decision for the app owner to make, not something to guess at.
 */
class TfliteNsfwClassifier : NsfwClassifier {
    override fun classify(bitmap: Bitmap): NsfwResult {
        throw NotImplementedError(
            "Plug in a TensorFlow Lite NSFW model here before using TfliteNsfwClassifier " +
                "(see README: Upgrading the classifier)."
        )
    }
}
