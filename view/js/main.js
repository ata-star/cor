var src = null;
var prev = null;
var livetime = null;
var msie = false;
var stopped = false;
var totStopped = false;
var timer = null;
var pr = 0;
var liking = 0;
var in_progress = false;
var langSelect = false;
var commentBusy = false;
var last_popup_menu = null;
var last_popup_button = null;
var scroll_next = false;
var next_page = 1;
var page_load = true;
var loadingPage = true;
var pageHasMoreContent = true;
var divmore_height = 400;
var last_filestorage_id = null;
var mediaPlaying = false;
var liveRecurse = 0;
var savedTitle = '';
var followUpPageLoad = false;
var window_needs_alert = true;
var expanded_items = [];

var sse_bs_active = false;
var sse_offset = 0;
var sse_type;
var sse_partial_result = false;
var sse_rmids = [];
var sse_fallback_interval;

var page_cache = {};

// take care of tab/window reloads on channel change
if(localStorage.getItem('uid') !== localUser.toString()) {
	localStorage.clear();
	sessionStorage.clear();
	localStorage.setItem('uid', localUser.toString());
}
window.onstorage = function(e) {
	if(e.key === 'uid' && parseInt(e.newValue) !== localUser) {
		if(window_needs_alert) {
			window_needs_alert = false;
			alert("Your identity has changed. Page reload required!");
			window.location.reload();
			return;
		}
	}
}

$.ajaxSetup({cache: false});

$(document).ready(function() {

	$(document).on('click focus', '.comment-edit-form', handle_comment_form);
	$(document).on('click', '.conversation-settings-link', getConversationSettings);
	$(document).on('click', '#settings_module_ajax_submit', postConversationSettings);

	$(document).on('click focus', '.comment-edit-form  textarea', function(e) {
		if(! this.autocomplete_handled) {
			/* autocomplete @nicknames */
			$(this).editor_autocomplete(baseurl+"/acl?f=&n=1");
			/* autocomplete bbcode */
			$(this).bbco_autocomplete('bbcode');

			this.autocomplete_handled = true;
		}

	});

	$(document).on('keydown', '.comment-edit-form  textarea.expanded', function (e) {
		if (e.ctrlKey && e.keyCode === 13) {
			post_comment(this.id.replace('comment-edit-text-',''));
		}
	});

	// @hilmar |->
	if ( typeof(window.tao) == 'undefined' ) {
		window.tao = {};
	}
	if ( typeof(window.tao.zin) == 'undefined' ) {
		tao.zin = { syslc: '', syslcs: {}, htm: '', me: '', debug: '' };
		tao.zin.axim = '<div class="zinpax fa fa-sync fa-spin"> </div>';
		$('.navbar-app[href*="/lang"]').attr({"data-toggle": "dropdown", "aria-expand": "true", "id": "zintog"})
			.removeAttr('href').addClass('zinlcx zinlcxp dropdown dropdown-toggle');
		$('.dropdown-item[href*="/lang"]').addClass('zinlcxmi zinlcx').removeAttr('href').css('cursor','pointer');
	}
	$('.zinlcx').on('click',  function(e) {
		if (tao.zin.syslc == '') {
			$('.zinlcx').append(tao.zin.axim);
			$.ajax({
    			type: 'POST', url: 'lang', 
      			data: { zinlc: '??' }
   			}).done( function(re) {
   				tao.zin.re = JSON.parse(re);
   			 	tao.zin.syslc = tao.zin.re.lc;
   			 	tao.zin.syslcs = tao.zin.re.lcs;
				tao.zin.htm = '<ul class="zinlcs fa-ul">';
				$.each( tao.zin.syslcs, function( k, v ) {
					tao.zin.htm += '<li><a id="zinlc' + k + '" class="zinlc dropdown-item fakelink">' + k + ' ' + v + '</a></li>';
				});
				tao.zin.htm += '</ul>';
				$('.zinpax').remove();
				$('.zinlcx').append(tao.zin.htm);
				$('.zinlcxp > ul').addClass('dropdown dropdown-menu dropdown-menu-right').css('left','-16em');
   			});
			return false;
		} else {
			if (e.target.id == '') {
				// noop click on lang again
				return false;
			}
			tao.zin.me = e.target.id.substr(5);
			$('#right_aside_wrapper').append(tao.zin.axim);
			$.ajax({
	   			type: 'POST', url: 'lang', 
      			data: { zinlc: tao.zin.me }
    		}).done( function(re) {
     			tao.zin.re = JSON.parse(re);
     			location.reload(true);
    		});
		}
	});
	$('#zintog').on('click', function() {
		$('.zinlcs').toggle();
	});
	$('#dropdown-menu').on('shown.bs.dropdown', function() {
		tao.zin.debug += 'e,';
		//$('.zinlcs').removeAttr('display');
	})
		.on('mouseleave', function() {
		$(this).trigger('click');
	});
	// @hilmar <-|

	var tf = new Function('n', 's', 'var k = s.split("/")['+aStr['plural_func']+']; return (k ? k : s);');

	jQuery.timeago.settings.strings = {
		prefixAgo     : aStr['t01'],
		prefixFromNow : aStr['t02'],
		suffixAgo     : aStr['t03'],
		suffixFromNow : aStr['t04'],
		seconds       : aStr['t05'],
		minute        : aStr['t06'],
		minutes       : function(value){return tf(value, aStr['t07']);},
		hour          : aStr['t08'],
		hours         : function(value){return tf(value, aStr['t09']);},
		day           : aStr['t10'],
		days          : function(value){return tf(value, aStr['t11']);},
		month         : aStr['t12'],
		months        : function(value){return tf(value, aStr['t13']);},
		year          : aStr['t14'],
		years         : function(value){return tf(value, aStr['t15']);},
		wordSeparator : aStr['t16'],
		numbers       : aStr['t17'],
	};

	jQuery.timeago.settings.allowFuture = true;

	if(sse_enabled) {
		if(typeof(window.SharedWorker) === 'undefined') {
			// notifications with multiple tabs open will not work very well in this scenario
			var evtSource = new EventSource('/sse');

			evtSource.addEventListener('notifications', function(e) {
				var obj = JSON.parse(e.data);
				sse_handleNotifications(obj, false, false);
			}, false);

			document.addEventListener('visibilitychange', function() {
				if (!document.hidden) {
					sse_offset = 0;
					sse_bs_init();
				}
			}, false);

		}
		else {
			var myWorker = new SharedWorker('/view/js/sse_worker.js', localUser);

			myWorker.port.onmessage = function(e) {
				obj = e.data;
				console.log(obj);
				sse_handleNotifications(obj, false, false);
			}

			myWorker.onerror = function(e) {
				myWorker.port.close();
			}

			myWorker.port.start();
		}
	}
	else {
		if (!document.hidden)
			sse_fallback_interval = setInterval(sse_fallback, updateInterval);

		document.addEventListener('visibilitychange', function() {
			if (document.hidden) {
				clearInterval(sse_fallback_interval);
			}
			else {
				sse_offset = 0;
				sse_bs_init();
				sse_fallback_interval = setInterval(sse_fallback, updateInterval);
			}

		}, false);
	}

	$('.notification-link').on('click', { replace: true, followup: false }, sse_bs_notifications);

	$('.notification-filter').on('keypress', function(e) {
		if(e.which == 13) { // enter
			this.blur();
			sse_offset = 0;
			$("#nav-" + sse_type + "-menu").html('');
			$("#nav-" + sse_type + "-loading").show();

			var cn_val = $('#cn-' + sse_type + '-input').length ? $('#cn-' + sse_type + '-input').val().toString().toLowerCase() : '';

			$.get('/sse_bs/' + sse_type + '/' + sse_offset + '?nquery=' + encodeURIComponent(cn_val), function(obj) {
				console.log('sse: bootstraping ' + sse_type);
				console.log(obj);

				sse_bs_active = false;
				sse_partial_result = true;
				sse_offset = obj[sse_type].offset;
				if(sse_offset < 0)
					$("#nav-" + sse_type + "-loading").hide();

				sse_handleNotifications(obj, true, false);

			});
		}
	});

	$('.notifications-textinput-clear').on('click', function(e) {
		if(! sse_partial_result)
			return;

		$("#nav-" + sse_type + "-menu").html('');
		$("#nav-" + sse_type + "-loading").show();
		$.get('/sse_bs/' + sse_type, function(obj) {
			console.log('sse: bootstraping ' + sse_type);
			console.log(obj);

			sse_bs_active = false;
			sse_partial_result = false;
			sse_offset = obj[sse_type].offset;
			if(sse_offset < 0)
				$("#nav-" + sse_type + "-loading").hide();

			sse_handleNotifications(obj, true, false);

		});
	});

	$('.notification-content').on('scroll', function() {
		if(this.scrollTop > this.scrollHeight - this.clientHeight - (this.scrollHeight/7)) {
			sse_bs_notifications(sse_type, false, true);
		}
	});

	//mod_mail only
	$(".mail-conv-detail .autotime").timeago();

	savedTitle = document.title;

	updateInit();

	var e = document.getElementById('content-complete');
	if(e)
		pageHasMoreContent = false;

	$(document).on('hz:updateConvItems', function(event) {
		if(!bParam_mid)
			cache_next_page();
	});

});

