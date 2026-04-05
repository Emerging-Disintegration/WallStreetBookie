import json
import os
import tempfile

SETTINGS_DIR = os.path.expanduser('~/.wallstreetbookie')
SETTINGS_PATH = os.path.join(SETTINGS_DIR, 'settings.json')

DEFAULT_SETTINGS = {
    'gemini_api_key': '',
    'ticker_strip': ['SPY', 'QQQ', 'DIA'],
    'theme': 'default'
}


class SettingsManager:
    def __init__(self) -> None:
        os.makedirs(SETTINGS_DIR, exist_ok=True)

    def get_all(self) -> dict:
        """Return the full settings dict, merged with defaults."""
        if not os.path.exists(SETTINGS_PATH):
            return dict(DEFAULT_SETTINGS)
        with open(SETTINGS_PATH, 'r') as f:
            saved = json.load(f)
        # Merge with defaults so new keys are always present
        merged = dict(DEFAULT_SETTINGS)
        merged.update(saved)
        return merged

    def save(self, settings: dict) -> None:
        """Overwrite the entire settings file. Atomic write."""
        # Validate ticker_strip max 3 items
        ticker_strip = settings.get('ticker_strip')
        if ticker_strip is not None and len(ticker_strip) > 3:
            raise ValueError("Ticker strip can only have 3 stocks maximum")
        
        fd, tmp = tempfile.mkstemp(dir=SETTINGS_DIR, suffix='.tmp')
        try:
            with os.fdopen(fd, 'w') as f:
                json.dump(settings, f, indent=2)
            os.replace(tmp, SETTINGS_PATH)
        except Exception:
            os.unlink(tmp)
            raise

    def get(self, key: str, default=None):
        """Get a single setting value."""
        settings = self.get_all()
        return settings.get(key, default)

    def set(self, key: str, value) -> None:
        """Set a single setting value."""
        # Validate ticker_strip max 3 items
        if key == 'ticker_strip' and value is not None and len(value) > 3:
            raise ValueError("Ticker strip can only have 3 stocks maximum")
        
        settings = self.get_all()
        settings[key] = value
        self.save(settings)
