import flet as ft 
from app.layout import primary_color, secondary_color, accent_color_1, accent_color_2, text_color 
import pandas as pd 
from simpledt import DataFrame



class SearchResults(ft.Container):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.bgcolor = primary_color
        self.width = 1200
        self.height = 750
        self.layout = SearchResultsLayout(page)
        self.content = self.layout
        self.alignment = ft.alignment.center

class SearchResultsLayout(ft.Column):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.bgcolor = primary_color
        self.scroll = ft.ScrollMode.AUTO
        self.title = SearchPageTitleContainer()
        self.df = pd.DataFrame(page.session.get('search_results'))
        self.flet_df = DataFrame(self.df)
        self.flet_table = self.flet_df.datatable
        # self.width = 585
        # self.height = 700
        self.alignment = ft.MainAxisAlignment.CENTER
        self.controls = [
            self.title,
            self.flet_table,
        ]
class SearchPageTitleContainer(ft.Container):
    def __init__(self):
        super().__init__()
        self.bgcolor = primary_color
        self.width = 585
        self.height = 50
        self.alignment = ft.alignment.center
        self.content = ft.Text('Potential Contracts', font_family='Boldonse-Regular', size=35, color=text_color)
        
       