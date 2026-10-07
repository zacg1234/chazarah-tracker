// Call right after a successful password login on mobile web (not on saved sessions or password
// resets, so people can still recover their password in the browser). Hand off to the native app, but only if it's installed.
// If it isn't, nothing visible happens and the user just carries on in the web app.
//
// Browsers can't tell us whether an app is installed, so we fire the app's link and
// rely on how each platform behaves when nothing handles it:
//  - Android: an intent:// link opens the app if installed, otherwise Chrome follows
//    S.browser_fallback_url (the web app's home page), so the user stays on the web app.
//  - iOS: a custom-scheme link in a hidden iframe is silently ignored when the app isn't
//    installed (navigating the page itself would show an "invalid address" alert).
//    If the app is installed, iOS asks the user to confirm "Open in Chazarah Tracker?".
const ANDROID_PACKAGE = 'com.zacg1234.chazarahtracker';
const SCHEME = 'chazarahtracker';

export function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function tryOpenMobileApp() {
  if (!isMobileBrowser()) return;
  if (/Android/i.test(navigator.userAgent)) {
    const fallback = encodeURIComponent(`${window.location.origin}/chazarah`);
    window.location.href = `intent://#Intent;scheme=${SCHEME};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
  } else {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = `${SCHEME}://`;
    document.body.appendChild(frame);
    setTimeout(() => frame.remove(), 2000);
  }
}
