'use strict';
/* ============================================================================
 * Imports and red tape
 * ========================================================================= */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 1337;

const Request = require('request');
const dayjs = require('dayjs');

app.use(express.json());

/* ============================================================================
 * Endpoint /today
 * ========================================================================= */
app.get('/today', (req, res) => {

  // We want today's data
  const now = new Date(Date.now());

  // Skeleton object
  const api_data = {
    areas: {
      SE1: { hourly: [] },
      SE2: { hourly: [] },
      SE3: { hourly: [] },
      SE4: { hourly: [] },
    }
  };

  // Nordpool uses a stupid date format!
  const endDate = dayjs(now).format('DD-MM-YYYY');

  // get data from nordpool undocumented API
  Request.get(
    `http://www.nordpoolspot.com/api/marketdata/page/29?currency=SEK,SEK,SEK&endDate=${endDate}`,
    (error, _, body) => {

      // Bail if error
      if (error) {
        throw error;
      }

      // We only want this data.
      const data = JSON.parse(body)["data"]["Rows"];

      // For each column...
      data.map(item => {

        // ..get price data per area...
        item.Columns.map(area => {

          /* This is ugly, but source data uses spaces and commas... */
          const value = (parseFloat(area.Value.replace(',', '.').replace(' ', '')) / 10).toFixed(2)

          // ..and put it where it belongs
          if (!item.IsExtraRow) {
            // Hourly price data
            api_data.areas[area.Name].hourly.push(value);
          } else {
            // "special" data (min, max, average etc.)
            if (item.Name === 'Max') {
              api_data.areas[area.Name].max = value;
            } else if (item.Name === 'Min') {
              api_data.areas[area.Name].min = value;
            } else if (item.Name === 'Average') {
              api_data.areas[area.Name].mean = value;
            }
          }
        })

      });


      const new_object = {
        max: {
          SE1: api_data.areas.SE1.max,
          SE2: api_data.areas.SE2.max,
          SE3: api_data.areas.SE3.max,
          SE4: api_data.areas.SE4.max,
          scale: -999999999
        },
        min: {
          SE1: api_data.areas.SE1.min,
          SE2: api_data.areas.SE2.min,
          SE3: api_data.areas.SE3.min,
          SE4: api_data.areas.SE4.min,
          scale: 999999999
        },
        mean: {
          SE1: api_data.areas.SE1.mean,
          SE2: api_data.areas.SE2.mean,
          SE3: api_data.areas.SE3.mean,
          SE4: api_data.areas.SE4.mean,
        },
        hourly: []
      }

      let i = 0;
      for (i = 0; i < api_data.areas.SE1.hourly.length; i++) {
        const h = {
          hour: i,
          SE1: api_data.areas.SE1.hourly[i],
          SE2: api_data.areas.SE2.hourly[i],
          SE3: api_data.areas.SE3.hourly[i],
          SE4: api_data.areas.SE4.hourly[i],
        }
        new_object.hourly.push(h);
      }

      ['SE1', 'SE2', 'SE3', 'SE4'].forEach(area => {
        new_object.min.scale = new_object.min.scale < new_object.min[area] ? new_object.min.scale : new_object.min[area];
        new_object.max.scale = new_object.max.scale > new_object.max[area] ? new_object.max.scale : new_object.max[area];
      });


      // Return result
      res
        .set('Access-Control-Allow-Origin', '*') /* BUGFIX: CORS */
        .json({
          result: 'success',
          data: {
            date: dayjs(now).format('YYYY-MM-DD'),
            hours: api_data.areas.SE1.hourly.length,
            unit: 'öre/kWh',
            ...new_object,
          }
        });
    });
});


/* ============================================================================
 * Start API server
 * ========================================================================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

