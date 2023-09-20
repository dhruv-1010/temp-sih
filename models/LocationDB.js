const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    BusNo: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    latitude: Number,
    longitude: Number,
});

const LocationDB = mongoose.model('LocationDB', LocationSchema);

module.exports = LocationDB;
