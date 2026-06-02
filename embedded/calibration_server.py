import json

import machine
import uasyncio

_adc: machine.ADC | None = None
_connected: bool = False
cal: dict[str, int] = {"adc_dry": 65535, "adc_wet": 23765}


def init(adc: machine.ADC, default_dry: int, default_wet: int):
    global _adc
    _adc = adc
    cal["adc_dry"] = default_dry
    cal["adc_wet"] = default_wet
    _load_calibration()


def _load_calibration():
    try:
        with open("calibration.json") as f:
            data = json.load(f)
            cal["adc_dry"] = data.get("adc_dry", cal["adc_dry"])
            cal["adc_wet"] = data.get("adc_wet", cal["adc_wet"])
        print(
            "Loaded calibration: dry={} wet={}".format(cal["adc_dry"], cal["adc_wet"])
        )
    except Exception:
        pass


def _save_calibration():
    try:
        with open("calibration.json", "w") as f:
            json.dump({"adc_dry": cal["adc_dry"], "adc_wet": cal["adc_wet"]}, f)
    except Exception as e:
        print("Save calibration failed:", e)


def compute_moisture(raw: int) -> float:
    dry = cal["adc_dry"]
    wet = cal["adc_wet"]
    if dry == wet:
        return 0.0
    level = (dry - raw) / (dry - wet) * 100
    return max(0.0, min(100.0, level))


async def handle_client(reader, writer):
    global _connected
    if _connected:
        writer.close()
        await writer.wait_closed()
        return
    _connected = True
    print("Calibration client connected")
    try:
        while True:
            try:
                line = await uasyncio.wait_for(reader.readline(), timeout=0.1)
                if line:
                    try:
                        msg = json.loads(line)
                        if "adc_dry" in msg:
                            cal["adc_dry"] = int(msg["adc_dry"])
                        if "adc_wet" in msg:
                            cal["adc_wet"] = int(msg["adc_wet"])
                        _save_calibration()
                        print(
                            "Calibration updated: dry={} wet={}".format(
                                cal["adc_dry"], cal["adc_wet"]
                            )
                        )
                    except Exception as e:
                        print("Parse error:", e)
            except uasyncio.TimeoutError:
                pass

            assert _adc is not None
            raw = _adc.read_u16()
            moisture = compute_moisture(raw)
            payload = json.dumps(
                {
                    "raw": raw,
                    "moisture": round(moisture, 1),
                    "adc_dry": cal["adc_dry"],
                    "adc_wet": cal["adc_wet"],
                }
            )
            writer.write((payload + "\n").encode())
            await writer.drain()
            await uasyncio.sleep(1)
    except Exception as e:
        print("Calibration client error:", e)
    finally:
        _connected = False
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass
        print("Calibration client disconnected")
