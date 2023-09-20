const mongoose = require('mongoose');
const busStopSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true
    },
    coOrdinates: {
        type: {
            longitude: Number,
            latitude: Number
        },
        required: true
    }
});

const BusDetails = new mongoose.Schema({
    BusNo: {
        type: String,
        required: true,
		unique:true
    },
    DriverName: {
        type: String,
        required: true
    },
    ConductorName: {
        type: String,
        required: true
    },
    ConductorMobile: {
        type : Number ,
        required: true 
    },
	isLoggedIn: {
		type:Boolean,
	},
    SeatsAvailable: {
        type: Number,
        required: true,
        min: 0,
        max: 60
    },
	fuelType:{
		type : String,
	},
	password: {
        type: String,
        trim:true,
		required:true
    },
    busStops: [busStopSchema]
});
module.exports = BusDetails;