function getConversationSettings() {
	$.get('settings/conversation/?f=&aj=1',function(data) {
		$('#conversation_settings_body').html(data);
	});
}

function postConversationSettings() {
	$.post(
		'settings/conversation',
		$('#settings_module_ajax_form').serialize() + "&auto_update=" + next_page
	);

	if(next_page === 1) {
		page_load = true;
	}

	$('#conversation_settings').modal('hide');

	if(timer) clearTimeout(timer);
	timer = setTimeout(updateInit,100);

	return false;
}

function datasrc2src(selector) {
	$(selector).each(function(i, el) {
		$(el).attr("src", $(el).data("src"));
		$(el).removeAttr("data-src");
	});
}

function confirmDelete() {
	return confirm(aStr.delitem);
}

function handle_comment_form(e) {
	e.stopPropagation();

	//handle eventual expanded forms
	var expanded = $('.comment-edit-text.expanded');
	var i = 0;

	if(expanded.length) {
		expanded.each(function() {
			var ex_form = $(expanded[i].form);
			var ex_fields = ex_form.find(':input[type=text], textarea');
			var ex_fields_empty = true;

			ex_fields.each(function() {
				if($(this).val() != '')
					ex_fields_empty = false;
			});
			if(ex_fields_empty) {
				ex_form.find('.comment-edit-text').removeClass('expanded').attr('placeholder', aStr.comment);
				ex_form.find(':not(.comment-edit-text)').hide();
			}
			i++;
		});
	}

	// handle clicked form
	var form = $(this);

	var fields = form.find(':input[type=text], textarea');
	var fields_empty = true;

	if(form.find('.comment-edit-text').length) {
		var commentElm = form.find('.comment-edit-text').attr('id');
		var submitElm = commentElm.replace(/text/,'submit');

		$('#' + commentElm).addClass('expanded').removeAttr('placeholder');
		$('#' + commentElm).attr('tabindex','9');
		$('#' + submitElm).attr('tabindex','10');

		form.find(':not(:visible)').show();
	}


	// handle click outside of form (close empty forms)
	$(document).one('click', function(e) {
		fields.each(function() {
			if($(this).val() != '')
				fields_empty = false;
		});
		if(fields_empty) {
			var emptyCommentElm = form.find('.comment-edit-text').attr('id');
        	var emptySubmitElm = commentElm.replace(/text/,'submit');

			$('#' + emptyCommentElm).removeClass('expanded').attr('placeholder', aStr.comment);
			$('#' + emptyCommentElm).removeAttr('tabindex');
			$('#' + emptySubmitElm).removeAttr('tabindex');
			form.find(':not(.comment-edit-text)').hide();
			form.find(':input[name=parent]').val(emptyCommentElm.replace(/\D/g,''));
			var btn = form.find(':button[type=submit]').html();
			form.find(':button[type=submit]').html(btn.replace(/<[^>]*>/g, '').trim());
			form.find(':button[type=submit]').prop('title', '');
		}
	});

	var commentSaveTimer = null;
	var emptyCommentElm = form.find('.comment-edit-text').attr('id');
	var convId = emptyCommentElm.replace('comment-edit-text-','');
	$('#' + emptyCommentElm).on('focusout',function(e){
		if(commentSaveTimer)
			clearTimeout(commentSaveTimer);
		commentSaveChanges(convId,true);
		commentSaveTimer = null;
		$('#' + emptyCommentElm).off();
	});

	$('#' + emptyCommentElm).on('focusin', function (e){
		commentSaveTimer = setTimeout(function () {
			commentSaveChanges(convId,false);
		},10000);
	});

	function commentSaveChanges(convId, isFinal) {

		if(typeof isFinal === 'undefined')
			isFinal = false;

		if(auto_save_draft) {
			tmp = $('#' + emptyCommentElm).val();
			if(tmp) {
				localStorage.setItem("comment_body-" + convId, tmp);
			}
			else {
				localStorage.removeItem("comment_body-" + convId);
			}
			if( !isFinal) {
				commentSaveTimer = setTimeout(commentSaveChanges,10000,convId);
			}
		}
	}

}



function commentClose(obj, id) {
	if(obj.value === '') {
		$("#comment-edit-text-" + id).removeClass("expanded");
		$("#mod-cmnt-wrap-" + id).hide();
		$("#comment-tools-" + id).hide();
		$("#comment-edit-anon-" + id).hide();
		return true;
	}
	return false;
}

function showHideCommentBox(id) {
	if( $('#comment-edit-form-' + id).is(':visible')) {
		$('#comment-edit-form-' + id).hide();
	} else {
		$('#comment-edit-form-' + id).show();
	}
}

function commentInsert(obj, id) {
	var tmpStr = $("#comment-edit-text-" + id).val();
	if(tmpStr == '$comment') {
		tmpStr = '';
		$("#comment-edit-text-" + id).addClass("expanded");
		openMenu("comment-tools-" + id);
	}
	var ins = $(obj).html();
	ins = ins.replace('&lt;','<');
	ins = ins.replace('&gt;','>');
	ins = ins.replace('&amp;','&');
	ins = ins.replace('&quot;','"');
	$("#comment-edit-text-" + id).val(tmpStr + ins);
}

function insertbbcomment(comment, BBcode, id) {
	// allow themes to override this
	if(typeof(insertFormatting) != 'undefined')
		return(insertFormatting(comment, BBcode, id));

	var urlprefix = ((BBcode == 'url') ? '#^' : '');

	var tmpStr = $("#comment-edit-text-" + id).val();
	if(tmpStr == comment) {
		tmpStr = "";
		$("#comment-edit-text-" + id).addClass("expanded");
		openMenu("comment-tools-" + id);
		$("#comment-edit-text-" + id).val(tmpStr);
	}

	textarea = document.getElementById("comment-edit-text-" +id);
	if (document.selection) {
		textarea.focus();
		selected = document.selection.createRange();
		selected.text = urlprefix+"["+BBcode+"]" + selected.text + "[/"+BBcode+"]";
	} else if (textarea.selectionStart || textarea.selectionStart == "0") {
		var start = textarea.selectionStart;
		var end = textarea.selectionEnd;
		textarea.value = textarea.value.substring(0, start) + urlprefix+"["+BBcode+"]" + textarea.value.substring(start, end) + "[/"+BBcode+"]" + textarea.value.substring(end, textarea.value.length);
	}
	return true;
}

function inserteditortag(BBcode, id) {
	// allow themes to override this
	if(typeof(insertEditorFormatting) != 'undefined')
		return(insertEditorFormatting(BBcode));

	textarea = document.getElementById(id);
	if (document.selection) {
		textarea.focus();
		selected = document.selection.createRange();
		selected.text = urlprefix+"["+BBcode+"]" + selected.text + "[/"+BBcode+"]";
	} else if (textarea.selectionStart || textarea.selectionStart == "0") {
		var start = textarea.selectionStart;
		var end = textarea.selectionEnd;
		textarea.value = textarea.value.substring(0, start) + "["+BBcode+"]" + textarea.value.substring(start, end) + "[/"+BBcode+"]" + textarea.value.substring(end, textarea.value.length);
	}
	return true;
}

function insertCommentAttach(comment,id) {

	activeCommentID = id;
	activeCommentText = comment;

	$('body').css('cursor', 'wait');

	$('#invisible-comment-upload').trigger('click');

	return false;

}

