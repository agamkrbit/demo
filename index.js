var express = require('express');
var port  = process.env.PORT || 3000;
var mountRouter = require('./routers');
const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

//mounting router
mountRouter(app);

app.all('/', (req, res) => {
    res.status(200).json({
        status : 'error',
        message : 'unauthorized api'
    });
});

app.listen(port, console.log(
    `Listing to port ${port}`
));
