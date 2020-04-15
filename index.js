const cheerio = require('cheerio');
const axios = require('axios')
const fs = require('fs');

const ARCHIVE_URL = 'http://archive.luftdaten.info/';
const SENSOR_ID = '22040';
const SENSOR_TYPE = 'sds011';
const header = 'sensor_id;sensor_type;location;lat;lon;timestamp;P1;durP1;ratioP1;P2;durP2;ratioP2';

function buildDataURL(day) {
    // http://archive.luftdaten.info/2020-04-12/2020-04-12_sds011_sensor_22040.csv

    return `${ARCHIVE_URL}${day}${day.slice(0, -1)}_${SENSOR_TYPE}_sensor_${SENSOR_ID}.csv`;
}

async function getDays() {
    const dayRegExp = /\d{4}-\d{2}-\d{2}\//g;
    const response = await axios.get(ARCHIVE_URL);
    const $ = cheerio.load(response.data);
    return $('tr>td>a')
        .map((i, el) => $(el).text())
        .get()
        .filter(s => s.match(dayRegExp))
        .filter(s => s.startsWith('2019'))
        ;
}

async function downloadDataFile(day) {
    try {
        const response = await axios.get(buildDataURL(day));
        // remove header
        const data = response.data.slice(response.data.indexOf('\n'));
        return data;
    } catch (e) {
        return null;
    }
}

async function downloadSensorData() {
    console.log('Starting to download data');
    const stream = fs.createWriteStream("result.csv", { flags: 'w' });

    const days = await getDays();

    stream.write(header);

    for (const day of days) {
        const dayData = await downloadDataFile(day);
        if (dayData) {
            stream.write(dayData)
            console.log('Written data for', day);
        } else {
            console.warn('No data for', day);
        }
    }
    stream.end();
}

downloadSensorData();