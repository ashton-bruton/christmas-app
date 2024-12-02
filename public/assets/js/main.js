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
  
	  // 
  