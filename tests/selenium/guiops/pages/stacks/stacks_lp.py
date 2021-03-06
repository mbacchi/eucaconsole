from pages.landingpage import LandingPage

class StacksView(LandingPage):

    def __init__(self, tester):
        self.tester = tester
        self.verify_stacks_view_page_loaded()

    _stacks_view_page_title = "Stacks"
    _create_stack_btn_id = "create-stack-btn"
    _stack_link_css = 'td>a[href="/stack/{0}"]'
    _stack_actions_menu_id = "table-item-dropdown_{0}"
    _view_details_stack_actions_menuitem_css ="#item-dropdown_{0}>li>a"
    _delete_stack_actions_menuitem_css ="#item-dropdown_{0}>li>a"

    def verify_stacks_view_page_loaded(self):
        """
        Waits for page title to load; waits for refresh button to load; wait for 'Create Stack' button to load.
        """
        self.tester.wait_for_text_present_by_id(ViewPage._page_title_id, self._stacks_view_page_title)
        self.tester.wait_for_visible_by_id(ViewPage._refresh_button_id)
        self.tester.wait_for_visible_by_id(self._create_stack_btn_id)

    def click_create_stack_button_on_view_page(self):
        self.tester.click_element_by_id(self._create_stack_btn_id)

    def click_stack_link_on_view_page(self, stack_name):
        self.tester.click_element_by_css(self._stack_link_css.format(stack_name))

    def verify_stack_present_on_view_page(self, stack_name):
        self.tester.wait_for_element_present_by_css(self._stack_link_css.format(stack_name))

    def verify_stack_not_present_on_view_page(self, stack_name):
        self.tester.wait_for_element_not_present_by_css(self._stack_link_css.format(stack_name))

    def click_action_delete_stack_on_view_page(self, stack_name):
        self.tester.click_element_by_id(self._stack_actions_menu_id.format(stack_name))
        self.tester.click_element_by_css(self._delete_stack_actions_menuitem_css.format(stack_name))
