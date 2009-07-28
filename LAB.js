// LAB.js (LABjs :: Loading And Blocking JavaScript)
// v0.7 (c) Kyle Simpson
// MIT License

(function(global){		  
	global.$LAB = function() {
		var UNDEF = "undefined",
			JSSTR = "string",
			HEAD = "head",
			BODY = "body",
			JSTRUE = true,
			JSFALSE = false,
			SETTIMEOUT = global.setTimeout,
			doc = global.document,
			_append_to = {
				"head" : doc.getElementsByTagName(HEAD),
				"body" : doc.getElementsByTagName(BODY)
			},
			all_scripts = {},
			publicAPI = null;
		
		if (typeof _append_to[HEAD] !== UNDEF && _append_to[HEAD] !== null && _append_to[HEAD].length > 0) _append_to[HEAD] = _append_to[HEAD][0];
		else _append_to[HEAD] = null;
		if (typeof _append_to[BODY] !== UNDEF && _append_to[BODY] !== null && _append_to[BODY].length > 0) _append_to[BODY] = _append_to[BODY][0];
		else _append_to[BODY] = null;
		
		function scriptFilename(src) { 
			if (typeof src === JSSTR && src.length > 0) return /^(.*\/)?([^?\/#]*)(\?.*)?(#.*)?$/i.exec(src)[2].toLowerCase();
			return "";
		}
		
		function scriptTagExists(script_filename) {
			var docScripts = doc.getElementsByTagName("script"), i;
			for (i=0; i<docScripts.length; i++) {
				if (typeof docScripts[i].src === JSSTR && script_filename === scriptFilename(docScripts[i].src)) return JSTRUE;
			}
			return JSFALSE;
		}
		
		var engine = function(queueExec,_which) {
			queueExec = !(!queueExec);
			_which = ((typeof _which === JSSTR) ? _which : HEAD);
			
			var _ready = JSFALSE,
				_wait = null,
				_scripts_loading = JSFALSE,
				publicAPI = null,
				_scripts = {},
				exec = [];
				
			function handleScriptLoad(scriptentry) {
				if ((this.readyState && this.readyState!=="complete" && this.readyState!=="loaded") || scriptentry.done) { return; }
				this.onload = this.onreadystatechange = null; // prevent memory leak
				scriptentry.done = JSTRUE;
				for (var i in _scripts) {
					if ((_scripts[i] !== Object.prototype[i]) && !(_scripts[i].done)) return;
				}
				_ready = JSTRUE;
				if (_wait !== null) _wait(); // safe since 'wait' will already contain old_func() call wrapped in try/catch
			}
	
			function loadScript(src,type,language,allowDup) {
				var src_filename = scriptFilename(src);
				if (typeof type === UNDEF) type = "text/javascript";
				if (typeof language === UNDEF) language = "javascript";
				allowDup = !(!allowDup);
				if (!allowDup && (typeof all_scripts[src_filename] !== UNDEF || scriptTagExists(src_filename))) return;
				if (typeof _scripts[src_filename] === UNDEF) _scripts[src_filename] = {done:JSFALSE};
				else _scripts[src_filename]["done"] = JSFALSE;
				all_scripts[src_filename] = JSTRUE;
				_scripts_loading = JSTRUE;
				(function(__which){
					SETTIMEOUT(function(){
						var __append = null;
						if (((__append = _append_to[__which]) === null) && (typeof (__append = doc.getElementsByTagName(__which)[0]) === UNDEF || __append === null)) {
							SETTIMEOUT(arguments.callee,25); 
							return;
						}
						var scriptElem = doc.createElement("script");
						scriptElem.setAttribute("type",type);
						scriptElem.setAttribute("language",language);
						scriptElem.onload = scriptElem.onreadystatechange = function(){handleScriptLoad.call(scriptElem,_scripts[src_filename]);};
						scriptElem.setAttribute("src",src);
						__append.appendChild(scriptElem);
					},0);
				})(_which);
			}
			
			function executeOrQueue(execBody,retObj) {
				if (queueExec) {
					exec.push(execBody);
					return retObj;
				}
				else return execBody();
			}
			
			publicAPI = {
				script:function() {
					var args = arguments;
					return executeOrQueue(function(){
						for (var i=0; i<args.length; i++) {
							if (args[i].constructor === Array) args.callee.apply(null,args[i]);
							else if (typeof args[i] === "object") loadScript(args[i]["src"],args[i]["type"],args[i]["language"],args[i]["allowDup"]);
							else if (typeof args[i] === JSSTR) loadScript(args[i]);
						}				
						return publicAPI;
					},publicAPI);
				},
				block:function(func) {
					if (typeof func !== "function") func = function(){};
					var old_func = func, e = new engine(JSTRUE,_which);
					func = function(){try { old_func(); } catch(err) {} e.trigger(); }
					return executeOrQueue(function(){
						if (_scripts_loading && !_ready) _wait = func;
						else SETTIMEOUT(func,0);
						return e;
					},e);
				},
				toHEAD:function(){
					return executeOrQueue(function(){
						_which=HEAD; return publicAPI;
				   },publicAPI);
				},
				toBODY:function(){
					return executeOrQueue(function(){
						_which=BODY; return publicAPI;
				   },publicAPI);
				},
				trigger:function(){
					for (var i=0; i<exec.length; i++) exec[i]();
				}
			};
			return publicAPI;
		};
		
		publicAPI = {
			script:function(){
				return (new engine()).script.apply(null,arguments);
			},
			block:function(){
				return (new engine()).block.apply(null,arguments);
			},
			toHEAD:function(){
				return (new engine()).toHEAD();
			},
			toBODY:function(){
				return (new engine()).toBODY();
			}
		};
		return publicAPI;
	}();
})(window);