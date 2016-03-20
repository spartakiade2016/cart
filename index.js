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

let globalCarts = {}

// Add all other service routes
app.get('/carts/:cartId', (req, res) => {
  // console.log('params: ' + req.params);
  
  res.send(JSON.stringify(globalCarts[req.params.cartId]));
});

app.post('/carts', function (req, res) {
  // console.log(req.body);
  // console.log(req.body.products);
  
  // Generate a v1 (time-based) id 
  let cartId = uuid.v1();
  
  if (req.body.cartId) {
    cartId = req.body.cartId;
  }
   
  let calculatedPrice = 0;
  let products = req.body.products;
  
  for (let product of products) {
    calculatedPrice = calculatedPrice + (product.price * product.quantity);
  }
  
  let cart = {
    cartId: cartId,
    products: products,
    summary: calculatedPrice
  };
  globalCarts[req.body.cartId] = cart;
  
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
