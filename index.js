'use strict';

const express = require('express');
const cors = require('cors');
const endpoints = require('express-endpoints');
const gracefulShutdown = require('http-graceful-shutdown');
const agent = require('multiagent');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();

// Define some default values if not set in environment
const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT = process.env.SHUTDOWN_TIMEOUT || 10000;
const SERVICE_CHECK_HTTP = process.env.SERVICE_CHECK_HTTP || '/healthcheck';
const SERVICE_ENDPOINTS = process.env.SERVICE_ENDPOINTS || '/endpoints';
const DISCOVERY_SERVERS = process.env.DISCOVERY_SERVERS
  ? process.env.DISCOVERY_SERVERS.split(',')
  : ['http://???.???.???.001:8500', 'http://???.???.???.002:8500', 'http://???.???.???.003:8500'];

// Create a new express app
const app = express();

// Add CORS headers
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add health check endpoint
app.get(SERVICE_CHECK_HTTP, (req, res) => res.send({ uptime: process.uptime() }));

// Add metadata endpoint
app.get(SERVICE_ENDPOINTS, endpoints());

              // Add all other service routes
              // app.get('/superstars', (req, res) => {
              //   res.send([
              //     'Scarlett Johansson',
              //     'Leonardo DiCaprio',
              //     'Jennifer Lawrence',
              //     'Ashton Kutcher',
              //     'Kate Beckinsale',
              //     'Robert Downey Jr.'
              //   ]);
              // });

// // POST /carts{/:cartId}

// // Request:
// {
//   products: [{
//     productId: 'abc',
//     quantity: 1,
//     title: 'Foobar',
//     price: 12.56 
//   }]
// }

// // Response:
// {
//   cartId: '375cffch9g8w4hz',
//   products: [{
//     productId: 'abc',
//     quantity: 1,
//     title: 'Foobar',
//     price: 12.56 
//   }]
// }


app.post('/carts', function (req, res) {
  // console.log(req.body);
  // console.log(req.body.products);
  
  // Generate a v1 (time-based) id 
  const newCartId = uuid.v1();
  // console.log('uuid: ' + newCartId);
   
  let calculatedPrice = 0;
  let products = req.body.products;
  
  for (let product of products) {
    calculatedPrice = calculatedPrice + product.price;
  }
  
  let cart = {
    cartId: newCartId,
    products: products,
    summary: calculatedPrice
  };
  
  res.send(JSON.stringify(cart));
});

// Start the server
const server = app.listen(PORT, () => console.log(`Service listening on port ${PORT} ...`));

// Enable graceful server shutdown when process is terminated
gracefulShutdown(server, { timeout: SHUTDOWN_TIMEOUT });



// This is how you would use the discovery
// client to talk to other services:
//
// const client = agent.client({
//   discovery: 'consul',
//   discoveryServers: DISCOVERY_SERVERS,
//   serviceName: 'some-service'
// });

// client
//   .get('/healthcheck')
//   .then(res => console.log(res.body))
//   .catch(err => console.log(err));
