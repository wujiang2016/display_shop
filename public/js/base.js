var Layout = function () {

    var initFixHeaderWithPreHeader = function () {
        jQuery(window).scroll(function() {
            if (jQuery(window).scrollTop()>37){
                jQuery("body").addClass("page-header-fixed");
            }
            else {
                jQuery("body").removeClass("page-header-fixed");
            }
        });
    };
    var handleScrollspy = function() {
        var scrollspy = $('body').scrollspy({
            target: '#scro',
            offset: 88
        });

        setTimeout(function() {
            $(window).scroll();
        }, 1000);
    }

    return {
        initFixHeaderWithPreHeader: initFixHeaderWithPreHeader,
        handleScrollspy: handleScrollspy
    }
}();