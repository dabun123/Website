//Imports
import fs from 'fs';
import url from 'url';
import http from 'http';
import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from "express-session";

const app = express();

//Variables
let currentUser = "";
let events = [];
let globalUsers = [];
let globalDocuments = [];

//Neccessary Express stuff
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.use(express.urlencoded({extended:true}));

app.use(session({
    secret: 'some secret here',
    resave: true,
    saveUninitialized: true
}));

app.set('view engine', 'pug'); 
app.set('views', "./views");

app.use((req, res, next) => {
	next();
})


//ROUTES
//Get Routes
app.get('/', (req, res) => {
	req.session.loggedin = false;
	req.session.username = undefined;
	res.render('pages/accountReg', {});

});
app.get('/homePage', (req, res) => {
	
	res.render('pages/artworks', {data:globalDocuments});

});
app.get('/login', (req, res) => {
	res.render('pages/login', {});

});
app.get('/artworks', (req, res) => {
	res.render('pages/artworks', {data:globalDocuments});
	
});
app.get('/workshop', (req, res) => {
	res.render('pages/workshop', {events});
	
});
//Add's Liked Artworks to the profile
app.get('/profile', (req, res) => {
	const userInfo = getUserByUsername(currentUser);

	const likedArtworks = [];
	if(userInfo.Likes && userInfo){
		for (let x = 0; x < userInfo.Likes.length; x++) {
			const artworkId = userInfo.Likes[x];
			const likedArtwork = findArtworkById(artworkId);
	
			if (likedArtwork) {
				likedArtworks.push(likedArtwork);
			}
		}
	}

	res.render('pages/profile', {data: userInfo, likedArt: likedArtworks});
	
});
//Search request
app.get('/search', (req, res) => {
	try {
	  const { title, artist, category } = req.query;
  
	  //Search request for the artworks
	  const filteredArtworks = globalDocuments
		.flat() 
		.filter((artwork) => {
		  return (
			(!title || artwork.Title.toLowerCase().includes(title.toLowerCase())) &&
			(!artist || artwork.Artist.toLowerCase().includes(artist.toLowerCase())) &&
			(!category || artwork.Category.toLowerCase().includes(category.toLowerCase()))
		  );
		});

	  res.render('pages/search', { data: filteredArtworks });
	} catch (error) {
	  console.error(error);
	  res.status(500).send('Internal Server Error');
	}
  });
  
  //User account create based off registration
  app.post('/users', async (req, res) => {
	let reqName = req.body.name;
	let reqPass = req.body.password;
	let reqBirth = req.body.birthday;

	if (req.session.loggedin || req.session.username == reqName || reqName == currentUser) {
        res.status(401).send("Unauthorized");
        return;
    }

	req.session.loggedin = true;
	req.session.username = reqName;

	// If any of these values are empty
	if (!reqName || !reqPass) {
	  res.status(400).send('Failed');
	} else {
	  const newUser = {
		Username: reqName,
		Password: reqPass,
		DOB: reqBirth || '', 
	  };
	  currentUser = reqName;
	  //Creating the user 
	  try {
		const user = await User.create(newUser);
		globalUsers.push(user);
  
		res.send(newUser);
	  } catch (error) {
		console.error('Error creating user:', error);
		res.status(500).send('Internal Server Error');
	  }
	}
  });

  app.post('/userInfo', async (req, res) => {
    try {
        console.log(req.body);
        const username = req.body.name;
        const password = req.body.password;

		//Find user
        const user = await User.findOne({ Username: username, Password: password });

        if (user) {
			currentUser = username;
            res.send(true);
        } else {
            res.send(false);
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
//Post artwork
  app.post('/post-artwork', async (req, res) => {
	const title = req.body.title;
	const artist = req.body.artist;
	const year = req.body.year;
	const category = req.body.category;
	const medium = req.body.medium;
	const description = req.body.description;
	const poster = req.body.poster; 
	console.log(req.body);
	try {
	
	  const artwork ={
		Title: title,
		Artist: artist,
		Year: year,
		Category: category,
		Medium: medium,
		Description: description,
		Poster: poster,
	  };
	  //Create in mongoose and globalDocuments
	  const prod = await Product.create(artwork);
	  globalDocuments[0].push(artwork);
	  console.log(globalDocuments);
	  res.json({ message: 'Artwork posted successfully!', globalDocuments });
	} catch (error) {
	  console.error('Error posting artwork:', error);
	  res.status(500).json({ error: 'Internal Server Error' });
	}
  });
//Renders the single artwork
app.get('/artwork/:artworkId', (req, res) => {
	const artworkId = req.params.artworkId;
	const artwork = findArtworkById(artworkId);
	res.render('pages/art', { artwork });
});

//Like route
app.get('/artwork/:artworkId/processLike', async (req, res) => {
    const artworkId = req.params.artworkId;
    const artwork = findArtworkById(artworkId);
    const user = getUserByUsername(currentUser);

    // Check if the user has already liked the artwork
    const hasLiked = user.Likes.includes(artworkId);

    if (!hasLiked) {
        user.Likes.push(artworkId);
        await user.save();
    
        artwork.Likes++;
        console.log(user);
    }

    res.render('pages/art', { artwork });
});
//Unlike
app.get('/artwork/:artworkId/processUnlike', async (req, res) => {
    const artworkId = req.params.artworkId;
    const artwork = findArtworkById(artworkId);
    const user = getUserByUsername(currentUser);

    // Check if the user has already liked the artwork
    const hasLiked = user.Likes.includes(artworkId);

    if (hasLiked) {
        user.Likes.pop(artworkId);
        await user.save();
        
        artwork.Likes--;
        console.log(user);
    }

    res.render('pages/art', { artwork });
});

//Add reviews to each artwork
app.post('/artwork/:artworkId/review', async (req, res) => {
	const artworkId = req.params.artworkId;
	const artwork = findArtworkById(artworkId);
	const reviewContent = req.body.reviewContent;
  
	artwork.Reviews.push(reviewContent);
	res.render('pages/art', { artwork });
  });

  //Create a new event
  app.post('/createEvent', async(req,res) => {
		console.log(req.body);
		const eventName = req.body.name;
		const eventDate = req.body.date;
		const eventDescription = req.body.description;
		
		const eventDetails = {
			name: eventName,
			date: eventDate,
			description: eventDescription,
		}
		events.push(eventDetails);
		
		res.render('pages/workshop', {events});
		
  });
  
  //Follow
  app.get('/artwork/:artworkId/follow', async (req, res) => {
  
	const artworkId = req.params.artworkId;
	const artwork = findArtworkById(artworkId);
	const user = getUserByUsername(currentUser);

	const update = await User.findOne({Username: currentUser});
	if(update){
		if (!user.Following.includes(artwork.Artist)) {
			user.Following.push(artwork.Artist);
			await user.save();
			console.log(`${currentUser} is now following ${artwork.Artist}`);
		  } else {
			console.log(`${currentUser} is already following ${artwork.Artist}`);
		  }
	}
	console.log(user);
	res.render('pages/art', {artwork});
  });

//If artwork matches the id
function findArtworkById(artworkId) {
	return globalDocuments.flat().find(artwork => String(artwork._id) === artworkId);
}
//Returns user by name
function getUserByUsername(username) {
	return globalUsers.find(user => user.Username === username);
}

//Route to view more artworks
app.get('/more-artworks', (req, res) => {
  const remainingArtworks = globalDocuments; 
  res.render('pages/artworks', { data: remainingArtworks });
});

//Route to change Artist Type
app.get('/changeType', async(req, res) => {
	const update = await User.findOne({Username: currentUser});
	update.Artist = true;
	await update.save();
	res.send();
});
  


//Mongoose Connection
const Schema = mongoose.Schema;

//Schemas
let productSchema = new mongoose.Schema({
	Title: String,
	Artist: String,
	Year: String,
	Category: String,
	Medium: String,
	Description: String,
	Poster: String,
	Reviews: {
		type: Array,
		default: [], 
	  },
	Likes: {
	  type: Number,
	  default: 0, 
	},
  }, {
	strict: false, 
  });

let userSchema = Schema({
	Username: String,
	Password: String,
	DOB: String,
	Artist: Boolean,
	ArtworkArr: Array,
	Likes: Array,
	Reviews: Array,
	Following: Array,
	Followers: Array,
	Notifications: Array,
});



const port = 3144;
mongoose.connect('mongodb://127.0.0.1/gallery');
const Product = mongoose.model('galleryCollection', productSchema);
const User = mongoose.model('userCollection', userSchema);

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));



db.once('open', async function () {
  // The Gallery Json uploaded into Global Documents
  const documents = await Product.find();
  globalDocuments.push(documents);

  // Processed Names
  const processedUsernames = new Set();
  const userCreationPromises = documents.map(async (document) => {
    // Create User Object
    const existingUser = await User.findOne({ Username: document.Artist });

    // Check if username already exists or if it is a new user
    if (!existingUser && !processedUsernames.has(document.Artist)) {
      // Add unique username
      processedUsernames.add(document.Artist);

      // Create a new user
      const newUser = {
        Username: document.Artist,
        Password: 'yourPassword',
        DOB: 'yourDateOfBirth',
		Artist: false,
        ArtworkArr: [], // Initialize with an empty array
		Likes: [],
		Reviews: [],
		Following: [],
		Followers: [],
		Notifications: [],
		Artist: false,
      };
	
      //Add the new user to globalUsers
      const user = await User.create(newUser);
    }
	

    //Push Artworks to the ID <3
    const userToUpdate = await User.findOne({ Username: document.Artist });
    if (userToUpdate) {
      userToUpdate.ArtworkArr.push(document._id);
      await userToUpdate.save();
    }
  });

  await Promise.all(userCreationPromises);
  app.listen(port);
  console.log('Server listening at http://localhost:' + port);

});






