/*! FX Common JS.
 * Copyright (c) 2015 HaiDai. All rights reserved.
 */

(function($, window, undefined) {

  'use strict';

  //当 fxc-common.js 被重复引入时进行提示
  if ($.fxc !== undefined) {
    console.warn('fx-common.js has already been loaded!');
    return;
  }
  
  var document = window.document,
  console = window.console,
  fieldErrorWithIcon = true,
  fxc;

  $.fxc = fxc = {

    // 系统提示信息相关的（fieldErrors、actionErrors、actionMessages）的样式名定义
    messageBoxId_: 'messageBox',
    controlGroupClass_: 'control-group',
    fieldErrorGroupClass_: 'error',
    fieldErrorClass_: 'alert-field-error', // 输入框的固定位置的出错信息（div/span）的样式
    fieldErrorDriftFieldClass_: 'alert-error-drift', // 输入框的动态浮动的出错信息
    fieldErrorDriftClass_: 'alert alert-block alert-warning alert-error-drift',
    fieldErrorFieldClass_: 'fx-error-field', // 标注出错的输入框
    actionErrorClass_: 'alert alert-block alert-error alert-danger alert-dismissable',
    actionMessageClass_: 'alert alert-block alert-success alert-dismissable',
    exceptionErrorClass_: 'alert alert-block alert-warning alert-dismissable',
    // 关闭系统提示信息框的按钮
    messageBoxCloseBtn_: '<button type="button" class="close" data-dismiss="alert">&times;</button>',

    // ajax 操作成功时（仅仅是 status 200，也可能包含业务错误）的回调接口
    ajaxSuccess: function(data, status, xhr, fragment, tmpl, scrollTo, fragmentCallback) {
      var ct = xhr.getResponseHeader('content-type') || '',
          $fragment = $(fragment),
          $tmpl = $(tmpl || fragment + '-tmpl'),
          $scrollTo = $(scrollTo);
      if (!/^\.|#/.test(fragment) && !$fragment.length) {
        $fragment = $('#' + fragment);
        $tmpl = $('#' + fragment + '-tmpl');
      }

      if (ct.indexOf('text/html') === -1) {
        // 判断返回的数据类型，如果是 string，则需要解析为 json 对象
        if ($.type(data) === 'string') {
          data = $.parseJSON(data);
        }

        // 如果存在 js 模版元素，则使用 json 数据显示 js 模版
        if ($tmpl.length) {
          fxc.render($fragment.selector, $tmpl.selector, data);
          if ($scrollTo.length) {
            $scrollTo.ScrollTo({offsetTop: 30});
          }
          fxc.debug('Rendered fragment {0} with js template {1}.', $fragment.selector, $tmpl.selector);
        } else {
          fxc.drawMessages(data);
        }
      } else if ($fragment.length) {
        $fragment.html(data);
        if ($scrollTo.length) {
          $scrollTo.ScrollTo({offsetTop: 30});
        }
        fxc.debug('Rendered fragment {0} with html.', $fragment.selector);
      }

      // 如果有指定 fragmentCallback 则执行
      if ($.isFunction(fragmentCallback)) {
        fragmentCallback();
      }
    },

    // ajax 操作失败时（status 非 200，如服务器内部错误）
    ajaxError: function(error, status, xhr) {
      fxc.drawMessages(error, null, xhr);
    },

    // 获取系统提示信息的 div 的 jquery 对象
    $messageBox: function(messageBoxId) {
      messageBoxId = messageBoxId || fxc.messageBoxId_;
      var $messageBox = $('#' + messageBoxId),
          $container = $('body');
      if (!$messageBox.length) {
        if ($('.fx-container').length) {
          $container = $('.fx-container');
        }
        $container.prepend('<div id="' + fxc.messageBoxId_ + '"></div>');
        $messageBox = $('#' + fxc.messageBoxId_);
      }
      return $messageBox;
    },

    // 显示添加样式的提示信息
    showMessage: function(message, isSuccess, messageBoxId) {
      fxc.clearMessages(messageBoxId);

      var messageHtml,
          messageClass = isSuccess ? fxc.actionMessageClass_ : fxc.actionErrorClass_,
          $messageBox = fxc.$messageBox(messageBoxId),
          hasNoOpenModal = !$('.modal.fade.in').length;

      if (message) {
        messageHtml = '<div>' + fxc.messageBoxCloseBtn_ + message + '</div>';
        $messageBox.append($(messageHtml).addClass(messageClass));
        if (hasNoOpenModal) {
          window.scrollTo(0, $messageBox.offset().top - 200);
        }
      }
    },

    // 将系统返回的 fieldErrors、actionErrors、actionMessages 显示到页面
    drawMessages: function(reply, messageBoxId, xhr, parent) {
      fxc.clearMessages(messageBoxId);

      // 定义将被多个代码块使用的局部变量，避免 JSLint 提示：'xx' is already defined.
      var position, i,
          $messageBox = fxc.$messageBox(messageBoxId),
          hasNoOpenModal = !$('.modal.fade.in').length;

      // 如果返回消息有错误, 则显示异常信息
      if (xhr && xhr.status != 200 || reply.exception) {
        var status = xhr ? xhr.status : '',
            statusText = xhr ? xhr.statusText : '',
            exception = reply.exception,
            exceptionHtml = '<div>' + fxc.messageBoxCloseBtn_;

        if (!status && exception && exception.status != 200) {
          status = exception.status;
        }

        if (statusText && status !== 605) {
          exceptionHtml += '<h4>' + statusText + ' ' + status + '</h4>';
        }

        if (status === 401 || status === 403) {
          exceptionHtml += '对不起，您没有权限进行该操作！';
        } else if (status === 605) {
          exceptionHtml += '对不起， 请登录后再操作！';
        } else if (status === 404 || status === 405) {
          if (exception && exception.message) {
            exceptionHtml += exception.message;
          } else {
            exceptionHtml += '对不起，您请求的资源不存在！';
          }
        } else if (status === 413) {
          exceptionHtml += exception.message;
        } else {
          exceptionHtml += '对不起，访问出错了。';
        }

        exceptionHtml += '</div>';
        $messageBox.append($(exceptionHtml).addClass(fxc.exceptionErrorClass_));

        if (hasNoOpenModal) {
          position = $messageBox.offset();
          window.scrollTo(0, position.top - 200);
        }
        return;
      }

      var hasActionMessages = fxc.hasMessages(reply);
      if (hasActionMessages) {
        var messages = fxc.getMessages(reply),
            messageHtml = '<div>' + fxc.messageBoxCloseBtn_;

        if (messages.length > 1) {
          messageHtml += '<ul>';
          for (i = 0; i < messages.length; i++) {
            messageHtml += '<li>' + messages[i] + '</li>';
          }
          messageHtml += '</ul>';
        } else {
          messageHtml += messages[0];
        }

        messageHtml += '</div>';
        $messageBox.append($(messageHtml).addClass(fxc.actionMessageClass_));

        if (hasNoOpenModal) {
          position = $messageBox.offset();
          window.scrollTo(0, position.top - 200);
        }
      }

      var errors = fxc.getErrors(reply),
          hasActionErrors = errors && errors.length > 0;
      if (hasActionErrors) {
        var errorHtml = '<div>' + fxc.messageBoxCloseBtn_;

        if (errors.length > 1) {
          errorHtml += '<ul>';
          for (i = 0; i < errors.length; i++) {
            errorHtml += '<li>' + (errors[i].defaultMessage || errors[i]) + '</li>';
          }
          errorHtml += '</ul>';
        } else {
          errorHtml += (errors[0].defaultMessage || errors[0]);
        }

        errorHtml += '</div>';
        $messageBox.append($(errorHtml).addClass(fxc.actionErrorClass_));

        if (hasNoOpenModal) {
          position = $messageBox.offset();
          window.scrollTo(0, position.top - 200);
        }
      }

      var fieldErrors = reply.fieldErrors;
      if (fieldErrors) {
        var $field,
            $firstErrorField,
            $firstFieldErrorBox,
            fieldName,
            fieldNameWithoutSq,
            fieldNameEscaped,
            fieldError,
            fieldErrorBox,
            useDriftStyle;

        for (fieldName in fieldErrors) {
          fieldError = fieldErrors[fieldName][0];
          if (fieldErrorWithIcon) {
        	  fieldError = '<i class="fa fa-info-circle"></i> ' + fieldError;
          }
          useDriftStyle = false;
          fieldNameEscaped = fieldName.replace(/\[/, '\\[').replace(/\]/, '\\]');
          if (parent) {
            fieldErrorBox = $(parent + ' [name="' + fieldNameEscaped + 'Error"]')[0];
          } else {
            fieldErrorBox = null;
          }

          if (!fieldErrorBox) {
            fieldErrorBox = $('#' + fieldNameEscaped + 'Error')[0];
          }

          if (!fieldErrorBox) {
            useDriftStyle = true;
            fieldErrorBox = document.createElement('div');
            fieldErrorBox.id = fieldName + 'Error';
          }

          // 获取删除了 spring 返回的数组 error 字段中的 [xx] 部分，如：answer[0] => answer
          fieldNameWithoutSq = fieldName.replace(/\[.*\]/, '');

          if (parent) {
            $field = $(parent + ' input[name="' + fieldNameWithoutSq + '"],' +
                parent + ' textarea[name="' + fieldNameWithoutSq + '"],' +
                parent + ' checkbox[name="' + fieldNameWithoutSq + '"],' +
                parent + ' radio[name="' + fieldNameWithoutSq + '"],' +
                parent + ' select[name="' + fieldNameWithoutSq + '"]');
          } else {
            $field = $('input[name="' + fieldNameWithoutSq + '"],' +
                'textarea[name="' + fieldNameWithoutSq + '"],' +
                'checkbox[name="' + fieldNameWithoutSq + '"],' +
                'radio[name="' + fieldNameWithoutSq + '"],' +
                'select[name="' + fieldNameWithoutSq + '"]');
          }

          if (!$firstErrorField) {
            $firstErrorField = $field.first();
            $firstErrorField.focus();
          }
          $field.addClass(fxc.fieldErrorFieldClass_); // 用样式标注出错的输入框
          // 添加出错字段样式 (bootstrap 2.x)
          $field.closest('.' + fxc.controlGroupClass_).addClass(fxc.fieldErrorGroupClass_);
          // 添加出错字段样式 (bootstrap 3.0)
          $field.closest('.form-group').addClass('has-error');

          $(fieldErrorBox).addClass(fxc.fieldErrorClass_);
          $(fieldErrorBox).html(fieldError);
          if (useDriftStyle) {
            $(fieldErrorBox).addClass(fxc.fieldErrorDriftClass_);
            $(fieldErrorBox).css({
              'position': 'absolute',
              'display': 'none',
              'z-index': '999'
            });
            $field.after(fieldErrorBox);

            $field.on('mouseover', fxc.mouseoverHandler)
              .on('mouseout', fxc.mouseoutHandler)
              .on('focus', fxc.focusHandler)
              .on('blur', fxc.blurHandler);
            $field.mouseover();
          }

          $firstFieldErrorBox = $firstFieldErrorBox || $(fieldErrorBox);
        }

        if (hasNoOpenModal && $firstFieldErrorBox && !hasActionMessages && !hasActionErrors) {
          var firstPosition = $firstFieldErrorBox.offset();
          window.scrollTo(0, firstPosition.top - 200);
        }
      }
      $(".alert-field-error").removeClass("hidden");
    },

    clearMessage: function(messageBoxId) {
    	$(".alert-field-error").addClass("hidden");
      fxc.clearMessages(messageBoxId);
    },

    clearMessages: function(messageBoxId) {
      // TODO 将按钮设置为正在提交的状态
      try {
        var array = document.getElementsByTagName('input'), i;
        if (array.length > 0) {
          for (i = 0; i < array.length; i++) {
            if (array[i].type === 'submit') {
              array[i].disabled = false;
            }
          }
        }
      } catch (ex) {
        // ignore
      }

      // 清除 Success 提示信息
      messageBoxId = messageBoxId || fxc.messageBoxId_;
      var $messageBox = $('#' + messageBoxId);
      $messageBox.empty();
      //$messageBox.removeClass();

      // 清除 Action Error 提示信息
      var $errorBox = $('.' + fxc.actionErrorClass_);
      $errorBox.empty();
      $errorBox.removeClass();

      // 清除 Field Error 提示信息
      // 先把所有出错字段的提示信息清空并移除样式
      var $fieldErrorBoxes = $('.' + fxc.fieldErrorClass_);
      $fieldErrorBoxes.empty();
      $fieldErrorBoxes.removeClass(fxc.fieldErrorClass_);

      // 再把所有浮动提示的出错字段删除
      $('.' + fxc.fieldErrorDriftFieldClass_).remove();

      // 移除 bootstrap error 样式 (bootstrap 2.x)
      $('.' + fxc.controlGroupClass_).removeClass(fxc.fieldErrorGroupClass_);
      // 移除 bootstrap error 样式 (bootstrap 3.0)
      var $errorFields = $('.' + fxc.fieldErrorFieldClass_);
      $errorFields.closest('.form-group').removeClass('has-error');

      // 清除 Error Field 的绑定时间
      $errorFields.unbind('mouseover', fxc.mouseoverHandler);
      $errorFields.unbind('mouseout', fxc.mouseoutHandler);
      $errorFields.unbind('focus', fxc.focusHandler);
      $errorFields.unbind('blur', fxc.blurHandler);
    },

    mouseoutHandler: function() {
      var box = $('#' + this.name + 'Error');
      if (box.length) {
        box.hide();
      }
    },

    mouseoverHandler: function() {
      var $box = $('#' + this.name + 'Error');
      if ($box.length) {
        // 这里用 position() 比用 offset() 更通用
        // 在父元素使用相对定位的情况下，用 offset 取到的位置不符合要求
        var position = $(this).position();
        // 这里用 innerHeight() 比用 height() 更通用，因为有可能输入框会设置 padding
        // height() 不包含 padding，而 innerHeight() 包含 padding
        $box.css('top', position.top + $(this).innerHeight() + 4);
        $box.css('left', position.left);
        $box.show();
      }
    },

    focusHandler: function() {
      var $box = $('#' + this.name + 'Error');
      if ($box.length) {
        var position = $(this).position();
        $box.css('top', position.top + $(this).innerHeight() + 4);
        $box.css('left', position.left);
        $box.show();
      }
    },

    blurHandler: function() {
      var $box = $('#' + this.name + 'Error');
      if ($box.length) {
        $box.hide();
      }
    },

    hasErrors: function(reply) {
      if (!reply) {
        return false;
      }

      // 如果相应消息中包含脚本则执行
      if (reply.script) {
        new Function(reply.script)();
        return true;
      }

      if (reply.hasErrors || reply.exception) {
        return true;
      }

      // 以下是通过 Controller.addActionError()、Controller.addFieldError() 添加的消息的判断方式
      if (!$.isEmptyObject(reply.fieldErrors)) {
        return true;
      }

      var errors = fxc.getErrors(reply);
      return errors && errors.length > 0;
    },

    hasMessages: function(reply) {
      if (!reply) {
        return false;
      }

      var messages = fxc.getMessages(reply);
      return messages && messages.length > 0;
    },

    getErrors: function(reply) {
      return reply.errors || reply.actionErrors;
    },

    getMessages: function(reply) {
      return reply.messages || reply.actionMessages || reply.message;
    },

    stackTraceSwitch: function() {
      if ($('#stackTrace').is(':hidden')) {
        $('#stackTraceText').text('隐藏错误详情');
        $('#stackTrace').show();
      } else {
        $('#stackTraceText').text('显示错误详情');
        $('#stackTrace').hide();
      }
    },

    // 滚动一屏幕的时候回调接口
    triggerByScroll: function(handler) {
      if (!$.isFunction(handler)) {
        return;
      }

      $(document).scroll(function() {
        if ($(window).scrollTop() + $(window).height() === $(document).height()) {
          handler();
        }
      });
    },

    _s4: function() {
      return Math.floor((1 + Math.random()) * 0x10000) .toString(16).substring(1);
    },

    // 生成 uuid 字符串
    uuid: function() {
      var uuid = '', i = 0;
      for (i = 0; i < 8; i++) {
        uuid += fxc._s4();
      }
      return uuid;
    },

    debug: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('debug');
      fxc.log.apply(null, args);
    },

    warn: function(message) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('warn');
      fxc.log.apply(null, args);
    },

    error: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('error');
      fxc.log.apply(null, args);
    },

    // 输出日志到控制台，方便开发时 debug
    // 注意：只有当获取到全局变量 JS_DEBUG为 true 时，才会输出日志
    log: function(level, message) {
      if (typeof console === 'undefined' ||
          typeof JS_DEBUG=== 'undefined' || JS_DEBUG!== true) {
        return;
      }

      var args = Array.prototype.slice.call(arguments, 1),
          result = fxc.format.apply(null, args);
      if (level === 'warn') {
        console.warn(result);
      } else if (level === 'error') {
        console.error.apply(console, args);
      } else {
        console.log(result);
      }
    },

    // 格式化字符串
    // e.g. format('hello, {0} and {1}', 'foo', 'bar') -> 'hello, foo and bar'
    format: function(str) {
      var args = Array.prototype.slice.call(arguments, 1);
      if (!args.length) {
        return str;
      }

      var pattern = new RegExp('{([0-' + (args.length - 1) + '])}', 'g');
      return String(str).replace(pattern, function(match, index) {
        return args[index];
      });
    },

    // 显示 JS 模版
    render: function(fragment, tmpl, data, isAppend) {
      var hbs = window.Handlebars;
      if (!hbs) {
        fxc.warn('Handlebars.js is not loaded!');
        return;
      }

      var $fragment = $(fragment),
          $tmpl = $(tmpl);
      if (!$fragment.length) {
        fxc.warn('Fragment {0} is not exists.', fragment);
        return;
      }

      if (!$tmpl.length) {
        fxc.warn('Js template {0} is not exists.', tmpl);
        return;
      }

      // 判断返回的数据类型，如果是 string，则需要解析为 json 对象
      if ($.type(data) === 'string') {
        data = $.parseJSON(data);
      }

      var template = hbs.compile($tmpl.text()),
          content = template(data);
      if (isAppend) {
        $fragment.append(content);
      } else {
        $fragment.html(content);
      }
    },

    // 显示 JS 模版
    get: function(url, params, others, type) {
      if (!url.startsWith("http://") && window.getContextPath) {
        url = getContextPath() + url;
      }

      $.get(url, params, function(data) {
        if ($.isFunction(others)) {
          others(data);
        } else {
          fxc.render(others.fragment, others.tmpl, data);
        }
      }, type || 'json');
    },

    // 根据函数名获取函数对象
    getFunc: function(fnName, context) {
      context = context || window;
      var args = Array.prototype.slice.call(arguments).splice(2);
      var namespaces = fnName.split(".");
      var fn = namespaces.pop();
      for (var i = 0; i < namespaces.length; i++) {
          context = context[namespaces[i]];
      }
      return (typeof context[fn] === 'function') ? context[fn] : null;
    }
  };

  // 美化文件上传按钮
  $.beautifyFileInput = function() {
    $('input[type=file].fx-file').each(function(i, elem) {
      var $input = $(this), btnTitle = '请选择文件...';
      if (!$input.prop('id')) {
        $input.prop('id', 'file_' + i);
      }

      if ($input.prop('title')) {
        btnTitle = $input.prop('title');
      }
      $input.wrap('<div class="file-input"></div>');

      var $btn = $('<a class="btn btn-success"><label for="' + $input.prop('id')
          + '"><i class="fa fa-plus"></i> ' + btnTitle + '</label></a>');
      $input.before($btn);

      $input.change(function() {
        var filename = $(this).val();
        // 去掉 C:\f71baea 这样的前缀
        filename = filename.substring(filename.lastIndexOf('\\') + 1, filename.length);

        $btn.next('.name').remove();
        $btn.after('<span class="name">' + filename + '</span>');
      });
    });
  };

  $(function() {
//    if (!$('#fx-loading-box').length) {
//      $('body').append('<div id="fx-loading-box" class="loading-box-wrapper" style="display:none">' +
//        '<div class="loading-box">正在加载...</div></div>');
//    }

    // 美化文件上传按钮
    $.beautifyFileInput();

    // 找出所有设置了 data-date 属性的字段，设置日期控件
    if ($.datepicker) {
      $('input[data-date]').each(function() {
        var yrange = $(this).attr('data-yearRange') || 'c-10:c',
            minDateStr = $(this).attr('data-minDate'),
            maxDateStr = $(this).attr('data-maxDate'),
            minDate = undefined, maxDate = undefined;

        if (minDateStr) {
          minDate = new Date(minDateStr);
        }
        if (maxDateStr) {
          maxDate = new Date(maxDateStr);
        }

        $(this).datepicker({
          changeMonth: true,
          changeYear: true,
          yearRange: yrange,
          minDate: minDate,
          maxDate: maxDate,
          onSelect: function() {
            if (typeof datePickerSelectCallback === 'function') {
              datePickerSelectCallback();
            }
          }
        });
      });
    }

    // 找出所有设置了 data-time 属性的字段，设置时间控件
    if ($.timepicker) {
      $('input[data-time]').datetimepicker2({
        format: 'yyyy-mm-dd hh:ii',
        onSelect: function() {
          if (typeof timePickerSelectCallback === 'function') {
            timePickerSelectCallback();
          }
        }
      });
    }

    // 设置 bootstrap-datetimepicker 时间控件
    if ($.fn.datetimepicker) {
      $('div[data-datetimepicker]').datetimepicker({
        language: 'zh-CN',
        weekStart: 1,
        autoclose: true,
        todayBtn: true,
        todayHighlight: true,
        pickerPosition: 'bottom-left'
      });

      $('div[data-datepicker]').datetimepicker({
        language: 'zh-CN',
        format: 'yyyy-mm-dd',
        weekStart: 1,
        minView: 2,
        autoclose: true,
        todayBtn: true,
        todayHighlight: true,
        pickerPosition: 'bottom-left'
      });

      var startTime = new Date();
      startTime.setHours(0);
      startTime.setMinutes(0);
      startTime.setSeconds(0);
      $('div[data-timepicker]').datetimepicker({
        language: 'zh-CN',
        format: 'hh:ii',
        startDate: startTime,
        startView: 1,
        minView: 0,
        maxView: 1,
        autoclose: true,
        todayBtn: true,
        todayHighlight: true,
        pickerPosition: 'bottom-left'
      });
    }
  });

  // 定义 ajax 成功后的回调方法
  var ajaxSuccessCallback = function(evt, data, status, xhr) {
    evt.stopPropagation(); // 阻止冒泡事件

    var callback, callbackStr = $(this).data('success');
    if (callbackStr) {
      fxc.debug('data-success: {0}', callbackStr);
      callback = fxc.getFunc(callbackStr, window);
    }
    
    callback = callback || fxc.ajaxSuccess;
    
    try {
      // 获取在返回 html 数据时需要被替换内容的页面片段节点
      var fragment = $(this).data('fragment'),
          tmpl = $(this).data('tmpl'),
          scrollTo = $(this).data('scroll'),
          fragmentCallbackStr = $(this).data('fragment-callback'),
          fragmentCallback;

      if (fragmentCallbackStr) {
        fxc.debug('data-fragment-callback: {0}', fragmentCallbackStr);
        fragmentCallback = fxc.getFunc(fragmentCallbackStr, window);
      }

      callback(data, status, xhr, fragment, tmpl, scrollTo, fragmentCallback);
    } catch (e) {
      fxc.error(e.message, e);
    }
  };

  // 定义 ajax 出错后的回调方法
  var ajaxErrorCallback = function(evt, xhr, status, error) {
    evt.stopPropagation(); // 阻止冒泡事件

    var callback, callbackStr = $(this).data('error');
    if (callbackStr) {
      fxc.debug('data-error: {0}', callbackStr);
      callback = fxc.getFunc(callbackStr, window);
    }

    callback = callback || fxc.ajaxError;

    try {
      fxc.debug('status: {0}, error: {1}', status, error);
      callback(error, status, xhr);
    } catch (e) {
      fxc.error(e.message, e);
    }
  };

  var isAjaxLoadingBoxEnable = function() {
    return typeof(isAjaxLoadingBoxDisabled) === 'undefined' || !isAjaxLoadingBoxDisabled;
  };

  // Show loading status when ajax call
  $(document).ajaxStart(function() {
    if (isAjaxLoadingBoxEnable()) {
      NProgress.start();
      $('#fx-loading-box').show();
    }
  }).ajaxStop(function() {
    if (isAjaxLoadingBoxEnable()) {
      $('#fx-loading-box').hide();
    }
  }).ajaxSuccess(function(evt, xhr) {
    var data = xhr.responseText,
        ct = xhr.getResponseHeader('content-type') || '';
    // 判断返回的数据类型，如果是 string，则需要解析为 json 对象
    if (ct.indexOf('text/html') === -1) {
      if ($.type(data) === 'string') {
        data = $.parseJSON(data);
        // 如果是一段脚本则执行，主要为了支持 session 过期后，请求 ajax 后可以刷新页面
        if (data && data.script) {
          new Function(data.script)();
        }
      }
    }
    NProgress.done();
  }).ajaxError(function(evt, xhr, settings, error) {
    if (xhr.status > 0) { // 不提示 status 0 的情况
      ajaxErrorCallback(evt, xhr, xhr.status, error);
    }
    NProgress.done();
  });

  // 绑定 jquery-ujs ajax 回调方法
  $(document).on('ajax:success', 'form, a, button, input, textarea, select', ajaxSuccessCallback);
  
  $(document).on('click', '.hdMenu', function() {
	var $this = $(this);
	$('.hdMenu').parent().removeClass('active');
	$this.parent().addClass('active');
  });
  
  $(document).on('click', '.hdAdminMenu', function() {
	var $this = $(this);
	var $menuLi = $('.hdMenuLi');
	var $menuLiNav = $('.hdMenuLi li');
	$menuLi.removeClass('open').removeClass('active');
	 $menuLiNav.removeClass('active');
	$this.parent().parent().parent().addClass('open').addClass('active');
	$this.parent().addClass('active');
  });
})(jQuery, window);

