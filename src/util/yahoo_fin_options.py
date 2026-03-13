import yfinance as yf
import pandas as pd
import time
import logging

logger = logging.getLogger(__name__)

# Retry config
_MAX_RETRIES = 3
_BASE_DELAY = 5  # seconds

# Column mapping from yfinance to yahoo_fin format
_COLUMN_MAP = {
    "contractSymbol": "Contract Name",
    "lastTradeDate": "Last Trade Date",
    "strike": "Strike",
    "lastPrice": "Last Price",
    "bid": "Bid",
    "ask": "Ask",
    "change": "Change",
    "percentChange": "% Change",
    "volume": "Volume",
    "openInterest": "Open Interest",
    "impliedVolatility": "Implied Volatility",
}

def _format_df(df):
    """Rename columns and format values to match yahoo_fin output."""
    df = df.rename(columns=_COLUMN_MAP)

    # yahoo_fin returns IV as a percentage string like "45.20%"
    if "Implied Volatility" in df.columns:
        df["Implied Volatility"] = df["Implied Volatility"].apply(
            lambda x: f"{x * 100:.2f}%" if pd.notna(x) else "0.00%"
        )

    # yahoo_fin returns Volume and OI as strings with dashes for zero
    if "Volume" in df.columns:
        df["Volume"] = df["Volume"].fillna(0).astype(int).astype(str).replace("0", "-")
    if "Open Interest" in df.columns:
        df["Open Interest"] = df["Open Interest"].fillna(0).astype(int).astype(str).replace("0", "-")

    return df


def _parse_date(date):
    """Convert date string (e.g. '03/18/2026') to yfinance format ('2026-03-18')."""
    if date is None:
        return None
    return pd.Timestamp(date).strftime("%Y-%m-%d")


def get_options_chain(ticker, date=None):
    """
    Drop-in replacement for yahoo_fin's get_options_chain.
    Returns dict with 'calls' and 'puts' DataFrames matching the original column format.
    Retries with exponential backoff on rate limiting (429).
    """
    t = yf.Ticker(ticker)
    yf_date = _parse_date(date)

    for attempt in range(_MAX_RETRIES):
        try:
            chain = t.option_chain(yf_date)
            calls = _format_df(chain.calls.copy())
            puts = _format_df(chain.puts.copy())
            return {"calls": calls, "puts": puts}
        except Exception as e:
            if "Rate" in str(e) or "429" in str(e) or "Too Many" in str(e):
                delay = _BASE_DELAY * (2 ** attempt)
                logger.warning(f"Rate limited (attempt {attempt + 1}/{_MAX_RETRIES}). Retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise

    raise Exception(f"Rate limited after {_MAX_RETRIES} retries for {ticker}. Try again later.")


def get_expiration_dates(ticker):
    """Drop-in replacement for yahoo_fin's get_expiration_dates."""
    t = yf.Ticker(ticker)
    return list(t.options)


def get_calls(ticker, date=None):
    return get_options_chain(ticker, date)["calls"]


def get_puts(ticker, date=None):
    return get_options_chain(ticker, date)["puts"]
