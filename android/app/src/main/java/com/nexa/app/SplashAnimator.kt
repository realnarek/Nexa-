package com.nexa.app

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.os.Build
import android.view.View
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import androidx.core.animation.doOnEnd
import androidx.core.splashscreen.SplashScreenViewProvider

/**
 * Drives the Nexa splash screen exit animation for all API levels.
 *
 * API 31+ — the system already played the AnimatedVectorDrawable entry
 *            (fade-in + scale-up). We add a glow pulse then fade out.
 *
 * API 21-30 — the compat library shows a static icon frame.
 *             We run a lightweight scale pulse then fade out.
 *
 * Total wall-clock budget: ≤ 700 ms so the overall splash stays under 1.2 s
 * when combined with the 500 ms animated icon on API 31+.
 */
internal object SplashAnimator {

    fun animate(provider: SplashScreenViewProvider) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            animateApi31(provider)
        } else {
            animateLegacy(provider)
        }
    }

    // ── API 31+ ──────────────────────────────────────────────────────────────

    private fun animateApi31(provider: SplashScreenViewProvider) {
        val icon = provider.iconView
        val splash = provider.view

        // Subtle glow pulse: icon scales up slightly then returns to 1.0
        val pulseX = ObjectAnimator.ofFloat(icon, View.SCALE_X, 1f, 1.035f, 1f).apply {
            duration = 280
            interpolator = DecelerateInterpolator(1.5f)
        }
        val pulseY = ObjectAnimator.ofFloat(icon, View.SCALE_Y, 1f, 1.035f, 1f).apply {
            duration = 280
            interpolator = DecelerateInterpolator(1.5f)
        }
        val glowPulse = AnimatorSet().apply {
            playTogether(pulseX, pulseY)
        }

        // Fade the whole splash overlay out
        val fadeOut = ObjectAnimator.ofFloat(splash, View.ALPHA, 1f, 0f).apply {
            duration = 350
            startDelay = 100
            interpolator = AccelerateInterpolator(1.8f)
            doOnEnd { provider.remove() }
        }

        AnimatorSet().apply {
            playTogether(glowPulse, fadeOut)
            start()
        }
    }

    // ── API 21–30 ─────────────────────────────────────────────────────────────

    private fun animateLegacy(provider: SplashScreenViewProvider) {
        val icon = provider.iconView
        val splash = provider.view

        // Lightweight pulse then fade — total ≈ 650 ms
        val pulseX = ObjectAnimator.ofFloat(icon, View.SCALE_X, 1f, 1.04f, 1f).apply {
            duration = 350
            interpolator = DecelerateInterpolator(2f)
        }
        val pulseY = ObjectAnimator.ofFloat(icon, View.SCALE_Y, 1f, 1.04f, 1f).apply {
            duration = 350
            interpolator = DecelerateInterpolator(2f)
        }

        val fadeOut = ObjectAnimator.ofFloat(splash, View.ALPHA, 1f, 0f).apply {
            duration = 300
            startDelay = 250
            interpolator = AccelerateInterpolator(1.8f)
            doOnEnd { provider.remove() }
        }

        AnimatorSet().apply {
            playTogether(pulseX, pulseY, fadeOut)
            start()
        }
    }
}