// Chinese initialisation for the date picker and time picker.
(function($) {
  if ($.datepicker) {
    $.datepicker.regional['zh-CN'] = {
      closeText: '关闭',
      prevText: '&#x3C;上月',
      nextText: '下月&#x3E;',
      currentText: '今天',
      monthNames: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月' ],
      monthNamesShort: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月' ],
      dayNames: [ '星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六' ],
      dayNamesShort: [ '周日', '周一', '周二', '周三', '周四', '周五', '周六' ],
      dayNamesMin: [ '日', '一', '二', '三', '四', '五', '六' ],
      weekHeader: '周',
      dateFormat: 'yy-mm-dd',
      firstDay: 1,
      isRTL: false,
      showMonthAfterYear: true,
      yearSuffix: '年'
    };
    $.datepicker.setDefaults($.datepicker.regional['zh-CN']);
  }

  if ($.timepicker) {
    $.timepicker.regional['zh-CN'] = {
      timeOnlyTitle: '选择时间',
      timeText: '时间',
      hourText: '小时',
      minuteText: '分钟',
      secondText: '秒钟',
      millisecText: '微秒',
      timezoneText: '时区',
      currentText: '现在时间',
      closeText: '关闭',
      timeFormat: 'HH:mm',
      amNames: ['AM', 'A'],
      pmNames: ['PM', 'P'],
      isRTL: false
    };
    $.timepicker.setDefaults($.timepicker.regional['zh-CN']);
  }
})(jQuery);

