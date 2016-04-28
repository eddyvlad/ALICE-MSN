function lastSentence(str){
	var splitStr = str.split(".");
	var last;
	for(var i=0, len = splitStr.length; i < len; ++i){
		last = splitStr[i];
	}
return toAiLanguage(last);
}

function toAiLanguage(str){
	str = str.replace(/'s/,' is');
	str = str.replace(/'m/,' am');
	str = str.replace(/'re/,'r');
	str = str.replace(/n't/,' not');
	str = filter(str);
return str;
}

function filter(str){
	var trimStr = ['.','?','!',',',"'",'"'];
	str = str.replace(new RegExp("["+trimStr.join('|')+"]+","g"),'');
	str = str.replace(/  /,' ');
	str = trim(str,' ');
return str;
}

function trimLine(str){
	var splitStr = str.split("\n");
	var newStr = new Array();
	for(var i=0, len = splitStr.length; i < len; ++i){
		var thisStr = splitStr[i];
		if(trim(thisStr) != ''){
			newStr.push(trim(thisStr));
		}
	}
return newStr.join("\n");
}

function trim(str, chars) {
	return ltrim(rtrim(str, chars), chars);
}
 
function ltrim(str, chars) {
	var chars = chars || "\\s";
	return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}
 
function rtrim(str, chars) {
	var chars = chars || "\\s";
	return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}