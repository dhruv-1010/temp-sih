const express= require('express')
const app= express() ;
const mongoose= require('mongoose');
const path= require('path')
const methodOverride= require('method-override')
const BusDetails = require('./models/BusDetailDB');
const bcrypt=require("bcrypt");
const { Int32 } = require('bson');
const Schema = mongoose.Schema;
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/UserDB')
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const LocationDB = require('./models/LocationDB')
app.use(express.static(path.join(__dirname, '/public')));
const cors = require('cors'); // Import the cors package


// body parser
app.use(express.urlencoded({ extended: true })); //for form data
app.use(methodOverride('_method'));

let configSesion = {
    secret: 'SIH',
    resave: false,
    saveUninitialized: true,
}
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // You can add other CORS headers and middleware settings as needed
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  
  // Handling OPTIONS requests in Node.js
  app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
  });
// Allow all origins (for development/testing; restrict in production)
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Use the cors middleware with Express
app.use(session(configSesion));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

passport.use(new LocalStrategy(User.authenticate()));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))

// mongoose.connect('mongodb+srv://dhruvsingh235443:BFMX2t0GxU6eEWkq@cluster0.sfxysuk.mongodb.net/?retryWrites=true&w=majority')/
// 'mongodb://127.0.0.1:27017/BusDB'
mongoose.connect('mongodb+srv://dhruvsingh235443:PG4kz8AQuQayXjxD@cluster0.gqx0wn1.mongodb.net/?retryWrites=true&w=majority').
then(()=>{
        console.log('DB connected local')
    })
    .catch((err)=>{
        console.log('Ye ni chal rha ') 
})
// t1VAf70fOcOk887p
// mongodb+srv://dhruvsingh235443:<password>@cluster0.sfxysuk.mongodb.net/?retryWrites=true&w=majority
// const User = require('./models/UserDB');
const BusDetailDB = mongoose.model("BusDetailDB",BusDetails);

//<------ SocketIO CODE FROM HERE ---->
const server = http.createServer(app);
const io = socketIo(server);

const userSubscriptions = {};
io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('subscribeToBus', (BusNo) => {
    userSubscriptions[socket.id] = BusNo;
    console.log(`User ${socket.id} subscribed to Bus No. ${BusNo}`);
  });

  // Listen for bus location updates from the client
  socket.on('busLocationUpdate', (data) => {
    const { busNo, latitude, longitude , speed, timestamp} = data;
	console.log(busNo,latitude,longitude,speed,timestamp);
// LocationDB.findOne({ BusNo: BusNo }, (err, existingLocation) => {
  // if (err) {
    // console.error('Error querying the database:', err);
  // } else if (existingLocation) {
    // existingLocation.latitude = latitude;
    // existingLocation.longitude = longitude;
    // existingLocation.save()
      // .then(() => {
        // console.log(`Location data for Bus No. ${BusNo} updated.`);
      // })
      // .catch((error) => {
        // console.error('Error updating location data:', error);
      // });
  // } else {
	// console.log({BusNo,latitude,longitude});
    // const locationData = new LocationDB({ BusNo, latitude, longitude });
    // locationData.save()
      // .then(() => {
        // console.log(`Location data for Bus No. ${BusNo} saved.`);
      // })
      // .catch((error) => {
        // console.error('Error saving location data:', error);
      // });
  // }
// });

    Object.keys(userSubscriptions).forEach((userId) => {
      if (userSubscriptions[userId] === busNo) {
        io.to(userId).emit('busLocationUpdate', { busNo, latitude, longitude });
      }
    });
  });

  socket.on('disconnect', () => {
    delete userSubscriptions[socket.id];
    console.log('A user disconnected.');
  });
});

// user-client signup and usage
app.get('/signup', (req, res)=>{
    res.render('signup')
})
app.post("/signup", async (req, res) => {
  let { username, mobileno, age, email, password } = req.body;
    // const user = new User({ email, username });
    try{
	const newUser = await User.register({username:username,mobileno:mobileno,age:age,email:email}, password);
    res.redirect('/login');
    console.log('User registered successfully');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Error registering user');
  }
});

app.get('/login', (req, res) => {
    res.render('login');
})
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login'
}),
    function (req, res) {
        res.redirect('/home');
    })
app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});
//USER LOGIN END
// Login route for bus drivers
app.get('/auth/busLogin',(req,res)=>{
	res.render('busLogin');
})

