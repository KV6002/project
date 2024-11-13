import fetch from 'node-fetch';

var myRouter = function (req, res) {
  var data = { "api": "/v1/geocode/reverse", "params": { "lang": "de", "limit": "3" }, "inputs": [{ "id": "optional-input-id1", "params": { "lat": "51.156397", "lon": "10.875491" } }] };
  var url = `https://api.geoapify.com/v1/batch?apiKey=6e8dbb26e95e4992baa404893d4d2892`;

  fetch(url, {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(getBodyAndStatus)
    .then((result) => {
      if (result.status !== 202) {
        res.json(result);
      } else {
        return getAsyncResult(`${url}&id=${result.body.id}`, 1000, 100).then(queryResult => {
          res.json(queryResult);
        });
      }
    })
    .catch(err => res.json(err));
}

function getBodyAndStatus(response) {
  return response.json().then(responceBody => {
    return {
      status: response.status,
      body: responceBody
    }
  });
}

function getAsyncResult(url, timeout, maxAttempt) {
  return new Promise((resolve, reject) => {
    // start monitoring after timeout
    setTimeout(() => {
      repeatUntilSuccess(resolve, reject, 0)
    }, timeout);
  });

  function repeatUntilSuccess(resolve, reject, attempt) {
    fetch(url)
      .then(getBodyAndStatus)
      .then(result => {
        if (result.status === 200) {
          resolve(result.body);
        } else if (attempt >= maxAttempt) {
          reject("Max amount of attempt achived");
        } else if (result.status === 202) {
            // Check again after timeout
          setTimeout(() => {
            repeatUntilSuccess(resolve, reject, attempt + 1)
          }, timeout);
        } else {
          // Something went wrong
          reject(result.body)
        }
      })
      .catch(err => reject(err));
  };
}
