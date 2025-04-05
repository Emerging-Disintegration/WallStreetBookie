import pandas as pd 
from math import log, sqrt, exp, erf
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from datetime import datetime, time
from yahoo_fin.options import get_options_chain

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--no-sandbox')

def get_r()-> float:
    # Use the CNBC.com to get the risk-free interest rate
    url = 'https://www.cnbc.com/quotes/US3M'
    driver = webdriver.Chrome(options=chrome_options)
    driver.get(url)
    html_content = driver.page_source
    soup = BeautifulSoup(html_content, 'html.parser')
    rate = soup.find('span', {'class': 'QuoteStrip-lastPrice'}).get_text()
    driver.quit()
    rate: float = float(rate.strip('%')) / 100  # Convert the percentage to a float 
    return rate

def get_t(exp, zone='CT'):
    time_stamps = {
    'EST': '16:00',
    'CT': '15:00',
    'MT': '14:00',
    'PST': '13:00'
}
    exp = datetime.strptime(exp, '%m/%d/%Y')
    times_str = time_stamps[zone]
    hours, minutes = map(int, times_str.split(':'))
    exp_dt = datetime.combine(exp, time(hours, minutes))
    current_dt = datetime.now()
    delta = exp_dt - current_dt
    seconds_per_year = 60*60*24*365.2425
    t = delta.total_seconds() / seconds_per_year
    return t

# Get the risk-free interest rate
r = get_r()  # Risk-free interest rate

def in_the_money_premium(df: pd.DataFrame, K, T, sigma, option_type='call') -> float:
        S = K  # Set stock price equal to strike price
        
        # Check if inputs are positive
        # if df['Strike'].eq(0).any() or df['t'].eq(0).any() or df['iv'].eq(0).any():
        #     raise ValueError(f"Inputs must be positive (S, K, T, sigma). S={S}, K={K}, T={T}, sigma={sigma}")

        # Calculate d1 and d2
        d1 = (log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt(T))
        d2 = d1 - sigma * sqrt(T)

        # Calculate in-the-money premium for a call option
        if option_type == 'call':
            money_premium = S * 0.5 * (1 + erf(d1 / sqrt(2))) - K * exp(-r * T) * 0.5 * (1 + erf(d2 / sqrt(2)))
        # Calculate in-the-money premium for a put option
        elif option_type == 'put':
            money_premium = K * exp(-r * T) * 0.5 * (1 + erf(-d2 / sqrt(2))) - S * 0.5 * (1 + erf(-d1 / sqrt(2)))
        else:
            raise ValueError("Invalid option_type. Use 'call' or 'put'")

        return money_premium

# Function to change percent to float value
def percent_gain_to_integer(percent_gain: float) -> float:
    # Calculate the corresponding integer
    integer_value = percent_gain / 100 + 1
    return integer_value
def integer_to_percent_gain(integer_value):
    # Calculate the corresponding percent gain
    percent = (integer_value - 1) * 100
    return percent
# Function to apply the in-the-money premium calculation for a call option
def apply_call(df):
    return in_the_money_premium(df, df['Strike'], df['t'], df['iv'])

# Function to apply the in-the-money premium calculation for a put option
def apply_put(df):
    return in_the_money_premium(df, df['Strike'], df['t'], df['iv'], option_type='put')

# def find_gain(exch: list[str], percent_gain: float, exp: str)-> pd.DataFrame:
    
#     # Convert the formatting of the expiration date for the API request
#     exp = exp.replace('/', '%2F')
    
#     # Set variable for the converted percent gain value 
#     times_gain = percent_gain_to_integer(percent_gain)
   
#     # List to store DataFrames for each stock
#     gains_list = [] 

#     # Iterate over each stock in the exchange list
#     for stock in exch:
#         # Construct the API URL
#         url = f'https://api.marketdata.app/v1/options/chain/{stock}/?format=json&expiration={exp}&range=otm&columns=strike%2C%20side%2C%20underlying%2C%20dte%2C%20ask%2C%20underlyingPrice%2C%20iv&token=cGxfN2Nra1FLVHNoQ2ttSVFDVEJudEs0a1JEblJwNGpvUXVfTmNUOVdvZz0'
#         # Send a GET request to the API
#         response = requests.request('GET', url)
#         chain = response.text

#         # Try to parse the response as JSON and create a DataFrame
#         try:
#             df = pd.read_json(chain)
#         except:
#             continue  # Skip to the next stock if parsing fails

