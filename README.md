# node-red-contrib-airthings

Node-RED nodes for the [Airthings Consumer API](https://consumer-api-doc.airthings.com/) — poll air quality sensor readings and control the Renew air purifier, all from your Node-RED flows.

## Nodes

| Node | Description |
|------|-------------|
| **airthings-config** | Shared credentials (Client ID + Secret) |
| **airthings-sensors** | Fetch latest sensor readings from your devices |
| **airthings-devices** | List all devices connected to your account |
| **airthings-renew-get** | Get the current mode of a Renew air purifier |
| **airthings-renew-set** | Set the mode of a Renew air purifier |

## Setup

### 1. Create an API client

Go to [consumer-api-doc.airthings.com/dashboard](https://consumer-api-doc.airthings.com/dashboard) and create an OAuth client. Copy the **Client ID** and **Client Secret**.

### 2. Add the config node

In Node-RED, add an **airthings-config** node and enter your Client ID and Client Secret. Account ID is optional — it will be auto-detected from your account.

### 3. Add nodes to your flow

All nodes take any input message as a trigger. Sensor data and device state are returned on `msg.payload`.

## Node reference

### airthings-sensors

Fetches the latest readings from one or more devices.

**Inputs**

| Property | Type | Description |
|----------|------|-------------|
| `payload` | any | Triggers a fetch |
| `unit` _(optional)_ | string | `"metric"` (default) or `"imperial"` |
| `serialNumbers` _(optional)_ | string[] | Filter to specific devices; overrides node setting |

**Output** — `msg.payload`:
```json
{
  "results": [
    {
      "serialNumber": "4200012345",
      "recorded": "2025-01-15T08:00:00Z",
      "batteryPercentage": 82,
      "sensors": [
        { "sensorType": "co2", "value": 612, "unit": "ppm" },
        { "sensorType": "humidity", "value": 43, "unit": "%" },
        { "sensorType": "pm25", "value": 3.1, "unit": "µg/m³" }
      ]
    }
  ],
  "hasNext": false,
  "totalPages": 1
}
```

### airthings-devices

Lists all devices on the account, including their sensor capabilities. Useful for discovering serial numbers.

**Output** — `msg.payload`:
```json
{
  "devices": [
    {
      "serialNumber": "4200012345",
      "name": "Living Room",
      "type": "WAVE_PLUS",
      "home": "Home",
      "sensors": ["co2", "humidity", "pressure", "radon", "temp", "voc"]
    }
  ]
}
```

### airthings-renew-get

Gets the last reported mode of a **Renew (AP_1)** air purifier.

**Input** — set `msg.serialNumber` to override the node's configured serial number.

**Output** — `msg.payload`:
```json
{ "mode": "AUTO" }
{ "mode": "MANUAL", "fanSpeed": 3 }
```

### airthings-renew-set

Sets the operational mode of a **Renew (AP_1)** air purifier. The command is forwarded asynchronously — use **airthings-renew-get** to confirm the device has applied it.

**Input** — `msg.payload` can be:
- A mode string: `"AUTO"`, `"OFF"`, `"SLEEP"`, `"BOOST"`, or `"MANUAL"`
- An object: `{ "mode": "MANUAL", "fanSpeed": 3 }` (fanSpeed 1–5 required for MANUAL)

Set `msg.serialNumber` to override the node's configured serial number.

| Mode | Description |
|------|-------------|
| `OFF` | Turn off |
| `AUTO` | Automatic — adjusts speed based on built-in PM sensor |
| `SLEEP` | Quiet low speed for 8 hours (23 dB) |
| `BOOST` | Maximum speed for 60 minutes |
| `MANUAL` | Fixed fan speed — set `fanSpeed` 1 (quietest) to 5 (highest) |

**Output** — `msg.payload` echoes the applied command:
```json
{ "mode": "MANUAL", "fanSpeed": 3 }
```

## Example flow

```json
[{"id":"inject1","type":"inject","z":"flow1","name":"Poll every 5 min","repeat":"300","once":true,"wires":[["sensors1"]]},{"id":"sensors1","type":"airthings-sensors","z":"flow1","name":"","configNode":"config1","unit":"metric","serialNumbers":"","wires":[["debug1"]]},{"id":"debug1","type":"debug","z":"flow1","name":"Sensor data","active":true,"wires":[]},{"id":"config1","type":"airthings-config","name":"Airthings"}]
```

Import this into Node-RED via **Menu → Import**, then open the config node to enter your credentials.

## Requirements

- Node.js 14 or later
- Node-RED 2.0 or later

## License

MIT

---

## Support this project

I built and maintain this as a personal project in my own time. If it's useful to you and you'd like to help keep it alive, a coffee goes a long way — it's the most direct way to support independent open-source work like this.

**[☕ Buy me a coffee](https://buymeacoffee.com/airdavid)**

Bug reports, feature requests, and pull requests are all welcome on [GitHub](https://github.com/devdavidkarlsson/node-red-contrib-airthings).
