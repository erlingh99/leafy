import network
import time
from config import WIFI_SSID, WIFI_PASSWORD


def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if wlan.isconnected():
        print("WiFi already connected:", wlan.ifconfig()[0])
        return True
    print("Connecting to WiFi:", WIFI_SSID)
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    for _ in range(20):  # 10-second timeout
        if wlan.isconnected():
            print("WiFi connected:", wlan.ifconfig()[0])
            return True
        time.sleep(0.5)
    print("WiFi connection failed")
    return False


connect_wifi()
