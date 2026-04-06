import json
import google.generativeai as genai

SYSTEM_PROMPT = """You are a ruthless, experienced options trader acting as a pre-trade risk auditor.
Given the following trade parameters, perform three strict checks:

1. Liquidity & Slippage: Is the Bid/Ask spread wider than 10%? Is volume dangerously low compared to Open Interest?
2. Price Target Feasibility: Does the required price target vastly exceed the historical weekly move (ATR) given the DTE?
3. IV Crush Risk: Is the current IV abnormally high compared to historical IV, posing a risk of premium crush after an event?

You MUST return your analysis strictly as a JSON object using the following structure.
Keep the notes punchy, aggressive, and under 2 sentences each.

{
  "liquidity": {
    "is_hazardous": true/false,
    "note": "string"
  },
  "feasibility": {
    "is_unrealistic": true/false,
    "note": "string"
  },
  "iv_crush": {
    "is_high_risk": true/false,
    "note": "string"
  },
  "overall_risk_level": "Low" | "Moderate" | "Extreme"
}"""


def build_trade_context(ticker, strike, option_type, dte, iv, bid, ask, volume, open_interest, current_price):
    """Build the user prompt with trade parameters."""
    spread_pct = ((ask - bid) / ask * 100) if ask > 0 else 0

    return f"""Analyze this trade:
- Ticker: {ticker}
- Strike: ${strike}
- Type: {option_type.upper()}
- Current Price: ${current_price}
- DTE: {dte} days
- IV: {iv * 100:.1f}%
- Bid/Ask: ${bid:.2f} / ${ask:.2f} (spread: {spread_pct:.1f}%)
- Volume: {volume}
- Open Interest: {open_interest}
- Vol/OI Ratio: {f"{volume / open_interest:.2f}" if open_interest > 0 else 'N/A'}"""


def audit_trade(api_key, ticker, strike, option_type, dte, iv,
                bid, ask, volume, open_interest, current_price):
    """Send trade data to Gemini and return structured risk assessment."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-3-flash-preview')

    user_prompt = build_trade_context(
        ticker, strike, option_type, dte, iv,
        bid, ask, volume, open_interest, current_price
    )

    response = model.generate_content(
        [SYSTEM_PROMPT, user_prompt],
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
        )
    )

    result = json.loads(response.text)
    return result
