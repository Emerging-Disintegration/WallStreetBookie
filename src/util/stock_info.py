import finnhub.client as fh 
import os 
from dotenv import load_dotenv
import re 
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--no-sandbox')

load_dotenv()

api_key = os.getenv('API_KEY')
api = fh.Client(api_key=api_key)

def get_current_price(stock: str):
    quote = api.quote(stock)
    current_price = quote['c']
    return str(current_price)
    

def get_percent_change(stock: str):
    quote = api.quote(stock)
    percent_change = quote['dp']
    return str(percent_change)

def get_option_stats(ticker: str)-> dict:
    """
    Available Keys:
        'Implied Volatility (30d)',
        'IV Rank',
        'IV Percentile',
        'Historical Volatility',
        'IV High',
        'IV Low',
        'Today\'s Open Interest',
        'Put-Call Ratio',
        'Put Open Interest',
        'Call Open Interest',
        'Open Interest Avg (30-day)',
        'Today vs Open Interest Avg (30-day)',
        'Today\'s Volume',
        'Put Volume',
        'Call Volume',
        'Volume Avg (30-day)',
        'Today vs Volume Avg (30-day)'

    """

    url = f'https://optioncharts.io/options/{ticker.upper()}'
    driver = webdriver.Chrome(options=chrome_options)
    driver.get(url)
    html_content = driver.page_source
    #scrape webpage
    soup = BeautifulSoup(html_content, 'html.parser')
    #find all stats
    opt_stats = soup.find_all('div', class_='tw-font-semibold')
    #find all stat titles
    opt_stat_titles = soup.find_all('div', class_='tw-text-sm tw-text-gray-500')
    #orgaine uncleaned stats into a list
    raw_stats = [x.get_text() for x in opt_stats]
    #clean and store the titles as well
    stat_strings = [x.get_text().rstrip() for x in opt_stat_titles]
    #close the browser
    driver.quit()
    #create list to hold cleaned stats
    stats = []
    #create dictionary to hold the stats and their titles
    metrics = {}
    #stat cleaning 
    for stat in raw_stats:
        stats.append(re.sub(r'[^\d,.%]', '', stat))
    #zip stats and titles into a dictionary and store it in metrics dictionary
    for k, v in zip(stat_strings, stats):
        metrics[k] = v
    metrics['IV High'] = metrics['IV High'].split('%')[0]
    metrics['IV Low'] = metrics['IV Low'].split('%')[0]
    return metrics

def get_vix()-> float:
    driver = webdriver.Chrome(options=chrome_options)
    url = 'https://www.cnbc.com/quotes/.VIX'
    driver.get(url)
    html_content = driver.page_source
    soup = BeautifulSoup(html_content, 'html.parser')
    vix = float(soup.find('span', {'class': 'QuoteStrip-lastPrice'}).get_text())
    driver.quit()
    return vix