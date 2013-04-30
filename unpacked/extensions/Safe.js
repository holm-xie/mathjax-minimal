/*************************************************************
 *
 *  MathJax/extensions/Safe.js
 *  
 *  Implements a "Safe" mode that disables features that could be
 *  misused in a shared environment (such as href's to javascript URL's).
 *  See the CONFIG variable below for configuration options.
 *
 *  ---------------------------------------------------------------------
 *  
 *  Copyright (c) 2013 Design Science, Inc.
 * 
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

(function (HUB,AJAX) {
  var VERSION = "2.1";
  
  var CONFIG = MathJax.Hub.CombineConfig("Safe",{
    allow: {
      //
      //  Values can be "all", "safe", or "none"
      //
      URLs: "safe",      // safe are in safeProtocols below
      classes: "safe",   // safe start with MJX-
      cssIDs: "safe",    // safe start with MJX-
      styles: "safe",    // safe are in safeStyles below
      fontsize: "all",   // safe are between sizeMin and sizeMax em's
      require: "safe",   // safe are in safeRequire below
    },
    sizeMin: .7,        // \scriptsize
    sizeMax: 1.44,      // \large
    safeProtocols: {
      http: true,
      https: true,
      file: true,
      javascript: false
    },
    safeStyles: {
      color: true,
      backgroundColor: true,
      border: true,
      cursor: true,
      margin: true,
      padding: true,
      textShadow: true,
      fontFamily: true,
      fontSize: true,
      fontStyle: true,
      fontWeight: true,
      opacity: true,
      outline: true
    },
    safeRequire: {
      action: true,
      amscd: true,
      amsmath: true,
      amssymbols: true,
      autobold: false,
      "autoload-all": false,
      bbox: true,
      begingroup: true,
      boldsymbol: true,
      cancel: true,
      color: true,
      enclose: true,
      extpfeil: true,
      HTML: true,
      mathchoice: true,
      mhchem: true,
      newcommand: true,
      noErrors: false,
      noUndefined: false,
      unicode: true,
      verb: true
    }
  });
  
  var ALLOW = CONFIG.allow;
  if (ALLOW.fontsize !== "all") {CONFIG.safeStyles.fontSize = false}

  var SAFE = MathJax.Extension.Safe = {
    version: VERSION,
    config: CONFIG,
    div1: document.createElement("div"),  // for CSS processing
    div2: document.createElement("div"),
    
    //
    //  Filter HREF URL's
    //
    filterURL: function (url) {
      var protocol = (url.match(/^\s*([a-z]+):/i)||[null,""])[1].toLowerCase();
      if (ALLOW.URLs === "none" ||
         (ALLOW.URLs !== "all" && !CONFIG.safeProtocols[protocol])) {url = null}
      return url;
    },
    
    //
    //  Filter class names and css ID's
    //
    filterClass: function (CLASS) {
      if (ALLOW.classes === "none" ||
         (ALLOW.classes !== "all" && !CLASS.match(/^MJX-/))) {CLASS = null}
      return CLASS;
    },
    filterID: function (id) {
      if (ALLOW.cssIDs === "none" ||
         (ALLOW.cssIDs !== "all" && !id.match(/^MJX-/))) {id = null}
      return id;
    },
    
    //
    //  Filter style strings
    //
    filterStyles: function (styles) {
      if (ALLOW.styles === "all") {return styles}
      if (ALLOW.styles === "none") {return null}
      try {
        //
        //  Set the div1 styles to the given styles, and clear div2
        //  
        var STYLE1 = this.div1.style, STYLE2 = this.div2.style;
        STYLE1.cssText = styles; STYLE2.cssText = "";
        //
        //  Check each allowed style and transfer OK ones to div2
        //
        for (var name in CONFIG.safeStyles) {if (CONFIG.safeStyles.hasOwnProperty(name)) {
          var value = this.filterStyle(name,STYLE1[name]);
          if (value != null) {STYLE2[name] = value}
        }}
        //
        //  Return the div2 style string
        //
        styles = STYLE2.cssText;
      } catch (e) {styles = null}
      return styles;
    },
    //
    //  Filter an individual name:value style pair
    //
    filterStyle: function (name,value) {
      if (typeof value !== "string") {return null}
      if (value.match(/^\s*expression/)) {return null}
      if (value.match(/javascript:/)) {return null}
      return (CONFIG.safeStyles[name] ? value : null);
    },
    
    //
    //  Filter TeX font size values (in em's)
    //
    filterSize: function (size) {
      if (ALLOW.fontsize === "none") {return null}
      if (ALLOW.fontsize !== "all")
        {size = Math.min(Math.max(size,CONFIG.sizeMin),CONFIG.sizeMax)}
      return size;
    },
    filterFontSize: function (size) {
      return (ALLOW.fontsize === "all" ? size: null);
    },
    
    //
    //  Filter TeX extension names
    //
    filterRequire: function (name) {
      if (ALLOW.require === "none" ||
         (ALLOW.require !== "all" && !CONFIG.safeRequire[name.toLowerCase()]))
           {name = null}
      return name;
    }
    
  };
  
  HUB.Register.StartupHook("TeX HTML Ready",function () {
    var TEX = MathJax.InputJax.TeX;

    TEX.Parse.Augment({

      //
      //  Implements \href{url}{math} with URL filter
      //
      HREF_attribute: function (name) {
        var url = SAFE.filterURL(this.GetArgument(name)),
            arg = this.GetArgumentMML(name);
        if (url) {arg.With({href:url})}
        this.Push(arg);
      },

      //
      //  Implements \class{name}{math} with class-name filter
      //
      CLASS_attribute: function (name) {
        var CLASS = SAFE.filterClass(this.GetArgument(name)),
            arg   = this.GetArgumentMML(name);
        if (CLASS) {
          if (arg["class"] != null) {CLASS = arg["class"] + " " + CLASS}
          arg.With({"class":CLASS});
        }
        this.Push(arg);
      },

      //
      //  Implements \style{style-string}{math} with style filter
      //
      STYLE_attribute: function (name) {
        var style = SAFE.filterStyles(this.GetArgument(name)),
            arg   = this.GetArgumentMML(name);
        if (style) {
          if (arg.style != null) {
            if (style.charAt(style.length-1) !== ";") {style += ";"}
            style = arg.style + " " + style;
          }
          arg.With({style: style});
        }
        this.Push(arg);
      },

      //
      //  Implements \cssId{id}{math} with ID filter
      //
      ID_attribute: function (name) {
        var ID  = SAFE.filterID(this.GetArgument(name)),
            arg = this.GetArgumentMML(name);
        if (ID) {arg.With({id:ID})}
        this.Push(arg);
      }

    });

  });
  
  HUB.Register.StartupHook("TeX Jax Ready",function () {
    var TEX = MathJax.InputJax.TeX;
    
    TEX.Parse.Augment({
      
      //
      //  Implements \require{name} with filtering
      //
      Require: function (name) {
        var file = this.GetArgument(name).replace(/.*\//,"").replace(/[^a-z0-9_.-]/ig,"");
        file = SAFE.filterRequire(file);
        if (file) {this.Extension(null,file)}
      },
      
      //
      //  Controls \mmlToken attributes
      //
      MmlTokenAllow: {
        fontsize: (ALLOW.fontsize === "all"),
        id: (ALLOW.cssIDs === "all"),
        "class": (ALLOW.classes === "all"),
        style: (ALLOW.styles === "all")
      },
      
      //
      //  Handles font size macros with filtering
      //  
      SetSize: function (name,size) {
        size = SAFE.filterSize(size);
        if (size) {
          this.stack.env.size = size;
          this.Push(TEX.Stack.Item.style().With({styles: {mathsize: size+"em"}}));
        }
      }

    });
  });
  
  HUB.Register.StartupHook("TeX bbox Ready",function () {
    var TEX = MathJax.InputJax.TeX;

    //
    //  Filter the styles for \bbox
    //
    TEX.Parse.Augment({
      BBoxStyle: function (styles) {return SAFE.filterStyles(styles)}
    });

  });
  
  HUB.Register.StartupHook("MathML Jax Ready",function () {
    var PARSE = MathJax.InputJax.MathML.Parse;
    
    var METHOD = {
      href:     "filterURL",
      "class":  "filterClass", 
      id:       "filterID",
      fontsize: "filterFontSize",
      style:    "filterStyles"
    };

    //
    //  Filter MathML attributes
    //
    PARSE.Augment({
      filterAttribute: function (name,value) {
        if (METHOD[name]) {value = SAFE[METHOD[name]](value)}
        return value;
      }
    });

  });
  
  // MathML input (href, style, fontsize, class, id)

  HUB.Startup.signal.Post("Safe Extension Ready");
  AJAX.loadComplete("[MathJax]/extensions/Safe.js");

})(MathJax.Hub,MathJax.Ajax);