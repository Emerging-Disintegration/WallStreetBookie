from bs4 import BeautifulSoup
from selenium import webdriver
import pandas as pd
from selenium.webdriver.chrome.options import Options
import time
import re

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--no-sandbox')

_CONTRACT_RE = re.compile(
    r'^(?P<ticker>.+?)\s+(?P<expiry>[A-Za-z]{3}\s+\d{1,2},\s+\d{4})\s+(?P<strike>\d+(?:\.\d+)?)\s+(?P<type>call|put)$'
)


def _parse_contract(contract: str) -> dict[str, str | float]:
    match = _CONTRACT_RE.match(contract.strip())
    if not match:
        return {'expiry': '', 'strike': 0.0, 'type': ''}
    return {
        'expiry': match.group('expiry'),
        'strike': float(match.group('strike')),
        'type': match.group('type'),
    }


def options_flow() -> list[dict]:
    url = 'https://optioncharts.io/trending/unusual-options-activity-stock-contracts'
    max_retries = 3
    for attempt in range(max_retries):
        driver = webdriver.Chrome(options=chrome_options)
        try:
            driver.get(url)
            html_content = driver.page_source
            soup = BeautifulSoup(html_content, 'html.parser')
            tables = soup.find_all('table')
            if not tables:
                raise ValueError("No tables found on page")
            df = pd.read_html(str(tables[0]))[0]
            if df.empty:
                raise ValueError("Options flow table is empty")
            df = df.rename(columns={
                'Symbol': 'ticker',
                'Contract': 'contract',
                'Volume/Open Interest': 'ratio',
                'Option Volume': 'optionVolume',
                'Open Interest': 'openInterest',
            })
            df['optionVolume'] = df['optionVolume'].astype(str).str.replace(',', '').astype(int)
            df['openInterest'] = df['openInterest'].astype(str).str.replace(',', '').astype(int)
            df['ratio'] = df['ratio'].astype(float)

            parsed = df['contract'].apply(_parse_contract)
            df['expiry'] = parsed.apply(lambda x: x['expiry'])
            df['strike'] = parsed.apply(lambda x: x['strike'])
            df['type'] = parsed.apply(lambda x: x['type'])

            return df.to_dict('records')
        except Exception as e:
            print(f"Options flow scrape attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
        finally:
            driver.quit()
    raise RuntimeError("Failed to scrape options flow after multiple attempts")
