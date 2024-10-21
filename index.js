// management-service.js
const express = require('express'); // Express framework for creating the REST API
const amqp = require('amqplib/callback_api'); // AMQP library for RabbitMQ
const cors = require('cors'); // Enable CORS
require('dotenv').config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

const orders = []; // In-memory store for orders

const RABBITMQ_CONNECTION_STRING = process.env.RABBITMQ_CONNECTION_STRING || 'amqp://localhost';
const PORT = process.env.PORT || 3000; // Management service runs on port 3000

// Function to consume messages from RabbitMQ
amqp.connect(RABBITMQ_CONNECTION_STRING, (err, conn) => {
  if (err) {
    console.error('Failed to connect to RabbitMQ:', err);
    process.exit(1);
  }
  conn.createChannel((err, channel) => {
    if (err) {
      console.error('Failed to create a RabbitMQ channel:', err);
      process.exit(1);
    }

    const queue = 'order_queue'; // Queue name from which to consume messages

    // Ensure the queue exists before consuming messages
    channel.assertQueue(queue, { durable: false });

    console.log(`Waiting for messages in ${queue}...`);

    // Consume messages from the queue
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const order = JSON.parse(msg.content.toString());
        orders.push(order); // Store order in memory
        console.log("Received order:", order);
      }
    }, { noAck: true }); // Automatic acknowledgment of messages
  });
});

// REST API to get all pending orders
app.get('/orders', (req, res) => {
  res.json(orders); // Return all pending orders
});

// Start the management service
app.listen(PORT, () => {
  console.log(`Management service is running on http://localhost:${PORT}`);
});
