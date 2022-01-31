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
  Request.get(url, (error, result, body) => {

    if (error) {
      throw error;
    }

    const data = JSON.parse(body)["data"]["Rows"];

    const out = [];
    let hour = 0;

    data.map(item => {
      if (!item.IsExtraRow) {
        const t = {
          hour: hour++,
          prices: {}
        }
        item.Columns.map(area => {
          t.prices[area.Name] = (parseFloat(area.Value.replace(',', '.')) / 10).toFixed(2)
        })
        out.push(t)
      }

    });
    res.json({
      result: 'success',
      data: out
    });

  })
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

