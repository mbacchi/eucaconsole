from guiops.guiops import GuiOps
from option_parser import Option_parser
import string, random, time


class Snapshot_operations_sequence(GuiOps):

    def __init__(self):
        parser = Option_parser()
        self.console_url = parser.parse_options()['console_url']
        self.webdriver_url = parser.parse_options()['web_driver']
        self.account = parser.parse_options()['account']
        self.user = parser.parse_options()['user_name']
        self.password = parser.parse_options()['password']
        self.sauce = parser.parse_options()['sauce']
        self.browser = parser.parse_options()['browser']
        self.version = parser.parse_options()['version']
        self.platform = parser.parse_options()['platform']
        self.tester = GuiOps(console_url=self.console_url, webdriver_url=self.webdriver_url, sauce=self.sauce, browser=self.browser, version=self.version, platform=self.platform)


    def id_generator(self, size = 6, chars=string.ascii_uppercase + string.digits):
        return ''.join(random.choice(chars) for j in range(size))

    def snapshot_ops_test(self):
        self.tester.login(self.account, self.user, self.password)
        volume1_name = self.id_generator()+"-volume"
        volume1 = self.tester.create_volume_from_view_page(volume1_name, availability_zone="one")
        volume1_id = volume1.get("volume_id")
        snapshot1 = self.tester.create_snapshot_on_volumes_view_page(volume1_id, snapshot_description="Created by snapshot operations test")
        snapshot1_id = snapshot1.get("snapshot_id")
        snapshot2_name =self.id_generator()+"-snapshot"
        snapshot2 = self.tester.create_snapshot_from_dashboard(volume1_id, snapshot2_name, "Created by snapshot operations test")
        snapshot2_id = snapshot2.get("snapshot_id")
        instance1 = self.tester.launch_instance_from_dashboard(availability_zone="one")
        instance1_id = instance1.get("instance_id")
        self.tester.attach_volume_from_instance_lp(volume1_id, instance1_id, device= "/dev/vdg")
        snapshot3_name =self.id_generator()+"-snapshot"
        snapshot3 = self.tester.create_snapshot_on_snapshot_view_page(volume1_id, snapshot3_name,"Created by snapshot operations test")
        snapshot3_id = snapshot3.get("snapshot_id")
        image1 = self.tester.register_snapshot_as_an_image_from_snapshot_landing_page(snapshot3_id, "myimage")
        image1_id = image1.get("image_id")
        self.tester.remove_image_from_cloud_on_images_lp(image1_id)
        volume2=self.tester.create_volume_from_snapshot_on_snapshot_lp(snapshot3_id, availability_zone="two")
        volume2_id=volume2.get("volume_id")
        self.tester.delete_volume_from_view_page(volume2_id)
        volume3_name = self.id_generator()+"-volume"
        volume3=self.tester.create_volume_from_snapshot_on_snapshot_detail_page(snapshot3_id, volume_name=volume3_name, availability_zone="two")
        volume3_id=volume3.get("volume_id")
        self.tester.delete_volume_from_detail_page(volume3_id)
        snapshot4 = self.tester.create_snapshot_on_volumes_view_page(volume1_id)
        snapshot4_id = snapshot4.get("snapshot_id")
        self.tester.delete_snapshot_from_landing_page(snapshot4_id)
        self.tester.delete_snapshot_from_detail_page(snapshot1_id)
        self.tester.delete_snapshot_from_landing_page(snapshot2_id)
        self.tester.delete_snapshot_from_landing_page(snapshot3_id)
        self.tester.terminate_instance_from_view_page(instance1_id)
        self.tester.delete_volume_from_view_page(volume1_id)
        self.tester.logout()
        self.tester.exit_browser()

if __name__ == '__main__':
        tester = Snapshot_operations_sequence()
        Snapshot_operations_sequence.snapshot_ops_test(tester)