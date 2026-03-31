import math


def _norm_cdf(x):
    """Standard normal CDF using math.erf (no scipy needed)."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def _bs_price(S, K, T, r, sigma, option_type):
    """Black-Scholes theoretical option price. Falls back to intrinsic when T <= 0 or sigma <= 0."""
    if T <= 0 or sigma <= 0:
        if option_type == "call":
            return max(0, S - K)
        return max(0, K - S)

    try:
        d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
        d2 = d1 - sigma * math.sqrt(T)

        if option_type == "call":
            return S * _norm_cdf(d1) - K * math.exp(-r * T) * _norm_cdf(d2)
        return K * math.exp(-r * T) * _norm_cdf(-d2) - S * _norm_cdf(-d1)
    except (ValueError, OverflowError):
        # extreme log/exp values — fall back to intrinsic
        if option_type == "call":
            return max(0, S - K)
        return max(0, K - S)


def calculate_contract_value(strike, option_type, current_price,
                             dte=0, iv=0.3, risk_free_rate=0.05,
                             price_range_pct=0.5, num_points=200):
    """Calculate contract value across a range of underlying prices."""

    if strike <= 0:
        raise ValueError("strike must be greater than 0")

    option_type = option_type.lower()
    if option_type not in ("call", "put"):
        raise ValueError("option_type must be 'call' or 'put'")

    # full range centered on strike
    range_low = strike * (1 - price_range_pct)
    range_high = strike * (1 + price_range_pct)

    # extend range if current price falls outside
    buffer = 0.05
    if current_price < range_low:
        range_low = current_price * (1 - buffer)
    if current_price > range_high:
        range_high = current_price * (1 + buffer)

    step = (range_high - range_low) / (num_points - 1) if num_points > 1 else 0
    prices = [range_low + step * i for i in range(num_points)]

    T = dte / 365.0

    # contract value = theoretical option price x100
    points = []
    for price in prices:
        if dte > 0 and iv > 0:
            value = _bs_price(price, strike, T, risk_free_rate, iv, option_type) * 100
        else:
            if option_type == "call":
                value = max(0, price - strike) * 100
            else:
                value = max(0, strike - price) * 100
        
        # Ensure a tiny floor for OTM values so they render correctly on the chart
        # if the price is close to strike or if BS model returns a tiny float
        points.append({"price": round(price, 2), "value": round(value, 2)})

    return {
        "points": points,
        "currentPrice": current_price,
        "optionType": option_type,
        "strike": strike,
    }
