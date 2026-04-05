import pandas as pd
import numpy as np
import yfinance as yf
from scipy.stats import norm
from datetime import datetime, time, timedelta, timezone
from util.yahoo_fin_options import get_options_chain


def get_r() -> float:
    # 13-week T-bill rate from Yahoo Finance
    t = yf.Ticker('^IRX')
    return float(t.fast_info['last_price']) / 100

def get_t(exp):
    # Parse expiration date and set to 4pm EST
    exp = datetime.strptime(exp, '%m/%d/%Y')
    est_tz = timezone(timedelta(hours=-5))  # EST is UTC-5
    exp_dt = datetime.combine(exp, time(16, 0)).replace(tzinfo=est_tz)
    
    # Get current time in UTC
    current_dt = datetime.now(timezone.utc)
    
    # Calculate time difference
    delta = exp_dt - current_dt
    seconds_per_year = 60*60*24*365.2425
    t = delta.total_seconds() / seconds_per_year
    return t

# Get the risk-free interest rate
r = get_r()  # Risk-free interest rate

# Calculate the in-the-money premium for a given option using the Black-Scholes-Merton model
def in_the_money_premium(df: pd.DataFrame, K, T, sigma, option_type='call') -> float:
        S = K  # Set stock price equal to strike price

        # Black Scholes d1 and d2 calculations
        d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)
        # Calculate the in-the-money premium based on the option type
        if option_type == 'call':
            itm_premium = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
        elif option_type == 'put':
            itm_premium = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        # Handle unrecognized option types
        else:
            raise ValueError(f'Unrecognized option type: {option_type}. Expected "call" or "put".')

        return itm_premium

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

# def api_result_chain(stock, percent_gain: float, exp: str, zone ='CT', opt_side= 'any')-> pd.DataFrame:
    # Get time to expiration in years
    # T = get_t(exp, zone)
    # Convert the formatting of the expiration date for the API request
    # exp = exp.replace('/', '%2F')
    # Option chain API key
    # option_chain_api_key = os.getenv('OPTION_CHAIN_API_KEY')
    # url = None
    # Construct the API URL
    # match opt_side:
        # case 'call':
            # url = None
        # case 'put':
            # url = None
        # case _:
            # url = f'https://api.marketdata.app/v1/options/chain/{stock}/?format=json&expiration={exp}&range=otm&columns=strike%2C%20side%2C%20underlying%2C%20dte%2C%20ask%2C%20underlyingPrice%2C%20iv&token={option_chain_api_key}'
    # Set variable for the converted percent gain value 
    # times_gain = percent_gain_to_integer(percent_gain)
    # Send a GET request to the API
    # response = requests.request('GET', url)
    # chain = response.text
    # Parse the response as JSON and create a DataFrame
    # df = pd.read_json(chain)
# 
    # Calculate time to expiration in years
    # df['t'] = T
    # Calculate in-the-money premium for each option
    # df['inTheMoneyPrice'] = df.apply(lambda x: apply_call(x) if x['side'] == 'call' else apply_put(x), axis=1)
    # df['inTheMoneyPrice'] = df['inTheMoneyPrice'].round(2)
    # Calculate times gain for each option
    # df['timesGain'] = df['inTheMoneyPrice'] / df['ask']
    # df['timesGain'] = df['timesGain'].round(2)
    # Filter options with times gain greater than the desired value
    # df = df[df['timesGain'] >= times_gain]
    # Sort options by times gain in ascending order
    # df.sort_values(by='timesGain', ascending=True, inplace=True)
    # Drop all of the rows after the first 10
    # df.drop(df.index[10:], inplace=True)
    # Convert times gain back to percent gain 
    # df['percentGain'] = df['timesGain'].apply(lambda x: integer_to_percent_gain(x)).round(2)
    # df['percentGain'] = df['percentGain'].apply(lambda x: str(x) + '%')
    # df['iv'] = df['iv'].round(1)
    # df['iv'] = df['iv'].apply(lambda x: str(x * 100) + '%')
    # Drop the time to expiration, and times gain columns
    # df.drop(columns=['t', 'timesGain'], inplace=True)
    # df.rename(
        # columns={
            # 'iv': 'Implied Volatility',
            # 'inTheMoneyPrice': 'ITM Price',
            # 'percentGain': 'Percent Gain'
        # }, inplace=True)
    # return df

    
################################################################################################
def result_chain(stock, percent_gain, exp, opt_side = 'Any' ):
    times_gain = percent_gain_to_integer(percent_gain)
    T = get_t(exp)
    df = None
    match opt_side:
        case 'Calls':
            df = get_options_chain(stock, exp)['calls']
            df['side'] = 'call'
        case 'Puts':
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
    # Calculate times gain; fall back to Last Price when Ask is 0
    price_basis = df['Ask'].where(df['Ask'] > 0, df['Last Price'])
    df['timesGain'] = (df['inTheMoneyPrice'] / price_basis).replace([float('inf'), float('-inf')], float('nan'))
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
    df['iv'] = df['iv'] * 100
    df['iv'] = df['iv'].round(1)
    df['iv'] = df['iv'].apply(lambda x: str(x) + '%')
    df.rename(
        columns={
            'Last Price': 'Last',
            'Open Interest': 'OI',
            'side': 'Side',
            'iv': 'IV',
            'inTheMoneyPrice': 'ITM Price',
            'percentGain': '% Gain'
        }, inplace=True)
    return df