/**
 * Simplified Chinese translation for bootstrap-datetimepicker.
 */
(function($) {
  if ($.fn.datetimepicker) {
    $.fn.datetimepicker.dates['zh-CN'] = {
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        today: "今天",
        suffix: [],
        meridiem: ["上午", "下午"]
    };
  }
})(jQuery);

// String monkey patches
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
    position = position || this.length;
    position = position - searchString.length;
    var lastIndex = this.lastIndexOf(searchString);
    return lastIndex !== -1 && lastIndex === position;
  };
}

(function($) {
  $.fn.insertText = function(text) {
    this.each(function() {
      if (this.tagName !== 'INPUT' && this.tagName !== 'TEXTAREA') {
        return;
      }

      if (document.selection) {
        this.focus();
        var cr = document.selection.createRange();
        cr.text = text;
        cr.collapse();
        cr.select();
      } else if (this.selectionStart !== undefined) {
        var start = this.selectionStart;
        var end = this.selectionEnd;
        this.value = this.value.substring(0, start) + text + this.value.substring(end, this.value.length);
        this.selectionStart = this.selectionEnd = start + text.length;
      } else {
        this.value += text;
      }
    });

    return this;
  };

  $.fn.getRange = function() {
    var position = 0;
    if (document.selection) {
      this.focus();
      var sel = document.selection.createRange();
      Sel.moveStart ('character', -this.val().length);
      position = sel.text.length;
    } else if (this[0].selectionStart || this[0].selectionStart == '0') {
      position = this[0].selectionStart;
    }
    return position;
  };

  $.fn.selectRange = function(start, end) {
    if (!end) end = start;
    return this.each(function() {
      if (this.setSelectionRange) {
        this.focus();
        this.setSelectionRange(start, end);
      } else if (this.createTextRange) {
        var range = this.createTextRange();
        range.collapse(true);
        range.moveEnd('character', end);
        range.moveStart('character', start);
        range.select();
      }
    });
  };
})(jQuery);

function logoutCallback(reply) {
  if ($.fxc.hasErrors(reply)) {
    return;
  }
  
  window.location.href = getContextPath() +  reply.data.redirect;
}

function ecbaoCallback(reply) {
  if ($.fxc.hasErrors(reply)) {
	$.fxc.drawMessages(reply);
    return;
  }
  
  alert(replay.data.data);
}

function hdalert(str,fn,hold){
	hold=hold||1300;
  $.blockUI({ 
        message: '<h1 class="hd-alert">'+str+'</h1>',
        timeout: hold,
        showOverlay: false, // loading模态的话取消这项或设置为true
        css: { 
			zIndex:99999,
            width: '300px',
            padding:'20px',
            border: 'none',
            fontSize: '20px',
            margin: '0',
            background:'rgba(8,8,8,0.8)',
            color: '#fff' ,
			callbackHandler: fn && setTimeout(function(){fn()},hold+500)
        } 
  })
}


