var express = require('express'),
  app = express(),
  server = app.listen(process.env.PORT || 3000),
  io = require('socket.io').listen(server),
	path = require('path'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	exphbs = require('express-handlebars'),
	expressValidator = require('express-validator'),
	flash = require('connect-flash'),
	session = require('express-session'),
  passport = require('passport'),
  db = require('./database/database'),
  index = require('./routes/index'),
  bcrypt = require('bcryptjs'),
  salt = bcrypt.genSaltSync(10);
 
var routes = index.router;
var users = require('./routes/users');

app.set('views', path.join(__dirname, 'views'));
app.engine('html', exphbs({defaultLayout: false, extname: '.html'}));
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
  errorFormatter: (param, msg, value) => {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

var roomno = 1;

io.on('connection', socket => {
  console.log("connected!");
  if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 1) {
    roomno++;
  }

   socket.nickname = index.currentUser.name;
   socket.join("room-"+roomno);

   io.sockets.in("room-"+roomno).emit('connectToRoom', "User connected!");

   socket.on('disconnect', () => {
    io.sockets.in("room-"+roomno).emit('disconnect', "User left!");
   });

   socket.on('chat message', msg => {
    io.sockets.in("room-"+roomno).emit('chat message', msg);

    var sender = socket.nickname;
    var currentRoom = io.sockets.adapter.rooms['room-'+roomno];
    var socketsInRoom = currentRoom.sockets;
    var recieverID = '';
    var reciever = '';
    for (socketID in socketsInRoom){
      if (socketID !== socket.id){
        recieverID = socketID;
        break;
      }
    }
    for (socketID in io.sockets.sockets){
      if (socketID === recieverID){
        reciever = io.sockets.sockets[socketID].nickname;
        break;
      }
    }
    var encryptedMsg = bcrypt.hashSync(msg, salt);
    var query = "INSERT INTO messages (sender, reciever, message) VALUES('" + 
	    sender + "', '" + reciever + "', '" + encryptedMsg + "')";
    db.query(query).spread((result, metadata) => {
		  console.log("Data has been successfully added to data base");
	  }).catch((err) => {
      console.log("There is something wrong with adding data to data base");
		  throw err;
	  });
  });
});

app.use(express.static(path.join(__dirname, '/views')));
app.use('/', routes);
app.use('/users', users);