function insertCommentURL(comment, id) {
	reply = prompt(aStr.linkurl);
	if(reply && reply.length) {
		reply = bin2hex(reply);
		$('body').css('cursor', 'wait');
		$.get('linkinfo?f=&binurl=' + reply, function(data) {
			var tmpStr = $("#comment-edit-text-" + id).val();
			if(tmpStr == comment) {
				tmpStr = "";
				$("#comment-edit-text-" + id).addClass("expanded");
				openMenu("comment-tools-" + id);
				$("#comment-edit-text-" + id).val(tmpStr);
			}

			textarea = document.getElementById("comment-edit-text-" +id);
			textarea.value = textarea.value + data;
			preview_comment(id);
			$('body').css('cursor', 'auto');
		});
	}
	return true;
}

function doFollowAuthor(url) {
	$.get(url, function(data) { notificationsUpdate(); });
	return true;
}


function viewsrc(id) {
	$.colorbox({href: 'viewsrc/' + id, maxWidth: '80%', maxHeight: '80%' });
}

function showHideComments(id) {
	if( $('#collapsed-comments-' + id).is(':visible')) {
		$('#collapsed-comments-' + id + ' .autotime').timeago('dispose');
		$('#collapsed-comments-' + id).hide();
		$('#hide-comments-' + id).html(aStr.showmore);
		$('#hide-comments-total-' + id).show();
	} else {
		$('#collapsed-comments-' + id + ' .autotime').timeago();
		$('#collapsed-comments-' + id).show();
		$('#hide-comments-' + id).html(aStr.showfewer);
		$('#hide-comments-total-' + id).hide();
	}
}

function openClose(theID) {
	if(document.getElementById(theID).style.display == "block") {
		document.getElementById(theID).style.display = "none";
	} else {
		document.getElementById(theID).style.display = "block";
	}
}

function openCloseTR(theID) {
	if(document.getElementById(theID).style.display == "table-row") {
		document.getElementById(theID).style.display = "none";
	} else {
		document.getElementById(theID).style.display = "table-row";
	}
}

function closeOpen(theID) {
	if(document.getElementById(theID).style.display == "none") {
		document.getElementById(theID).style.display = "block";
	} else {
		document.getElementById(theID).style.display = "none";
	}
}

function openMenu(theID) {
	document.getElementById(theID).style.display = "block";
}

function closeMenu(theID) {
	document.getElementById(theID).style.display = "none";
}

function markRead(notifType) {
	$.get('notifications?f=&markRead='+notifType);
	$('.' + notifType + '-button').fadeOut(function() {
		$("." + notifType + "-update").html('0');
		$('#nav-' + notifType + '-menu').html('');
		$('#nav-' + notifType + '-sub').removeClass('show');
		sessionStorage.removeItem('notification_open');
		sse_setNotificationsStatus();
	});
}

function markItemRead(itemId) {
	$.get('notifications?f=&markItemRead='+itemId);
	$('.unseen-wall-indicator-'+itemId).remove();
}

function contextualHelp() {
	var container = $("#contextual-help-content");

	if(container.hasClass('contextual-help-content-open')) {
		container.removeClass('contextual-help-content-open');
		$('main').css('margin-top', '')
	}
	else {
		container.addClass('contextual-help-content-open');
		var mainTop = container.outerHeight(true);
		$('main').css('margin-top', mainTop + 'px');
	}
}

function contextualHelpFocus(target, openSidePanel) {
        if($(target).length) {
            if (openSidePanel) {
                    $("main").addClass('region_1-on');  // Open the side panel to highlight element
            }
            else {
                    $("main").removeClass('region_1-on');
            }

	    var css_position = $(target).parent().css('position');
	    if (css_position === 'fixed') {
	            $(target).parent().css('position', 'static');
	    }

            $('html,body').animate({ scrollTop: $(target).offset().top - $('nav').outerHeight(true) - $('#contextual-help-content').outerHeight(true)}, 'slow');
            for (i = 0; i < 3; i++) {
                    $(target).fadeTo('slow', 0.1).fadeTo('slow', 1.0);
            }

	    $(target).parent().css('position', css_position);
        }
}

function updatePageItems(mode, data) {

	$(document).trigger('hz:updatePageItems');

	if(mode === 'append') {
		newitemcount = 0;
		$(data).each(function() {
			$('#page-end').before($(this));
			newitemcount++;
		});

		if(loadingPage) {
			loadingPage = false;
		}
	}

	var e = document.getElementById('content-complete');
	if(e) {
		pageHasMoreContent = false;
	} else {
		if (newitemcount < 1) {
			pageUpdate();
		}
	}

	collapseHeight();
}


function updateConvItems(mode,data) {

	var scroll_position = $(window).scrollTop();

	if(mode !== 'update')
		$(document).trigger('hz:updateConvItems');

	if(mode === 'update' || mode === 'replace') {
		prev = 'threads-begin';
	}
	if(mode === 'append') {
		next = 'threads-end';
	}

	if(mode === 'replace') {
		$('.thread-parent').remove(); // clear existing content
	}

	$('.thread-wrapper', data).each(function() {
		if(this.classList.contains('toplevel_item')) {
			var ident = this.id;
			var convId = ident.replace('thread-wrapper-','');
			var commentWrap = $('#'+ident+' .collapsed-comments').attr('id');

			var itmId = 0;
			var isVisible = false;

			// figure out the comment state
			if(typeof commentWrap !== 'undefined')
				itmId = commentWrap.replace('collapsed-comments-','');

			if($('#collapsed-comments-'+itmId).is(':visible'))
				isVisible = true;

			// insert the content according to the mode and first_page
			// and whether or not the content exists already (overwrite it)

			if($('#' + ident).length == 0) {
				if((mode === 'update' || mode === 'replace') && profile_page == 1) {
						$('#' + prev).after($(this));
					prev = ident;
				}
				if(mode === 'append') {
					$('#' + next).before($(this));
				}
			}
			else {
				$('#' + ident).replaceWith($(this));
			}

			// set the comment state to the state we discovered earlier

			if(isVisible)
				showHideComments(itmId);

			var commentBody = localStorage.getItem("comment_body-" + convId);

			if(commentBody) {
				var commentElm = $('#comment-edit-text-' + convId);
				if(auto_save_draft) {
					if($(commentElm).val() === '') {
						$('#comment-edit-form-' + convId).show();
						$(commentElm).addClass("expanded");
						openMenu("comment-tools-" + convId);
						$(commentElm).val(commentBody);
					}
				} else {
					localStorage.removeItem("comment_body-" + convId);
				}
			}

			// trigger the autotime function on all newly created content
			$("> .wall-item-outside-wrapper .autotime, > .thread-wrapper .autotime",this).timeago();
			$("> .shared_header .autotime",this).timeago();

			if((mode === 'append' || mode === 'replace') && (loadingPage)) {
				loadingPage = false;
			}

			// if single thread view and  the item has a title, display it in the title bar

			if(mode === 'replace') {
				if (window.location.search.indexOf("mid=") != -1 || window.location.pathname.indexOf("display") != -1) {
					var title = $(".wall-item-title").text();
					title.replace(/^\s+/, '');
					title.replace(/\s+$/, '');
					if (title) {
						savedTitle = title + " " + savedTitle;
						document.title = title;
					}
				}
			}
		}

		// take care of the notifications count updates
		var nmids = $(this).data('b64mids');

		nmids.forEach(function(nmid, index) {

			sse_rmids.push(nmid);

			if($('.notification[data-b64mid=\'' + nmid + '\']').length) {
				$('.notification[data-b64mid=\'' + nmid + '\']').each(function() {
					var n = this.parentElement.id.split('-');
					return sse_updateNotifications(n[1], nmid);
				});
			}

			// special handling for forum notifications
			$('.notification-forum').filter(function() {
				var fmids = decodeURIComponent($(this).data('b64mids'));
				var n = this.parentElement.id.split('-');
				if(fmids.indexOf(nmid) > -1) {
					var fcount = Number($('.' + n[1] + '-update').html());
					fcount--;
					$('.' + n[1] + '-update').html(fcount);
					if(fcount < 1)
						$('.' + n[1] + '-button').fadeOut();

					var count = Number($(this).find('.badge-secondary').html());
					count--;
					$(this).find('.badge-secondary').html(count);
					if(count < 1)
						$(this).remove();
				}
			});


		});

		sse_setNotificationsStatus();

	});

	$(window).scrollTop(scroll_position);

	if(followUpPageLoad)
		sse_bs_counts();
	else
		sse_bs_init();

	if(commentBusy) {
		commentBusy = false;
		$('body').css('cursor', 'auto');
	}

	// Setup to determine if the media player is playing. This affects
	// some content loading decisions.

	$('video').off('playing');
	$('video').off('pause');
	$('audio').off('playing');
	$('audio').off('pause');

	$('video').on('playing', function() {
		mediaPlaying = true;
	});
	$('video').on('pause', function() {
		mediaPlaying = false;
	});
	$('audio').on('playing', function() {
		mediaPlaying = true;
	});
	$('audio').on('pause', function() {
		mediaPlaying = false;
	});

	if(! preloadImages) {
		$('.wall-item-body, .wall-photo-item').imagesLoaded()
		.always( function( instance ) {
			//console.log('all images loaded');
			collapseHeight();

			if(bParam_mid && mode === 'replace')
				scrollToItem();

		})
		.done( function( instance ) {
			//console.log('all images successfully loaded');
		})
		.fail( function() {
			//console.log('all images loaded, at least one is broken');
		})
		.progress( function( instance, image ) {
			//var result = image.isLoaded ? 'loaded' : 'broken';
			//console.log( 'image is ' + result + ' for ' + image.img.src );
		});
	}
	else {
		collapseHeight();

		if(bParam_mid && mode === 'replace')
			scrollToItem();
	}

	// reset rotators and cursors we may have set before reaching this place
	$('.like-rotator').hide();
	$("#page-spinner").hide();
	$("#profile-jot-text-loading").hide();

	followUpPageLoad = true;

}

