(function (root, doc, factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["jquery"], function ($) {
            factory($, root, doc);
            return $.mobile;
        });
    } else {
        // Browser globals
        factory(root.jQuery, root, doc);
    }
}


(this, document, function(jQuery, window, document, undefined) {
    (function ($) {
        $.mobile = {};
    }(jQuery));
    
    

    (function( $, undefined ) {

        $.mobile.behaviors.formReset = {
            _handleFormReset: function() {
                this._on( this.element.closest( "form" ), {
                    reset: function() {
                        this._delay( "_reset" );
                    }
                });
            }
        };
        
        })( jQuery );
        (function ($, undefined) {

            $.widget("mobile.slider", $.extend({
                initSelector: "input[type='range'], :jqmData(type='range'), :jqmData(role='slider')",

                widgetEventPrefix: "slide",

                options: {
                    theme: null,
                    trackTheme: null,
                    corners: true,
                    mini: false,
                    highlight: false
                },

                _create: function () {

                    // TODO: Each of these should have comments explain what they're for
                    var self = this,
                        control = this.element,
                        trackTheme = this.options.trackTheme || $.mobile.getAttribute(control[0], "theme"),
                        trackThemeClass = trackTheme ? " ui-bar-" + trackTheme : " ui-bar-inherit",
                        cornerClass = (this.options.corners || control.jqmData("corners")) ? " ui-corner-all" : "",
                        miniClass = (this.options.mini || control.jqmData("mini")) ? " ui-mini" : "",
                        cType = control[0].nodeName.toLowerCase(),
                        isToggleSwitch = (cType === "select"),
                        isRangeslider = control.parent().is(":jqmData(role='rangeslider')"),
                        selectClass = (isToggleSwitch) ? "ui-slider-switch" : "",
                        controlID = control.attr("id"),
                        $label = $("[for='" + controlID + "']"),
                        labelID = $label.attr("id") || controlID + "-label",
                        min = !isToggleSwitch ? parseFloat(control.attr("min")) : 0,
                        max = !isToggleSwitch ? parseFloat(control.attr("max")) : control.find("option").length - 1,
                        step = window.parseFloat(control.attr("step") || 1),
                        domHandle = document.createElement("a"),
                        handle = $(domHandle),
                        domSlider = document.createElement("div"),
                        slider = $(domSlider),
                        valuebg = this.options.highlight && !isToggleSwitch ? (function () {
                            var bg = document.createElement("div");
                            bg.className = "ui-slider-bg " + $.mobile.activeBtnClass;
                            return $(bg).prependTo(slider);
                        })() : false,
                        options,
                        wrapper,
                        j, length,
                        i, optionsCount, origTabIndex,
                        side, activeClass, sliderImg;

                    $label.attr("id", labelID);
                    this.isToggleSwitch = isToggleSwitch;

                    domHandle.setAttribute("href", "#");
                    domSlider.setAttribute("role", "application");
                    domSlider.className = [this.isToggleSwitch ? "ui-slider ui-slider-track ui-shadow-inset " : "ui-slider-track ui-shadow-inset ", selectClass, trackThemeClass, cornerClass, miniClass].join("");
                    domHandle.className = "ui-slider-handle";
                    domSlider.appendChild(domHandle);

                    handle.attr({
                        "role": "slider",
                        "aria-valuemin": min,
                        "aria-valuemax": max,
                        "aria-valuenow": this._value(),
                        "aria-valuetext": this._value(),
                        "title": this._value(),
                        "aria-labelledby": labelID
                    });

                    $.extend(this, {
                        slider: slider,
                        handle: handle,
                        control: control,
                        type: cType,
                        step: step,
                        max: max,
                        min: min,
                        valuebg: valuebg,
                        isRangeslider: isRangeslider,
                        dragging: false,
                        beforeStart: null,
                        userModified: false,
                        mouseMoved: false
                    });

                    if (isToggleSwitch) {
                        // TODO: restore original tabindex (if any) in a destroy method
                        origTabIndex = control.attr("tabindex");
                        if (origTabIndex) {
                            handle.attr("tabindex", origTabIndex);
                        }
                        control.attr("tabindex", "-1").focus(function () {
                            $(this).blur();
                            handle.focus();
                        });

                        wrapper = document.createElement("div");
                        wrapper.className = "ui-slider-inneroffset";

                        for (j = 0, length = domSlider.childNodes.length; j < length; j++) {
                            wrapper.appendChild(domSlider.childNodes[j]);
                        }

                        domSlider.appendChild(wrapper);

                        // slider.wrapInner( "<div class='ui-slider-inneroffset'></div>" );

                        // make the handle move with a smooth transition
                        handle.addClass("ui-slider-handle-snapping");

                        options = control.find("option");

                        for (i = 0, optionsCount = options.length; i < optionsCount; i++) {
                            side = !i ? "b" : "a";
                            activeClass = !i ? "" : " " + $.mobile.activeBtnClass;
                            sliderImg = document.createElement("span");

                            sliderImg.className = ["ui-slider-label ui-slider-label-", side, activeClass].join("");
                            sliderImg.setAttribute("role", "img");
                            sliderImg.appendChild(document.createTextNode(options[i].innerHTML));
                            $(sliderImg).prependTo(slider);
                        }

                        self._labels = $(".ui-slider-label", slider);

                    }

                    // monitor the input for updated values
                    control.addClass(isToggleSwitch ? "ui-slider-switch" : "ui-slider-input");

                    this._on(control, {
                        "change": "_controlChange",
                        "keyup": "_controlKeyup",
                        "blur": "_controlBlur",
                        "vmouseup": "_controlVMouseUp"
                    });

                    slider.bind("vmousedown", $.proxy(this._sliderVMouseDown, this))
                        .bind("vclick", false);

                    // We have to instantiate a new function object for the unbind to work properly
                    // since the method itself is defined in the prototype (causing it to unbind everything)
                    this._on(document, { "vmousemove": "_preventDocumentDrag" });
                    this._on(slider.add(document), { "vmouseup": "_sliderVMouseUp" });

                    slider.insertAfter(control);

                    // wrap in a div for styling purposes
                    if (!isToggleSwitch && !isRangeslider) {
                        wrapper = this.options.mini ? "<div class='ui-slider ui-mini'>" : "<div class='ui-slider'>";

                        control.add(slider).wrapAll(wrapper);
                    }

                    // bind the handle event callbacks and set the context to the widget instance
                    this._on(this.handle, {
                        "vmousedown": "_handleVMouseDown",
                        "keydown": "_handleKeydown",
                        "keyup": "_handleKeyup"
                    });

                    this.handle.bind("vclick", false);

                    this._handleFormReset();

                    this.refresh(undefined, undefined, true);
                },

                _setOptions: function (options) {
                    if (options.theme !== undefined) {
                        this._setTheme(options.theme);
                    }

                    if (options.trackTheme !== undefined) {
                        this._setTrackTheme(options.trackTheme);
                    }

                    if (options.corners !== undefined) {
                        this._setCorners(options.corners);
                    }

                    if (options.mini !== undefined) {
                        this._setMini(options.mini);
                    }

                    if (options.highlight !== undefined) {
                        this._setHighlight(options.highlight);
                    }

                    if (options.disabled !== undefined) {
                        this._setDisabled(options.disabled);
                    }
                    this._super(options);
                },

                _controlChange: function (event) {
                    // if the user dragged the handle, the "change" event was triggered from inside refresh(); don't call refresh() again
                    if (this._trigger("controlchange", event) === false) {
                        return false;
                    }
                    if (!this.mouseMoved) {
                        this.refresh(this._value(), true);
                    }
                },

                _controlKeyup: function (/* event */) { // necessary?
                    this.refresh(this._value(), true, true);
                },

                _controlBlur: function (/* event */) {
                    this.refresh(this._value(), true);
                },

                // it appears the clicking the up and down buttons in chrome on
                // range/number inputs doesn't trigger a change until the field is
                // blurred. Here we check thif the value has changed and refresh
                _controlVMouseUp: function (/* event */) {
                    this._checkedRefresh();
                },

                // NOTE force focus on handle
                _handleVMouseDown: function (/* event */) {
                    this.handle.focus();
                },

                _handleKeydown: function (event) {
                    var index = this._value();
                    if (this.options.disabled) {
                        return;
                    }

                    // In all cases prevent the default and mark the handle as active
                    switch (event.keyCode) {
                        case $.mobile.keyCode.HOME:
                        case $.mobile.keyCode.END:
                        case $.mobile.keyCode.PAGE_UP:
                        case $.mobile.keyCode.PAGE_DOWN:
                        case $.mobile.keyCode.UP:
                        case $.mobile.keyCode.RIGHT:
                        case $.mobile.keyCode.DOWN:
                        case $.mobile.keyCode.LEFT:
                            event.preventDefault();

                            if (!this._keySliding) {
                                this._keySliding = true;
                                this.handle.addClass("ui-state-active"); /* TODO: We don't use this class for styling. Do we need to add it? */
                            }

                            break;
                    }

                    // move the slider according to the keypress
                    switch (event.keyCode) {
                        case $.mobile.keyCode.HOME:
                            this.refresh(this.min);
                            break;
                        case $.mobile.keyCode.END:
                            this.refresh(this.max);
                            break;
                        case $.mobile.keyCode.PAGE_UP:
                        case $.mobile.keyCode.UP:
                        case $.mobile.keyCode.RIGHT:
                            this.refresh(index + this.step);
                            break;
                        case $.mobile.keyCode.PAGE_DOWN:
                        case $.mobile.keyCode.DOWN:
                        case $.mobile.keyCode.LEFT:
                            this.refresh(index - this.step);
                            break;
                    }
                }, // remove active mark

                _handleKeyup: function (/* event */) {
                    if (this._keySliding) {
                        this._keySliding = false;
                        this.handle.removeClass("ui-state-active"); /* See comment above. */
                    }
                },

                _sliderVMouseDown: function (event) {
                    // NOTE: we don't do this in refresh because we still want to
                    //       support programmatic alteration of disabled inputs
                    if (this.options.disabled || !(event.which === 1 || event.which === 0 || event.which === undefined)) {
                        return false;
                    }
                    if (this._trigger("beforestart", event) === false) {
                        return false;
                    }
                    this.dragging = true;
                    this.userModified = false;
                    this.mouseMoved = false;

                    if (this.isToggleSwitch) {
                        this.beforeStart = this.element[0].selectedIndex;
                    }

                    this.refresh(event);
                    this._trigger("start");
                    return false;
                },

                _sliderVMouseUp: function () {
                    if (this.dragging) {
                        this.dragging = false;

                        if (this.isToggleSwitch) {
                            // make the handle move with a smooth transition
                            this.handle.addClass("ui-slider-handle-snapping");

                            if (this.mouseMoved) {
                                // this is a drag, change the value only if user dragged enough
                                if (this.userModified) {
                                    this.refresh(this.beforeStart === 0 ? 1 : 0);
                                } else {
                                    this.refresh(this.beforeStart);
                                }
                            } else {
                                // this is just a click, change the value
                                this.refresh(this.beforeStart === 0 ? 1 : 0);
                            }
                        }

                        this.mouseMoved = false;
                        this._trigger("stop");
                        return false;
                    }
                },

                _preventDocumentDrag: function (event) {
                    // NOTE: we don't do this in refresh because we still want to
                    //       support programmatic alteration of disabled inputs
                    if (this._trigger("drag", event) === false) {
                        return false;
                    }
                    if (this.dragging && !this.options.disabled) {

                        // this.mouseMoved must be updated before refresh() because it will be used in the control "change" event
                        this.mouseMoved = true;

                        if (this.isToggleSwitch) {
                            // make the handle move in sync with the mouse
                            this.handle.removeClass("ui-slider-handle-snapping");
                        }

                        this.refresh(event);

                        // only after refresh() you can calculate this.userModified
                        this.userModified = this.beforeStart !== this.element[0].selectedIndex;
                        return false;
                    }
                },

                _checkedRefresh: function () {
                    if (this.value !== this._value()) {
                        this.refresh(this._value());
                    }
                },

                _value: function () {
                    return this.isToggleSwitch ? this.element[0].selectedIndex : parseFloat(this.element.val());
                },

                _reset: function () {
                    this.refresh(undefined, false, true);
                },

                refresh: function (val, isfromControl, preventInputUpdate) {
                    // NOTE: we don't return here because we want to support programmatic
                    //       alteration of the input value, which should still update the slider

                    var self = this,
                        parentTheme = $.mobile.getAttribute(this.element[0], "theme"),
                        theme = this.options.theme || parentTheme,
                        themeClass = theme ? " ui-btn-" + theme : "",
                        trackTheme = this.options.trackTheme || parentTheme,
                        trackThemeClass = trackTheme ? " ui-bar-" + trackTheme : " ui-bar-inherit",
                        cornerClass = this.options.corners ? " ui-corner-all" : "",
                        miniClass = this.options.mini ? " ui-mini" : "",
                        left, width, data, tol,
                        pxStep, percent,
                        control, isInput, optionElements, min, max, step,
                        newval, valModStep, alignValue, percentPerStep,
                        handlePercent, aPercent, bPercent,
                        valueChanged;

                    self.slider[0].className = [this.isToggleSwitch ? "ui-slider ui-slider-switch ui-slider-track ui-shadow-inset" : "ui-slider-track ui-shadow-inset", trackThemeClass, cornerClass, miniClass].join("");
                    if (this.options.disabled || this.element.prop("disabled")) {
                        this.disable();
                    }

                    // set the stored value for comparison later
                    this.value = this._value();
                    if (this.options.highlight && !this.isToggleSwitch && this.slider.find(".ui-slider-bg").length === 0) {
                        this.valuebg = (function () {
                            var bg = document.createElement("div");
                            bg.className = "ui-slider-bg " + $.mobile.activeBtnClass;
                            return $(bg).prependTo(self.slider);
                        })();
                    }
                    this.handle.addClass("ui-btn" + themeClass + " ui-shadow");

                    control = this.element;
                    isInput = !this.isToggleSwitch;
                    optionElements = isInput ? [] : control.find("option");
                    min = isInput ? parseFloat(control.attr("min")) : 0;
                    max = isInput ? parseFloat(control.attr("max")) : optionElements.length - 1;
                    step = (isInput && parseFloat(control.attr("step")) > 0) ? parseFloat(control.attr("step")) : 1;

                    if (typeof val === "object") {
                        data = val;
                        // a slight tolerance helped get to the ends of the slider
                        tol = 8;

                        left = this.slider.offset().left;
                        width = this.slider.width();
                        pxStep = width / ((max - min) / step);
                        if (!this.dragging ||
                            data.pageX < left - tol ||
                            data.pageX > left + width + tol) {
                            return;
                        }
                        if (pxStep > 1) {
                            percent = ((data.pageX - left) / width) * 100;
                        } else {
                            percent = Math.round(((data.pageX - left) / width) * 100);
                        }
                    } else {
                        if (val == null) {
                            val = isInput ? parseFloat(control.val() || 0) : control[0].selectedIndex;
                        }
                        percent = (parseFloat(val) - min) / (max - min) * 100;
                    }

                    if (isNaN(percent)) {
                        return;
                    }

                    newval = (percent / 100) * (max - min) + min;

                    //from jQuery UI slider, the following source will round to the nearest step
                    valModStep = (newval - min) % step;
                    alignValue = newval - valModStep;

                    if (Math.abs(valModStep) * 2 >= step) {
                        alignValue += (valModStep > 0) ? step : (-step);
                    }

                    percentPerStep = 100 / ((max - min) / step);
                    // Since JavaScript has problems with large floats, round
                    // the final value to 5 digits after the decimal point (see jQueryUI: #4124)
                    newval = parseFloat(alignValue.toFixed(5));

                    if (typeof pxStep === "undefined") {
                        pxStep = width / ((max - min) / step);
                    }
                    if (pxStep > 1 && isInput) {
                        percent = (newval - min) * percentPerStep * (1 / step);
                    }
                    if (percent < 0) {
                        percent = 0;
                    }

                    if (percent > 100) {
                        percent = 100;
                    }

                    if (newval < min) {
                        newval = min;
                    }

                    if (newval > max) {
                        newval = max;
                    }

                    this.handle.css("left", percent + "%");

                    this.handle[0].setAttribute("aria-valuenow", isInput ? newval : optionElements.eq(newval).attr("value"));

                    this.handle[0].setAttribute("aria-valuetext", isInput ? newval : optionElements.eq(newval).getEncodedText());

                    this.handle[0].setAttribute("title", isInput ? newval : optionElements.eq(newval).getEncodedText());

                    if (this.valuebg) {
                        this.valuebg.css("width", percent + "%");
                    }

                    // drag the label widths
                    if (this._labels) {
                        handlePercent = this.handle.width() / this.slider.width() * 100;
                        aPercent = percent && handlePercent + (100 - handlePercent) * percent / 100;
                        bPercent = percent === 100 ? 0 : Math.min(handlePercent + 100 - aPercent, 100);

                        this._labels.each(function () {
                            var ab = $(this).hasClass("ui-slider-label-a");
                            $(this).width((ab ? aPercent : bPercent) + "%");
                        });
                    }

                    if (!preventInputUpdate) {
                        valueChanged = false;

                        // update control"s value
                        if (isInput) {
                            valueChanged = parseFloat(control.val()) !== newval;
                            control.val(newval);
                        } else {
                            valueChanged = control[0].selectedIndex !== newval;
                            control[0].selectedIndex = newval;
                        }
                        if (this._trigger("beforechange", val) === false) {
                            return false;
                        }
                        if (!isfromControl && valueChanged) {
                            control.trigger("change");
                        }
                    }
                },

                _setHighlight: function (value) {
                    value = !!value;
                    if (value) {
                        this.options.highlight = !!value;
                        this.refresh();
                    } else if (this.valuebg) {
                        this.valuebg.remove();
                        this.valuebg = false;
                    }
                },

                _setTheme: function (value) {
                    this.handle
                        .removeClass("ui-btn-" + this.options.theme)
                        .addClass("ui-btn-" + value);

                    var currentTheme = this.options.theme ? this.options.theme : "inherit",
                        newTheme = value ? value : "inherit";

                    this.control
                        .removeClass("ui-body-" + currentTheme)
                        .addClass("ui-body-" + newTheme);
                },

                _setTrackTheme: function (value) {
                    var currentTrackTheme = this.options.trackTheme ? this.options.trackTheme : "inherit",
                        newTrackTheme = value ? value : "inherit";

                    this.slider
                        .removeClass("ui-body-" + currentTrackTheme)
                        .addClass("ui-body-" + newTrackTheme);
                },

                _setMini: function (value) {
                    value = !!value;
                    if (!this.isToggleSwitch && !this.isRangeslider) {
                        this.slider.parent().toggleClass("ui-mini", value);
                        this.element.toggleClass("ui-mini", value);
                    }
                    this.slider.toggleClass("ui-mini", value);
                },

                _setCorners: function (value) {
                    this.slider.toggleClass("ui-corner-all", value);

                    if (!this.isToggleSwitch) {
                        this.control.toggleClass("ui-corner-all", value);
                    }
                },

                _setDisabled: function (value) {
                    value = !!value;
                    this.element.prop("disabled", value);
                    this.slider
                        .toggleClass("ui-state-disabled", value)
                        .attr("aria-disabled", value);

                    this.element.toggleClass("ui-state-disabled", value);
                }

            }, $.mobile.behaviors.formReset));

        })(jQuery);
        (function ($, undefined) {

            var popup;

            function getPopup() {
                if (!popup) {
                    popup = $("<div></div>", {
                        "class": "ui-slider-popup ui-shadow ui-corner-all"
                    });
                }
                return popup.clone();
            }

            $.widget("mobile.slider", $.mobile.slider, {
                options: {
                    popupEnabled: false,
                    showValue: false
                },

                _create: function () {
                    this._super();

                    $.extend(this, {
                        _currentValue: null,
                        _popup: null,
                        _popupVisible: false
                    });

                    this._setOption("popupEnabled", this.options.popupEnabled);

                    this._on(this.handle, { "vmousedown": "_showPopup" });
                    this._on(this.slider.add(this.document), { "vmouseup": "_hidePopup" });
                    this._refresh();
                },

                // position the popup centered 5px above the handle
                _positionPopup: function () {
                    var dstOffset = this.handle.offset();

                    this._popup.offset({
                        left: dstOffset.left + (this.handle.width() - this._popup.width()) / 2,
                        top: dstOffset.top - this._popup.outerHeight() - 5
                    });
                },

                _setOption: function (key, value) {
                    this._super(key, value);

                    if (key === "showValue") {
                        this.handle.html(value && !this.options.mini ? this._value() : "");
                    } else if (key === "popupEnabled") {
                        if (value && !this._popup) {
                            this._popup = getPopup()
                                .addClass("ui-body-" + (this.options.theme || "a"))
                                .hide()
                                .insertBefore(this.element);
                        }
                    }
                },

                // show value on the handle and in popup
                refresh: function () {
                    this._super.apply(this, arguments);
                    this._refresh();
                },

                _refresh: function () {
                    var o = this.options, newValue;

                    if (o.popupEnabled) {
                        // remove the title attribute from the handle (which is
                        // responsible for the annoying tooltip); NB we have
                        // to do it here as the jqm slider sets it every time
                        // the slider's value changes :(
                        this.handle.removeAttr("title");
                    }

                    newValue = this._value();
                    if (newValue === this._currentValue) {
                        return;
                    }
                    this._currentValue = newValue;

                    if (o.popupEnabled && this._popup) {
                        this._positionPopup();
                        this._popup.html(newValue);
                    }

                    if (o.showValue && !this.options.mini) {
                        this.handle.html(newValue);
                    }
                },

                _showPopup: function () {
                    if (this.options.popupEnabled && !this._popupVisible) {
                        this.handle.html("");
                        this._popup.show();
                        this._positionPopup();
                        this._popupVisible = true;
                    }
                },

                _hidePopup: function () {
                    var o = this.options;

                    if (o.popupEnabled && this._popupVisible) {
                        if (o.showValue && !o.mini) {
                            this.handle.html(this._value());
                        }
                        this._popup.hide();
                        this._popupVisible = false;
                    }
                }
            });

        })(jQuery);

        (function( $, undefined ) {

        })( jQuery );
        
        (function( $, window ) {
        
            $.mobile.iosorientationfixEnabled = true;
        
            // This fix addresses an iOS bug, so return early if the UA claims it's something else.
            var ua = navigator.userAgent,
                zoom,
                evt, x, y, z, aig;
            if ( !( /iPhone|iPad|iPod/.test( navigator.platform ) && /OS [1-5]_[0-9_]* like Mac OS X/i.test( ua ) && ua.indexOf( "AppleWebKit" ) > -1 ) ) {
                $.mobile.iosorientationfixEnabled = false;
                return;
            }
        
            zoom = $.mobile.zoom;
        
            function checkTilt( e ) {
                evt = e.originalEvent;
                aig = evt.accelerationIncludingGravity;
        
                x = Math.abs( aig.x );
                y = Math.abs( aig.y );
                z = Math.abs( aig.z );
        
                // If portrait orientation and in one of the danger zones
                if ( !window.orientation && ( x > 7 || ( ( z > 6 && y < 8 || z < 8 && y > 6 ) && x > 5 ) ) ) {
                        if ( zoom.enabled ) {
                            zoom.disable();
                        }
                }	else if ( !zoom.enabled ) {
                        zoom.enable();
                }
            }
        
            $.mobile.document.on( "mobileinit", function() {
                if ( $.mobile.iosorientationfixEnabled ) {
                    $.mobile.window
                        .bind( "orientationchange.iosorientationfix", zoom.enable )
                        .bind( "devicemotion.iosorientationfix", checkTilt );
                }
            });
        
        }( jQuery, this ));
        
        (function( $, window, undefined ) {
            var	$html = $( "html" ),
                $window = $.mobile.window;
        
            //remove initial build class (only present on first pageshow)
            function hideRenderingClass() {
                $html.removeClass( "ui-mobile-rendering" );
            }
        
            // trigger mobileinit event - useful hook for configuring $.mobile settings before they're used
            $( window.document ).trigger( "mobileinit" );
        
            // support conditions
            // if device support condition(s) aren't met, leave things as they are -> a basic, usable experience,
            // otherwise, proceed with the enhancements
            if ( !$.mobile.gradeA() ) {
                return;
            }
        
            // override ajaxEnabled on platforms that have known conflicts with hash history updates
            // or generally work better browsing in regular http for full page refreshes (BB5, Opera Mini)
            if ( $.mobile.ajaxBlacklist ) {
                $.mobile.ajaxEnabled = false;
            }
        
            // Add mobile, initial load "rendering" classes to docEl
            $html.addClass( "ui-mobile ui-mobile-rendering" );
        
            // This is a fallback. If anything goes wrong (JS errors, etc), or events don't fire,
            // this ensures the rendering class is removed after 5 seconds, so content is visible and accessible
            setTimeout( hideRenderingClass, 5000 );
        
            $.extend( $.mobile, {
                // find and enhance the pages in the dom and transition to the first page.
                initializePage: function() {
                    // find present pages
                    var path = $.mobile.path,
                        $pages = $( ":jqmData(role='page'), :jqmData(role='dialog')" ),
                        hash = path.stripHash( path.stripQueryParams(path.parseLocation().hash) ),
                        theLocation = $.mobile.path.parseLocation(),
                        hashPage = hash ? document.getElementById( hash ) : undefined;
        
                    // if no pages are found, create one with body's inner html
                    if ( !$pages.length ) {
                        $pages = $( "body" ).wrapInner( "<div data-" + $.mobile.ns + "role='page'></div>" ).children( 0 );
                    }
        
                    // add dialogs, set data-url attrs
                    $pages.each(function() {
                        var $this = $( this );
        
                        // unless the data url is already set set it to the pathname
                        if ( !$this[ 0 ].getAttribute( "data-" + $.mobile.ns + "url" ) ) {
                            $this.attr( "data-" + $.mobile.ns + "url", $this.attr( "id" ) ||
                                path.convertUrlToDataUrl( theLocation.pathname + theLocation.search ) );
                        }
                    });
        
                    // define first page in dom case one backs out to the directory root (not always the first page visited, but defined as fallback)
                    $.mobile.firstPage = $pages.first();
        
                    // define page container
                    $.mobile.pageContainer = $.mobile.firstPage
                        .parent()
                        .addClass( "ui-mobile-viewport" )
                        .pagecontainer();
        
                    // initialize navigation events now, after mobileinit has occurred and the page container
                    // has been created but before the rest of the library is alerted to that fact
                    $.mobile.navreadyDeferred.resolve();
        
                    // alert listeners that the pagecontainer has been determined for binding
                    // to events triggered on it
                    $window.trigger( "pagecontainercreate" );
        
                    // cue page loading message
                    $.mobile.loading( "show" );
        
                    //remove initial build class (only present on first pageshow)
                    hideRenderingClass();
        
                    // if hashchange listening is disabled, there's no hash deeplink,
                    // the hash is not valid (contains more than one # or does not start with #)
                    // or there is no page with that hash, change to the first page in the DOM
                    // Remember, however, that the hash can also be a path!
                    if ( ! ( $.mobile.hashListeningEnabled &&
                        $.mobile.path.isHashValid( location.hash ) &&
                        ( $( hashPage ).is( ":jqmData(role='page')" ) ||
                            $.mobile.path.isPath( hash ) ||
                            hash === $.mobile.dialogHashKey ) ) ) {
        
                        // make sure to set initial popstate state if it exists
                        // so that navigation back to the initial page works properly
                        if ( $.event.special.navigate.isPushStateEnabled() ) {
                            $.mobile.navigate.navigator.squash( path.parseLocation().href );
                        }
        
                        $.mobile.changePage( $.mobile.firstPage, {
                            transition: "none",
                            reverse: true,
                            changeHash: false,
                            fromHashChange: true
                        });
                    } else {
                        // trigger hashchange or navigate to squash and record the correct
                        // history entry for an initial hash path
                        if ( !$.event.special.navigate.isPushStateEnabled() ) {
                            $window.trigger( "hashchange", [true] );
                        } else {
                            // TODO figure out how to simplify this interaction with the initial history entry
                            // at the bottom js/navigate/navigate.js
                            $.mobile.navigate.history.stack = [];
                            $.mobile.navigate( $.mobile.path.isPath( location.hash ) ? location.hash : location.href );
                        }
                    }
                }
            });
        
            $(function() {
                //Run inlineSVG support test
                $.support.inlineSVG();
        
                // check which scrollTop value should be used by scrolling to 1 immediately at domready
                // then check what the scroll top is. Android will report 0... others 1
                // note that this initial scroll won't hide the address bar. It's just for the check.
        
                // hide iOS browser chrome on load if hideUrlBar is true this is to try and do it as soon as possible
                if ( $.mobile.hideUrlBar ) {
                    window.scrollTo( 0, 1 );
                }
        
                // if defaultHomeScroll hasn't been set yet, see if scrollTop is 1
                // it should be 1 in most browsers, but android treats 1 as 0 (for hiding addr bar)
                // so if it's 1, use 0 from now on
                $.mobile.defaultHomeScroll = ( !$.support.scrollTop || $.mobile.window.scrollTop() === 1 ) ? 0 : 1;
        
                //dom-ready inits
                if ( $.mobile.autoInitializePage ) {
                    $.mobile.initializePage();
                }
        
                // window load event
                // hide iOS browser chrome on load if hideUrlBar is true this is as fall back incase we were too early before
                if ( $.mobile.hideUrlBar ) {
                    $window.load( $.mobile.silentScroll );
                }
        
                if ( !$.support.cssPointerEvents ) {
                    // IE and Opera don't support CSS pointer-events: none that we use to disable link-based buttons
                    // by adding the 'ui-disabled' class to them. Using a JavaScript workaround for those browser.
                    // https://github.com/jquery/jquery-mobile/issues/3558
        
                    // DEPRECATED as of 1.4.0 - remove ui-disabled after 1.4.0 release
                    // only ui-state-disabled should be present thereafter
                    $.mobile.document.delegate( ".ui-state-disabled,.ui-disabled", "vclick",
                        function( e ) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }
                    );
                }
            });
        }( jQuery, this ));
}));