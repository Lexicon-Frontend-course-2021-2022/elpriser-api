'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 1337;
const Request = require('request');
const dayjs = require('dayjs');

app.use(express.json());

// Root url '/'
app.get('/today', (req, res) => {

  const now = new Date(Date.now());

  const api_data = {
    areas: {
      SE1: { hourly: [] },
      SE2: { hourly: [] },
      SE3: { hourly: [] },
      SE4: { hourly: [] },
    }
  };

  const endDate = dayjs(now).format('DD-MM-YYYY');
  Request.get(
    `http://www.nordpoolspot.com/api/marketdata/page/29?currency=SEK,SEK,SEK&endDate=${endDate}`,
    (error, result, body) => {

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
      res.set('Access-Control-Allow-Origin', '*').json({
        result: 'success',
        data: {
          date: dayjs(now).format('YYYY-MM-DD'),
          hours: api_data.areas.SE1.hourly.length,
          unit: 'öre/kWh',
          ...api_data
        }
      });

    })
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