function scrollToItem() {
	// auto-scroll to a particular comment in a thread (designated by mid) when in single-thread mode

	if(justifiedGalleryActive)
		return;

	var submid = ((bParam_mid.length) ? bParam_mid : 'abcdefg');
	var encoded = ((submid.substr(0,4) == 'b64.') ? true : false);
	var submid_encoded = ((encoded) ? submid : window.btoa(submid));

	$('.thread-wrapper').filter(function() {
		if($(this).data('b64mids').indexOf(submid_encoded) > -1 && !$(this).hasClass('toplevel_item')) {
			if($('.collapsed-comments').length) {
				var scrolltoid = $('.collapsed-comments').attr('id').substring(19);
				$('#collapsed-comments-' + scrolltoid + ' .autotime').timeago();
				$('#collapsed-comments-' + scrolltoid).show();
				$('#hide-comments-' + scrolltoid).html(aStr.showfewer);
				$('#hide-comments-total-' + scrolltoid).hide();
			}
			$('html, body').animate({ scrollTop: $(this).offset().top - $('nav').outerHeight(true) }, 'slow');
			$(this).addClass('item-highlight');
		}
	});

}

function collapseHeight() {

	$(".wall-item-content, .directory-collapse").each(function() {
		var orgHeight = $(this).outerHeight(true);
		var id = $(this).attr('id')
		var open = ((expanded_items.indexOf($(this).attr('id')) === -1) ? false : true);
		if(orgHeight > divmore_height) {
			if(! $(this).hasClass('divmore') && $(this).has('div.no-collapse').length == 0) {
				$(this).readmore({
					speed: 0,
					startOpen: open,
					heightMargin: 50,
					collapsedHeight: divmore_height,
					moreLink: '<a href="#" class="divgrow-showmore fakelink">' + aStr.divgrowmore + '</a>',
					lessLink: '<a href="#" class="divgrow-showmore fakelink">' + aStr.divgrowless + '</a>',
					beforeToggle: function(trigger, element, expanded) {
						if(expanded) {
							if((($(element).offset().top + divmore_height) - $(window).scrollTop()) < 65 ) {
								$(window).scrollTop($(window).scrollTop() - ($(element).outerHeight(true) - divmore_height));
							}
							expanded_items = expanded_items.filter(expanded_items => expanded_items !== id);
						}
						else {
							expanded_items.push(id);
						}
					}
				});
				$(this).addClass('divmore');
			}
		}
	});

}

function updateInit() {

	if($('#live-network').length)    { src = 'network'; }
	if($('#live-channel').length)    { src = 'channel'; }
	if($('#live-pubstream').length)  { src = 'pubstream'; }
	if($('#live-display').length)    { src = 'display'; }
	if($('#live-hq').length)         { src = 'hq'; }
	if($('#live-search').length)     { src = 'search'; }
	// if($('#live-cards').length)      { src = 'cards'; }
	// if($('#live-articles').length)   { src = 'articles'; }

	if(src) {
		liveUpdate();
	}
	else {
		sse_bs_init();
	}

	if($('#live-photos').length || $('#live-cards').length || $('#live-articles').length ) {
		if(liking) {
			liking = 0;
			window.location.href=window.location.href;
		}
	}
}

function liveUpdate(notify_id) {

	if(typeof profile_uid === 'undefined') profile_uid = false; /* Should probably be unified with channelId defined in head.tpl */

	if((src === null) || (stopped) || (! profile_uid)) { $('.like-rotator').hide(); return; }

	if(in_progress || mediaPlaying) {
		if(livetime) {
			clearTimeout(livetime);
		}
		livetime = setTimeout(liveUpdate, 10000);
		return;
	}

	if(timer)
		clearTimeout(timer);

	if(livetime !== null)
		livetime = null;

	prev = 'live-' + src;

	in_progress = true;

	var update_url;
	var update_mode;

	if(scroll_next) {
		bParam_page = next_page;
		page_load = true;
	}
	else {
		bParam_page = 1;
	}

	update_url = buildCmd();

	console.log('displaying: ' + update_url);

	if(page_load) {
		$("#page-spinner").show();
		if(bParam_page == 1)
			update_mode = 'replace';
		else
			update_mode = 'append';
	}
	else {
		update_mode = 'update';
		var orgHeight = $("#region_2").height();
	}

	if(page_cache.data && bParam_page == page_cache.page) {
		page_load = false;
		scroll_next = false;
		updateConvItems(update_mode,page_cache.data);
		in_progress = false;
		return;
	}

	var dstart = new Date();
	console.log('LOADING data...');
	$.get(update_url, function(data) {

		// on shared hosts occasionally the live update process will be killed
		// leaving an incomplete HTML structure, which leads to conversations getting
		// truncated and the page messed up if all the divs aren't closed. We will try
		// again and give up if we can't get a valid HTML response after 10 tries.

		if((data.indexOf("<html>") != (-1)) && (data.indexOf("</html>") == (-1))) {
			console.log('Incomplete data. Reloading');
			in_progress = false;
			liveRecurse ++;
			if(liveRecurse < 10) {
				liveUpdate();
			}
			else {
				console.log('Incomplete data. Too many attempts. Giving up.');
			}
		}

		// else data was valid - reset the recursion counter
		liveRecurse = 0;

		if(typeof notify_id !== 'undefined' && notify_id !== 'undefined') {
			$.post(
				"hq",
				{
					"notify_id" : notify_id
				}
			);
		}

		var dready = new Date();
		console.log('DATA ready in: ' + (dready - dstart)/1000 + ' seconds.');

		if(update_mode === 'update' || preloadImages) {
			console.log('LOADING images...');
			$('.wall-item-body, .wall-photo-item',data).imagesLoaded()
			.always( function( instance ) {
				//console.log('all images loaded');

				var iready = new Date();
				console.log('IMAGES ready in: ' + (iready - dready)/1000 + ' seconds.');

				page_load = false;
				scroll_next = false;
				updateConvItems(update_mode,data);

				in_progress = false;
				$('#image_counter').html('');

			})
			.done( function( instance ) {
				//console.log('all images successfully loaded');
			})
			.fail( function() {
				//console.log('all images loaded, at least one is broken');
			})
			.progress( function( instance, image ) {
				$('#image_counter').html(instance.progressedCount + '/' + instance.images.length);
				//var result = image.isLoaded ? 'loaded' : 'broken';
				//console.log( 'image is ' + result + ' for ' + image.img.src );
			});

		}
		else {
			page_load = false;
			scroll_next = false;
			updateConvItems(update_mode,data);
			in_progress = false;
		}

	});
}

