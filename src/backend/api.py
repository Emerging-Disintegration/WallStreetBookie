# pywebview API bridge — exposes Python utils to the React frontend

from datetime import datetime
from util.scan import result_chain, get_t
from util.stock_info import get_current_price, get_percent_change, get_option_stats, get_vix
from util.chains import most_active_stock_chains, most_active_etf_chains
from util.volume import get_call_put_volume
from util.watchlist import WatchlistManager
from util.pnl import calculate_contract_value


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
            if success:
                return {"success": True, "data": {"added": True}}
            return {"success": False, "error": message}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def remove_favorite(self, ticker: str) -> dict:
        try:
            success, message = self.watchlist_manager.remove(ticker)
            if success:
                return {"success": True, "data": {"removed": True}}
            return {"success": False, "error": message}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_value_curve(self, strike, option_type, current_price, expiration='', dte_override=None, iv=0.3, price_range_pct=0.2) -> dict:
        try:
            strike = float(strike)
            current_price = float(current_price)
            iv = float(iv)
            option_type = option_type.lower()

            # compute DTE: use slider override, or calculate from expiration date
            if dte_override is not None:
                dte = max(0, float(dte_override))
                max_dte = dte
            elif expiration:
                exp_converted = datetime.strptime(expiration, '%Y-%m-%d').strftime('%m/%d/%Y')
                dte = max(0, get_t(exp_converted) * 365.2425)
                max_dte = dte
            else:
                dte = 0
                max_dte = 0

            result = calculate_contract_value(strike, option_type, current_price, dte=dte, iv=iv, price_range_pct=price_range_pct)
            result["maxDte"] = round(max_dte, 2)
            return {"success": True, "data": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
