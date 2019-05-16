'use strict';

const fetch = require('node-fetch');
const AWS = require('aws-sdk');

const cloudWatch = new AWS.CloudWatch();

const checkWebsite = async (name, url) => {
  const start = new Date();
  var data = {
    name: name,
    statusCode: 1000,
    duration: 0
  };
  
  try {
    const result = await fetch(url, { timeout: 10000 });  
    data.statusCode = result.status;
    data.duration = new Date - start;

    return data;
  } catch (err) {
    console.error(err);
  }  
}

const pushMetric = async (data) => {
  let params = {
    Namespace: 'Website-Watcher/HTTP',
    MetricData: [
      {
        MetricName: 'StatusCode',
        Dimensions: [
          {
            Name: 'Site',
            Value: data.name
          }
        ],     
        Timestamp: new Date(),   
        Unit: 'None',
        Value: data.statusCode
      },
      {
        MetricName: 'Duration',
        Dimensions: [
          {
            Name: 'Site',
            Value: data.name
          }
        ],
        Unit: 'Milliseconds',
        Value: data.duration
      }
    ]
  };

  cloudWatch.putMetricData(params, (err, data) => {
    if (err) console.log(err, err.stack);
    else console.log(`Logged metrics in CloudWatch at: ${params.Namespace}`);
  });
}

exports.handler = async (evt) => {  
  var promises = [];
  evt.sites.forEach(site => {
    promises.push(checkWebsite(site.name, site.url).then(data => pushMetric(data)));
  });

  await Promise.all(promises);
  return 'Done';
};
