package com.undrgradz.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        
        // Official Android 12+ SplashScreen custom smooth exit animation (fade + subtle scale)
        splashScreen.setOnExitAnimationListener(splashScreenViewProvider -> {
            splashScreenViewProvider.getView().animate()
                .alpha(0.0f)
                .scaleX(1.05f)
                .scaleY(1.05f)
                .setDuration(300L)
                .withEndAction(splashScreenViewProvider::remove)
                .start();
        });
    }
}
