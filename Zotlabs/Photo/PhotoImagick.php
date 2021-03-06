<?php

namespace Zotlabs\Photo;

/**
 * @brief ImageMagick photo driver.
 */
class PhotoImagick extends PhotoDriver {

	public function supportedTypes() {

		$ret = [
			'image/jpeg' => 'jpg',
			'image/png' => 'png',
			'image/gif' => 'gif'
		];
		if(\Imagick::queryFormats("WEBP"))
			$ret['image/webp'] = 'webp';

		return $ret;
	}


	protected function load($data, $type) {
		$this->valid = false;
		$this->image = new \Imagick();

		if(! $data)
			return;

		try {
			$this->image->readImageBlob($data);
		} catch(\Exception $e) {
			logger('Imagick readImageBlob() exception:' . print_r($e, true));
			return;
		}

		/*
		 * Setup the image to the format it will be saved to
		 */

		$map = $this->supportedTypes();
		$format = strtoupper($map[$type]);

		if($this->image) {
			$this->image->setFormat($format);

			// Always coalesce, if it is not a multi-frame image it won't hurt anyway
			$this->image = $this->image->coalesceImages();

			$this->valid = true;
			$this->setDimensions();

			/*
			 * setup the compression here, so we'll do it only once
			 */
			switch($this->getType()) {

				case 'image/png':
					$quality = get_config('system', 'png_quality');
					if((! $quality) || ($quality > 9))
						$quality = PNG_QUALITY;
					/*
					 * From http://www.imagemagick.org/script/command-line-options.php#quality:
					 *
					 * 'For the MNG and PNG image formats, the quality value sets
					 * the zlib compression level (quality / 10) and filter-type (quality % 10).
					 * The default PNG "quality" is 75, which means compression level 7 with adaptive PNG filtering,
					 * unless the image has a color map, in which case it means compression level 7 with no PNG filtering'
					 */
					$quality = $quality * 10;
					$this->image->setCompressionQuality($quality);
					break;

				case 'image/jpeg':
					$quality = get_config('system', 'jpeg_quality');
					if((! $quality) || ($quality > 100))
						$quality = JPEG_QUALITY;
					$this->image->setCompressionQuality($quality);
					break;

				case 'image/webp':
				    $quality = get_config('system', 'webp_quality');
				    if((! $quality) || ($quality > 100))
				        $quality = WEBP_QUALITY;
				    $this->image->setCompressionQuality($quality);
				    break;

				default:
					break;
			}
		}
	}

	protected function destroy() {
		if($this->is_valid()) {
			$this->image->clear();
			$this->image->destroy();
		}
	}

	protected function setDimensions() {
		$this->width = $this->image->getImageWidth();
		$this->height = $this->image->getImageHeight();
	}

	/**
	 * @brief Strips the image of all profiles and comments.
	 *
	 * Keep ICC profile for better colors.
	 *
	 * @see \Zotlabs\Photo\PhotoDriver::clearexif()
	 */
	public function clearexif() {
		$profiles = $this->image->getImageProfiles('icc', true);

		$this->image->stripImage();

		if(! empty($profiles)) {
			$this->image->profileImage('icc', $profiles['icc']);
		}
	}


	/**
	 * @brief Return a \Imagick object of the current image.
	 *
	 * @see \Zotlabs\Photo\PhotoDriver::getImage()
	 *
	 * @return boolean|\Imagick
	 */
	public function getImage() {
		if(! $this->is_valid())
			return false;

		$this->image = $this->image->deconstructImages();
		return $this->image;
	}

	public function doScaleImage($dest_width, $dest_height) {
		/*
		 * If it is not animated, there will be only one iteration here,
		 * so don't bother checking
		 */
		// Don't forget to go back to the first frame
		$this->image->setFirstIterator();
		do {
			$this->image->scaleImage($dest_width, $dest_height);
		} while($this->image->nextImage());

		$this->setDimensions();
	}

	public function rotate($degrees) {
		if(! $this->is_valid())
			return false;

		$this->image->setFirstIterator();
		do {
			// ImageMagick rotates in the opposite direction of imagerotate()
			$this->image->rotateImage(new \ImagickPixel(), -$degrees);
		} while($this->image->nextImage());

		$this->setDimensions();
	}

	public function flip($horiz = true, $vert = false) {
		if(! $this->is_valid())
			return false;

		$this->image->setFirstIterator();
		do {
			if($horiz) $this->image->flipImage();
			if($vert) $this->image->flopImage();
		} while($this->image->nextImage());

		$this->setDimensions(); // Shouldn't really be necessary
	}

	public function cropImageRect($maxx, $maxy, $x, $y, $w, $h) {
		if(! $this->is_valid())
			return false;

		$this->image->setFirstIterator();
		do {
			$this->image->cropImage($w, $h, $x, $y);
			/*
			 * We need to remove the canvas,
			 * or the image is not resized to the crop:
			 * http://php.net/manual/en/imagick.cropimage.php#97232
			 */
			$this->image->setImagePage(0, 0, 0, 0);
		} while($this->image->nextImage());

		$this->doScaleImage($maxx, $maxy);
	}

	public function imageString() {
		if(! $this->is_valid())
			return false;

		/* Clean it */
		$this->image = $this->image->deconstructImages();

		return $this->image->getImagesBlob();
	}

}
