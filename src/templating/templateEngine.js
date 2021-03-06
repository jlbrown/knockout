// If you want to make a custom template engine,
// 
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents, 
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }' 
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

ko.templateEngine = function () { };

ko.templateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    throw "Override renderTemplateSource";
};

ko.templateEngine.prototype['createJavaScriptEvaluatorBlock'] = function (script) {
    throw "Override createJavaScriptEvaluatorBlock";
};

ko.templateEngine.prototype['makeTemplateSource'] = function(template) {
    // Named template
    if (typeof template == "string") {
        var elem = document.getElementById(template);
        if (!elem)
            throw new Error("Cannot find template with ID " + template);
        return new ko.templateSources.domElement(elem);
    } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
        // Anonymous template
        return new ko.templateSources.anonymousTemplate(template);
    } else
        throw new Error("Unknown template type: " + template);
};

ko.templateEngine.prototype['renderTemplate'] = function (template, bindingContext, options) {
    var templateSource = this['makeTemplateSource'](template);
    return this['renderTemplateSource'](templateSource, bindingContext, options);
};

ko.templateEngine.prototype['isTemplateRewritten'] = function (template) {
    // Skip rewriting if requested
    if (this['allowTemplateRewriting'] === false)
        return true;
    
    // Perf optimisation - see below
    if (this.knownRewrittenTemplates && this.knownRewrittenTemplates[template])
        return true;
    
    return this['makeTemplateSource'](template)['data']("isRewritten");
};

ko.templateEngine.prototype['rewriteTemplate'] = function (template, rewriterCallback) {
    var templateSource = this['makeTemplateSource'](template);          
    var rewritten = rewriterCallback(templateSource['text']());
    templateSource['text'](rewritten);
    templateSource['data']("isRewritten", true);
    
    // Perf optimisation - for named templates, track which ones have been rewritten so we can
    // answer 'isTemplateRewritten' *without* having to use getElementById (which is slow on IE < 8)
    if (typeof template == "string") {
        this.knownRewrittenTemplates = this.knownRewrittenTemplates || {};
        this.knownRewrittenTemplates[template] = true;            
    }
};

ko.exportSymbol('templateEngine', ko.templateEngine);
