(function ($) {
    var clip = null;

    $.zeroclipboard = function (params) {
        ZeroClipboard.config(params);

        clip = new ZeroClipboard();

        clip.on('complete', function () {
            $(this).trigger('zeroclipboard_complete');
        });

        clip.on('dataRequested', function () {
            $(this).trigger('zeroclipboard_dataRequested', $.proxy(clip.setText, clip));
        });
    };

    var clipElement = function (params) {
        if (clip === null) {
            throw new Error("zeroclipboard jquery plugin: 'init' not called yet")
        }
        clip.clip(this);

        if (params.complete && $.isFunction(params.complete)) {
            this.bind('zeroclipboard_complete', params.complete);
        }

        if (params.dataRequested && $.isFunction(params.dataRequested)) {
            this.bind('zeroclipboard_dataRequested', params.dataRequested);
        }
    };

    $.fn.zeroclipboard = function (params) {
        if (typeof params == "object" && !params.length) {
            return this.each($.proxy(clipElement, this, params));
        } else if (typeof params == "string" && params.toLowerCase() == "remove") {
            return this.each(function () {
                clip.unclip($(this));
            });
        }
    };
})(jQuery);
