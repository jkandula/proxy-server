var http = require('http')
var request = require('request')
var fs = require('fs')
var stream = require('stream')
var path = require('path')
var yargs = require('yargs')
			.usage('node $0 [options]')
			.option('p', {
				alias: 'port',
				description: 'Specify a forwarding port'
			})
			.option('x', {
				alias: 'host',
				description: 'Specify a forwarding host'
			})
			.option('l', {
				alias: 'log',
				description: 'Specify a output log file'
			})
			.option('v', {
				alias: 'loglevel',
				description: 'Specify a log level [\'debug\', \'info\', \'notice\', \'warning\', \'err\', \'crit\', \'alert\', \'emerg\']',
				default: 'info'
			})
			.option('h', {
				alias: 'help',
				description: 'Show help'
			})
var argv = yargs.argv
var loglevels = ['debug', 'info', 'notice', 'warning', 'err', 'crit', 'alert', 'emerg']

if(argv.help) {
	yargs.showHelp('log')
	return
}

var currentloglevel = 0;
if(argv.loglevel) {
	var tmplvl = loglevels.indexOf(argv.loglevel)
	if(tmplvl < 0) {
		currentloglevel = 1
	} else {
		currentloglevel = tmplvl
	}
}


var logPath = argv.logfile && path.join(__dirname, argv.logfile)
// if(logPath) {
// 	process.stdout.write('Logger at location ' + logPath)
// }
var logStream = logPath ? fs.createWriteStream(logPath) : process.stdout

var scheme = 'http://'
var localhost = '127.0.0.1'
var host = argv.host || localhost
var port = argv.port || (host === localhost ? 8000 : 80)
var destinationUrl = scheme + host + ':' + port

var echoServer = http.createServer((req, res) => {
	log('info', 'echoServer')
	for(var header in req.headers) {
		res.setHeader(header, req.headers[header])
	}
	log('info', req.headers)
	req.pipe(res)
})
echoServer.listen(8000)
log('info', 'echoServer listening @ 127.0.0.1:8000')

var proxyServer = http.createServer((req, res) => {
	log('info','proxyServer')
	log('debug', 'This is a very detailed message')
	log('info',req.headers)
	var url = destinationUrl
	if(req.headers['x-destination-url']) {
		url = 'http://' + req.headers['x-destination-url']
	}

	var options = {
		url : url + req.url 
	}
	log('info', req)
	req.pipe(request(options)).pipe(res)
})
proxyServer.listen(9000)
log('info', 'proxyServer listening @ 127.0.0.1:9000')

function log(level, msg) {
	if(loglevels.indexOf(level) < currentloglevel) {
		return
	}
	if(msg instanceof stream.Stream) {
		msg.pipe(logStream, {end: false})
	} else if (typeof msg === 'string') {
		logStream.write(msg+'\n')
	} else { // my be object
		logStream.write(JSON.stringify(msg)+'\n')
	}
}