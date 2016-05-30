var express = require('express');
var router = express.Router();
var fs = require('fs');
/* GET home page. */

var path = fs.readFileSync(__dirname + '/url', 'utf-8');
console.log(path);


router.get('/status', function (req, res, next) {

    res.sendFile(__dirname + '/index.html');
});

router.get('/status/data', function (req, res) {
    var servers = {global: []};
    var lastServerName = '';
    var lastTotalProcessed = '';
    var lastPerMinute = '';
    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(path)
    });
    lineReader.on('close', function () {
        for (prop in servers) {
            servers[prop].reverse();
        }
        res.send(servers);
    })
    var isGlobal = false;
    lineReader.on('line', function (line) {
        var statisticsFor = line.indexOf("Statistics for ") > -1;
        var totalFor = line.indexOf("Number of items matched by fingerprint: ") > -1;
        var perMinute = line.indexOf('Number of PROCESSED items per minute') > -1;

        var globalTotal = line.indexOf('Number of items matched by text: ') > -1;
        var processedAdded = line.indexOf('Number of PROCESSED/ADDED') > -1;
        var globalMinutes = line.indexOf('Average time per item COMPLETE PROCESS: ') > -1;
        var errors = line.indexOf('Errored items, i.e. skipped: ') > -1;
        if (statisticsFor) {
            isGlobal = false;
            var serverName = line.substring(line.indexOf("Statistics for ") + 'Statistics for '.length, line.length - 1).replace('"', '').trim().replace(" ", "_");
            if (!servers[serverName])
                servers[serverName] = [];
            servers[serverName].push({name: serverName});
            lastServerName = serverName;
        }
        else if (totalFor) {
            lastTotalProcessed = line.substring(line.indexOf("Total processed: ") + "Total processed: ".length, line.length);
            servers[lastServerName][servers[lastServerName].length - 1].total = lastTotalProcessed;
        }
        else if (perMinute) {
            lastPerMinute = line.substring(line.indexOf("Number of PROCESSED items per minute: ") + "Number of PROCESSED items per minute: ".length, line.length);
            servers[lastServerName][servers[lastServerName].length - 1].perMinute = lastPerMinute;
        }
        else if (errors) {
            servers[lastServerName][servers[lastServerName].length-1].errors = parseInt(line.substring(line.indexOf('Errored items, i.e. skipped: ')+'Errored items, i.e. skipped: '.length, line.length));
        }
        else if (globalTotal) {
            isGlobal = true;
            var total = parseInt(line.substring(line.indexOf("Total processed: ") + "Total processed: ".length, line.length));
            var current = total
            if (servers['global'].length >= 1) {
                current = total - servers['global'][servers['global'].length - 1].total - 1
            }
            servers['global'].push({total: total, current: current})
        }
        else if (processedAdded) {
            var processed = line.substring(line.indexOf("Number of PROCESSED/ADDED items per minute: ") + "Number of PROCESSED/ADDED items per minute: ".length, line.length);
            var arrs = processed.split('/');
            servers['global'][servers['global'].length - 1].processed = arrs[0];
            servers['global'][servers['global'].length - 1].added = arrs[1];
            servers['global'][servers['global'].length - 1].timestamp = Date.parse(line.substring(0, '2016-05-29 10:22:17.7137'.length));
        }
        else if (globalMinutes && isGlobal) {
            servers['global'][servers['global'].length - 1].completeProcess = line.substring(line.indexOf('Average time per item COMPLETE PROCESS: ') + 'Average time per item COMPLETE PROCESS: '.length, line.length - 3)
            isGlobal = false;
        }
        console.log('Line from file:', line);
    });
})
function putInfo() {

}
module.exports = router;