#         # Try to calculate the in-the-money premium and times gain for each option
#         try:
#             # Calculate time to expiration in years
#             df['t'] = df['dte'].map(lambda x: float(x/365.25))

#             # Calculate in-the-money premium for each option
#             df['inTheMoneyPrice'] = df.apply(lambda x: apply_call(x) if x['side'] =='call' else apply_put(x), axis=1)
#             df['inTheMoneyPrice'] = df['inTheMoneyPrice'].round(2)

#             # Calculate times gain for each option
#             df['timesGain'] = df['inTheMoneyPrice'] / df['ask']
#             df['timesGain'] = df['timesGain'].round(2)

#             # Filter options with times gain greater than the desired value
#             df = df[df['timesGain'] >= times_gain]
#             #cSort options by times gain in ascending order
#             df.sort_values(by='timesGain', ascending=True, inplace=True)
#             # Drop all of the rows after the first 10
#             df.drop(df.index[10:], inplace=True)
#             # Convert times gain back to percent gain 
#             df['percentGain'] = df['timesGain'].apply(lambda x: integer_to_percent_gain(x)).round(2)
#             df['percentGain'] = df['percentGain'].apply(lambda x: str(x) + '%')
#             df['iv'] = df['iv'].round(1)
#             df['iv']= df['iv'].apply(lambda x: str(x * 100) + '%')
#             # Drop the time to expiration, and times gain columns
#             df.drop(columns=['t','timesGain'], inplace=True)

#             # Append the filtered DataFrame to the list
#             gains_list.append(df)
#         except:
#             continue  # Skip to the next stock if calculation fails

#     # If no options were found with the given criteria, return a message
#     if not gains_list:
#         return 'No options found with the given criteria. Try adjusting the percent gain or expiration range.'
    
#     # Return the concatenated DataFrame with the most gains for each stock
#     gains_df = pd.concat(gains_list)

#     # Reset the index of the concatenated DataFrame
#     gains_df = gains_df.reset_index(drop=True)
#     return gains_df

def find_gain_stock(stock, percent_gain, exp, zone='CT', opt_side='any'):
    times_gain = percent_gain_to_integer(percent_gain)
    T = get_t(exp, zone)
    df = None
    match opt_side:
        case 'call':
            df = get_options_chain(stock, exp)['calls']
            df['side'] = 'call'
        case 'put':
            df = get_options_chain(stock, exp)['puts']
            df['side'] = 'put'
        case _:
            chain_dict = get_options_chain(stock, exp)
            calls = chain_dict['calls']
            calls['side'] = 'call'
            puts = chain_dict['puts']
            puts['side'] = 'put'
            chain = [calls, puts]
            df = pd.concat(chain)

    df['iv'] = df['Implied Volatility'].str.replace(',', '').str.rstrip('%').astype(float) / 100
    df.insert(loc=0, column='Ticker', value=f'{stock}')
    df = df[['Ticker', 'Strike', 'Last Price', 'Bid', 'Ask', 'Change', 'Open Interest', 'side', 'iv']]
    df = df[df['iv'] > 0]
    df['t'] = T

    # Calculate in-the-money premium for each option
    df['inTheMoneyPrice'] = df.apply(lambda x: apply_call(x) if x['side'] == 'call' else apply_put(x), axis=1)
    df['inTheMoneyPrice'] = df['inTheMoneyPrice'].round(2)
    # Calculate times gain for each option
    df['timesGain'] = df['inTheMoneyPrice'] / df['Ask']
    df['timesGain'] = df['timesGain'].round(2)

    # Filter options with times gain greater than the desired value
    df = df[df['timesGain'] >= times_gain]
    # Sort options by times gain in ascending order
    df.sort_values(by='timesGain', ascending=True, inplace=True)
    # Drop all of the rows after the first 10
    df.reset_index(drop=True, inplace=True)
    df.drop(df.index[20:], inplace=True)
    # Convert times gain back to percent gain
    df['percentGain'] = df['timesGain'].apply(lambda x: integer_to_percent_gain(x)).round(2)
    df['percentGain'] = df['percentGain'].apply(lambda x: str(x) + '%')
    # Drop the time to expiration, and times gain columns
    df.drop(columns=['t', 'timesGain'], inplace=True)
    df['iv'] = df['iv'].round(1)
    df['iv'] = df['iv'].apply(lambda x: str(x * 100) + '%')
    df.rename(
        columns={
            'side': 'Side',
            'iv': 'Implied Volatility',
            'inTheMoneyPrice': 'ITM Price',
            'percentGain': 'Percent Gain'
        }, inplace=True)
    return df


