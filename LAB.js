// LAB.js (LABjs :: Loading And Blocking JavaScript)
// v0.7 (c) Kyle Simpson
// MIT License

(function(global, doc, delay) {
  var UNDEF = "undefined",
      JSSTR = "string",
      HEAD = "head",
      BODY = "body",
      _append_to = {
        head: doc.getElementsByTagName(HEAD)[0],
        body: doc.getElementsByTagName(BODY)[0]
      },
      all_scripts = {},
      reFilename = /.*\/([^\?\#]+)(?:\?.*)?(?:\#.*)?$/,
      toString = Object.prototype.toString;

  function scriptFilename(src) {
    return (src && src.length) ? src.match(reFilename)[1].toLowerCase() : '';
  }

  function scriptTagExists(filename) {
    var scripts = doc.getElementsByTagName('script'), i = 0, script;
    while (script = scripts[i++]) {
      if (filename == scriptFilename(script.src)) {
        return true;
      }
    }
    return false;
  }

  function engine(queueExec,_which) {
    queueExec = !!queueExec;
    _which = (typeof _which === JSSTR) ? _which : HEAD;

    var _ready = false,
      _scripts_loading = false,
      publicAPI,
      _wait,
      _scripts = {},
      exec = [];

    function handleScriptLoad(scriptentry) {
      if ((this.readyState && this.readyState != 'complete' && this.readyState != 'loaded') || scriptentry.done) { return; }
      this.onload = this.onreadystatechange = null; // prevent memory leak
      scriptentry.done = true;
      for (var i in _scripts) {
        if ((_scripts[i] !== Object.prototype[i]) && !(_scripts[i].done)) return;
      }
      _ready = true;
      if (_wait) _wait(); // safe since 'wait' will already contain old_func() call wrapped in try/catch
    }

    function loadScript(src, type, charset, allowDup) {
      var src_filename = scriptFilename(src);
      allowDup = !!allowDup;
      if (!allowDup && (typeof all_scripts[src_filename] !== UNDEF || scriptTagExists(src_filename))) return;
      if (typeof _scripts[src_filename] === UNDEF) _scripts[src_filename] = {done:false};
      else _scripts[src_filename].done = false;
      all_scripts[src_filename] = true;
      _scripts_loading = true;
      (function(__which){
        var count = 1;
        delay(function(){
          var __append = _append_to[__which] || doc.getElementsByTagName(__which)[0];
          if (!__append && (count++ < 10)) {
            return delay(arguments.callee,25);
          }
          var scriptElem = doc.createElement('script');
          scriptElem.setAttribute('type', type || 'text/javascript');
          scriptElem.setAttribute('charset', charset || 'utf-8');
          scriptElem.onload = scriptElem.onreadystatechange = function(){handleScriptLoad.call(scriptElem,_scripts[src_filename]);};
          scriptElem.setAttribute('src', src);
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
          for (var i = 0, length = args.length, arg; i < length; i++) {
            arg = args[i];
            if (toString.call(arg) == '[object Array]') args.callee.apply(null, arg);
            else if (typeof arg == 'object') loadScript(arg.src, arg.type, arg.charset, arg.allowDup);
            else if (typeof arg == JSSTR) loadScript(arg);
          }
          return publicAPI;
        },publicAPI);
      },
      block:function(func) {
        if (typeof func !== "function") func = function(){};
        var old_func = func, e = new engine(true,_which);
        func = function(){try { old_func(); } catch(err) {} e.trigger(); }
        return executeOrQueue(function(){
          if (_scripts_loading && !_ready) _wait = func;
          else delay(func, 0);
          return e;
        },e);
      },
      toHEAD:function(){
        return executeOrQueue(function(){
          _which=HEAD;
          return publicAPI;
        },publicAPI);
      },
      toBODY:function(){
        return executeOrQueue(function(){
          _which=BODY;
          return publicAPI;
        },publicAPI);
      },
      trigger:function(){
        for (var i = 0; i < exec.length; i++) {
          exec[i]();
        }
      }
    };
    return publicAPI;
  };

  global.$LAB = function() {
    return {
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
  }();
})(this, this.document, this.setTimeout);