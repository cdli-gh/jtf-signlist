/*---/ imports /------------------------------------------------------------*/

//var parseString = require('xml2js').parseStringPromise;
//var converter = require('./xml2jsonconverter.js');
var syllabary = require('./syllabary.json');

const re_cpoint = /U\+([A-F]|[0-9]){5}/g;
//const re_sep = /(?:\{)*.?(?:\})/g;
const re_curly = /\{|\}/g;

const code2char = function(cPoint){
	// Codepoint string to Unicode char. 
	return String.fromCodePoint('0x'+cPoint.split('+')[1])
};

const renderUnicodeChain = function(chain){
	// Render composite signs as Unicode
	chain = chain.replace(re_curly, '');
	chain = chain.replace(re_cpoint, code2char);
	return chain;
};

const getUnicode = function(sDict){
	// Get char from code point string
	// Format: U+00000.
	if (!sDict.unicode){
		return null;
	} else {
		var cPoint = sDict.unicode[0];
		if (!cPoint.includes('}')){
			return code2char(cPoint);
		} else {
			return renderUnicodeChain(cPoint);
		};
	};
};

const processValue = function(type, vDict, v){
	// Add ATF chars
	vDict = Object.assign({}, vDict)
	if (type==='det'){
		v = '{'+v+'}'
	};
	if (v!=='empty'){
		vDict.valATF = v;
		return vDict
	} else {
		return null;
	};
};

const parseValues = function(vals, type){
	//
	var valsArr = [];
	vals.forEach(function(val){
		var vDict = {type: type};
		if (val.$){
			if (val.$.main){
				vDict.toGroup = val.$.main;
			};
			if (val.$.period){
				vDict.period = val.$.period;
			};
		};
		if (val._){
			val._.split(',').forEach(function(v){
				var PV = processValue(type, vDict, v);
				if (PV){
					valsArr.push(PV);
				};
			});
		} else if (typeof val==='string') {
			var PV = processValue(type, vDict, val);
			if (PV){
				valsArr.push(PV);
			};
		} else {
			//console.log('some mess with val:', val)
		};
	});
	return valsArr;
};

const parseValuesDict = function(vDicts){
	//
	var valsArr = [];
	['log', 'syl', 'det', 'num', 'pnc'].forEach(function(type){
		if (vDicts[type]){
			var newArray = parseValues(vDicts[type][0].value, type)
			if (type==='det'){ newArray.forEach( v => {
				v.position = vDicts[type][0].$.position }) 
			};
			valsArr = valsArr.concat(newArray);
			vDicts[type] = newArray;
		} else {
			delete vDicts[type]
		};
	});
	//console.log(vDicts, valsArr);
	return [vDicts, valsArr]
};

const syllabary2values = function(){
	// Get array of article, array of values
	// From JSON syllabary.
	var articles = {};
	var valuesAll = {};
	syllabary.signs.sign.forEach(
		function(sDict){
			var uChr = getUnicode(sDict);
			var name = sDict.name[0];
			if (!name && sDict.unicode_name){ 
				//use unicode name as a temp. replacement 
				name = sDict.unicode_name[0];
			};
			var values = sDict.values[0];
			var vDicts = {
				'uChr': uChr,
				'name': name,
				'uName': sDict.unicode_name[0],
				'log': values.logographic,
				'syl': values.syllabic,
				'det': values.determinative,
				'num': values.numeral,
			};
			var [vDictsNew, valsArr] = parseValuesDict(vDicts);
			//console.log(typeof values, name, typeof name, vDictsNew, typeof vDictsNew);
			if (name){
				valuesAll[name] = vDictsNew;
				valsArr.forEach(function(v){
					v.toName = name;
					var ID = v.valATF;
					if (articles[ID]){
						articles[ID].push(v);
					} else {
						articles[ID] = [v];
					};
				});
			}; /* else {
				//console.log(sDict);
			}; */
	});
	return [articles, valuesAll]
};

const addResult = function(values, params={}, result=[]){
	//
	values.forEach(function(vDict){
		params.vDict = vDict
		params.article = articles[vDict.toName]
		result.push(params)
	});
	return result
};

const findArticlesByATF = function(atfstr){
	// This returns first only and it shouldn't
	// ToDo: correct, test with ŠUₓ
	atfstr = atfstr.replace(/#|\!|\?/, '')
	var result = [];
	if (valuesAll[atfstr]){
		result = result.concat(addResult(valuesAll[atfstr]))
	} else if (valuesAll[atfstr.toUpperCase()]) {
		var p = {shift: 'upper'};
		var r = addResult(valuesAll[atfstr.toUpperCase()], p);
		if (!result.includes(r)){
			result = result.concat(r)
		};
	} else if (valuesAll[atfstr.toLowerCase()]) {
		var p = {shift: 'lower'};
		var r = addResult(valuesAll[atfstr.toLowerCase()], p);
		if (!result.includes(r)){
			result = result.concat(r)
		};
	};
	return new Set(result);
};

[valuesAll, articles] = syllabary2values();
module.exports.findArticlesByATF = findArticlesByATF;

/* some raw tests here: */

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

let ambigValuesAll = [];
let ambigValuesX = {};
let ambigValuesDifferentNames = {};
let ambigValuesSameName = {};

Object.keys(valuesAll).forEach( k => {
	if ( valuesAll[k].length > 1 ){
		let valName = valuesAll[k][0].valATF
		ambigValuesAll[valName] = valuesAll[k]
		let toNames = valuesAll[k].map( v => v.toName).filter(onlyUnique);
		if (valName.includes('ₓ')){
			ambigValuesX[valName] = valuesAll[k];
		} else if (toNames.length>1){
			ambigValuesDifferentNames[valName] = valuesAll[k];
		} else {
			ambigValuesSameName[valName] = valuesAll[k];
		};
	};
});

//console.log( 'ambigous values in syllabary, X:\n', ambigValuesX);
//console.log( 'ambigous values in syllabary, different names:\n', ambigValuesDifferentNames);
//console.log( 'ambigous values in syllabary, same name:\n', ambigValuesSameName);



//console.log(articles, valuesAll)