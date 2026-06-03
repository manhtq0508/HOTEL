// events/eventBus.js
const EventEmitter = require('events');
const eventBus = new EventEmitter();

// Tên các sự kiện — đặt constant để tránh typo
eventBus.BOOKING_CHECKED_IN  = 'BOOKING_CHECKED_IN';
eventBus.BOOKING_CHECKED_OUT = 'BOOKING_CHECKED_OUT';
eventBus.BOOKING_CANCELLED   = 'BOOKING_CANCELLED';

module.exports = eventBus;