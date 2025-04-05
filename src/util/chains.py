# Import necessary libraries
from bs4 import BeautifulSoup  # For parsing HTML and XML documents
from selenium import webdriver  # For controlling a web browser
import pandas as pd  # For data manipulation and analysis
import numpy as np  # For mathematical operations



def most_active_stock_chains()-> np.array:
    # Define the URL of the webpage to scrape
    url = 'https://optioncharts.io/trending/most-active-stock-options'
    # Initialize a Chrome webdriver
    driver = webdriver.Chrome()

    # Load the webpage in the Chrome webdriver
    driver.get(url)

    # Get the HTML content of the loaded webpage
    html_content = driver.page_source

    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find the first table in the parsed HTML
    table = soup.find_all('table')[0]

    # Convert the table to a pandas DataFrame
    df = pd.read_html(str(table))[0]

    # Extract the list of stock symbols from the DataFrame
    most_active_stocks = np.array(df['Symbol'])

    return most_active_stocks


def most_active_etf_chains()-> np.array:
    # Define the URL of the webpage to scrape
    url = 'https://optioncharts.io/trending/most-active-etf-options'
    # Initialize a Chrome webdriver
    driver = webdriver.Chrome()

    # Load the webpage in the Chrome webdriver
    driver.get(url)

    # Get the HTML content of the loaded webpage
    html_content = driver.page_source

    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find the first table in the parsed HTML
    table = soup.find_all('table')[0]

    # Convert the table to a pandas DataFrame
    df = pd.read_html(str(table))[0]

    most_active_etf: np.array = np.array(df['Symbol'])

    return most_active_etf