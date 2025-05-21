// Connect to env
require("dotenv").config();

// Connect to ExpressJS
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Library to handle Date-Time
const moment = require("moment");
app.locals.moment = moment;

// Connect to use Method-override library. Because form element only have method POST, using this library to use method like DELETE, etc.
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

// Connect to parse the body when data is sent onto server by using body-parser library
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true })); // Middleware để parse form
app.use(express.json());

// Connect to Express Flash library to show notification when changing things
const flash = require("express-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");

app.use(cookieParser("keyboard cat"));
app.use(session({ cookie: { maxAge: 3600000 }}));
app.use(flash());

// Set Pug as the view engine
app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');

const path = require('path');
// Assuming your main server file is in the root directory
const configDir = path.join(__dirname, 'configs');
// Serve static files from the 'configs' directory at the /configs URL
app.use('/configs', express.static(configDir));

// Configuration public file
app.use(express.static(`${__dirname}/public`));

// App locals variables
const systemConfig = require("./configs/system");
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.locals.prefixUrl = systemConfig.prefixUrl;

// Connect to routes
const route = require('./routes/client/index.route')
const routeAdmin = require('./routes/admin/index.route')
route(app);
routeAdmin(app);

// If error, show 404 page
// app.get("*", (req, res) => {
//   res.render("client/pages/error/404", {
//       pageTitle: "404 Not Found"
//   })
// });

// Database setup with mssql
const { defaultPool } = require('./configs/database');

// Test database connection
defaultPool.on('error', err => {
    console.error('SQL Server Connection Error:', err);
});


// Initialize database connection
(async () => {
    try {
        await defaultPool.connect();
        console.log('Connected to SQL Server successfully');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
})();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


