from bs4 import BeautifulSoup
from selenium import webdriver
import pandas as pd
from selenium.webdriver.chrome.options import Options
import time
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--no-sandbox')

def options_flow() -> list:
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
            # df = df.rename(columns={
            #     'Symbol': 'ticker',
            #     'Type': 'type',
            #     'Volume': 'volume',
            #     'Price': 'price',
            #     'Time': 'time'
            # })
            # df['volume'] = df['volume'].astype(str).str.replace(',', '').astype(int)
            # df['price'] = df['price'].astype(str).str.replace('$', '').astype(float)
            return df.to_dict('records')
        except Exception as e:
            print(f"Options flow scrape attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
        finally:
            driver.quit()