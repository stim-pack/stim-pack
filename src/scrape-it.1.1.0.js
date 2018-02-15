const scrapeIt = require("scrape-it");
const fs = require('fs');

// notes:
// scraper working with timestamp

var offset = 0; // starting offset, 0 is newest
var amount = 5; // items to load via php, use standard = 5

// choose "en" || "nl"
var language = "nl"; // ~1090*5 entries
// var language = "nl"; // ~3695*5 entries

var counter = 0;
var outputfolder = "../dist/"; // relative to current .js

var creation_timestamp = new Date().getTime();
var outputfile = outputfolder + creation_timestamp + "." + language + ".json";

var obj = { timestamp: [], grants: [] }; // structure to use for output
obj.timestamp.push( creation_timestamp );

fetch_page( language, offset ); // starts loop

// fn's
function fetch_page(_language, _offset){
	var target = return_target(_language, _offset); // generate url

	scrapeIt(target, {
		// fetch the grants
		grants: {
			listItem: "article", // find all <article> elements
			data: {
				index: {
					selector: "input.dlink-input",
					attr: "value",
					convert: x => x.split("/")[ x.split("/").length-2 ]
				},
				title: {
					selector: "div.artt > h2"
				},
				organisation: {
					selector: "div.exfb > strong:first-of-type",
					convert: x => x.substr(0, x.indexOf(',')).trim()
				},
				sumTxt: {
					selector: "div.exfb > strong",
					eq: 1
				},
				sumCur: {
					selector: "div.exfb > strong",
					eq: 1,
					convert: x => x.substr(0,1)
				},
				sumVal: {
					selector: "div.exfb > strong:last-of-type",
					convert: x => x.replace(/[^\d\,]/g,'')
				},
				year: {
					selector: "div.exfb > strong",
					eq: 0,
					convert: x => x.substr(x.indexOf(',')+1,x.length).trim()
				},
				grantType: {
					selector: "div.type > h4",
					convert: x => x.substr(0, x.indexOf('→')).trim()
				},
				projectType: {
					selector: "div.type > h4",
					convert: x => x.substr(x.indexOf('→')+1,x.length).trim()
				},
				imgSrc: {
					selector: "div.inr > img",
					attr: "data-src"
				},
				thumbnailSrc: {
					selector: "div.inr > img",
					attr: "data-src",
					convert: x => x.replace(/\.[^/.]+$/, "") + "_th.jpg"
				},
				descriptionHtml: {
					selector: "div.artb",
					convert: x => x.replace(/<!--[\s\S]*?<\/div>/g, ""),
					how: "html"
				},
				urlExit: {
					selector: "div.exfb > a",
					attr: "href"
				},
				urlPermalink: {
					selector: "input.dlink-input",
					attr: "value"
				}
			} //end data for articles
		} //end grants
	}).then( ({ data, response }) => {
		counter++;
		var readable_time = new Date().toTimeString();
		var _alert = counter + "--- " + readable_time +"; requested ("+ _offset +"); statusCode: "+ response.statusCode;
		console.log(_alert);

		if (data) {
			if ( data.grants.length > 0 ){ // we have new data
				//add data to obj
				for (var i = 0; i < data.grants.length; i++) {
					obj.grants.push( data.grants[i] );
				}
				//change offset; fetch new (reenter loop)
				offset += amount;
				fetch_page(language, offset);
			} else { // no new data, we're done!
				var finished_timestamp = new Date().getTime();
				obj.timestamp.push( finished_timestamp );

				readable_time = new Date().toTimeString();
				console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
				_alert = "FINISHED at "+readable_time+" :)";
				console.log(_alert);
				console.log("----------------------------------------------------------------")

				fs.writeFileSync(outputfile, JSON.stringify(obj), 'utf-8'); 
			}
		} 
	})
}

// http://stimuleringsfonds.nl/inc/lightbox.php?path=%2Fnl%2Ftoekenningen%2F&special=toekenningen&offset=10&hasfilter=true&action=loadmore&lmtype=filter
// http://stimuleringsfonds.nl/inc/lightbox.php?path=%2Fnl%2Ftoekenningen%2F&special=toekenningen&offset=10&hasfilter=true&action=loadmore&regeling=15&lmtype=filter
// http://stimuleringsfonds.nl/inc/lightbox.php?path=%2Fen%2Fgrants_issued%2F&special=toekenningen&offset=900&hasfilter=true&action=loadmore&lmtype=filter&type=filter
// var target = "http://stimuleringsfonds.nl/inc/lightbox.php?path=%2Fen%2Fgrants_issued%2F&special=toekenningen&offset=4000&hasfilter=true&action=loadmore&lmtype=filter&type=filter"
// var target = "http://stimuleringsfonds.nl/inc/lightbox.php?path=%2Fen%2Fgrants_issued%2F&special=toekenningen&offset="+ offset +"&hasfilter=true&action=loadmore&lmtype=filter&type=filter"
// var target = "http://stimuleringsfonds.nl/inc/lightbox.php?path=%2Fen%2Fgrants_issued%2F&special=toekenningen&offset=0&amount=4585&hasfilter=true&action=loadmore&lmtype=filter&type=filter"

function return_target(_lang, _offset){
	var url_base_en = "http://stimuleringsfonds.nl/inc/lightbox.php?path=%2Fen%2Fgrants_issued%2F&special=toekenningen"
	var url_base_nl = "http://stimuleringsfonds.nl/inc/lightbox.php?path=%2Fnl%2Ftoekenningen%2F&special=toekenningen"
	var string_offset = "&offset=" + _offset;
	// var string_amount = "&amount=" + _amount; // not a settings used by the standard website
	// var url_suffix = "&action=loadmore&lmtype=filter&type=filter"
	var url_suffix = "&hasfilter=true&action=loadmore&lmtype=filter"
	
	var url_base;
	if (_lang == "en") {
		url_base = url_base_en;
	} else { //nl
		url_base = url_base_nl;
	}

	var string_target = url_base + string_offset + url_suffix;
	return string_target;
}


function return_timestamp(){
	return new Date().getTime();
}