function cache_next_page() {
	page_load = true;
	bParam_page++;
	update_url = buildCmd();

	$.get(update_url, function(data) {

		// on shared hosts occasionally the live update process will be killed
		// leaving an incomplete HTML structure, which leads to conversations getting
		// truncated and the page messed up if all the divs aren't closed. We will try
		// again and give up if we can't get a valid HTML response after 10 tries.

		if((data.indexOf("<html>") != (-1)) && (data.indexOf("</html>") == (-1))) {
			console.log('Incomplete data. Reloading');
			in_progress = false;
			bParam_page--;
			liveRecurse++;
			if(liveRecurse < 10) {
				liveUpdate();
			}
			else {
				console.log('Incomplete data. Too many attempts. Giving up.');
			}
		}

		// else data was valid - reset the recursion counter
		liveRecurse = 0;

		console.log('cached: ' + update_url);

		$('.wall-item-body, .wall-photo-item', data).imagesLoaded()
		.always( function( instance ) {
			console.log('page_cache images loaded:');

			page_cache.data = data;
			page_cache.page = bParam_page;
			page_cache.time = Date.now();

			bParam_page--;
			page_load = false;
		})
		.done( function( instance ) {
			console.log('success');
		})
		.fail( function() {
			console.log('at least one is broken');
		})
		.progress( function( instance, image ) {
			//console.log(instance.progressedCount + '/' + instance.images.length);
			//var result = image.isLoaded ? 'loaded' : 'broken';
			//console.log( 'image is ' + result + ' for ' + image.img.src );
		});

	});

}

function pageUpdate() {

	in_progress = true;

	var update_url;
	var update_mode;

	if(scroll_next) {
		bParam_page = next_page;
		page_load = true;
	}
	else {
		bParam_page = 1;
	}

	update_url = baseurl + '/' + decodeURIComponent(page_query) + '/?f=&aj=1&page=' + bParam_page + extra_args ;

	$("#page-spinner").show();
	update_mode = 'append';

	$.get(update_url,function(data) {
		page_load = false;
		scroll_next = false;
		updatePageItems(update_mode,data);
		$("#page-spinner").hide();
		$(".autotime").timeago();
		in_progress = false;
	});
}

function justifyPhotos(id) {
	justifiedGalleryActive = true;
	$('#' + id).show();
	$('#' + id).justifiedGallery({
		rowHeight: 150,
		selector: 'a',
		margins: 3,
		border: 0
	}).on('jg.complete', function(e){ justifiedGalleryActive = false; });
}

function justifyPhotosAjax(id) {
	justifiedGalleryActive = true;
	$('#' + id).justifiedGallery('norewind').on('jg.complete', function(e){ justifiedGalleryActive = false; });
}

function dolike(ident, verb) {
	$('#like-rotator-' + ident.toString()).show();

	if(typeof conv_mode == typeof undefined)
		conv_mode = '';

	if(typeof page_mode == typeof undefined)
		page_mode = '';

	$.get('like/' + ident.toString() + '?verb=' + verb + '&conv_mode=' + conv_mode + '&page_mode=' + page_mode, function (data) {
		if(data.success) {
			// this is a bit tricky since the top level thread wrapper wraps the whole thread
			if($('#thread-wrapper-' + data.orig_id).hasClass('toplevel_item')) {
				var wrapper = $('<div></div>').html( data.html ).find('#wall-item-outside-wrapper-' + data.id);
				$('#wall-item-outside-wrapper-' + data.orig_id).html(wrapper[0].innerHTML);
				// those were not replaced - swap the id
				$('#thread-wrapper-' + data.orig_id).attr('id', 'thread-wrapper-' + data.id);
				$('#wall-item-outside-wrapper-' + data.orig_id).attr('id', 'wall-item-outside-wrapper-' + data.id);
			}
			else {
				$('#thread-wrapper-' + data.orig_id).replaceWith(data.html);
			}
			$('#wall-item-ago-' + data.id + ' .autotime').timeago();
			collapseHeight();
			liking = 0;
		}
	});
	liking = 1;
}

function doprofilelike(ident, verb) {
	$.get('like/' + ident + '?verb=' + verb, function() { window.location.href=window.location.href; });
}


function doreply(parent, ident, owner, hint) {
        var form = $('#comment-edit-form-' + parent.toString());
        form.find('input[name=parent]').val(ident);
        var i = form.find('button[type=submit]');
        var btn = i.html().replace(/<[^>]*>/g, '').trim();
        i.html('<i class="fa fa-reply" ></i> ' + btn);
        var sel = 'wall-item-body-' + ident.toString();
        var quote = window.getSelection().toString().trim();
        form.find('textarea').val("@{" + owner + "}" + ((($(window.getSelection().anchorNode).closest("#" + sel).attr("id") != sel) || (quote.length === 0))? " " : "\n[quote]" + quote + "[/quote]\n"));
        $('#comment-edit-text-' + parent.toString()).focus();
}

function doscroll(parent, hidden) {
	var id;
	var x = '#hide-comments-outer-' + hidden.toString();
	var back = $('#back-to-reply');
	if(back.length == 0)
		var pos = $(window).scrollTop();
	else
		var pos = back.attr('href').replace(/[^\d|\.]/g,'');
	if($(x).length !== 0) {
		x = $(x).attr("onclick").replace(/\D/g,'');
		var c = '#collapsed-comments-' + x;
		if($(c).length !== 0 && (! $(c).is(':visible'))) {
			showHideComments(x);
			pos += $(c).height();
		}
	}
	back.remove();

	$('.thread-wrapper').filter(function() {
		if($(this).data('b64mids').indexOf(parent) > -1) {
			id = $(this);
		}
	});

	$('html, body').animate({scrollTop:(id.offset().top) - 50}, 'slow');
	$('<a href="javascript:doscrollback(' + pos + ');" id="back-to-reply" class="float-right" title="' + aStr['to_reply'] + '"><i class="fa fa-angle-double-down">&nbsp;&nbsp;&nbsp;</i></a>').insertBefore('#wall-item-info-' + id.attr('id').replace(/\D/g,''));
}

function doscrollback(pos) {
	$('#back-to-reply').remove();
	$(window).scrollTop(pos);
}

function dopin(id) {
        id = id.toString();
        $('#like-rotator-' + id).show();
        $.post('pin/pin', { 'id' : id })
                .done(function() {
                        var i = $('#wall-item-pinned-' + id);
                        var me = $('#item-pinnable-' + id);
                        var pin = $('.pinned-item');
                        if(pin.length) {
                                $('html, body').animate({ scrollTop: $('#region_2').offset().top }, 'slow', function() {
                                        pin.fadeTo('fast', 0.33, function() { this.remove(); });
                                });
                        };
                        pin.remove();
                        $('.dropdown-item-pinnable').html($('.dropdown-item-pinnable').html().replace(aStr['unpin_item'],aStr['pin_item']));
                        $('.wall-item-pinned').remove()
                        if(i.length == 0) {
                                $('<span class="float-right wall-item-pinned" title="' + aStr['pinned'] + '" id="wall-item-pinned-' + id + '"><i class="fa fa-thumb-tack">&nbsp;</i></span>').insertBefore('#wall-item-info-' + id);
                                me.html(me.html().replace(aStr['pin_item'],aStr['unpin_item']));
                        };
                })
                .fail(function() {
                        location.reload();
                })
                .always(function() {
                        $('#like-rotator-' + id).hide();
                });
}

function dropItem(url, object) {
	var confirm = confirmDelete();
	if(confirm) {
		var id = url.split('/')[2];
		$('body').css('cursor', 'wait');
		$(object + ', #pinned-wrapper-' + id).css('opacity', 0.33);

		$.get(url, function() {
			$(object + ', #pinned-wrapper-' + id).remove();
			$('body').css('cursor', 'auto');
		});

		if($('#wall-item-pinned-' + id).length)
			$.post('pin/pin', { 'id' : id });

		return true;
        }
	else {
		return false;
	}
}

function dosubthread(ident) {
	$('#like-rotator-' + ident.toString()).show();
	$.get('subthread/sub/' + ident.toString(), updateInit );
	liking = 1;
}

function dounsubthread(ident) {
	$('#like-rotator-' + ident.toString()).show();
	$.get('subthread/unsub/' + ident.toString(), updateInit );
	liking = 1;
}

