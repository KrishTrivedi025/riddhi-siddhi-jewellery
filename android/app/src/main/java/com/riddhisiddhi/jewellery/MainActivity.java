package com.riddhisiddhi.jewellery;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // ✅ REMOVED: WindowCompat.setDecorFitsSystemWindows(getWindow(), false)
        // That line was enabling edge-to-edge (WebView draws behind nav bar)
        // Now the system handles insets natively — no overlap
    }
}