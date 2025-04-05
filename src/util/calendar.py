from datetime import datetime, timedelta
import pandas as pd
from pandas.tseries.holiday import (
    USFederalHolidayCalendar,
    GoodFriday
)
from pandas.tseries.offsets import CustomBusinessDay

def get_trading_days(year):
    """
    Get all trading days between start_date and end_date, excluding weekends and market holidays.
    
    Parameters:
    start_date (datetime or str): Start date for the range. Defaults to today.
    end_date (datetime or str): End date for the range. Defaults to one year from start_date.
    
    Returns:
    pd.DatetimeIndex: Array of trading days
    """
    # Handle default dates
    start_date = f'{year}-01-01'
    end_date = f'{year}-12-31'
    
        
    # Convert string dates to datetime if necessary
    if isinstance(start_date, str):
        start_date = pd.to_datetime(start_date)
    if isinstance(end_date, str):
        end_date = pd.to_datetime(end_date)
    
    # Define market-specific holidays
    market_holidays = USFederalHolidayCalendar()
    
    
    # Get federal holidays
    federal_holidays = market_holidays.holidays(start=start_date, end=end_date)
    
    
    # Get additional market holidays
    market_specific_holidays = []

    # Calculate Good Friday date
    market_specific_holidays.extend(GoodFriday.dates(start_date, end_date))
    
    # Add Good Friday to Fedral Holidays 
    all_holidays = federal_holidays.union(pd.DatetimeIndex(market_specific_holidays))
    
    # Create business day calendar
    trading_calendar = CustomBusinessDay(holidays=all_holidays)
    
    # Generate trading days
    trading_days = pd.date_range(
        start=start_date,
        end=end_date,
        freq=trading_calendar
    )
    
    return trading_days

