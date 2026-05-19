"""Reddit sentiment data from ApeWisdom API."""

import requests


def get_sentiment(page: int = 1) -> list[dict]:
    """Fetch top 100 all-stocks from ApeWisdom sentiment API.

    Endpoint: https://apewisdom.io/api/v1.0/filter/all-stocks/page/{page}

    Returns list of dicts with these keys:
    - rank: int
    - ticker: str (uppercase)
    - name: str
    - mentions: int
    - upvotes: int
    - rank_24h_ago: int
    - mentions_24h_ago: int
    - rank_delta: int (rank_24h_ago - rank, positive = climbed ranks)
    - mention_delta: int (mentions - mentions_24h_ago, positive = more buzz)
    """
    url = f"https://apewisdom.io/api/v1.0/filter/all-stocks/page/{page}"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    payload = response.json()

    results = []
    for item in payload.get("results", []):
        rank = item.get("rank", 0)
        rank_24h_ago = int(item.get("rank_24h_ago", 0) or 0)
        mentions = int(item.get("mentions", 0) or 0)
        mentions_24h_ago = int(item.get("mentions_24h_ago", 0) or 0)

        results.append(
            {
                "rank": rank,
                "ticker": str(item.get("ticker", "")).upper(),
                "name": str(item.get("name", "")),
                "mentions": mentions,
                "upvotes": int(item.get("upvotes", 0) or 0),
                "rank_24h_ago": rank_24h_ago,
                "mentions_24h_ago": mentions_24h_ago,
                "rank_delta": rank_24h_ago - rank,
                "mention_delta": mentions - mentions_24h_ago,
            }
        )

    return results
