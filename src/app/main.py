import flet as ft
from app.layout import *
# from app.search_results import search_results_page
def main(page: ft.Page):
    
    # page.on_route_change = route_change
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
    page.theme = ft.Theme(font_family='Urbanist-Regular')
    app = BookieApp()
    # test = ft.Text('WallStreetBookie', font_family='Boldonse-Regular', size=40, color=text_color)
    page.add(app)
    
    # def route_change(route):
    #     page.views.clear()
    #     search_results_page(page)
    #     page.update()
ft.app(main, assets_dir='assets')
