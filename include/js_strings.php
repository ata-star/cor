<?php /** @file */

function js_strings() {
	return replace_macros(get_markup_template('js_strings.tpl'), array(
		'$delitem'     => t('Delete this item?'),
		'$comment'     => t('Comment'),
		'$showmore'    => sprintf( t('%s show all'), '<i class=\'fa fa-chevron-down\'></i>'),
		'$showfewer'   => sprintf( t('%s show less'), '<i class=\'fa fa-chevron-up\'></i>'),
		'$divgrowmore' => sprintf( t('%s expand'), '<i class=\'fa fa-chevron-down\'></i>'),
		'$divgrowless' => sprintf( t('%s collapse'),'<i class=\'fa fa-chevron-up\'></i>'),
		'$pwshort'     => t("Password too short"),
		'$pwnomatch'   => t("Passwords do not match"),
		'$everybody'   => t('everybody'),
		'$passphrase'  => t('Secret Passphrase'),
		'$passhint'    => t('Passphrase hint'),
		'$permschange' => t('Notice: Permissions have changed but have not yet been submitted.'),
		'$closeAll'    => t('close all'),
		'$nothingnew'  => t('Nothing new here'),
		'$rating_desc' => t('Rate This Channel (this is public)'),
		'$rating_val'  => t('Rating'),
		'$rating_text' => t('Describe (optional)'),
		'$submit'      => t('Submit'),
		'$linkurl'     => t('Please enter a link URL'),
		'$leavethispage' => t('Unsaved changes. Are you sure you wish to leave this page?'),
		'$location'    => t('Location'),
		'$lovely'      => t('lovely'),
		'$wonderful'   => t('wonderful'),
		'$fantastic'   => t('fantastic'),
		'$great'       => t('great'),
		'$nick_invld1' => t('Your chosen nickname was either already taken or not valid. Please use our suggestion ('),
		'$nick_invld2' => t(') or enter a new one.'),
		'$nick_valid'  => t('Thank you, this nickname is valid.'),
		'$name_empty'  => t('A channel name is required.'),
		'$name_ok1'    => t('This is a '),
		'$name_ok2'    => t(' channel name'),
		'$to_reply'	   => t('Back to reply
		'$pinned'      => t('Pinned'),
		'$pin_item'    => t('Pin to the top'),
		'$unpin_item'  => t('Unpin from the top'),

		// translatable prefix and suffix strings for jquery.timeago -
		// using the defaults set below if left untranslated, empty strings if
		// translated to "NONE" and the corresponding language strings
		// if translated to anything else
		'minutes'       => tt('%d minutes', '%d minutes', '%d'),
		'hours'         => tt('about %d hours', 'about %d hours', '%d'),
		'days'          => tt('%d days', '%d days', '%d'),
		'months'        => tt('%d months', '%d months', '%d'),
		'years'         => tt('%d years', '%d years', '%d'),
		
		// get plural function code
		'plural_func'   => tf(),
                
		'$t01' => ((t('timeago.prefixAgo') == 'timeago.prefixAgo') ? '' : ((t('timeago.prefixAgo') == 'NONE') ? '' : t('timeago.prefixAgo'))),
		'$t02' => ((t('timeago.prefixFromNow') == 'timeago.prefixFromNow') ? '' : ((t('timeago.prefixFromNow') == 'NONE') ? '' : t('timeago.prefixFromNow'))),
		'$t03' => ((t('timeago.suffixAgo') == 'timeago.suffixAgo') ? 'ago' : ((t('timeago.suffixAgo') == 'NONE') ? '' : t('timeago.suffixAgo'))),
		'$t04' => ((t('timeago.suffixFromNow') == 'timeago.suffixFromNow') ? 'from now' : ((t('timeago.suffixFromNow') == 'NONE') ? '' : t('timeago.suffixFromNow'))),

		// translatable main strings for jquery.timeago
		'$t05' => t('less than a minute'),
		'$t06' => t('about a minute'),
		'$t07' => ta('%d minutes'),
		'$t08' => t('about an hour'),
		'$t09' => ta('about %d hours'),
		'$t10' => t('a day'),
		'$t11' => ta('%d days'),
		'$t12' => t('about a month'),
		'$t13' => ta('%d months'),
		'$t14' => t('about a year'),
		'$t15' => ta('%d years'),
		'$t16' => t(' '), // wordSeparator
		'$t17' => ((t('timeago.numbers') != 'timeago.numbers') ? t('timeago.numbers') : '[]'),

		'$January' => t('January'),
		'$February' => t('February'),
		'$March' => t('March'),
		'$April' => t('April'),
		'$May' => t('May','long'),
		'$June' => t('June'),
		'$July' => t('July'),
		'$August' => t('August'),
		'$September' => t('September'),
		'$October' => t('October'),
		'$November' => t('November'),
		'$December' => t('December'),
		'$Jan' => t('Jan'),
		'$Feb' => t('Feb'),
		'$Mar' => t('Mar'),
		'$Apr' => t('Apr'),
		'$MayShort' => t('May','short'),
		'$Jun' => t('Jun'),
		'$Jul' => t('Jul'),
		'$Aug' => t('Aug'),
		'$Sep' => t('Sep'),
		'$Oct' => t('Oct'),
		'$Nov' => t('Nov'),
		'$Dec' => t('Dec'),
		'$Sunday' => t('Sunday'),
		'$Monday' => t('Monday'),
		'$Tuesday' => t('Tuesday'),
		'$Wednesday' => t('Wednesday'),
		'$Thursday' => t('Thursday'),
		'$Friday' => t('Friday'),
		'$Saturday' => t('Saturday'),
		'$Sun' => t('Sun'),
		'$Mon' => t('Mon'),
		'$Tue' => t('Tue'),
		'$Wed' => t('Wed'),
		'$Thu' => t('Thu'),
		'$Fri' => t('Fri'),
		'$Sat' => t('Sat'),
		'$today' => t('today','calendar'),
		'$month' => t('month','calendar'),
		'$week' => t('week','calendar'),
		'$day' => t('day','calendar'),
		'$allday' => t('All day','calendar')
	));
}
