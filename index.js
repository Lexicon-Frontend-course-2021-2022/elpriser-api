'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 1337;
const Request = require('request');
const dayjs = require('dayjs');

app.use(express.json());

const baseUrl = 'http://www.nordpoolspot.com/api/marketdata/page/29'

// Root url '/'
app.get('/today', (req, res) => {

  const now = new Date(Date.now());

  const endDate = dayjs(now).format('DD-MM-YYYY');
  const url = baseUrl + '?currency=SEK,SEK,SEK&endDate=' + endDate
  const api_data = {
    date: dayjs(now).format('YYYY-MM-DD'),
    areas: {
      SE1: {
        min: null,
        max: null,
        mean: null,
        hourly: []
      },
      SE2: {
        min: null,
        max: null,
        mean: null,
        hourly: []
      },
      SE3: {
        min: null,
        max: null,
        mean: null,
        hourly: []
      },
      SE4: {
        min: null,
        max: null,
        mean: null,
        hourly: []
      },
    }
  };

  Request.get(url, (error, result, body) => {

    if (error) {
      throw error;
    }

    const data = JSON.parse(body)["data"]["Rows"];

    const out = [];
    let hour = 0;

    data.map(item => {

      item.Columns.map(area => {

        const value = (parseFloat(area.Value.replace(',', '.').replace(' ', '')) / 10).toFixed(2)
        if (!item.IsExtraRow) {
          api_data.areas[area.Name].hourly.push(value);
        } else {
          if (item.Name === 'Max') {
            api_data.areas[area.Name].max = value;
          }
          if (item.Name === 'Min') {
            api_data.areas[area.Name].min = value;
          }
          if (item.Name === 'Average') {
            api_data.areas[area.Name].mean = value;
          }
        }
      })

    });
    res.json({
      result: 'success',
      data: {
        hours: api_data.areas.SE1.hourly.length,
        ...api_data
      }
    });

  })
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

