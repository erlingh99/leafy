import json

import machine
import uasyncio
import urequests

import calibration_server
from config import (
    ADC_DRY,
    ADC_PIN,
    ADC_WET,
    CALIBRATION_PORT,
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

calibration_server.init(adc, ADC_DRY, ADC_WET)


def register_sensor():
    url = "{}/api/sensors/register".format(SERVER_URL)
    headers = {"Content-Type": "application/json"}
    body = json.dumps({"sensor_id": SENSOR_ID})
    try:
        response = urequests.post(url, headers=headers, data=body)
        response.close()
        print("Registered sensor: {}".format(SENSOR_ID))
    except Exception as e:
        print("Registration failed: {}".format(e))


register_sensor()


def _post_moisture(level: float) -> int:
    url = "{}/api/moisture".format(SERVER_URL)
    headers = {"Content-Type": "application/json"}
    body = json.dumps({"sensor_id": SENSOR_ID, "level": level})
    # timeout bounds the blocking duration
    # so the calibration server isn't starved indefinitely
    response = urequests.post(url, headers=headers, data=body, timeout=10)
    status = response.status_code
    response.close()
    return status


async def sensor_loop():
    while True:
        try:
            raw = adc.read_u16()
            level = calibration_server.compute_moisture(raw)
            print("Moisture: {:.1f}%".format(level))

            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    await uasyncio.sleep(
                        0
                    )  # yield so calibration server can flush before blocking HTTP call
                    status = _post_moisture(level)
                    if status == 200:
                        print("Posted OK")
                        break
                    else:
                        print(
                            "Server returned {} on attempt {}".format(status, attempt)
                        )
                except OSError as e:
                    print("Network error on attempt {}: {}".format(attempt, e))
                if attempt < MAX_RETRIES:
                    await uasyncio.sleep(RETRY_DELAY_SECONDS)
            else:
                print("All retries failed, sleeping until next cycle")

        except Exception as e:
            print("Unexpected error:", e)

        await uasyncio.sleep(READING_INTERVAL_SECONDS)


async def main():
    server = await uasyncio.start_server(
        calibration_server.handle_client, "0.0.0.0", CALIBRATION_PORT
    )
    print("Calibration server listening on port {}".format(CALIBRATION_PORT))
    await uasyncio.gather(sensor_loop(), server.wait_closed())


uasyncio.run(main())
