import flet as ft 
from app.layout import primary_color, secondary_color, accent_color_1, accent_color_2, text_color 
import pandas as pd 
from simpledt import DataFrame

def search_results_page(page: ft.Page):
    df_dict = page.session.get('df_dict', {})
    df = pd.DataFrame(df_dict)
    flet_df = DataFrame(df)
    results_df = flet_df.datatable 
    page.floating_action_button = ft.FloatingActionButton(
        icon = ft.icons.HOME,
        on_click = lambda e: page.go('/'),
        bgcolor = secondary_color,
        tooltip='Go back to Home Page'
    )
    # page.padding = 0
    page.window.title_bar_hidden = True
    page.window.width = 1200
    page.window.height = 750
    page.window.resizable = False
    page.fonts = {
        'Boldonse-Regular': '/fonts/Boldonse-Regular.ttf',
        'Urbanist-Regular': '/fonts/Urbanist-Regular.ttf'
    }
    page.bgcolor = primary_color
    page.add(results_df)

ft.app(search_results_page, assets_dir='assets')