app.post('/auth/busLogin', async (req, res) => {
    const { BusNo, password } = req.body;

    try {
        const bus = await BusDetailDB.findOne({ BusNo: BusNo }).exec();

        if (!bus) {
            const msg = {
                "message": "Incorrect Login",
                "error": "Please input correct Bus Number"
            };
						console.log('this ran with error no bus !!!');

            // return res.redirect('/busLogin', { msg });
			return res.status(404).send('error aya bus nhi mili bc')
        }
		
        if (password === bus.password) {
            bus.isLoggedIn = true;
            await bus.save();
			console.log('this ran !!!');
            // Redirect or respond with a success message
            return res.redirect(`/dashBoard/search?busId=${bus._id}`);
        } else {
            // Incorrect password
            const msg = {
                "message": "Incorrect Password",
                "error": "Please input correct Password"
            };
						console.log('this ran with error !!!');

            // return res.redirect('/busLogin', { msg });
						return res.status(404).send('error aya password nhi mili bc')

        }
    } catch (error) {
        console.error('An error occurred:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/android/busLogin', async (req, res) => {
    const { BusNo, password } = req.query;

    try {
        const bus = await BusDetailDB.findOne({ BusNo: BusNo }).exec();

        if (!bus) {
            const msg = {
                "message": "Incorrect Login",
                "error": "Please input correct Bus Number"
            };
						console.log('this ran with error no bus !!!');

            // return res.redirect('/busLogin', { msg });
			return res.status(404).send('error aya bus nhi mili bc')
        }
		
        if (password === bus.password) {
            bus.isLoggedIn = true;
            await bus.save();
			console.log('this ran !!!');
			let obj = { ...bus.toObject() };
			delete obj.password;
			return res.status(200).json({obj});
        } else {
            // Incorrect password
            const msg = {
                "message": "Incorrect Password",
                "error": "Please input correct Password"
            };
						console.log('this ran with error !!!');

            // return res.redirect('/busLogin', { msg });
						return res.status(404).send('error aya password nhi mili bc')

        }
    } catch (error) {
        console.error('An error occurred:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/auth/busLogout/:id', async (req, res) => {
    const BusId = req.params.id;

    try {
        // Assuming BusDetailDB is your Mongoose model
        const bus = await BusDetailDB.findById(BusId);

        if (!bus) {
            return res.status(401).json({ message: 'Bus not found' });
        }

        bus.isLoggedIn = false;

        await bus.save();

        return res.redirect('/auth/busLogin'); // Make sure the route is correct
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// BUS LOGIN END
// MongoDB Connection


app.get('/home', (req, res) => {
  const existingUser = req.user;
  res.render('search', { existingUser });
});

app.post('/home', async (req, res) => {
    const search = req.body.search;
    const destination = req.body.destination;

    try {
		   const searchRegex = new RegExp(search, 'i'); // 'i' flag for case-insensitive search
    const destinationRegex = new RegExp(destination, 'i');

    let resultsUn = await BusDetailDB.find({
        $and: [
            { 'busStops.address': { $regex: searchRegex } },
            { 'busStops.address': { $regex: destinationRegex } }
        ]
    })
		let results = resultsUn.map((busDetail) => {
            let sanitizedBusDetail = { ...busDetail.toObject() };
            delete sanitizedBusDetail.password;
            return sanitizedBusDetail;
        });
        console.log(results);

        res.render("bus", { results });
    } catch (err) {
        console.error('Error searching bus details:', err);
        // Handle the error
        res.status(500).send('Error searching bus details');
    }
});
app.get('/api/bus', async (req, res) => {
    const search = req.query.search;
    const destination = req.query.destination;

    try {
		
		   const searchRegex = new RegExp(search, 'i'); // 'i' flag for case-insensitive search
    const destinationRegex = new RegExp(destination, 'i');
        const results = await BusDetailDB.find({
            $and: [
                { 'busStops.address': searchRegex },
                { 'busStops.address': destinationRegex }
            ]
        });

        // Now 'results' contains documents where both 'search' and 'destination' are present in 'busStops'
        console.log("some one run this");

        // Return the results as JSON
        res.status(200).json({ results });
    } catch (err) {
        console.error('Error searching bus details:', err);
        // Handle the error
        res.status(500).json({ error: 'Error searching bus details' });
    }
});

// const dummyData = {
		
// }
const dummyBusData = {
    BusNo: "UP80DSXXX3",
    DriverName: "Abhishek Sharma",
    ConductorName: "Dev Sharma",
    ConductorMobile: 8111111111,
    isLoggedIn: false,
    SeatsAvailable: 50,
    fuelType: "Petrol",
    password: "123456@",
    busStops: [
        {
            address: "St. Johns Crossing Agra",
            coOrdinates: { longitude: 27.192391, latitude: 78.000842 }
        },
        {
            address: "Hariparwat Crossing Agra",
            coOrdinates: { longitude: 27.196590, latitude: 78.001915 }
        },
        {
            address: "Sursadan Crossing Agra",
            coOrdinates: { longitude: 27.202545, latitude: 78.004704 }
        },
		{
			address:"District Court , Agra",
			coOrdinates : { longitude:27.207049, latitude:78.003460 }
		},
        {
            address: "Bhawagan Talkies Crossing Agra",
            coOrdinates: { longitude: 27.211008, latitude: 78.004661 }
        },
        {
            address: "ISBT Agra",
            coOrdinates: { longitude: 27.209520, latitude: 77.979320 }
        },
        {
            address: "Sikandra Crossing Agra",
            coOrdinates: { longitude: 27.215660, latitude: 77.950265 }
        },
        {
            address: "Farah (On NATIONAL HIGHWAY)",
            coOrdinates: { longitude: 27.323048, latitude: 77.758451 }
        },
        {
            address: "GLA University",
            coOrdinates: { longitude: 27.605001, latitude: 77.592165 }
        }
    ]
};

// BusDetailDB.create(dummyBusData);


        // res.status(200).json({results});


app.get('/api/map/:id',async (req,res)=>{
	let {id} = req.params;
	let objUh = await BusDetailDB.findById(id);
	let obj = { ...objUh.toObject() };
    delete obj.password;
	res.status(200).json({obj});
})

app.get('/map/show/:id',async (req,res)=>{
 	let {id} = req.params;
	let objUh = await BusDetailDB.findById(id);
	let obj = { ...objUh.toObject() };
    delete obj.password;
	res.render('map',{obj});
});
//dashboard -- route
app.get('/dashboard/search',async (req,res)=>{
	let busId = req.query.busId;
	console.log(busId);
        let objUh = await BusDetailDB.findById(busId);
	let obj = { ...objUh.toObject() };
    delete obj.password;
	res.render('dashBoard',{obj});
})
const port = 8080 || 8000;
server.listen(port,(req,res)=>{
    console.log("connected succesfully")
})
