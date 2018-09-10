require("babel-register")({ presets: ["env"] }); // Transpile server code to support ES6

let express = require("express"); // Express Server
let session = require("express-session");
let helmet = require("helmet");
let SessionRedisStore = require("connect-redis")(session);
let path = require("path");
let fs = require("fs");
let https = require("https");
let cookieParser = require("cookie-parser");
let bodyParser = require("body-parser");
let RateLimit = require("express-rate-limit");
let RateLimitRedisStore = require("rate-limit-redis");
let favicon = require("serve-favicon");
let loadWebpack = require("./server.dev");
let routes = require("./services/router"); // Server Routes
let winston = require("winston");
let expressWinston = require("express-winston");
let cors = require("cors");
let compression = require("compression");
let app = express();

let passport = require("./services/passport");
let database = require("./services/sequelize");
let nodemailer = require("./services/nodemailer");
let config = require("../config");

// Set up Sentry Error Reporting
if (config.sentry.enabled && config.build.environment === "production") {
	let raven = require("raven");
	raven.config(config.sentry.dns).install();
	app.use(raven.requestHandler());
	app.use(raven.errorHandler());
}

// Set up Papertrail Logging
if (config.papertrail.enabled && config.build.environment === "production") {
	let WinstonPapertrail = require("winston-papertrail").Papertrail;
	const transport = new WinstonPapertrail({
		host: config.papertrail.host,
		port: config.papertrail.port,
		hostname: config.papertrail.hostname,
		level: config.papertrail.level,
		logFormat: function(level, message) {
			return "[" + level + "] " + message;
		}
	});

	// Connect express to Papertrail Logging
	app.use(
		expressWinston.logger({
			transports: [transport],
			meta: true,
			msg: "{{req.method}} {{req.url}}",
			expressFormat: true,
			colorize: false,
			ignoreRoute: function(req, res) {
				return false;
			}
		})
	);

	let logger = new winston.Logger({
		transports: [transport]
	});
}

// Fetch Favicon
app.use(favicon(path.join(__dirname, "../favicon.ico")));

// Set up view engine
app.set("view engine", "html");
app.engine("html", function(path, options, callback) {
	fs.readFile(path, "utf-8", callback);
});

// Enable compression on Routes
app.use(compression());

// Enable Helmet for improved endpoint security
app.use(helmet());

// Add rate limiting to endpoints to prevent excessive use
app.enable("trust proxy");
var apiLimiter = new RateLimit({
	store: new RateLimitRedisStore({
		host: config.redis.host,
		port: config.redis.port
	}),
	windowMs: 15 * 60 * 1000,
	max: 100,
	delayMs: 0
});
app.use(apiLimiter);

// Handle HTTP Post body data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Handle reloading server in development mode
if (config.build.environment === "development") {
	loadWebpack(app);
}

// Load static files from client directory
app.use(express.static(path.join(__dirname, "../distribution")));

// Connection to Redis user session store
app.use(
	session({
		store: new SessionRedisStore({
			host: config.redis.host,
			port: config.redis.port
		}),
		secret: config.redis.secret,
		proxy: false,
		resave: config.redis.resave,
		saveUninitialized: false
	})
);

// Handle Redis connection failure
app.use(function(req, res, next) {
	if (!req.session) {
		process.stdout.write("Unable to connect to Redis session store\n");
		process.exit(1);
	}
	next();
});

// Initialise user authentication with passport
passport.initialize(app);

// Enable CORS for Routes
app.use(
	cors({
		origin: new RegExp(config.build.domainPath + "$"),
		optionsSuccessStatus: 200
	})
);

// Force redirect on routes if HTTPS enabled
if (config.build.protocol === "https") {
	app.use(function(req, res, next) {
		if (req.get("X-Forwarded-Proto") !== "https") {
			res.redirect("https://" + req.get("Host") + req.url);
		} else next();
	});
}

// Load the Routes
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
});
app.use("/", routes);

// Set Message Headers
app.use(function noCache(req, res, next) {
	res.header("Cache-Control", "no-cache, no-store, must-revalidate");
	res.header("Pragma", "no-cache");
	res.header("Expires", 0);
	next();
});

// Initialise Email Service
nodemailer.initialize();

// Initialise Stripe payment service
if (config.stripe.enabled) {
	require("./services/stripe");
}

// Handle server errors
app.use(function errorHandler(err, req, res, next) {
	// Report to Papertrail
	// Report to Kinesis
	const status = err.status != null ? err.status : 500;
	let response = {
		status: status,
		message: null,
		reason: null
	};
	if (err.message != null) {
		response.message = err.message;
	}
	if (err.reason != null) {
		response.reason = err.reason;
	}
	res.status(status).send(response);
});

// Set server port
app.set("port", config.build.port || 3000);

// Connect to MySQL database
database.connect(function(err) {
	if (err) {
		process.stdout.write("Unable to connect to MySQL Database\n");
		process.exit(1);
	} else {
		// Load server if database connection successful
		let server = null;
		if (config.build.protocol === "https") {
			// Create https server if specified
			server = https
				.createServer(
					{
						key: fs.readFileSync(config.build.key),
						cert: fs.readFileSync(config.build.certificate)
					},
					app
				)
				.listen(app.get("port"), function() {
					process.stdout.write(`Server listening securely on port: ${server.address().port}\n`);
				});
		} else {
			server = app.listen(app.get("port"), function() {
				process.stdout.write(`Server listening on port: ${server.address().port}\n`);
			});
		}
	}
});

module.exports = app;
