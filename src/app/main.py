import flet as ft
from app.layout import *
from app.search_results import SearchResults

def main(page: ft.Page):
    # Initialize page settings
    page.window.title_bar_hidden = True
    page.window.width = 1200
    page.window.height = 750
    page.window.resizable = False
    page.scroll = ft.ScrollMode.ALWAYS
    page.fonts = {
        'Boldonse-Regular': '/fonts/Boldonse-Regular.ttf',
        'Urbanist-Regular': '/fonts/Urbanist-Regular.ttf'
    }
    page.bgcolor = primary_color
    page.theme = ft.Theme(font_family='Urbanist-Regular')
    # app = BookieApp(page)

    def floating_action_on_click(e):
        page.session.remove('search_results')
        page.go('/')
        page.update()

    def route_change(route):
        page.views.clear()
        if page.route == '/':
            home_view = ft.View(
                '/',
                [BookieApp(page)],  
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                vertical_alignment=ft.MainAxisAlignment.CENTER,
                padding=0
            )
            page.views.append(home_view)
        elif page.route == '/search_results':
            page.views.append(
                ft.View(
                    '/search_results',
                    [SearchResults(page)],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    vertical_alignment=ft.MainAxisAlignment.CENTER,
                    padding = 25,
                    bgcolor = primary_color,
                    floating_action_button = ft.FloatingActionButton(
                        icon = ft.icons.HOME,
                        bgcolor = accent_color_1,
                        on_click = floating_action_on_click,
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
