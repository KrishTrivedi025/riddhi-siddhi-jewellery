package com.riddhisiddhi.jewellery;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Tell Android: WebView draws behind system bars, expose real insets
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
