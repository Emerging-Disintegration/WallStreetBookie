from bs4 import BeautifulSoup
import numpy as np
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options




def get_call_put_volume()-> np.array:

    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.binary_location = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

    url = 'https://optioncharts.io/trending/most-active-stock-options'
    
    driver = webdriver.Chrome(options=chrome_options)

    driver.get(url)

    html_content = driver.page_source

    soup = BeautifulSoup(html_content, 'html.parser')

    table = soup.find_all('table')[0]

    df = pd.read_html(str(table))[0]

    call_volume: int = (df['Call Volume']).astype(int).sum()
    put_volume: int = (df['Put Volume']).astype(int).sum()
    # total_volume: int = call_volume + put_volume
    # put_call_ratio: float = put_volume / call_volume if call_volume > 0 else 0

    return np.array([call_volume, put_volume,])



















































