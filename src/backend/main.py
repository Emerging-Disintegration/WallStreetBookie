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

from backend.api import Api

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


def main():
    api = Api()
    entry = get_entry_point()

    window = webview.create_window(
        title='WallStreetBookie',
        url=entry,
        js_api=api,
        width=1200,
        height=850,
        resizable=True,
        frameless=True,
    )
    api.set_window(window)

    webview.start(debug=bool(os.environ.get('WALLSTBOOKIE_DEV')))


if __name__ == '__main__':
    main()
