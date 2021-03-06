var Enabled = false;
var LockEnabled = true;

// Only enable in away mode
function OnEvent_Initialize(MessengerStart){
	if(Messenger.MyStatus == STATUS_AWAY){
		Enabled = true;
	}
	else if(LockEnabled == false) {
		Enabled = false;
	}
}

function OnEvent_MyStatusChange(NewStatus){
	if(NewStatus == STATUS_AWAY){
		Enabled = true;
	}
	else if(LockEnabled == false) {
		Enabled = false;
	}
}

function OnEvent_MenuClicked(mnuId,Loc,Wnd) {
	switch(mnuId) {
		case "EnabledToggle":
			if(Enabled || LockEnabled) Enabled = false; else Enabled = true;
			if(Enabled || LockEnabled) LockEnabled = false; else LockEnabled = true;
			break;
	}
}

function OnGetScriptMenu(iLocation){
	var sMenu = "<ScriptMenu>";
	if(Enabled || LockEnabled)
		sMenu += "<MenuEntry Id=\"EnabledToggle\">Disable A.I</MenuEntry>";
	else
		sMenu += "<MenuEntry Id=\"EnabledToggle\">Enable A.I</MenuEntry>";
	sMenu += "</ScriptMenu>";
	return sMenu;
}

var lastMsgSentTime = 0;
function OnEvent_ChatWndReceiveMessage(Wnd,sOrigin,sMessage,iKind) {
	var time = new Date();
	var thisTime = time.getTime();
	if((thisTime - lastMsgSentTime) < 3000){
		return sMessage;
	}
	lastMsgSentTime = thisTime;

	if((Enabled || LockEnabled) && sOrigin != Messenger.MyName && iKind == MSGKIND_SAYS){
		//Debug.Trace(sOrigin+' != '+Messenger.MyName);
		AI_Response(Wnd,sOrigin,sMessage);
	}
	else {
		return sMessage;
	}
}