function dostar(ident) {
	ident = ident.toString();
	$('#like-rotator-' + ident).show();
	$.get('starred/' + ident, function(data) {
		if(data.result == 1) {
			$('#starred-' + ident).addClass('starred');
			$('#starred-' + ident).removeClass('unstarred');
			$('#starred-' + ident).addClass('fa-star');
			$('#starred-' + ident).removeClass('fa-star-o');
			$('#star-' + ident).addClass('hidden');
			$('#unstar-' + ident).removeClass('hidden');
			var btn_tpl = '<div class="btn-group" id="star-button-' + ident + '"><button type="button" class="btn btn-outline-secondary btn-sm wall-item-like" onclick="dostar(' + ident + ');"><i class="fa fa-star"></i></button></div>'
			$('#wall-item-tools-left-' + ident).prepend(btn_tpl);
		}
		else {
			$('#starred-' + ident).addClass('unstarred');
			$('#starred-' + ident).removeClass('starred');
			$('#starred-' + ident).addClass('fa-star-o');
			$('#starred-' + ident).removeClass('fa-star');
			$('#star-' + ident).removeClass('hidden');
			$('#unstar-' + ident).addClass('hidden');
			$('#star-button-' + ident).remove();
		}
		$('#like-rotator-' + ident).hide();
	});
}

function getPosition(e) {
	var cursor = {x:0, y:0};
	if ( e.pageX || e.pageY  ) {
		cursor.x = e.pageX;
		cursor.y = e.pageY;
	}
	else {
		if( e.clientX || e.clientY ) {
			cursor.x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
			cursor.y = e.clientY + (document.documentElement.scrollTop  || document.body.scrollTop)  - document.documentElement.clientTop;
		}
		else {
			if( e.x || e.y ) {
				cursor.x = e.x;
				cursor.y = e.y;
			}
		}
	}
	return cursor;
}

function lockview(type, id) {
	$.get('lockview/' + type + '/' + id, function(data) {
		$('#panel-' + id).html(data);
	});
}

function submitPoll(id) {

	$.post('vote/' + id,
		$('#question-form-' + id).serialize(),
		function(data) {
			$.jGrowl(data.message, { sticky: false, theme: ((data.success) ? 'info' : 'notice'), life: 10000 });
			if(timer) clearTimeout(timer);
			timer = setTimeout(updateInit, 500);
		}
	);

}

function post_comment(id) {

	commentBusy = true;
	$('body').css('cursor', 'wait');
	$("#comment-preview-inp-" + id).val("0");

	if(typeof conv_mode == typeof undefined)
		conv_mode = '';

	var form_data =	$("#comment-edit-form-" + id).serialize();

	$.post(
		"item",
		form_data  + '&conv_mode=' + conv_mode,
		function(data) {
			if(data.success) {
				localStorage.removeItem("comment_body-" + id);
				$("#comment-edit-preview-" + id).hide();
				$("#comment-edit-text-" + id).val('').blur().attr('placeholder', aStr.comment);
				$('#wall-item-comment-wrapper-' + id).before(data.html);
				$('#wall-item-ago-' + data.id + ' .autotime').timeago();
				$('body').css('cursor', 'unset');
				collapseHeight();
				commentBusy = false;

				var tarea = document.getElementById("comment-edit-text-" + id);
				if(tarea) {
					commentClose(tarea, id);
					$(document).off( "click.commentOpen");
				}
			}
		},
		"json"
	);

	return false;

}



function preview_comment(id) {
	$("#comment-preview-inp-" + id).val("1");
	$("#comment-edit-preview-" + id).show();
	$.post(
		"item",
		$("#comment-edit-form-" + id).serialize(),
		function(data) {
			if(data.preview) {
				$("#comment-edit-preview-" + id).html(data.preview);
				$("#comment-edit-preview-" + id + " .autotime").timeago();
				$("#comment-edit-preview-" + id + " a").click(function() { return false; });
			}
		},
		"json"
	);
	return true;
}

function importElement(elem) {
	$.post(
		"impel",
		{ "element" : elem },
		function(data) {
			if(timer) clearTimeout(timer);
			timer = setTimeout(updateInit,10);
		}
	);
	return false;
}

function preview_post() {
	$("#jot-preview").val("1");
	$("#jot-preview-content").show();
	$.post(
		"item",
		$("#profile-jot-form").serialize(),
		function(data) {
			if(data.preview) {
				$("#jot-preview-content").html(data.preview);
				$("#jot-preview-content .autotime").timeago();
				$("#jot-preview-content" + " a").click(function() { return false; });
			}
		},
		"json"
	);
	$("#jot-preview").val("0");
	return true;
}

function bin2hex(s) {
	// Converts the binary representation of data to hex
	//
	// version: 812.316
	// discuss at: http://phpjs.org/functions/bin2hex
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   bugfixed by: Onno Marsman
	// +   bugfixed by: Linuxworld
	// *     example 1: bin2hex('Kev');
	// *     returns 1: '4b6576'
	// *     example 2: bin2hex(String.fromCharCode(0x00));
	// *     returns 2: '00'
	var v,i, f = 0, a = [];
	s += '';
	f = s.length;

	for (i = 0; i<f; i++) {
		a[i] = s.charCodeAt(i).toString(16).replace(/^([\da-f])$/,"0$1");
	}

	return a.join('');
}

function hex2bin(hex) {
	var bytes = [], str;

	for(var i=0; i< hex.length-1; i+=2)
		bytes.push(parseInt(hex.substr(i, 2), 16));

	return String.fromCharCode.apply(String, bytes);
}

function groupChangeMember(gid, cid, sec_token) {
	$('body .fakelink').css('cursor', 'wait');
	$.get('group/' + gid + '/' + cid + "?t=" + sec_token, function(data) {
		$('#group-update-wrapper').html(data);
		$('body .fakelink').css('cursor', 'auto');
	});
}

function profChangeMember(gid, cid) {
	$('body .fakelink').css('cursor', 'wait');
	$.get('profperm/' + gid + '/' + cid, function(data) {
		$('#prof-update-wrapper').html(data);
		$('body .fakelink').css('cursor', 'auto');
	});
}

function contactgroupChangeMember(gid, cid) {
	$('body').css('cursor', 'wait');
	$.get('contactgroup/' + gid + '/' + cid, function(data) {
		$('body').css('cursor', 'auto');
		$('#group-' + gid).toggleClass('fa-check-square-o fa-square-o');
	});
}

function checkboxhighlight(box) {
	if($(box).is(':checked')) {
		$(box).addClass('checkeditem');
	} else {
		$(box).removeClass('checkeditem');
	}
}

/**
 * sprintf in javascript
 *  "{0} and {1}".format('zero','uno');
 */
String.prototype.format = function() {
	var formatted = this;
	for (var i = 0; i < arguments.length; i++) {
		var regexp = new RegExp('\\{'+i+'\\}', 'gi');
		formatted = formatted.replace(regexp, ((typeof arguments[i] !== 'undefined') ? arguments[i] : ''));
	}
	return formatted;
};

