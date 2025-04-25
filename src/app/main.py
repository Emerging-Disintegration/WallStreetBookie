import flet as ft
from app.layout import *
from app.search_results import SearchResults

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
    app = BookieApp(page)

    def route_change(route):
        page.views.clear()
        page.views.append(
            ft.View(
                '/',
                [app],
                horizontal_alignment = ft.MainAxisAlignment.CENTER,
                vertical_alignment = ft.MainAxisAlignment.CENTER,
                padding = 0
            )
        )
        if page.route =='/search_results':
            page.views.append(
                ft.View(
                    '/search_results',
                    [SearchResults(page)],
                    horizontal_alignment=ft.MainAxisAlignment.CENTER,
                    vertical_alignment=ft.MainAxisAlignment.CENTER,
                    padding = 10,
                    bgcolor = primary_color,
                    floating_action_button = ft.FloatingActionButton(
                        icon = ft.icons.HOME,
                        bgcolor = accent_color_1,
                        on_click = lambda e: page.go('/')
                    )
                )
            )
        page.update()
    def view_pop(view):
        page.views.pop()
        top_view = page.views[-1]
        page.go(top_view.route)

    page.on_route_change = route_change
    page.on_view_pop = view_pop
    page.go(page.route)
   
        
    
    
        
ft.app(main, assets_dir='assets')
