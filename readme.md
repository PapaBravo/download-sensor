# Sensor Downloader

Downloads all available data for a given sensor id from https://sensor.community/en/

It saves all results locally in `result.csv` and only downloads new data in subsequent runs.

## Install

You need NodeJS >= 12

```
npm install
```

You should change `SENSOR_ID` to your own sensor and change the `SENSOR_TYPE` if necessary.

## Run

```
npm start
```