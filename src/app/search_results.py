import flet as ft 
from app.layout import primary_color, secondary_color, accent_color_1, accent_color_2, text_color 
import pandas as pd 
from simpledt import DataFrame

# #DataTable variable
# global flet_table

# #Turn DataFrame into a Flet DataTable
# df = pd.DataFrame(Page.session.get('search_results'))
# flet_df =DataFrame(df)
# flet_table = flet_df.datatable

# #DataTable properties
# flet_table.heading_row_color = accent_color_1
# flet_table.heading_text_style = ft.TextStyle(
#     color = text_color,
#     size = 20,
#     font_family = 'Boldonse-Regular',
# )
# flet_table.horizontal_lines = ft.BorderSide(color = accent_color_2)
# flet_table.data_text_style = ft.TextStyle(color = text_color)





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
        self.title = ft.Text('Potential Contracts', font_family='Boldonse-Regular', size=30, color=text_color)
        self.df = pd.DataFrame(page.session.get('search_results'))
        self.flet_df = DataFrame(self.df)
        self.flet_table = self.flet_df.datatable
        self.flet_table.heading_row_color = accent_color_1
        self.flet_table.heading_text_style = ft.TextStyle(
            color = text_color,
            size = 12,
        )
        self.flet_table.horizontal_lines = ft.BorderSide(color = accent_color_2, width = 1)
        self.flet_table.data_text_style = ft.TextStyle(color = text_color)
        self.flet_table.border_radius = ft.BorderRadius(8,8,8,8)
        # self.width = 585
        # self.height = 700
        self.alignment = ft.MainAxisAlignment.CENTER
        self.controls = [
            self.title,
            self.flet_table,
        ]
# class SearchPageTitleContainer(ft.Container):
#     def __init__(self):
#         super().__init__()
#         self.bgcolor = primary_color
#         self.width = 50
#         self.height = 50
#         self.alignment = ft.alignment.center
#         self.content = None
        
       