# Bottom Nav Overlap Bug — Full Debug History

## App Info
- Next.js 15 + Tailwind v4
- Backend: Next.js API on Vercel
- Mobile: Capacitor (hybrid mode — loads LIVE Vercel URL, no static bundle)
- Capacitor version: 7.x (@capacitor/app@7.1.2)
- Device tested: Physical Android (Vivo I2220) + Emulator

## The Bug
Last item in scrollable list (e.g. GR01 in Inventory) is cut off/hidden behind the app's own bottom nav bar (58px tall, fixed bottom-0).
Same issue visible in Chrome browser on phone — not just APK.

---

## Root Causes Identified

1. `MainActivity.java` had `WindowCompat.setDecorFitsSystemWindows(getWindow(), false)` — enables edge-to-edge, WebView draws behind Android system nav bar
2. `styles.xml` had `android:windowTranslucentNavigation = true` — double-enables edge-to-edge
3. `splashImmersive: true` + `splashFullScreen: true` in capacitor.config.ts — triple-enables edge-to-edge
4. `env(safe-area-inset-bottom)` returning 0px because edge-to-edge was misconfigured
5. `p-4` in MobileScrollFix className overriding `.mobile-scroll-container` paddingBottom due to Tailwind v4 cascade order
6. **CRITICAL: Git pushes may not be reaching Vercel** — GitHub still shows 42 commits, latest deployment timestamp unknown, Vercel may be disconnected from master branch

---

## Fixes Attempted (All Failed)

### Fix 1 — capacitor.config.ts
Changed: `splashFullScreen: true → false`, `splashImmersive: true → false`
Result: No change

### Fix 2 — styles.xml
Removed: `android:windowTranslucentNavigation = true`
Added: `android:navigationBarColor = #FF0F0F0F`, `android:statusBarColor = #FF0F0F0F`, `android:windowDrawsSystemBarBackgrounds = true`
Result: No change

### Fix 3 — MainActivity.java
Removed: `WindowCompat.setDecorFitsSystemWindows(getWindow(), false)` and its import
Result: No change

### Fix 4 — mobile-scroll-fix.tsx (CSS padding approach)
Removed `p-4` from className, added inline style `paddingBottom: calc(58px + 2rem)`
Tried values: 2rem, 3rem
Result: No change

### Fix 5 — globals.css
Removed `.mobile-scroll-container` block with `!important` padding overrides
Result: No change

### Fix 6 — mobile-scroll-fix.tsx (JS dynamic approach)
Used `useEffect` + `getBoundingClientRect()` to measure nav height and apply paddingBottom dynamically with setTimeout (0ms, 300ms, 800ms)
Result: No change

### Fix 7 — dashboard/layout.tsx (Spacer div approach)
Added `<div className="block md:hidden" style={{ height: "74px" }} />` inside scroll container above BottomNav
Result: No change

---

## Key Observations

- Chrome browser on phone shows SAME overlap as APK → problem is in Vercel code, NOT Android/APK
- Clearing Chrome cache, browsing history, app data — no effect
- `npx cap sync android` run after every change ✅
- Android Studio Clean Project run ✅  
- Git push terminal shows success each time ✅
- BUT: GitHub repo still shows 42 commits — suspected pushes not reaching Vercel
- Vercel deployment status: UNKNOWN — dashboard not checked yet

---

## Current File States (after all fixes)

### capacitor.config.ts
```
splashFullScreen: false
splashImmersive: false
StatusBar.overlaysWebView: false
server.url: https://riddhi-siddhi-jewellery-dlbp.vercel.app (hybrid/live URL mode)
```

### MainActivity.java
```java
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // WindowCompat line REMOVED
  }
}
```

### styles.xml
```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
  <item name="windowActionBar">false</item>
  <item name="windowNoTitle">true</item>
  <item name="android:background">@null</item>
  <!-- windowTranslucentNavigation REMOVED -->
  <item name="android:windowDrawsSystemBarBackgrounds">true</item>
  <item name="android:navigationBarColor">#FF0F0F0F</item>
  <item name="android:statusBarColor">#FF0F0F0F</item>
</style>
```

### mobile-scroll-fix.tsx
```tsx
export function MobileScrollFix({ children }) {
  return (
    <main className="flex-1 overflow-y-auto hw-scroll md:p-6 ...">
      {children}
    </main>
  )
}
```

### dashboard/layout.tsx
Has spacer div `<div className="block md:hidden" style={{ height: "74px" }} />` inside scroll area

---

## Bottom Nav Component Facts
- File: `components/shared/bottom-nav.tsx`
- Classes: `fixed bottom-0 left-0 right-0 z-50 md:hidden`
- Height: `h-[58px]` (58px)
- Only shows on mobile (hidden on md+)

---

## What To Investigate Next
1. Verify Vercel is actually deploying from master branch
2. Check Vercel dashboard deployment logs
3. Consider if Next.js build cache on Vercel is stale
4. Try: add `?v=2` query param to test URL to bypass any CDN cache
5. Try: run `vercel --prod` CLI directly instead of relying on git push trigger
6. Try: disconnect and reconnect Vercel GitHub integration
