package com.nexa.app

import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat

/**
 * Entry point for the Nexa app.
 *
 * Splash screen flow:
 *   1. OS displays the themed splash window instantly (black bg + Nexa logo).
 *   2. API 31+: The AnimatedVectorDrawable entry animation plays automatically
 *      for windowSplashScreenAnimationDuration (500 ms).
 *   3. setOnExitAnimationListener drives a glow pulse + fade-out via
 *      SplashAnimator, then removes the splash overlay.
 *   4. The app content underneath is revealed without any visible cut.
 *
 * No busy-waiting, no Thread.sleep, no postDelayed chains — the entire
 * timing is driven by the Animator framework on the RenderThread.
 */
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Must be called before super.onCreate so the compat library can
        // intercept the theme switch and show the splash window.
        val splashScreen = installSplashScreen()

        super.onCreate(savedInstanceState)

        // Edge-to-edge rendering — splash and content share the same insets.
        WindowCompat.setDecorFitsSystemWindows(window, false)

        // Keep the display on during the short animation to prevent any
        // frame drop caused by screen-dim logic on low-end devices.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // setContentView must be called before setOnExitAnimationListener so
        // the content view is already laid out when the splash overlay lifts.
        setContentView(R.layout.activity_main)

        // Don't hold the splash beyond the animated-icon duration.
        // The condition returns false immediately so the system dismisses
        // the splash as soon as the first content frame is drawn.
        splashScreen.setKeepOnScreenCondition { false }

        // Hand off exit animation to SplashAnimator.
        // provider.remove() is called inside the animator's doOnEnd.
        splashScreen.setOnExitAnimationListener { provider ->
            SplashAnimator.animate(provider)
        }
    }
}
