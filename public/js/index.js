$(document).ready(function() {
    //搜索关键字，分类，品牌，渠道，价格排序，低价，高价，当前页
    var sKeywords=[],sCategoryId,sBrandId,sChannelIds=[],priceOrder=0,lowPrice,highPrice,curPage=1;
    var totalPage=parseInt($('span.totalpage').html())
    // $("div.market-fenye>.arrow-left").trigger('click','noSearch')
    // $("div.market-fenye>.arrow-left").click()
    if (totalPage<2) {
        $("a.arrow-right.fa-angle-right").addClass('disabled')
        $('.hd-pagination-ul').find('li:eq(6)>a').addClass('disabled')
    }
    if (2==totalPage) {
        $('.hd-pagination-ul').find('li:eq(4)>a').show()
    }else if (totalPage>2) {
        $('.hd-pagination-ul').find('li:eq(4)>a').show()
        $('.hd-pagination-ul').find('li:eq(5)').show()
    }
    var pagelength=50//每页显示的数量
    function search() {
        $.post('/search', {
            sKeywords: sKeywords,
            sCategoryId: sCategoryId,
            sBrandId: sBrandId,
            sChannelIds: sChannelIds,
            priceOrder: priceOrder,
            lowPrice: lowPrice,
            highPrice: highPrice,
            curPage: curPage,
            limit: pagelength,
        }, function(data, textStatus, xhr) {
            console.log(data);
            /*optional stuff to do after success */
            var count=data.count||0
            totalPage=Math.ceil(count/pagelength)
            $('span.totalpage').html(totalPage)
            $('span.text-danger').html(count)
            if (!count) {
                $("ul#origin").hide()
                $("ul#newer").html('<p style="text-align: center;">没有查到数据！</p>').show()
                return
            }
            var flag=data.tel?true:false;
            data=data.data
            var html=''
            data.map(function(elem,index) {
                html+='<li class="item" id="item6442" data-id="6442" data-accessable="false"> <div class="gds"> <a target="_blank" class="g-img" style="line-height: 212px;"> <img src="'+elem.picture+'"> </a> </div> <div class="gtit"> <a href="javascript:;"> <span>'+elem.productname+'</span> </a> </div> <div class="gds-lr">'
                if (flag) {
                    html+='<span class="md"> <span class="spc">价格</span> <span class="goods-pt">¥'+elem.species[0].price_low+'~'+elem.species[0].price_high+'</span> </span>'
                } else {
                    html+='<div class=""> <a href="/login">登录后查看价格</a> </div>'
                }
                html+='</div> <div class="more-detail"> <div class="gds-n"> <a target="_blank">'+elem.productname+'</a> </div> <div class="spec-wrap"> <div class="s-lt" id="gspec6442">'
                elem.species.map(function(elem2,index2) {
                    html+='<a href="/goods/6442.html" target="_blank"> <div class="lt-item"> <span class="attr-t">'+elem2.speci+'</span>'
                    if (flag) {
                        html+='<a style="color: red;">¥'+elem2.price_low+'~'+elem2.price_high+'</a>'
                    } else {
                        html+='<a href="/login">登录后查看</a>'
                    }
                    html+='</div> </a>'
                })
                html+='</div> </div> </div> </li>'
            })
            $("ul#origin").hide()
            $("ul#newer").html(html).show()
            $('li.item').hover(function() {
                $(this).addClass('hover')
            }, function() {
                $(this).removeClass('hover')
            });
        });
    }
    $('a.catList').click(function () {
        var $this = $(this);
        sCategoryId = $this.data('id');
        console.log(sCategoryId);
        if (!sCategoryId) {return;}
        var name = $this.text();
        $('div.nav-crumb').show().find('span.first').show().nextAll('span[data-name="cat"]').show().find('span').html(name)
        $('div.dl.classify-filter-box.js-classify-filter-box:eq(0)').hide()
        curPage=1;
        search();
    });
    $('a.brandList').click(function () {
        var $this = $(this);
        sBrandId = $this.data('id');
        console.log(sBrandId);
        if (!sBrandId) {return;}
        var name = $this.text();
        $('div.nav-crumb').show().find('span.first').show().nextAll('span[data-name="brand"]').show().find('span').html(name)
        $('div.dl.classify-filter-box.js-classify-filter-box:eq(1)').hide()
        curPage=1;
        search();
    });
    $('i.icon-close.search-close').click(function (e,para) {
        var $span = $(this).parent().hide();
        var type = $span.data('name');
        if (type == 'cat') {
            sCategoryId = '';
            $('div.dl.classify-filter-box.js-classify-filter-box:eq(0)').show()
        } else if (type == 'brand') {
            sBrandId = '';
            $('div.dl.classify-filter-box.js-classify-filter-box:eq(1)').show()
        }
        if (!sCategoryId&&!sBrandId&&!sKeywords.length) {
            $span.parent().hide();
            $('span.fa-angle-right').hide();
        }
        curPage=1;
        if ('noSearch'!=para) {
            search();
        }
    });
    $('a.market-sort-a').click(function () {
        switch(priceOrder){
            case 0:
                priceOrder=1;
                $(this).addClass('active').find('i').removeClass('fa-angle-down').addClass('fa-angle-up').show()
                break;
            case 1:
                priceOrder=-1;
                $(this).find('i').removeClass('fa-angle-up').addClass('fa-angle-down')
                break;
            case -1:
                priceOrder=0;
                $(this).removeClass('active').find('i').hide()
                break;
        }
        search();
    });
    $('#priceSure').click(function () {
        lowPrice=parseFloat($('input[name=low]').val()).toFixed(2)
        highPrice=parseFloat($('input[name=high]').val()).toFixed(2)
        search();
    });
    $('input[name=trade_type]').click(function () {
        if ($(this).is(':checked')) {
            sChannelIds.push($(this).data('id'))
        } else {
            sChannelIds.map((elem,index)=> {
                if (elem==$(this).data('id')) {
                    sChannelIds.splice(index,1)
                    return false;
                }
            })
        }
        search();
    });
    $('li>a.channel').click(function () {
        var $parent=$(this).parent()
        if ($parent.hasClass('active')) {
            return;
        } else {
            $parent.addClass('active').siblings('li').removeClass('active')
        }
        var $this = $(this);
        var channelId = $this.data('id');
        if (!channelId) {
            window.location.reload()
            return;
        }else{
            sKeywords=[]
            sCategoryId=''
            sBrandId=''
            sChannelIds=[]
            priceOrder=0
            lowPrice=''
            highPrice=''
            curPage=1;
            $('input[name=low]').val('')
            $('input[name=high]').val('')
            $('a.market-sort-a').removeClass('active').find('i').hide()
            $('.btn-group>label').hide()
            $('i.icon-close.search-close').trigger('click','noSearch')
        }
        curPage=1;
        search();
    });

    $('input[name="search"]').click(function () {
        var value=$('input[name=keyword]').val().trim()
        if (!value) {return}
        sCategoryId=''
        sBrandId=''
        sChannelIds=[]
        priceOrder=0
        lowPrice=''
        highPrice=''
        curPage=1;
        $('input[name=low]').val('')
        $('input[name=high]').val('')
        $('a.market-sort-a').removeClass('active').find('i').hide()
        $('.btn-group>label').hide()
        console.log(111);
        $('i.icon-close.search-close').trigger('click','noSearch')
        console.log(222);
        curPage=1;
        sKeywords=value.split(' ')    
        $("div.nav-crumb").show().find('.filter-keyword').html(value).prev('span').show()
        $('.btn-group>label').show().find('input').removeAttr('checked')
        search();
    });
    //分页
    $("div.market-fenye>.arrow-left").click(function(e,para) {
        if (1==curPage) {return}
        $(this).next('span').html(--curPage)
        var $ul=$('.hd-pagination-ul')
        console.log(curPage);
        $ul.find('li:eq(3)>span').html(curPage)
        if (curPage>1) {
            $ul.find('li:eq(0)>a').removeClass('disabled')
            $ul.find('li:eq(2)>a').show().html(curPage-1)
        } else {
            $ul.find('li:eq(0)>a').addClass('disabled')
            $ul.find('li:eq(2)>a').hide()
        }
        if (curPage>2) {
            $ul.find('li:eq(1)').show()
        } else {
            $ul.find('li:eq(1)').hide()
        }
        if (totalPage>curPage) {
            $ul.find('li:eq(6)>a').removeClass('disabled')
            $ul.find('li:eq(4)>a').show().html(curPage+1)
        } else {
            $ul.find('li:eq(6)>a').addClass('disabled')
            $ul.find('li:eq(4)>a').hide()
        }
        if (totalPage>(curPage+1)) {
            $ul.find('li:eq(5)').show()
        } else {
            $ul.find('li:eq(5)').hide()
        }
        if ('noSearch'!=para) {
            search();
        }
    });
    $("div.market-fenye>.arrow-right").click(function(event) {
        if (totalPage==curPage) {return}
        curPage+=2
        $("div.market-fenye>.arrow-left").removeClass('disabled').click()
    });
    $("li.prev>a,.hd-pagination-ul>li:eq(2)>a").click(function(event) {
        $("div.market-fenye>.arrow-left").click()
    });
    $("li.next>a,.hd-pagination-ul>li:eq(4)>a").click(function(event) {
        $("div.market-fenye>.arrow-right").click()
    });
    $("#pageJumpNum_").focus(function() {
        $(this).val("");
      }).blur(function() {
        if (!$(this).val() || isNaN(parseInt($(this).val()))) {
          $(this).val("1");
        }
      }).keyup(function(e) {
        if (e.keyCode == 13) {
          $("#pageJumpBtn_").click();
        }
      });

      $("#pageJumpBtn_").click(function(e) {
        e.preventDefault();
        var page=parseInt($("#pageJumpNum_").val())
        // if (curPage==page) {return}
        curPage=Math.min(page,totalPage)+1
        $("div.market-fenye>.arrow-left").click()
      });
});


