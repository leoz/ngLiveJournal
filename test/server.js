var express = require('express')
, request = require('request')
, app = express();

var postToLJ = function(req, res, next) {
    req.pipe(request.post('http://www.livejournal.com' + req.path)).pipe(res);
};

app.post('/interface/xmlrpc', postToLJ);

app.use(express.static('.'));

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
