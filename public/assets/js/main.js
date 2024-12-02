/*
    Eventually by HTML5 UP
    html5up.net | @ajlkn
    Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function () {
	"use strict";
  
	var $body = document.querySelector("body");
  
	// Play initial animations on page load.
	window.addEventListener("load", function () {
	  window.setTimeout(function () {
		$body.classList.remove("is-preload");
	  }, 100);
	});
  
	// Slideshow Background.
	(function () {
	  // Settings.
	  var settings = {
		images: {
		  "images/image1.jpg": "center",
		  "images/image2.jpg": "center",
		  "images/image3.jpg": "center",
		  "images/image4.jpg": "center",
		  "images/image5.jpg": "center",
		},
		delay: 6000,
	  };
  
	  var pos = 0,
		lastPos = 0,
		$wrapper,
		$bgs = [],
		$bg,
		k;
  
	  $wrapper = document.createElement("div");
	  $wrapper.id = "bg";
	  $body.appendChild($wrapper);
  
	  for (k in settings.images) {
		$bg = document.createElement("div");
		$bg.style.backgroundImage = `url("${k}")`;
		$bg.style.backgroundPosition = settings.images[k];
		$wrapper.appendChild($bg);
		$bgs.push($bg);
	  }
  
	  $bgs[pos].classList.add("visible");
	  $bgs[pos].classList.add("top");
  
	  if ($bgs.length == 1 || !canUse("transition")) return;
  
	  window.setInterval(function () {
		lastPos = pos;
		pos++;
  
		if (pos >= $bgs.length) pos = 0;
  
		$bgs[lastPos].classList.remove("top");
		$bgs[pos].classList.add("visible");
		$bgs[pos].classList.add("top");
  
		window.setTimeout(function () {
		  $bgs[lastPos].classList.remove("visible");
		}, settings.delay / 2);
	  }, settings.delay);
	})();
  })();
  