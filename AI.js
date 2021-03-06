var path = MsgPlus.ScriptFilesPath + '\\aiml\\';
var ext = '.aiml';
var lastResponse = '';
var loopCounter;
var mode = null;
var xmlDoc;
var collectMode = null;
var isSearching = false;
var prefix = 'ALICE: ';

function AI_Response(Wnd,sOrigin,sMessage){
	loopCounter = 0;
	var collections = preCollectResponse(sOrigin,sMessage);
	if(collections.length > 0){
		var response = processCollections(collections);
		response = trimLine(response);
		lastResponse = trimLine(filter(lastSentence(lastResponse))).toUpperCase();
		//Debug.Trace('Last Response: '+lastResponse);
		Wnd.SendMessage(prefix+response);
	}
collectMode = null;
}

function preCollectResponse(sOrigin,sMessage){
	isSearching = true;
	collectMode = null;
	var collections = collectResponse(sOrigin,sMessage);

	if(collections.length == 0 && set.topic){
		loopCounter = 0;
		collectMode = 'topic';
		var collections = collectResponse(sOrigin,sMessage);
	}
	if(collections.length == 0){
		loopCounter = 0;
		collectMode = 'under';
		var collections = collectResponse(sOrigin,sMessage);
	}
	if(collections.length == 0){
		loopCounter = 0;
		collectMode = 'star';
		var collections = collectResponse(sOrigin,sMessage);
	}
	isSearching = false;
return collections;
}

function collectResponse(sOrigin,sMessage){
	var xml = createDOM();
	var firstLetter = sMessage.substring(0,1).toUpperCase();
	var aimlPath = path+firstLetter+ext;

	if(collectMode != null){
		if(collectMode == 'topic' || collectMode == 'star'){
			var aimlPath = path+'star'+ext;
		} else {
			var aimlPath = path+collectMode+ext;
		}
	}
	
	xml.load(aimlPath);
	//Debug.Trace('Collect Mode: '+collectMode);
	//Debug.Trace('Open: '+aimlPath);
	xmlDoc = xml;
	var msgTrim = toAiLanguage(sMessage).toUpperCase();

	if(collectMode == 'topic'){
		var categories = xml.selectNodes("aiml/topic[@name='"+set.topic+"']/category | aiml/topic[@name='"+set.topic+" *']/category");
	} else {
		var categories = xml.selectNodes('aiml/category');
	}
	var collections = new Array();
	var thatCollections = new Array();
	var counter = 0;
	var thatCounter = 0;
	var round = 0;

	for(var i = 0, len = categories.length; i < len; ++i){
		var thisPattern = categories[i].selectSingleNode('pattern').text;
		var thisRegEx = thisPattern.replace(/[\*|_]/,"(.*?)");
		
		var RegEx = null;
		if(round == 0){
			RegEx = new RegExp("^"+thisRegEx+"$","gi");
		} else if(round == 1){
			RegEx = new RegExp("^"+thisRegEx,"gi");
		}
		
		var Matches = msgTrim.match(RegEx);
		if(Matches != null){
		//Debug.Trace(thisRegEx);
			function thisObject(){
				this.node = categories[i];
				this.match = Matches;
				this.regex = RegEx;
				this.pattern = thisPattern;
				this.msg = msgTrim;
				this.origin = sOrigin;
			}
			collections[counter] = new thisObject();

			if(categories[i].selectSingleNode('that') && lastResponse != ''){
				//var thatNode = loopThisTag(categories[i].selectSingleNode('that'),collections[counter],false);
				var thatNode = categories[i].selectSingleNode('that').text;
				thatNode = thatNode.replace(/[\*|_]/,"(.*?)");
				var thatMatch = lastResponse.match("^"+thatNode+"$");
				//Debug.Trace("Matching '"+lastResponse+"' with '"+thatNode+"'");
				if(thatMatch){
					//Debug.Trace('Found <that>'+ thatNode +'</that>');
					thatCollections[thatCounter] = collections[counter];
					thatCounter++;
					// break if response is exactly the same
					if(lastResponse == thatNode) break;
				}
			}

		counter++;
		if(thisPattern == thisRegEx) break;
		}

		if(i == len && counter == 0){
			round++;
			i = 0;
			if(round == 1) break;
		}
	}

	if(thatCollections.length > 0){
		return thatCollections;
	}
return collections;
}

