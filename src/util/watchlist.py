import json
import os
from datetime import datetime
from pathlib import Path

class WatchlistManager:
    def __init__(self, filepath=None):
        if filepath:
            self.filepath = Path(filepath)
        else:
            self.filepath = Path.home() / ".wallstreetbookie" / "watchlist.json"
        self._ensure_file()

    def _ensure_file(self):
        if not self.filepath.exists():
            self.filepath.parent.mkdir(parents=True, exist_ok=True)
            self._save({"version": 1, "updated_at": datetime.now().isoformat(), "tickers": []})

    def _load(self):
        try:
            with open(self.filepath, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
             return {"version": 1, "tickers": []}

    def _save(self, data):
        # Atomic write: temp file then rename
        data["updated_at"] = datetime.now().isoformat()
        tmp = self.filepath.with_suffix('.tmp')
        with open(tmp, 'w') as f:
            json.dump(data, f, indent=2)
        tmp.replace(self.filepath)

    def get_all(self):
        data = self._load()
        return data.get("tickers", [])

    def add(self, symbol: str):
        symbol = symbol.upper().strip()
        data = self._load()
        # Check for duplicate
        if any(t['symbol'] == symbol for t in data['tickers']):
            return False, "Ticker already in watchlist"
        
        # Add new ticker
        new_ticker = {
            "symbol": symbol,
            "added_at": datetime.now().isoformat()
        }
        data['tickers'].append(new_ticker)
        self._save(data)
        return True, "Ticker added"

    def remove(self, symbol: str):
        symbol = symbol.upper().strip()
        data = self._load()
        initial_len = len(data['tickers'])
        data['tickers'] = [t for t in data['tickers'] if t['symbol'] != symbol]
        
        if len(data['tickers']) < initial_len:
            self._save(data)
            return True, "Ticker removed"
        return False, "Ticker not found"
