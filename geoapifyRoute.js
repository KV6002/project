import fetch from 'node-fetch';
var requestOptions = {
  method: 'GET',
};

fetch("https://api.geoapify.com/v1/routing?waypoints=50.96209827745463%2C4.414458883409225%7C50.429137079078345%2C5.00088081232559&mode=drive&apiKey=6e8dbb26e95e4992baa404893d4d2892", requestOptions)
  .then(response => response.json())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));