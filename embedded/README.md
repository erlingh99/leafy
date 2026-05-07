# ESP32 Moisture Sensor

Reads soil moisture from a capacitive sensor and reports it to the Leafy backend.

## Wiring

| Sensor pin | ESP32 pin  |
|------------|------------|
| VCC        | 3.3V       |
| GND        | GND        |
| AOUT       | GPIO34     |

GPIO34 is an input-only pin with no pull-up/pull-down resistors — the safest choice for ADC on ESP32.

## Setup

### 1. Install dependencies

Flash MicroPython firmware onto the ESP32:
```
esptool.py --chip esp32 erase_flash
esptool.py --chip esp32 write_flash -z 0x1000 esp32-micropython.bin
```
Download the latest MicroPython firmware from https://micropython.org/download/esp32/

### 2. Configure

```
cp .env.example .env
```

Edit `.env` with your values:
- `WIFI_SSID` / `WIFI_PASSWORD` — your home network
- `SERVER_URL` — the address of your Leafy backend (e.g. `http://192.168.1.100:8000`)
- `SENSOR_ID` — a name you choose (e.g. `living-room-sensor`). Must match the Sensor ID set in the Leafy frontend for the plant you want to track.

Generate `config.py`:
```
python generate_config.py
```

### 3. Register the sensor in Leafy

Open the Leafy frontend, edit the plant you want to monitor, and enter the same `SENSOR_ID` in the "Sensor ID" field. Save the plant.

### 4. Upload to ESP32

Upload these files using `mpremote` or Thonny:
- `boot.py`
- `main.py`
- `config.py`

Do **not** upload `.env`, `.env.example`, or `generate_config.py` — these stay on your computer.

```
mpremote cp boot.py :boot.py
mpremote cp main.py :main.py
mpremote cp config.py :config.py
```

Reset the board. Open the serial console to verify it connects and reports readings.

## Calibration

The default calibration (`ADC_DRY=4095`, `ADC_WET=1000`) works for most common capacitive sensors (v1.2, v2.0). To calibrate for your specific sensor:

1. Hold the sensor in air — note the raw ADC value printed to serial. Set `ADC_DRY` to that value.
2. Submerge the sensor in a glass of water — note the value. Set `ADC_WET` to that value.
3. Re-run `python generate_config.py` and re-upload `config.py`.

## How it works

On boot, `boot.py` connects to WiFi. Then `main.py` loops:
1. Read ADC from the sensor
2. Convert raw value to a moisture percentage (0–100%)
3. POST to `SERVER_URL/api/moisture` with `{"sensor_id": "...", "level": 75.3}`
4. Sleep for `READING_INTERVAL_SECONDS` (default: 5 minutes)

The backend stores the last reading per sensor. The Leafy frontend shows it on the plant card with a color-coded badge (green = moist, amber = getting dry, red = dry).
