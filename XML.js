NODE_ELEMENT = 1;
NODE_TEXT = 3;
function settings(){
	
}
var set = new settings();

function createDOM() {
	var xml = new ActiveXObject("Microsoft.XMLDOM");
	xml.async = false;
	xml.resolveExternals = false;
	xml.validateOnParse = false;
	return xml;
}