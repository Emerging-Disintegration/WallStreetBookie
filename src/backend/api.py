# pywebview API bridge — exposes Python utils to the React frontend

from datetime import datetime
from util.scan import result_chain
from util.stock_info import get_current_price, get_percent_change, get_option_stats, get_vix
from util.chains import most_active_stock_chains, most_active_etf_chains
from util.volume import get_call_put_volume
from util.watchlist import WatchlistManager


class Api:

    def __init__(self):
        self._window = None
        self._maximized = False
        self.watchlist_manager = WatchlistManager()

    def set_window(self, window):
        self._window = window

    def close_window(self):
        self._window.destroy()

    def minimize_window(self):
        self._window.minimize()

    def toggle_maximize(self):
        if self._maximized:
            self._window.restore()
            self._maximized = False
        else:
            self._window.maximize()
            self._maximized = True

    def search_options(self, ticker: str, expiration: str, desired_gain: int, option_type: str = 'Any') -> list:
        try:
            # Convert frontend date format (YYYY-MM-DD) to backend format (MM/DD/YYYY)
            expiration = datetime.strptime(expiration, '%Y-%m-%d').strftime('%m/%d/%Y')
            df = result_chain(ticker, desired_gain, expiration, option_type)
            return {"success": True, "data": df.to_dict('records')}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_price(self, ticker: str) -> dict:
        try:
            price = get_current_price(ticker)
            return {"success": True, "data": price}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_change(self, ticker: str) -> dict:
        try:
            change = get_percent_change(ticker)
            return {"success": True, "data": change}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_stock_card_data(self, ticker: str) -> dict:
        # fetches price + percent change in one call
        try:
            price = get_current_price(ticker)
            change = get_percent_change(ticker)
            return {
                "success": True,
                "data": {
                    "ticker": ticker,
                    "price": price,
                    "change": change
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_vix_value(self) -> dict:
        try:
            vix = get_vix()
            return {"success": True, "data": vix}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_options_stats(self, ticker: str) -> dict:
        try:
            stats = get_option_stats(ticker)
            return {"success": True, "data": stats}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_active_stocks(self) -> dict:
        try:
            stocks = most_active_stock_chains()
            return {"success": True, "data": stocks}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_active_etfs(self) -> dict:
        try:
            etfs = most_active_etf_chains()
            return {"success": True, "data": etfs}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_volume(self) -> dict:
        try:
            volume = get_call_put_volume()
            return {
                "success": True,
                "data": {
                    "callVolume": int(volume[0]),
                    "putVolume": int(volume[1])
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_watchlist(self) -> dict:
        try:
            watchlist = self.watchlist_manager.get_all()
            return {"success": True, "data": watchlist}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def add_favorite(self, ticker: str) -> dict:
        try:
            success, message = self.watchlist_manager.add(ticker)
            return {"success": success, "message": message}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def remove_favorite(self, ticker: str) -> dict:
        try:
            success, message = self.watchlist_manager.remove(ticker)
            return {"success": success, "message": message}
        except Exception as e:
            return {"success": False, "error": str(e)}
