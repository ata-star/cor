<?php
namespace Zotlabs\Module;

use Zotlabs\Lib\Crypto;
use Zotlabs\Web\HTTPSig;
use Zotlabs\Lib\Libzot;

/**
 * module: getfile
 *
 * used for synchronising files and photos across clones
 *
 * The site initiating the file operation will send a sync packet to known clones.
 * They will respond by building the DB structures they require, then will provide a
 * post request to this site to grab the file data. This is sent as a stream direct to
 * disk at the other end, avoiding memory issues.
 *
 * Since magic-auth cannot easily be used by the CURL process at the other end,
 * we will require a signed request which includes a timestamp. This should not be
 * used without SSL and is potentially vulnerable to replay if an attacker decrypts
 * the SSL traffic fast enough. The amount of time slop is configurable but defaults
 * to 3 minutes.
 *
 */



require_once('include/attach.php');


class Getfile extends \Zotlabs\Web\Controller {

	function post() {

		$header_verified = false;

		$hash     = $_POST['hash'];
		$time     = $_POST['time'];
		$sig      = $_POST['signature'];
		$resource = $_POST['resource'];
		$revision = intval($_POST['revision']);

		if(! $hash)
			killme();

		foreach([ 'REDIRECT_REMOTE_USER', 'HTTP_AUTHORIZATION' ] as $head) {
			if(array_key_exists($head,$_SERVER) && substr(trim($_SERVER[$head]),0,9) === 'Signature') {
				if($head !== 'HTTP_AUTHORIZATION') {
					$_SERVER['HTTP_AUTHORIZATION'] = $_SERVER[$head];
					continue;
				}

				$sigblock = HTTPSig::parse_sigheader($_SERVER[$head]);
				if($sigblock) {
					$keyId = $sigblock['keyId'];

					if($keyId) {
						$r = q("select * from hubloc left join xchan on hubloc_hash = xchan_hash
							where hubloc_id_url = '%s'",
							dbesc(str_replace('acct:','',$keyId))
						);
						if($r) {
							$hubloc = Libzot::zot_record_preferred($r);
							$verified = HTTPSig::verify('',$hubloc['xchan_pubkey']);
							if($verified && $verified['header_signed'] && $verified['header_valid'] && $hash == $hubloc['hubloc_hash']) {
								$header_verified = true;
							}
						}
					}
				}
			}
		}


		logger('post: ' . print_r($_POST,true),LOGGER_DEBUG,LOG_INFO);
		if($header_verified) {
				logger('HTTPSig verified');
		}

		$channel = channelx_by_hash($hash);

		if((! $channel) || (! $time) || (! $sig)) {
			logger('error: missing info');
			killme();
		}

		if(isset($_POST['resolution']))
			$resolution = intval($_POST['resolution']);
		elseif(substr($resource,-2,1) == '-') {
			$resolution = intval(substr($resource,-1,1));
			$resource = substr($resource,0,-2);
		}
		else {
			$resolution = (-1);
		}

		$slop = intval(get_pconfig($channel['channel_id'],'system','getfile_time_slop'));
		if($slop < 1)
			$slop = 3;

		$d1 = datetime_convert('UTC','UTC',"now + $slop minutes");
		$d2 = datetime_convert('UTC','UTC',"now - $slop minutes");

		if(! $header_verified) {
			if(($time > $d1) || ($time < $d2)) {
				logger('time outside allowable range');
				killme();
			}

			if(! Crypto::verify($hash . '.' . $time,base64url_decode($sig),$channel['channel_pubkey'])) {
				logger('verify failed.');
				killme();
			}
		}

		if($resolution > 0) {
			$r = q("SELECT * FROM photo WHERE resource_id = '%s' AND uid = %d AND imgscale = %d LIMIT 1",
				dbesc($resource),
				intval($channel['channel_id']),
				$resolution
			);
			if($r) {
				header('Content-type: ' . $r[0]['mimetype']);

				if(intval($r[0]['os_storage'])) {
					$fname = dbunescbin($r[0]['content']);
					if(strpos($fname,'store') !== false)
						$istream = fopen($fname,'rb');
					else
						$istream = fopen('store/' . $channel['channel_address'] . '/' . $fname,'rb');
					$ostream = fopen('php://output','wb');
					if($istream && $ostream) {
						pipe_streams($istream,$ostream);
						fclose($istream);
						fclose($ostream);
					}
				}
				else {
					echo dbunescbin($r[0]['content']);
				}
			}
			killme();
		}

		$r = attach_by_hash($resource,$channel['channel_hash'],$revision);

		if(! $r['success']) {
			logger('attach_by_hash failed: ' . $r['message']);
			notice( $r['message'] . EOL);
			return;
		}

		$unsafe_types = array('text/html','text/css','application/javascript');

		if(in_array($r['data']['filetype'],$unsafe_types) && (! channel_codeallowed($channel['channel_id']))) {
				header('Content-type: text/plain');
		}
		else {
			header('Content-type: ' . $r['data']['filetype']);
		}

		header('Content-disposition: attachment; filename="' . $r['data']['filename'] . '"');
		if(intval($r['data']['os_storage'])) {
			$fname = dbunescbin($r['data']['content']);
			if(strpos($fname,'store') !== false)
				$istream = fopen($fname,'rb');
			else
				$istream = fopen('store/' . $channel['channel_address'] . '/' . $fname,'rb');
			$ostream = fopen('php://output','wb');
			if($istream && $ostream) {
				pipe_streams($istream,$ostream);
				fclose($istream);
				fclose($ostream);
			}
		}
		else {
			echo dbunescbin($r['data']['content']);
		}
		killme();
	}
}
