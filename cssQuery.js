(function (win, doc) {
  var CSSQuery,
      qS  = 'querySelector',
      qSA = qS + 'All',
      QuerySelector    = doc[qS],
      QuerySelectorAll = doc[qSA],
      getStyle;
      // There are two config points for CSS unobtrusiveness
      // They can be found via a search for 'CONFIGURE POINT'

  // TODO: JSDoc
  function walkNodeFn(node, fn, arr) {
    var result = fn(node),
        i,
        len,
        childNodes;
    if( result ) {
      // jGoods you are welcome for characters over performance
      arr.push( node );
    }
    // Using 0 as a hard stop constant
    else if( result === 0 ) {
      // TODO: This won't stop recursion from left to right though...
      return arr;
    }
    childNodes = node.childNodes;

    // Perform DFS (over BFS) since top down reading works that way
    for( i = 0, len = childNodes.length; i < len; i++ ) {
      walkNodeFn(childNodes[i], fn, arr);
    }
    return arr;
  }

  /**
   * Style Object constructor
   * @param {HTMLElement} node Node to return Style Object on
   * @returns {Object<Style>} Wrapper object with 'g' function to return style of node
   */
  Style = (function (win) {
    var gCS = win.getComputedStyle;
    return function (node) {
      var ret = { g: function () { return; } },
          style;
      // Skip over text nodes
      if( node.nodeType !== 3 ) {
        if(gCS) {
          // Second parameter is for pseudo element (we never use it)
          style = gCS(node);
          ret = { g: function (key) { return style.getPropertyValue(key) + ''; } };
        }
        else {
          style = node.currentStyle;
          if( style ) {
            ret = { g: function (key) { return style[key] + ''; } };
          }
        }
      }
      return ret;
    };
  }(win));

  /**
   * General purpose CSS Query function
   * @param {Node}    node      Node that will be searched on
   * @param {String}  query     CSS Query to find elements that match
   * @xParam {Object}  options   Object that holds additional options
   * @xParam {String}  options.r CSS rule to apply to CSS Query
   * @xParam {Boolean} options.s Stop on first item or not
   * Options have been nerfed to save on file size
   * @returns {Array.HTMLElement|HTMLElement} HTMLElement(s) that are either the node itself or children and match the CSS Query
   */
  CSSQuery = function ( node, query ) {
    var head,
        styleElt,
        styleSheet,
        cssRule,
        rules,
        arr = [],
        ruleIndex;

    // Create a stylesheet if one does not exist
    // TODO: Could create a Stylesheet Object which has creation/deletion methods but that is overengineering at this point
    // TODO: Use stylesheet.disabled if there is a flicker
    if( document.styleSheets.length < 1 ) {
      // FF does not support IE's createStyleSheet
      styleElt = document.createElement('style');
      // TODO: Bullet proof append
      head = document.getElementsByTagName("head");
      if( head && head.length > 0 ) {
        head[0].appendChild(styleElt);
      }

      // Check and keep on trying
      if( document.styleSheets.length < 1 ) {
        // TODO: Use IE addStyleSheet method here (only if failures start happening here in testing)
        // If nothing works, return early
        return arr;
      }
    }

    // Place down fallbacks
    node  = node  || doc;
    query = query || '*';

    // Grab the first styleSheet
    styleSheet = document.styleSheets[0];
    // CONFIGURE POINT 1
    cssRule    = 'position: relative; z-index: 1;';
    ruleIndex  = -1;

    // Chrome is quirky so we will do the counting out here
    rules = styleSheet.rules;
    if( !rules ) {
      rules = styleSheet.cssRules;
    }

    if( rules ) {
      ruleIndex = rules.length;
    }

    // TODO: Compress accessor strings (ie aR = "addRule")
    // Add the rule to the stylesheet
    if ( styleSheet.insertRule ) {
      styleSheet.insertRule( query + '{' + cssRule + '}', ruleIndex );
    }
    else if( styleSheet.addRule ) {
      styleSheet.addRule( query, cssRule );
    }

    // Traverse the DOM searching for our unique style
    arr = walkNodeFn(
      node,
      function (node) {
        var style = Style(node);
        // CONFIGURE POINT 2
        console.log(node, style.g('z-index'));
        return style.g('z-index') === '1';
      },
      [] );

    // Remove the rule for future searches
    if ( styleSheet.deleteRule ) {
      styleSheet.deleteRule( ruleIndex );
    }
    else if( styleSheet.removeRule ) {
      styleSheet.removeRule( ruleIndex );
    }

    return arr;
  };

  // Bind to the outside
  win.CSSQuery = CSSQuery;

}(window, document));

// Final test
window.onload = function () {
  var myDiv   = CSSQuery(document.body, '#myDiv'),
      allDivs = CSSQuery(document.body, 'div'),
  // var myDiv   = CSSQuery(null, '#myDiv'),
      // allDivs = CSSQueryAll(null, 'div'),
      i,
      div,
      text;

  if( myDiv.length > 0) {
    text = document.createTextNode('text1')
    myDiv[0].appendChild(text);
  }

  if( allDivs ) {
    for( i = allDivs.length; i--; ) {
      text = document.createTextNode('text2');
      div = allDivs[i];
      div.appendChild(text);
    }
  }
};