function processCollections(collections){
	// Use the last found answer (To be improve)
	var totalCollections = collections.length;
	var lastIndex = totalCollections - 1;
	var thisNode = collections[lastIndex].node;
	var AnswerNode = thisNode.selectSingleNode('template');
	var thisChildNodes = AnswerNode.childNodes;
	var buildResponse = '';
	
	for(var c = 0; c < thisChildNodes.length; c++){
		var thisResponse = null;
		if(thisChildNodes.item(c).nodeType == NODE_TEXT){
			thisResponse = thisChildNodes.item(c).nodeValue;
		}
		else if(thisChildNodes.item(c).nodeType == NODE_ELEMENT){
			thisResponse = nodeToString(thisChildNodes.item(c),collections[lastIndex]);
		}

		if(thisResponse != null && trim(thisResponse) != ''){
			if(isSearching == false){
				lastResponse = thisResponse;
			}
			buildResponse += thisResponse
		}
	}
return buildResponse;
}

function nodeToString(node,collection){
	if(loopCounter > 10){
		return ' I don\'t know how to answer you because I am still under development. Ask me, "Who is your creator" or "What are you"'+"\n";
	}
	loopCounter++;
	//Debug.Trace(node.tagName);

	switch(node.tagName){
		case 'person':
		case 'star':
			var thisRegEx = collection.pattern.replace(/\*/,'');
			var RegEx = new RegExp(thisRegEx,"gi");
			var trim = collection.msg.replace(RegEx,'');
			return trim;
		break;

		case 'bot':
			return processBotTag(node,collection);
		break;
		
		case 'get':
			return processGetTag(node,collection);
		break;
		
		case 'set':
			return processSetTag(node,collection);
		break;
		
		case 'random':
			return processRandomTag(node,collection);
		break;
		
		case 'think':
			mode = 'think';
			var result = loopThisTag(node,collection);
			mode = null;
			return result;
		break;
		
		case 'gossip':
			return ''; // under development
		break;

		case 'srai':
			return processSraiTag(node,collection);
		break;

		case 'sr':
			return processSrTag(node,collection);
		break;

		default:
			return node.text;
		break;
	}
}

function processBotTag(node,collection){
	var xml = createDOM();
	xml.load(path+'bot'+ext);

	var attrVal = node.getAttributeNode('name').text;
	var entries = xml.selectNodes("aiml/bot[@name=\""+attrVal+"\"]");
	if(entries.length > 0){
		return entries[0].text;
	}
}

function processSrTag(node,collection){
	var sraiNode = xmlDoc.createElement("srai");
	var starNode = xmlDoc.createElement("star");
	sraiNode.appendChild(starNode);
	var result = processSraiTag(sraiNode,collection);
	result += ' ';

return result;
}

function processSraiTag(node,collection){
	var result = loopThisTag(node,collection);
	var collections = preCollectResponse(collection.origin,result);
	var response = '';
	if(collections.length > 0){
		response = processCollections(collections);
	}
return response;
}

function processGetTag(node,collection){
	var attrVal = node.getAttributeNode('name').text;
	if(set[attrVal]){
		return set[attrVal];
	}
	if(attrVal == 'name'){
		return collection.origin;
	}
return 'what?';
}

function processSetTag(node,collection){
	var attrVal = node.getAttributeNode('name').text;
	var childNodes = node.childNodes;
	var response = '';

	for(var i=0, len = childNodes.length; i < len; ++i){
		set[attrVal] = nodeToString(childNodes.item(i),collection);
		if(mode != 'think'){
				response += ' '+set[attrVal];
		}
		else if(node.parentNode.tagName == 'set'){
			if(set[attrVal] == undefined){
				response = attrVal;
			} else {
				response = set[attrVal];
			}
		}
	}

return response;
}

function processRandomTag(node,collection){
	var total = node.childNodes.length;
	var rand = Math.floor(Math.random()*total);
	return loopThisTag(node.childNodes.item(rand),collection);
}

function loopThisTag(node,collection){
	var thisChildNodes = node.childNodes;
	var buildResponse = '';

	for(var i=0, len = thisChildNodes.length; i < len; ++i){
		var thisResponse = null;
		if(thisChildNodes.item(i).nodeType == NODE_TEXT){
			thisResponse = thisChildNodes.item(i).nodeValue;
		}
		else if(thisChildNodes.item(i).nodeType == NODE_ELEMENT){
			thisResponse = nodeToString(thisChildNodes.item(i),collection);
		}

		if(thisResponse != null && trim(thisResponse) != ''){
			if(isSearching == false){
				//lastResponse = thisResponse;
			}
			buildResponse += thisResponse;
		}
	}
return buildResponse;
}