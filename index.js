const axios = require('axios')
const fs = require('fs');
const readLastLines = require('read-last-lines');

const ARCHIVE_URL = 'https://archive.sensor.community/';
const SENSOR_ID = '22040';
const SENSOR_TYPE = 'sds011';
const RESULT_FILE_NAME = 'result.csv';

const header = 'sensor_id;sensor_type;location;lat;lon;timestamp;P1;durP1;ratioP1;P2;durP2;ratioP2';

function buildDataURL(day) {
    // https://archive.sensor.community/2020-04-12/2020-04-12_sds011_sensor_22040.csv
    return `${ARCHIVE_URL}${day}${day.slice(0, -1)}_${SENSOR_TYPE}_sensor_${SENSOR_ID}.csv`;
}

async function getDays() {
    const dayLineRegExp = /drwxr.*(\d{4}-\d{2}-\d{2})<\/a>/g;
    const response = await axios.get(ARCHIVE_URL);

    const matches = [...response.data.matchAll(dayLineRegExp)];
    return matches
        .map(m => m[1] + '/')
        .filter(s => s.startsWith('2019') || s.startsWith('2020'))
}

async function downloadDataFile(day) {
    try {
        const response = await axios.get(buildDataURL(day));
        // remove header
        const data = response.data.slice(response.data.indexOf('\n'));
        return data.trim() + '\n';
    } catch (e) {
        return null;
    }
}

async function getLatestDownload() {
    try {
        const lastLine = await readLastLines.read(RESULT_FILE_NAME, 1);
        const dayRegExp = /\d{4}-\d{2}-\d{2}/g;
        const match = dayRegExp.exec(lastLine);
        return match[0];
    } catch (err) {
        console.error(err);
    }
}

function filterDays(days, lastDay) {
    const lastExistingIndex = days.indexOf(lastDay + '/');
    if (lastExistingIndex >= 0) {
        return days.slice(lastExistingIndex + 1);
    }
    return days;
}

async function downloadSensorData() {
    console.log('Checking for old data');
    const lastDownload = await getLatestDownload();
    console.log('Latest download was', lastDownload);

    console.log('Getting days');
    let days = await getDays();

    let stream;
    if (lastDownload) {
        stream = fs.createWriteStream(RESULT_FILE_NAME, { flags: 'a' });
        days = filterDays(days, lastDownload)
    } else {
        stream = fs.createWriteStream(RESULT_FILE_NAME, { flags: 'w' });
        stream.write(header);
    }

    console.log('Starting to download data', days.length);
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