// Array Remove
Array.prototype.remove = function(item) {
	to = undefined;
	from = this.indexOf(item);
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

function zFormError(elm,x) {
	if(x) {
		$(elm).addClass("zform-error");
		$(elm).removeClass("zform-ok");
	} else {
		$(elm).addClass("zform-ok");
		$(elm).removeClass("zform-error");
	}
}

$(window).scroll(function () {
	if(typeof buildCmd == 'function') {
		// This is a content page with items and/or conversations
		if($(window).scrollTop() + $(window).height() > $('#conversation-end').position().top) {
			if((pageHasMoreContent) && (! loadingPage)) {
				next_page++;
				scroll_next = true;
				loadingPage = true;
				liveUpdate();
			}
		}
	}
	else {
		// This is some other kind of page - perhaps a directory
		if($('#page-end').length && ($(window).scrollTop() + $(window).height() > $('#page-end').position().top)) {
			if((pageHasMoreContent) && (! loadingPage) && (! justifiedGalleryActive)) {
				next_page++;
				scroll_next = true;
				loadingPage = true;
				pageUpdate();
			}
		}
	}
});

function addhtmltext(data) {
	data = h2b(data);
	addeditortext(data);
}

function loadText(textRegion,data) {
	var currentText = $(textRegion).val();
	$(textRegion).val(currentText + data);
}

function addeditortext(data) {
	if(plaintext == 'none') {
		var currentText = $("#profile-jot-text").val();
		$("#profile-jot-text").val(currentText + data);
	}
}

function h2b(s) {
	var y = s;
	function rep(re, str) {
		y = y.replace(re,str);
	}

	rep(/<a.*?href=\"(.*?)\".*?>(.*?)<\/a>/gi,"[url=$1]$2[/url]");
	rep(/<span style=\"font-size:(.*?);\">(.*?)<\/span>/gi,"[size=$1]$2[/size]");
	rep(/<span style=\"color:(.*?);\">(.*?)<\/span>/gi,"[color=$1]$2[/color]");
	rep(/<font>(.*?)<\/font>/gi,"$1");
	rep(/<img.*?width=\"(.*?)\".*?height=\"(.*?)\".*?src=\"(.*?)\".*?\/>/gi,"[img=$1x$2]$3[/img]");
	rep(/<img.*?height=\"(.*?)\".*?width=\"(.*?)\".*?src=\"(.*?)\".*?\/>/gi,"[img=$2x$1]$3[/img]");
	rep(/<img.*?src=\"(.*?)\".*?height=\"(.*?)\".*?width=\"(.*?)\".*?\/>/gi,"[img=$3x$2]$1[/img]");
	rep(/<img.*?src=\"(.*?)\".*?width=\"(.*?)\".*?height=\"(.*?)\".*?\/>/gi,"[img=$2x$3]$1[/img]");
	rep(/<img.*?src=\"(.*?)\".*?\/>/gi,"[img]$1[/img]");

	rep(/<ul class=\"listbullet\" style=\"list-style-type\: circle\;\">(.*?)<\/ul>/gi,"[list]$1[/list]");
	rep(/<ul class=\"listnone\" style=\"list-style-type\: none\;\">(.*?)<\/ul>/gi,"[list=]$1[/list]");
	rep(/<ul class=\"listdecimal\" style=\"list-style-type\: decimal\;\">(.*?)<\/ul>/gi,"[list=1]$1[/list]");
	rep(/<ul class=\"listlowerroman\" style=\"list-style-type\: lower-roman\;\">(.*?)<\/ul>/gi,"[list=i]$1[/list]");
	rep(/<ul class=\"listupperroman\" style=\"list-style-type\: upper-roman\;\">(.*?)<\/ul>/gi,"[list=I]$1[/list]");
	rep(/<ul class=\"listloweralpha\" style=\"list-style-type\: lower-alpha\;\">(.*?)<\/ul>/gi,"[list=a]$1[/list]");
	rep(/<ul class=\"listupperalpha\" style=\"list-style-type\: upper-alpha\;\">(.*?)<\/ul>/gi,"[list=A]$1[/list]");
	rep(/<li>(.*?)<\/li>/gi,"[li]$1[/li]");

	rep(/<code>(.*?)<\/code>/gi,"[code]$1[/code]");
	rep(/<\/(strong|b)>/gi,"[/b]");
	rep(/<(strong|b)>/gi,"[b]");
	rep(/<\/(em|i)>/gi,"[/i]");
	rep(/<(em|i)>/gi,"[i]");
	rep(/<\/u>/gi,"[/u]");

	rep(/<span style=\"text-decoration: ?underline;\">(.*?)<\/span>/gi,"[u]$1[/u]");
	rep(/<u>/gi,"[u]");
	rep(/<blockquote[^>]*>/gi,"[quote]");
	rep(/<\/blockquote>/gi,"[/quote]");
	rep(/<hr \/>/gi,"[hr]");
	rep(/<br (.*?)\/>/gi,"\n");
	rep(/<br\/>/gi,"\n");
	rep(/<br>/gi,"\n");
	rep(/<p>/gi,"");
	rep(/<\/p>/gi,"\n");
	rep(/&nbsp;/gi," ");
	rep(/&quot;/gi,"\"");
	rep(/&lt;/gi,"<");
	rep(/&gt;/gi,">");
	rep(/&amp;/gi,"&");

	return y;
}

function b2h(s) {
	var y = s;
	function rep(re, str) {
		y = y.replace(re,str);
	}

	rep(/\&/gi,"&amp;");
	rep(/\</gi,"&lt;");
	rep(/\>/gi,"&gt;");
	rep(/\"/gi,"&quot;");

	rep(/\n/gi,"<br />");
	rep(/\[b\]/gi,"<strong>");
	rep(/\[\/b\]/gi,"</strong>");
	rep(/\[i\]/gi,"<em>");
	rep(/\[\/i\]/gi,"</em>");
	rep(/\[u\]/gi,"<u>");
	rep(/\[\/u\]/gi,"</u>");
	rep(/\[hr\]/gi,"<hr />");
	rep(/\[url=([^\]]+)\](.*?)\[\/url\]/gi,"<a href=\"$1\">$2</a>");
	rep(/\[url\](.*?)\[\/url\]/gi,"<a href=\"$1\">$1</a>");
	rep(/\[img=(.*?)x(.*?)\](.*?)\[\/img\]/gi,"<img width=\"$1\" height=\"$2\" src=\"$3\" />");
	rep(/\[img\](.*?)\[\/img\]/gi,"<img src=\"$1\" />");

	rep(/\[zrl=([^\]]+)\](.*?)\[\/zrl\]/gi,"<a href=\"$1" + '?f=&zid=' + zid + "\">$2</a>");
	rep(/\[zrl\](.*?)\[\/zrl\]/gi,"<a href=\"$1" + '?f=&zid=' + zid + "\">$1</a>");
	rep(/\[zmg=(.*?)x(.*?)\](.*?)\[\/zmg\]/gi,"<img width=\"$1\" height=\"$2\" src=\"$3" + '?f=&zid=' + zid + "\" />");
	rep(/\[zmg\](.*?)\[\/zmg\]/gi,"<img src=\"$1" + '?f=&zid=' + zid + "\" />");

	rep(/\[list\](.*?)\[\/list\]/gi, '<ul class="listbullet" style="list-style-type: circle;">$1</ul>');
	rep(/\[list=\](.*?)\[\/list\]/gi, '<ul class="listnone" style="list-style-type: none;">$1</ul>');
	rep(/\[list=1\](.*?)\[\/list\]/gi, '<ul class="listdecimal" style="list-style-type: decimal;">$1</ul>');
	rep(/\[list=i\](.*?)\[\/list\]/gi,'<ul class="listlowerroman" style="list-style-type: lower-roman;">$1</ul>');
	rep(/\[list=I\](.*?)\[\/list\]/gi, '<ul class="listupperroman" style="list-style-type: upper-roman;">$1</ul>');
	rep(/\[list=a\](.*?)\[\/list\]/gi, '<ul class="listloweralpha" style="list-style-type: lower-alpha;">$1</ul>');
	rep(/\[list=A\](.*?)\[\/list\]/gi, '<ul class="listupperalpha" style="list-style-type: upper-alpha;">$1</ul>');
	rep(/\[li\](.*?)\[\/li\]/gi, '<li>$1</li>');
	rep(/\[color=(.*?)\](.*?)\[\/color\]/gi,"<span style=\"color: $1;\">$2</span>");
	rep(/\[size=(.*?)\](.*?)\[\/size\]/gi,"<span style=\"font-size: $1;\">$2</span>");
	rep(/\[code\](.*?)\[\/code\]/gi,"<code>$1</code>");
	rep(/\[quote.*?\](.*?)\[\/quote\]/gi,"<blockquote>$1</blockquote>");

	rep(/\[video\](.*?)\[\/video\]/gi,"<a href=\"$1\">$1</a>");
	rep(/\[audio\](.*?)\[\/audio\]/gi,"<a href=\"$1\">$1</a>");

	rep(/\[\&amp\;([#a-z0-9]+)\;\]/gi,'&$1;');

	rep(/\<(.*?)(src|href)=\"[^hfm](.*?)\>/gi,'<$1$2="">');

	return y;
}

function zid(s) {
	if((! s.length) || (s.indexOf('zid=') != (-1)))
		return s;

	if(! zid.length)
		return s;

	var has_params = ((s.indexOf('?') == (-1)) ? false : true);
	var achar = ((has_params) ? '&' : '?');
	s = s + achar + 'f=&zid=' + zid;

	return s;
}

function sse_bs_init() {
	if(sessionStorage.getItem('notification_open') !== null || typeof sse_type !== 'undefined' ) {
		if(typeof sse_type === 'undefined')
			sse_type = sessionStorage.getItem('notification_open');

		$("#nav-" + sse_type + "-sub").addClass('show');
		sse_bs_notifications(sse_type, true, false);
	}
	else {
		sse_bs_counts();
	}
}

function sse_bs_counts() {
	if(sse_bs_active)
		return;

	sse_bs_active = true;

	$.ajax({
		type: 'post',
		url: '/sse_bs',
		data: { sse_rmids }
	}).done( function(obj) {
		console.log(obj);
		sse_bs_active = false;
		sse_rmids = [];
		sse_handleNotifications(obj, true, false);
	});
}

function sse_bs_notifications(e, replace, followup) {

	if(sse_bs_active)
		return;


	var manual = false;

	if(typeof replace === 'undefined')
		replace = e.data.replace;

	if(typeof followup === 'undefined')
		followup = e.data.followup;

	if(typeof e === 'string') {
		sse_type = e;
	}
	else {
		manual = true;
		sse_offset = 0;
		sse_type = e.target.dataset.sse_type;
	}

	if(typeof sse_type === 'undefined')
		return;

	if(followup || !manual || !($('#nav-' + sse_type + '-sub').hasClass('collapse') && $('#nav-' + sse_type + '-sub').hasClass('show'))) {

		if(sse_offset >= 0) {
			$("#nav-" + sse_type + "-loading").show();
		}

		sessionStorage.setItem('notification_open', sse_type);
		if(sse_offset !== -1 || replace) {

			var cn_val = (($('#cn-' + sse_type + '-input').length && sse_partial_result) ? $('#cn-' + sse_type + '-input').val().toString().toLowerCase() : '');

			$("#nav-" + sse_type + "-loading").show();

			sse_bs_active = true;

			$.ajax({
				type: 'post',
				url: '/sse_bs/' + sse_type + '/' + sse_offset,
				nquery: encodeURIComponent(cn_val),
				data: { sse_rmids }
			}).done(function(obj) {
				console.log('sse: bootstraping ' + sse_type);
				console.log(obj);
				sse_bs_active = false;
				sse_rmids = [];
				$("#nav-" + sse_type + "-loading").hide();
				sse_offset = obj[sse_type].offset;
				sse_handleNotifications(obj, replace, followup);
			});
		}
		else
			$("#nav-" + sse_type + "-loading").hide();

	}
	else {
		sessionStorage.removeItem('notification_open');
	}
}

function sse_handleNotifications(obj, replace, followup) {

	var primary_notifications = ['dm', 'home', 'intros', 'register', 'notify', 'files'];
	var secondary_notifications = ['network', 'forums', 'all_events', 'pubs'];
	var all_notifications = primary_notifications.concat(secondary_notifications);

	all_notifications.forEach(function(type, index) {
		if(typeof obj[type] === typeof undefined)
			return true;

		if(obj[type].count) {
			$('.' + type + '-button').fadeIn();
			if(replace || followup)
				$('.' + type + '-update').html(Number(obj[type].count));
			else
				$('.' + type + '-update').html(Number(obj[type].count) + Number($('.' + type + '-update').html()));
		}
		else {
			$('.' + type + '-update').html('0');
			$('.' + type + '-button').fadeOut(function() {
				sse_setNotificationsStatus();
			});
		}
		if(obj[type].notifications.length)
			sse_handleNotificationsItems(type, obj[type].notifications, replace, followup);
	});

	sse_setNotificationsStatus();

	// notice and info
	$.jGrowl.defaults.closerTemplate = '<div>[ ' + aStr.closeAll + ']</div>';

	if(obj.notice) {
		$(obj.notice.notifications).each(function() {
			$.jGrowl(this, { sticky: true, theme: 'notice' });
		});
	}

	if(obj.info) {
		$(obj.info.notifications).each(function(){
			$.jGrowl(this, { sticky: false, theme: 'info', life: 10000 });
		});
	}

	// load more notifications if visible notifications count becomes low
	if(sse_type  && sse_offset != -1 && $('#nav-' + sse_type + '-menu').children().length <= 20) {
		sse_offset = 0;
		sse_bs_notifications(sse_type, false, true);
	}


}

function sse_handleNotificationsItems(notifyType, data, replace, followup) {

	var notifications_tpl = ((notifyType == 'forums') ? decodeURIComponent($("#nav-notifications-forums-template[rel=template]").html().replace('data-src', 'src')) : decodeURIComponent($("#nav-notifications-template[rel=template]").html().replace('data-src', 'src')));
	var notify_menu = $("#nav-" + notifyType + "-menu");
	var notify_loading = $("#nav-" + notifyType + "-loading");
	var notify_count = $("." + notifyType + "-update");

	if(replace && !followup) {
		notify_menu.html('');
		notify_loading.hide();
	}

	$(data).each(function() {

		// do not add a notification if it is already present
		if($('#nav-' + notifyType + '-menu .notification[data-b64mid=\'' + this.b64mid + '\']').length)
			return true;

		html = notifications_tpl.format(this.notify_link,this.photo,this.name,this.addr,this.message,this.when,this.hclass,this.b64mid,this.notify_id,this.thread_top,this.unseen,this.private_forum, encodeURIComponent(this.mids), this.body);
		notify_menu.append(html);
	});

	if(!replace && !followup) {
		$("#nav-" + notifyType + "-menu .notification").sort(function(a,b) {
			a = new Date(a.dataset.when);
			b = new Date(b.dataset.when);
			return a > b ? -1 : a < b ? 1 : 0;
		}).appendTo('#nav-' + notifyType + '-menu');
	}

	$(document.body).trigger("sticky_kit:recalc");
	$("#nav-" + notifyType + "-menu .notifications-autotime").timeago();

	if($('#tt-' + notifyType + '-only').hasClass('active'))
		$('#nav-' + notifyType + '-menu [data-thread_top=false]').addClass('tt-filter-active');

	if($('#cn-' + notifyType + '-input').length) {
		var filter = $('#cn-' + notifyType + '-input').val().toString().toLowerCase();
		if(filter) {
			filter = filter.indexOf('%') == 0 ? filter.substring(1) : filter;

			$('#nav-' + notifyType + '-menu .notification').each(function(i, el) {
				var cn = $(el).data('contact_name').toString().toLowerCase();
				var ca = $(el).data('contact_addr').toString().toLowerCase();
				if(cn.indexOf(filter) === -1 && ca.indexOf(filter) === -1)
					$(el).addClass('cn-filter-active');
				else
					$(el).removeClass('cn-filter-active');
			});
		}
	}
}

function sse_updateNotifications(type, mid) {

	if(type === 'pubs')
		return true;

	if(type === 'notify' && (mid !== bParam_mid || sse_type !== 'notify'))
		return true;
/*
	var count = Number($('.' + type + '-update').html());

	count--;

	if(count < 1) {
		$('.' + type + '-update').html(count);
		$('.' + type + '-button').fadeOut(function() {
			sse_setNotificationsStatus();
		});
	}
	else {
		$('.' + type + '-update').html(count);
	}
*/

	$('#nav-' + type + '-menu .notification[data-b64mid=\'' + mid + '\']').fadeOut(function() {
		this.remove();
	});

}

function sse_setNotificationsStatus() {
	var primary_notifications = ['dm', 'home', 'intros', 'register', 'notify', 'files'];
	var secondary_notifications = ['network', 'forums', 'all_events', 'pubs'];
	var all_notifications = primary_notifications.concat(secondary_notifications);

	var primary_available = false;
	var any_available = false;

	all_notifications.forEach(function(type, index) {
		if($('.' + type + '-button').css('display') == 'block') {
			any_available = true;
			if(primary_notifications.indexOf(type) > -1)
				primary_available = true;
		}
	});

	if(primary_available) {
		$('.notifications-btn-icon').removeClass('fa-exclamation-circle');
		$('.notifications-btn-icon').addClass('fa-exclamation-triangle');
	}
	else {
		$('.notifications-btn-icon').removeClass('fa-exclamation-triangle');
		$('.notifications-btn-icon').addClass('fa-exclamation-circle');
	}

	if(any_available) {
		$('.notifications-btn').css('opacity', 1);
		$('#no_notifications').hide();
		$('#notifications').show();
	}
	else {
		$('.notifications-btn').css('opacity', 0.5);
		$('#navbar-collapse-1').removeClass('show');
		$('#no_notifications').show();
		$('#notifications').hide();
	}

}

function sse_fallback() {
	$.get('/sse', function(obj) {
		if(! obj)
			return;

		console.log('sse fallback');
		console.log(obj);

		sse_handleNotifications(obj, false, false);
	});
}

function makeid(length) {
	var result = '';
	var characters = 'abcdef0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
