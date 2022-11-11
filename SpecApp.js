//	Javascript file for the Spectroscopy Tutorial web application.  This contains all of the functions used
//  by the Spectroscopy Tutorial web application.

		var specName = "Ethanol"; // Start with the t-Butyl Methyl Ether spectrum and structure
		var whichSpectrum = "MS"; // Start with the MS spectrum.
		var specNameArray = {};
		var xmlResponse;
		var currentPeakDescArray = [];
		var fragArray = [];
		fragArray.id = "fragArray";
		var movieArray = [];
		var peakNameArray = {};

		function initializeApp(){//This function gets everything started by getting and loading the SpecInfo.xml file and using that data to create the Compounds menu.
			getXML("Spectra/SpecInfo.xml", loadXML, "New message!\n\n");
		}
		
		function xhrSuccess () { this.callback.apply(this, this.arguments); }// This runs the callback function if the loadXML is successful.

		function xhrError () { console.error(this.statusText); }// This runs if the loadXML is not successful.

		function getXML (sURL, loadXMLCallback /*, argumentToPass1, argumentToPass2, etc. */) { // This function loads an XML file.  For this application the XML file contains information about each compound in the Spectroscopy Tutorial.  Change the XML file and you can load different compounds and information.
			var xmlDoc = new XMLHttpRequest();
			xmlDoc.callback = loadXMLCallback;
			xmlDoc.arguments = Array.prototype.slice.call(arguments, 2);
			xmlDoc.onload = xhrSuccess;
			xmlDoc.onerror = xhrError;
			xmlDoc.open("get", sURL, true);
			xmlDoc.overrideMimeType('text/xml');
			xmlDoc.send(null);
		}
		
		function loadXML () { // This is the callback function for the getXML function.  After the XML file is read in it is sent here.  The data in the XML file is used to create the Compounds menu.  After this the first spectrum and molecule are loaded into their respective canvases.
			xmlResponse = this.responseXML;
			makeSpecNameArray(xmlResponse);
			makeUnorderedList("sub-menu");
			getAndShow(specName, 'Init');
// 			textDescribe("");
		}	
			
		function makeSpecNameArray(xmlResponse){ // This creates a key/value array where the key is the compound's name as seen in the Compound menu and the value is the name as found in the spectrum jcamp file name.
			var xmlSpecName = xmlResponse.evaluate("/SpectroscopyInfo/Compound/SpecName", xmlResponse, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			var xmlName = xmlResponse.evaluate("/SpectroscopyInfo/Compound/Name", xmlResponse, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			var getSpecName = xmlSpecName.iterateNext();
			var getName = xmlName.iterateNext();
			while (getName) {
				var val = getSpecName.textContent;
				var key = getName.textContent;
				specNameArray[key] = val;
				getSpecName = xmlSpecName.iterateNext();
				getName = xmlName.iterateNext();
			}
		}	
		
		function makeUnorderedList (listID) { // This is creating the html list that is used to make the Compound menu.
			var nameArray = [];
			makeNameArray(nameArray);
			var list = document.getElementById(listID);
			for (var i in nameArray) {
				add_li(nameArray, listID, list, i);
			}
		}
			
		function add_li(nameArray, listID, list, i) { // Creates the list item and attaches an onclick function to it so that selecting an item from the list causes the corresponding spectrum file to be loaded.
				var listItem = document.createElement("li");
				var compoundString = new String();
				var spectrumString = "Init";
				var key = nameArray[i];
				compoundString = specNameArray[key];
				var A = document.createElement("a");
				A.onclick = function(){getAndShow(compoundString, spectrumString)};
				A.innerHTML = nameArray[i];
				listItem.appendChild(A);
				list.appendChild(listItem);
		}
							
		function makeNameArray (nameArray) {  //This creates an array containing the names of all the compounds.
			var xmlName = xmlResponse.evaluate("/SpectroscopyInfo/Compound/Name", xmlResponse, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			var getList = xmlName.iterateNext();
			while (getList) {
				nameArray.push(getList.textContent);
				getList = xmlName.iterateNext();
			}
			return nameArray;
		}
		
		function getAndShow(compoundName, spectrumName){// This function loads spectrum and molecule data from an external file then displays the spectrum and molecule in their respective divs.
			specName = compoundName;
			if (spectrumName == "Init"){// For when the app is first starting up.
				whichSpectrum = "MS";// Display the IR spectrum for the first molecule when starting the app.
			}else{
				whichSpectrum = spectrumName;
				}
			makePeakArrays(compoundName);
// 			if (whichSpectrum == "IR"){
// 				makePeakNameArray(compoundName); //these lines of code are for the IR vibrations.
// 			}
			var fileName = specName + whichSpectrum + ".jdx";
			var spectrumFile = "./Spectra/" + whichSpectrum + "/" + fileName;
			removeCanvas("specSpec", "spec_spectrum");
			removeCanvas("specMol", "spec_molecule");
			loadCanvas("specSpec", "spec_spectrum");
			loadCanvas("specMol", "spec_molecule");
			getSpectrum (spectrumFile, function (spectrumData){
				showSpectrum(spectrumData);
			});
			if (spectrumName == 'Init'){ // First time through we need to display general info about the compound.
				document.getElementById("fragCell").innerHTML = "";
				var xPathExpr = "//Compound[SpecName='" + compoundName + "']/Description";
				var xmlMolDesc = xmlResponse.evaluate(xPathExpr, xmlResponse, null, XPathResult.STRING_TYPE, null);
				textDescribe(xmlMolDesc.stringValue);
			}else{ // Subsequent times through we need to display information about the specific spectrum.
				var xPathExpr = "//Compound[SpecName='" + compoundName + "']/" + whichSpectrum + "Description";
				var xmlPeakDesc = xmlResponse.evaluate(xPathExpr, xmlResponse, null, XPathResult.STRING_TYPE, null);
				textDescribe(xmlPeakDesc.stringValue);
				}
		}
		
		function makePeakArrays(compoundName){// This function reads data from SpecInfo.xml for the current spectrum and puts it into an array.  This info will then be displayed when hovering over peaks in the spectrum or atoms in the molecule.
			var peakDescString = whichSpectrum + "Description";
			var xPathExpr = "//Compound[SpecName='" + compoundName + "']/" + peakDescString;
			var xmlPeakDesc = xmlResponse.evaluate(xPathExpr, xmlResponse, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			var getList = xmlPeakDesc.iterateNext();
//			var name = "";
			currentPeakDescArray = {};// Clear out the array to put new info in it.
			var i=0;
//			var peakName;
			peakNameArray = {};
			while (getList) {// iterate through all the peak descriptions for this spectrum in the SpecInfo.xml file.
				var key = getList.getAttribute("x");
				var val = getList.textContent;
				currentPeakDescArray[key] = val;
// 				if (whichSpectrum == "IR"){ // This code not currently being used.  It will be used for displaying IR vibrations later.
// 					peakName = name + i + ".";
// 					peakNameArray[key] = peakName;
// 				}
				getList = xmlPeakDesc.iterateNext();
				i++;
			}
		}
				
		function getSpectrum (spectrumFile, callback){// This gets the spectrum data from the external file.
// 			var test = fileExists(spectrumFile);
			var test = 1;
			if (test){
				ChemDoodle.io.file.content(spectrumFile, function(fileContent){
					var spectrumData = fileContent;
					callback(spectrumData);
				});
			}
		}
		
		function showSpectrum (spectrumData){// This creates the Structure Spectrum Set and loads the spectrum and molecule into their respective canvases in their divs.
			var spectrumSet = new ChemDoodle.io.JCAMPInterpreter().makeStructureSpectrumSet('spec', spectrumData, 200, 200, 600, 300, whichSpectrum);
		}
		
		function removeCanvas(divId, canvasId) {// This function removes a canvas element from a div to clear out that div before adding a new spectrum or molecule.
			var canvas = document.getElementById(canvasId);
			if (canvas) {
				var d = document.getElementById(divId);
				d.removeChild(canvas);
			}
		}
		
		function loadCanvas(divId, canvasId) {// This function loads a spectrum or molecule into its respective div.
			switch (divId) {
				case "specSpec":
					var specCanvas = document.createElement('canvas');
					specCanvas.id = canvasId;
					var specDiv = document.getElementById("specSpec"); 
					specDiv.appendChild(specCanvas);
					break;
				case "specMol":
					var molCanvas = document.createElement('canvas');
					molCanvas.id = canvasId;
					var molDiv = document.getElementById("specMol");
					molDiv.appendChild(molCanvas);
					break;
			}
		}
		
		function textDescribe(Description) { // This function takes text from a text file and displays it in a div.  Used to display information relevant to the spectra.
			var textDescription = document.getElementById("specDesc");
			textDescription.innerHTML = Description;
		}
		
		function showSomething(hovered){// This function changes the display of text when hovering over a peak in a spectrum or the corresponding atom in the molecule.
			showProps(hovered, "hovered");
			var textDescription = document.getElementById("specDesc");
			textDescription.innerHTML = currentPeakDescArray[hovered.x];
			peakName = peakNameArray[hovered.x];
//			loadIRmovieFiles(peakName);
		}
		
		function removeSomething(){// This function is for removing text from being displayed if not hovering over a peak or atom.
			var textDescription = document.getElementById("specDesc");
			textDescription.innerHTML = null;
		}
		
		function loadFragment(fragImage){//This function loads an image of a molecule fragment into the Fragment Space on the web page.
			var source = fragImage.src;//fragImage will be the image reduced in size.
			var newFrag = document.createElement('img');//Get its source and assign it to a new image element which will then be
			newFrag.src = source;//original size.
			document.getElementById("fragCell").appendChild(newFrag);
			var blank = document.createElement('img');
			blank.src = "./FragLibrary/blank.png";
			document.getElementById("fragCell").appendChild(blank);
			document.getElementById("fragTable").style.visibility = "hidden";
		}
		
		function loadFragArray (fragArray){
			for (var i = 0; i<34; i++){
				var fragImage = document.createElement('img');
				fragImage.src = "./FragLibrary/frag" + i + ".png";
// 				test = fileExists(fragImage.src);//only add the image to the table if you can find it on the server.
// 				if (test){
					fragArray.push(fragImage);
// 				}
			}
		}
		
		function makeFragmentTable(resizeCallback){// This function creates a 7x5 table and loads molecule fragment images into it.
			var tableDiv = document.getElementById("fragTable");
			var table = document.createElement('table');
			var header = table.createTHead();
			var row = header.insertRow();
			var cell = row.insertCell();
			cell.setAttribute('colSpan', '7');
			cell.innerHTML ="<b>Click on a fragment to add it to the molecule's Fragment Space</b>";//These first 7 or so lines of code create the table and a table header.
			var tbody = document.createElement('tbody');//Creating the table body.
			loadFragArray(fragArray);
			var counter = 0;
			for (var i = 0; i<5; i++){
				var row = tbody.insertRow();//Creating each row of the table.
				for (var j = 0; j<7; j++){
					var cell = row.insertCell();//Creating each table cell (td element).
						if (counter<34){
							fragImage = fragArray[counter];
							source = fragImage.src;
							fragImage.onclick = function(){loadFragment(this)};//Make it so that clicking on the fragment image loads it into the Fragment Space area of the page.
							cell.appendChild(fragImage);
							counter++;
						}
				}
			}
			table.appendChild(tbody);
			tableDiv.appendChild(table);//Now that the table has been created this puts it into the div, which starts out invisible.
			resizeCallback();
		}
		
		function resize(){//This just reads in the width and height of the image, cuts them in half, then assigns those new values to the width and height attributes.
			var l=fragArray.length;
			for (var i = 0; i<l; i++){
				if (fragArray[i].width != 0){
					var w = fragArray[i].width;
					w = w * 0.5;
				}
			}
		}
		
		function showFragTable(){//Makes the "hidden" table visible while also reducing the size of all the images in the table.
			var fragDiv = document.getElementById("fragTable");
			for (var i in fragArray){//This loops runs through the whole array of fragment images and reduces their size.
				fragImage = fragArray[i];
				if (fragImage.width == fragImage.naturalWidth){//checks to make sure the image hasn't already been resized.  Don't want to keep making them smaller.
					w = fragImage.width;
					w = w * 0.5;
					fragImage.width = w;
				}
			}
			fragDiv.style.visibility = "visible";
		}
		
		function loadIRmovieFiles (peakName) { // Not using this yet.  It will load pdb files for displaying IR vibrations.
// 			var movieArray = [];
			var frame;
			var frameName;
			for (var i=0; i<11; i++) {
				frameName = "./" + peakName + i + ".pdb"
				var pdbFile = new XMLHttpRequest();
				pdbFile.open("get", frameName, true);
				pdbFile.send(null);
// 				addToArray();
				var timer = function addToArray(){
					if (pdbFile.responseText){
						frame = pdbFile.responseText;
						movieArray.push(frame);
					} else {
						setTimeout("addToArray()", 10);
					}
				}
				timer();
			}
			if (movieArray.length == 11){
				showVibration(peakName);
			}
		}
		
		function showVibration(peakName){ // Not using this yet.  It will put together all of the pdb files to display a movie of IR vibrations.
// 			var movieArray = [];
			while (movieArray.length<11){
				loadIRmovieFiles(peakName, movieArray);
				setTimeout("loadIRmovieFiles(peakName, movieArray)", 100);
			}
			var IRmovie = new ChemDoodle.MovieCanvas3D('IRmovie', 300, 300);
			for (var i=0; i<movieArray.length; i++){
				IRmovie.addFrame([ChemDoodle.readPDB(movieArray[i])]);
			}
			IRmovie.specs.set3DRepresentation('Ball and Stick');
			IRmovie.specs.backgroundColor = 'black';
			var molecule = IRmovie.frames[0].mols[0];
			IRmovie.loadMolecule(molecule);
			IRmovie.startAnimation();
			IRmovieDiv = document.getElementByID('IRmovie');
			IRmovieDiv.appendChild(IRmovie);
			IRmovieDiv.visibility = 'visible';
		}

		function listAllProperties(o){     //this is just here so if I'm testing I can tell what properties some object has.
			var objectToInspect;     
			var result = [];
			for(objectToInspect = o; objectToInspect !== null; objectToInspect = Object.getPrototypeOf(objectToInspect)){  
				var prop = Object.getOwnPropertyNames(objectToInspect);
				if (typeof prop === "function"){
					result = result.concat(Object.getOwnPropertyNames(objectToInspect));  
				}
			}
			return result;
		}
		
		function showProps(obj, objName) {  //also for testing purposes, shows property name and value.
		  var result = "";
		  for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				result += objName + "." + i + " = " + obj[i] + "\n";
			}
		  }
		}
		

		function fileExists(url) {// This function checks to see if a file is actually on the server before downloading it.
			if(url){
				var req = new XMLHttpRequest();
				try {
					req.open('HEAD', url, false);
					req.send(null);
					return req.status == 200 || req.status == 0 ? true : false;
					}
				catch(er) {
					return false;
				}
			} else {
				return false;
				}
		}
		
