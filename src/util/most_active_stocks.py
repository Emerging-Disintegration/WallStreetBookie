# Import necessary libraries
from bs4 import BeautifulSoup  # For parsing HTML and XML documents
from selenium import webdriver  # For controlling a web browser
import pandas as pd  # For data manipulation and analysis
import numpy as np  # For mathematical operations
from selenium.webdriver.chrome.options import Options


chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--no-sandbox')


import time

def most_active_stock_chains() -> list:
    # Define the URL of the webpage to scrape
    url = 'https://optioncharts.io/trending/most-active-stock-options'
    max_retries = 3

    for attempt in range(max_retries):
        # Initialize a Chrome webdriver
        driver = webdriver.Chrome(options=chrome_options)
        try:
            # Load the webpage in the Chrome webdriver
            driver.get(url)

            # Get the HTML content of the loaded webpage
            html_content = driver.page_source

            # Parse the HTML content using BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')

            # Find the first table in the parsed HTML
            tables = soup.find_all('table')
            if not tables:
                raise ValueError("No tables found on page")

            # Convert the table to a pandas DataFrame
            df = pd.read_html(str(tables[0]))[0]
            if df.empty:
                raise ValueError("Most active table is empty")

            # Rename columns to match frontend expectations
            df = df.rename(columns={
                'Symbol': 'ticker',
                'Call Volume': 'callVolume',
                'Put Volume': 'putVolume',
                'Total Volume': 'totalVolume'
            })

            # Clean numeric columns (remove commas and convert to int)
            for col in ['callVolume', 'putVolume', 'totalVolume']:
                if col in df.columns:
                    df[col] = df[col].astype(str).str.replace(',', '').astype(int)

            return df.to_dict('records')

        except Exception as e:
            print(f"Stock chains scrape attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
        finally:
            driver.quit()

    return []
