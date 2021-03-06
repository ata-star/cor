<?php

namespace Zotlabs\Module;

use App;
use Zotlabs\Web\Controller;
use Zotlabs\Lib\Apps;
use Zotlabs\Lib\Libsync;

class Permcats extends Controller {

	function post() {

		if(! local_channel())
			return;

		if(! Apps::system_app_installed(local_channel(), 'Permission Categories'))
			return;

		$channel = App::get_channel();

		check_form_security_token_redirectOnErr('/permcats', 'permcats');


		$all_perms = \Zotlabs\Access\Permissions::Perms();

		$name = escape_tags(trim($_POST['name']));
		if(! $name) {
			notice( t('Permission category name is required.') . EOL);
			return;
		}


		$pcarr = [];

		if($all_perms) {
			foreach($all_perms as $perm => $desc) {
				if(array_key_exists('perms_' . $perm, $_POST)) {
					$pcarr[] = $perm;
				}
			}
		}

		\Zotlabs\Lib\Permcat::update(local_channel(),$name,$pcarr);

		Libsync::build_sync_packet();

		info( t('Permission category saved.') . EOL);

		return;
	}


	function get() {

		if(! local_channel())
			return;

		if(! Apps::system_app_installed(local_channel(), 'Permission Categories')) {
			//Do not display any associated widgets at this point
			App::$pdl = '';
			$papp = Apps::get_papp('Permission Categories');
			return Apps::app_render($papp, 'module');
		}

		$channel = App::get_channel();

		if(argc() > 1)
			$name = hex2bin(argv(1));

		if(argc() > 2 && argv(2) === 'drop') {
			\Zotlabs\Lib\Permcat::delete(local_channel(),$name);
			Libsync::build_sync_packet();
			json_return_and_die([ 'success' => true ]);
		}


		$desc = t('Use this form to create permission rules for various classes of people or connections.');

		$existing = [];

		$pcat = new \Zotlabs\Lib\Permcat(local_channel());
		$pcatlist = $pcat->listing();
		$permcats = [];
		if($pcatlist) {
			foreach($pcatlist as $pc) {
				if(($pc['name']) && ($name) && ($pc['name'] == $name))
					$existing = $pc['perms'];
				if(! $pc['system'])
					$permcats[bin2hex($pc['name'])] = $pc['localname'];
			}
		}

		$global_perms = \Zotlabs\Access\Permissions::Perms();

		foreach($global_perms as $k => $v) {
			$thisperm = \Zotlabs\Lib\Permcat::find_permcat($existing,$k);
			$checkinherited = \Zotlabs\Access\PermissionLimits::Get(local_channel(),$k);

			if($existing[$k])
				$thisperm = "1";

			$perms[] = array('perms_' . $k, $v, '',$thisperm, 1, (($checkinherited & PERMS_SPECIFIC) ? '' : '1'), '', $checkinherited);
		}



		$tpl = get_markup_template("permcats.tpl");
		$o .= replace_macros($tpl, array(
			'$form_security_token' => get_form_security_token("permcats"),
			'$title'	=> t('Permission Categories'),
			'$desc'     => $desc,
			'$desc2' => $desc2,
			'$tokens' => $t,
			'$permcats' => $permcats,
			'$atoken' => $atoken,
			'$url1' => z_root() . '/channel/' . $channel['channel_address'],
			'$url2' => z_root() . '/photos/' . $channel['channel_address'],
			'$name' => array('name', t('Permission category name') . ' <span class="required">*</span>', (($name) ? $name : ''), ''),
			'$me' => t('My Settings'),
			'$perms' => $perms,
			'$inherited' => t('inherited'),
			'$notself' => 0,
			'$self' => 1,
			'$permlbl' => t('Individual Permissions'),
			'$permnote' => t('Some permissions may be inherited from your channel\'s <a href="settings"><strong>privacy settings</strong></a>, which have higher priority than individual settings. You can <strong>not</strong> change those settings here.'),
			'$submit' 	=> t('Submit')
		));
		return $o;
	}

}
