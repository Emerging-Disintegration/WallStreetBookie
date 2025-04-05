from bs4 import BeautifulSoup
from selenium import webdriver
import numpy as np
import pandas as pd

def get_call_put_volume()-> np.array:

    url = 'https://optioncharts.io/trending/most-active-stock-options'
    
    driver = webdriver.Chrome()

    driver.get(url)

    html_content = driver.page_source

    soup = BeautifulSoup(html_content, 'html.parser')

    table = soup.find_all('table')[0]

    df = pd.read_html(str(table))[0]

    call_volume: int = (df['Call Volume']).sum()
    put_volume: int = (df['Put Volume']).sum()

    return np.array([call_volume, put_volume])




















































