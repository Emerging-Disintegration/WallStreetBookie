import flet as ft
from util.search import find_gain_stock
import pandas as pd
from util.stock_info import *

primary_color = '#8F87F1'
secondary_color = '#C68EFD'
accent_color_1 = '#E9A5F1'
accent_color_2 = '#FED2E2'
text_color = '#F1E7E7'


class BookieApp(ft.Container):
    def __init__(self):
        super().__init__()
        self.bgcolor = primary_color
        self.width = 1200
        self.height = 750
        self.alignment = ft.alignment.top_center
        self.app = AppLayout()
        self.content = self.app
        self.padding = 5

class AppLayout(ft.Column):
    def __init__(self):
        super().__init__()
        self.card_row = CardRow()
        self.title_section = TitleSection()
        self.middle_row_container = MiddleRowContainer()
        self.search_container = SearchContainer()
        self.controls = [
            self.title_section, 
             self.card_row,
             self.middle_row_container,
             self.search_container
        ]
        self.alignment = ft.MainAxisAlignment.CENTER
        self.width = 585
        self.height = 700
 

class TitleSection(ft.Column):
    def __init__(self):
        super().__init__()
        self.title = 'WallStreetBookie'
        self.alignment = ft.MainAxisAlignment.START
        self.spacing = 5
        self.controls = [
            ft.Text(self.title, font_family = 'Boldonse-Regular', size = 35, color = text_color),
            ft.Text('Find High-Potential(and High Risk) trades instantly\nYour shortcut to your next WallStreetBet', size = 17, color = text_color, weight = 300)
        ]

class CardRow(ft.Row):
    def __init__(self):
        super().__init__()
        # self.container = None
        self.spy = StockCard('SPY')
        self.qqq = StockCard('QQQ')
        self.iwm = StockCard('IWM')
        self.controls = [
            self.spy,
            self.qqq,
            self.iwm
        ]
        self.alignment = ft.MainAxisAlignment.CENTER
        self.spacing = 30


class StockCard(ft.Container):
    def __init__(self, stock):
        super().__init__()
        # self.stock = stock
        self.bgcolor = secondary_color
        self.border_radius = 8
        self.width = 175
        self.height = 175
        self.alignment = ft.alignment.center 
        self.content = StockStats(stock)


class StockStats(ft.Column):
    def __init__(self, stock):
        super().__init__()
        self.width = 165
        self.current_price = get_current_price(stock)
        self.percent_change = get_percent_change(stock)
        self.option_stats = None
        self.controls = [
            ft.Row(
                controls = [
                    ft.Text(stock, size = 25, color = text_color),

                ],
                alignment = ft.MainAxisAlignment.START
            ),
            ft.Row(
                controls=[
                    ft.Text(self.current_price, size = 30, color = text_color, expand = True),
                    ft.Text(self.percent_change)
                ],
                alignment = ft.MainAxisAlignment.CENTER,
                spacing = 5

            )
        ]




class Vix(ft.Text):
    def __init__(self):
        super().__init__()
        self.text = str(get_vix())



# class SideButton(ft.CupertinoSegmentedButton):
#     def __inti__(self):
#         super().__init__()
#         self.selected_index = 1
#         self.thumb_color = accent_color_2
#         self.border_color = primary_color
#         self.selected_color = accent_color_1
#         self.controls = [
#             ft.Text('Calls'),
#             ft.Text('Puts'),
#             ft.Text('Any')
#         ]


class MiddleRowContainer(ft.Container):
    def __init__(self):
        super().__init__()
        self.bgcolor = primary_color
        self.height = 85
        self.width = 585
        self.alignment = ft.alignment.bottom_center
        self.middle_row = MiddleRow()
        self.content = self.middle_row


class MiddleRow(ft.Row):
    def __init__(self):
        super().__init__()
        self.width = 585
        self.vix = Vix()
        self.alignment = ft.MainAxisAlignment.SPACE_BETWEEN
        self.controls = [
            ft.CupertinoSlidingSegmentedButton(
                controls = [
                    ft.Text('Calls'),
                    ft.Text('Puts'),
                    ft.Text('Any')
                ],
                selected_index = 1,
                thumb_color = accent_color_1,
                bgcolor = primary_color
            ),
            ft.Text(value = f'VIX: {self.vix.text}', size = 35, color = text_color)
        ]

class SearchContainer(ft.Container):
    def __init__(self):
        super().__init__()
        self.width = 585
        self.height = 65
        self.bgcolor = secondary_color
        self.alignment = ft.Alignment(1, 0)
        self.search_row = SearchRow()
        self.content = self.search_row
        self.border_radius = 8


class SearchRow(ft.Row):
    def __init__(self):
        super().__init__()
        # self.page = ft.Page()
        self.width = 575
        self.height = 60
        self.ticker_box = SearchBox('Ticker')
        self.expiration_box = SearchBox('Expiration')
        self.desired_profit_box = SearchBox('Desired Profit')
        self.search_button = SearchButton()
        self.controls = [
            self.ticker_box,
            self.expiration_box,
            self.desired_profit_box,
            self.search_button
        ] 

class SearchBox(ft.TextField):
    def __init__(self, label: str):
        super().__init__()
        self.label = label
        self.bgcolor = primary_color
        self.color = text_color
        self.border = ft.InputBorder.OUTLINE
        self.border_color = accent_color_2
        self.width = 151
        self.height = 30
        self.border_radius = 8
        self.label_style = ft.TextStyle(color = text_color, size = 12)
        self.cursor_color = text_color
        self.cursor_height = 15
        self.cursor_radius = 8
        self.text_vertical_align = ft.VerticalAlignment.START
        
class SearchButton(ft.FilledButton):
    def __init__(self):
        super().__init__()
        self.text = 'Search'
        self.color = text_color
        self.icon = ft.icons.SEARCH
        self.icon_color = text_color
        self.bgcolor = accent_color_1
        self.style = ft.ButtonStyle(shape = ft.RoundedRectangleBorder(radius = 8))


    # def on_search_click(self, e):
    #     ticker = self.ticker_box.value
    #     expiration = self.expiration_box.value
    #     percent_gain = self.desired_profit_box.value

    #     df = find_gain_stock(ticker, percent_gain, expiration)
    #     self.page.session.set('search_results', df.to_dict)
    #     self.page.go('/search_results')

