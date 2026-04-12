# pywebview entry point for WallStreetBookie

import webview
import subprocess
import atexit
import time
import os
import sys
import urllib.request

# add src/ to Python path so 'util' is importable
src_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from backend.api import Api, _drag_state

vite_process = None


def wait_for_server(url, timeout=30):
    """Poll the dev server until it responds or timeout."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            urllib.request.urlopen(url)
            return True
        except Exception:
            time.sleep(0.5)
    return False


def start_vite_dev_server():
    """Spawn the Vite dev server as a child process."""
    global vite_process
    frontend_dir = os.path.join(src_dir, 'frontend')

    print("Starting Vite dev server...")
    vite_process = subprocess.Popen(
        ['npx', 'vite'],
        cwd=frontend_dir,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )

    url = 'http://localhost:5173'

    # wait for Vite to actually be ready
    if wait_for_server(url):
        print("Vite dev server is ready.")
    else:
        print("Vite dev server failed to start within 30 seconds.")
        stop_vite_dev_server()
        sys.exit(1)

    return url


def stop_vite_dev_server():
    """Kill the Vite dev server on exit."""
    global vite_process
    if vite_process:
        vite_process.terminate()
        vite_process.wait()
        vite_process = None


def get_entry_point() -> str:
    """Return the URL or file path for the frontend."""
    if os.environ.get('WALLSTBOOKIE_DEV'):
        url = start_vite_dev_server()
        atexit.register(stop_vite_dev_server)
        return url
    else:
        index_path = os.path.join(src_dir, 'frontend', 'dist', 'index.html')
        if not os.path.exists(index_path):
            print("Built frontend not found at:", index_path)
            print("Run 'npm run build' in src/frontend/, or set WALLSTBOOKIE_DEV=1 for dev mode.")
            sys.exit(1)
        return index_path


def patch_cocoa_drag():
    """Monkey-patch pywebview's mouseDragged_ to respect the shared drag flag
    and fix the super-call bug (mouseDown_ -> mouseDragged_)."""
    from webview.platforms import cocoa
    from webview.platforms.cocoa import BrowserView
    import AppKit

    def patched_mouseDragged_(self, event):
        i = BrowserView.get_instance('webview', self)
        window = self.window()

        # only move the window if drag is enabled
        if i.frameless and i.easy_drag and _drag_state['enabled']:
            screenFrame = i.screen
            if screenFrame is None:
                raise RuntimeError('Failed to obtain screen')
            windowFrame = window.frame()
            if windowFrame is None:
                raise RuntimeError('Failed to obtain frame')
            currentLocation = window.convertBaseToScreen_(
                window.mouseLocationOutsideOfEventStream()
            )
            newOrigin = AppKit.NSMakePoint(
                (currentLocation.x - self.initialLocation.x),
                (currentLocation.y - self.initialLocation.y),
            )
            if (newOrigin.y + windowFrame.size.height) > (
                screenFrame.origin.y + screenFrame.size.height
            ):
                newOrigin.y = screenFrame.origin.y + (
                    screenFrame.size.height + windowFrame.size.height
                )
            window.setFrameOrigin_(newOrigin)

        if event.modifierFlags() & getattr(AppKit, 'NSEventModifierFlagControl', 1 << 18):
            if not cocoa._state['debug']:
                return

        # forward as mouseDown_ so WKWebView's internal dispatch receives the event
        # (WKWebView ignores mouseDragged: from the responder chain)
        super(BrowserView.WebKitHost, self).mouseDown_(event)

    BrowserView.WebKitHost.mouseDragged_ = patched_mouseDragged_


def main():
    api = Api()
    entry = get_entry_point()

    window = webview.create_window(
        title='WallStreetBookie',
        url=entry,
        js_api=api,
        # width=1200,
        # height=850,
        width=450,
        height=800,
        resizable=True,
        frameless=True,
        # min_size=(538, 1)
    )
    api.set_window(window)

    patch_cocoa_drag()
    webview.start(debug=bool(os.environ.get('WALLSTBOOKIE_DEV')))


if __name__ == '__main__':
    main()
