// This file contains a script to convert 
// XML syllabary to JSON file using xml2js.

// Use: node xml2jsonconverter.js.

/* Load sign list from XML */

var fs = require('fs');
/* if (Object.keys(fs).length === 0){
	console.log('NO fs');
	var str = require('../../public/syllabary.xml');
	//var str = require('react-native-fs');
} else {
	let str = fs.readFileSync(__dirname + '/syllabary.xml', 'UTF-8');
} */

let str = fs.readFileSync(__dirname + '/syllabary.xml', 'UTF-8');

var parseString = require('xml2js').parseStringPromise;

/* States */
var ready_state = false;
var syllabary = null;
var [valuesAll, articles] = [null, null];

var getSyllabaryObj = function(){
	// Import XML sign list & convert it to JSON
	parseString(str).then(
		function(result){
			syllabary = result;
			writeJSON('syllabary.json', syllabary);
			//[valuesAll, articles] = syllabary2values();
			//ready_state = true;
			//console.log(findArticlesByATF('a'));
		});
};

var writeJSON = function(filepath, data){
	fs.writeFile(filepath, JSON.stringify(data), 'utf8', function(err) {
		if (err) {
			throw err
		};
		console.log('complete');
	});
};

getSyllabaryObj();
