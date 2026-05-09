import json
import time

import machine
import urequests

from config import (
    ADC_DRY,
    ADC_PIN,
    ADC_WET,
    MAX_RETRIES,
    READING_INTERVAL_SECONDS,
    RETRY_DELAY_SECONDS,
    SENSOR_ID,
    SERVER_URL,
)

adc = machine.ADC(machine.Pin(ADC_PIN))
# ATTN_11DB enables full 0-3.3V input range (0-4095 raw).
# Without this, the default 0dB cap (~1V) makes wet readings saturate.
adc.init(atten=machine.ADC.ATTN_11DB)


def read_moisture_percent():
    raw = adc.read_u16()
    level = (ADC_DRY - raw) / (ADC_DRY - ADC_WET) * 100
    return max(0.0, min(100.0, level))


def post_moisture(level):
    url = "{}/api/moisture".format(SERVER_URL)
    headers = {"Content-Type": "application/json"}
    body = json.dumps({"sensor_id": SENSOR_ID, "level": level})
    response = urequests.post(url, headers=headers, data=body)
    status = response.status_code
    response.close()
    return status


while True:
    try:
        level = read_moisture_percent()
        print("Moisture: {:.1f}%".format(level))

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                status = post_moisture(level)
                if status == 200:
                    print("Posted OK")
                    break
                else:
                    print("Server returned {} on attempt {}".format(status, attempt))
            except OSError as e:
                print("Network error on attempt {}: {}".format(attempt, e))
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
        else:
            print("All retries failed, sleeping until next cycle")

    except Exception as e:
        print("Unexpected error:", e)

    time.sleep(READING_INTERVAL_SECONDS)
