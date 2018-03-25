var adv = function (window,$) {

    var getAdvHtml = function () {
        $.get(getContextPath() +"/goods/listAdvByAcid?acid=" + 101, function (data) {
            var dd = JSON.parse(data);
            renderAdv(JSON.parse(dd.data.advList));
        })
    }
    
    var renderCenter = function (data) {
        var leftTime = parseInt(data.endtime) - parseInt(data.begintime);
        if (leftTime > 0 && !$.cookie('centerAdv')) {
            $("#mainAdv img").attr("src",data.atturl).bind('load',function () {
                $("#mainAdv a").attr("href",data.url);
                $("#centerAdv").modal();
            }).bind('error',function () {
                return;
            })
        }

        $('#centerAdv').on('hide.bs.modal', function (e) {
            if (!$.cookie('centerAdv')) {
                $.cookie('centerAdv',false,{path: '/'});
            }
        });
    }

    var renderBottom = function (data) {
        var leftTime = parseInt(data.endtime) - parseInt(data.begintime);
        if (leftTime > 0 && !$.cookie('bottomAdv')) {
            $("#hot-fixed-bar .t-tg img").attr("src",data.atturl).bind('load',function () {
                $("#hot-fixed-bar .t-tg").attr("href",data.url);
                $("#hot-fixed-bar").show();
            }).bind('error',function () {
                return;
            })
        }
    }

    var renderAdv = function (data) {
        if (data == "") return false;
        for (var i = 0; i < data.length; i ++ ) {
            if (data[i].cat_id == "center") {
                renderCenter(data[i]);
                continue;
            } else if (data[i].cat_id == "bottom") {
                renderBottom(data[i]);
                continue;
            } else {
                break;
            }
        }
    }

    return {
        getAdvHtml: getAdvHtml
    }
}(window,$);