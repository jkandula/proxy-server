var http = require('http')
var request = require('request')
var fs = require('fs')
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
			.option('h', {
				alias: 'help',
				description: 'Show help'
			})
var argv = yargs.argv

if(argv.help) {
	yargs.showHelp('log')
	return
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
	logStream.write('echoServer\n')
	for(var header in req.headers) {
		res.setHeader(header, req.headers[header])
	}
	logStream.write(JSON.stringify(req.headers)+'\n')
	req.pipe(res)
})
echoServer.listen(8000)
logStream.write('echoServer listening @ 127.0.0.1:8000\n')

var proxyServer = http.createServer((req, res) => {
	logStream.write('proxyServer\n')
	logStream.write(JSON.stringify(req.headers)+'\n')
	var url = destinationUrl
	if(req.headers['x-destination-url']) {
		url = 'http://' + req.headers['x-destination-url']
	}

	var options = {
		url : url + req.url 
	}
	req.pipe(logStream, {end: false})
	req.pipe(request(options)).pipe(res)
})
proxyServer.listen(9000)
logStream.write('proxyServer listening @ 127.0.0.1:9000\n')