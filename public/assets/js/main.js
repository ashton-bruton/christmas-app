/*
    Eventually by HTML5 UP
    html5up.net | @ajlkn
    Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function () {
	"use strict";
  
	// Define `canUse` globally.
	window.canUse = function (property) {
	  const testElement = document.createElement("div");
	  const capitalizedProperty = property.charAt(0).toUpperCase() + property.slice(1);
  
	  return (
		property in testElement.style ||
		`Moz${capitalizedProperty}` in testElement.style ||
		`Webkit${capitalizedProperty}` in testElement.style ||
		`O${capitalizedProperty}` in testElement.style ||
		`ms${capitalizedProperty}` in testElement.style
	  );
	};
  
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
  
	  // Vars.
	  var pos = 0,
		lastPos = 0,
		$wrapper,
		$bgs = [],
		$bg,
		k;
  
	  // Create BG wrapper, BGs.
	  $wrapper = document.createElement("div");
	  $wrapper.id = "bg";
	  $body.appendChild($wrapper);
  
	  for (k in settings.images) {
		// Create BG.
		$bg = document.createElement("div");
		$bg.style.backgroundImage = 'url("' + k + '")';
		$bg.style.backgroundPosition = settings.images[k];
		$wrapper.appendChild($bg);
  
		// Add it to array.
		$bgs.push($bg);
	  }
  
	  // Main loop.
	  $bgs[pos].classList.add("visible");
	  $bgs[pos].classList.add("top");
  
	  // Bail if we only have a single BG or the client doesn't support transitions.
	  if ($bgs.length == 1 || !canUse("transition")) return;
  
	  window.setInterval(function () {
		lastPos = pos;
		pos++;
  
		// Wrap to beginning if necessary.
		if (pos >= $bgs.length) pos = 0;
  
		// Swap top images.
		$bgs[lastPos].classList.remove("top");
		$bgs[pos].classList.add("visible");
		$bgs[pos].classList.add("top");
  
		// Hide last image after a short delay.
		window.setTimeout(function () {
		  $bgs[lastPos].classList.remove("visible");
		}, settings.delay / 2);
	  }, settings.delay);
	})();
  
	// Update Background Based on Character
	function updateBackground(character) {
	  const bgWrapper = document.querySelector("#bg");
	  const newBackground = `url('images/characters/${character}.jpg')`;
  
	  // Update body background if #bg is not present.
	  if (!bgWrapper) {
		$body.style.backgroundImage = newBackground;
		$body.style.backgroundSize = "cover";
		$body.style.backgroundPosition = "center";
	  } else {
		// Dynamically update the #bg div if slideshow exists.
		const newBgDiv = document.createElement("div");
		newBgDiv.style.backgroundImage = newBackground;
		newBgDiv.style.backgroundPosition = "center";
		newBgDiv.style.backgroundSize = "cover";
		newBgDiv.classList.add("visible", "top");
  
		bgWrapper.appendChild(newBgDiv);
  
		// Hide the previous background after a short delay.
		const currentBg = bgWrapper.querySelector(".visible:not(.top)");
		if (currentBg) {
		  window.setTimeout(function () {
			currentBg.classList.remove("visible");
			bgWrapper.removeChild(currentBg);
		  }, 1500);
		}
	  }
	}
  
	// Signup Form with Background Change on Submit and Hide Content.
	(function () {
	  var $form = document.querySelector("#signup-form"),
		$submit = document.querySelector("#signup-form input[type='submit']"),
		$message,
		$mainContent = document.querySelector("#mainContent"); // Reference to mainContent.
  
	  if (!("addEventListener" in $form)) return;
  
	  $message = document.createElement("span");
	  $message.classList.add("message");
	  $form.appendChild($message);
  
	  $message._show = function (type, text) {
		$message.innerHTML = text;
		$message.classList.add(type);
		$message.classList.add("visible");
  
		window.setTimeout(function () {
		  $message._hide();
		}, 3000);
	  };
  
	  $message._hide = function () {
		$message.classList.remove("visible");
	  };
  
	  $form.addEventListener("submit", async function (event) {
		event.stopPropagation();
		event.preventDefault();
  
		$message._hide();
		$submit.disabled = true;
  
		// Fetch character and update background.
		const character = document.getElementById("character").value;
		updateBackground(character);
  
		// Hide mainContent.
		if ($mainContent) {
		  $mainContent.style.display = "none";
		}
  
		// Reset form and re-enable submit.
		window.setTimeout(function () {
		  $form.reset();
		  $submit.disabled = false;
		  $message._show("success", "Thank you!");
		}, 750);
	  });
	})();
  })();
  