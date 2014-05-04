(function() {
	'use strict';
	var plRun = {
		radius : {
			miles : 3959,
			kms : 6371
		},
		tounit : {
			miles : 1609.344,
			kms : 1000
		},
		pace : {
			miles : 26.8224,
			kms : 16.6667
		},
		speed : {
			miles : 2.2369,
			kms : 3.6
		},
		pacelabel:{
			miles : ' min/mile',
			kms : ' min/km'
		},
		speedlabel:{
			miles : ' mph',
			kms : ' kph'
		},
		distancelabel:{
			miles : ' miles',
			kms : ' km'
		},
		/**
		 * sets the accuracy in metres, above which points will not be recorded
		 */
		minrecordingaccuracy : 12,
		/**
		 * sets the minimum number of milliseconds between recordings
		 */
		minrecordinggap : 5000,
		unit : 'miles',
		paceorspeed : 'pace',
		toRad : function(x){
			return x * Math.PI/180;
		},
		numericExpression : /^[0-9]+$/,
		localstoragetest : function() {
			try {
				return ('localStorage' in window && window.localStorage !== null);
			} catch (e) {
				return (false);
			}
		},
		onUpdateReady : function(){
			$('#updateholder').html('There is a new version of this app available'+
					'. It will be loaded when you refresh the page.');
			$('#updateholder').removeClass();
		},
		clicklistener : function(el, fn){
			try{
			document.getElementById(el).addEventListener('click', fn, false);
			}catch(e){
				try{
					document.getElementById(el).attachEvent('onclick', fn);
				}catch(e){
					alert('cannot make buttons clickable');
				}
			}
		},
		saveGpx : function(){
			if(plRun.haslocalstorage){
				if(plRun.gpxData.length > 0){
					var saveData = '';
					saveData += plRun.gpxData[0].join(',');
					for(var x=1; x<plRun.gpxData.length; x++){
						saveData += '|';
						saveData += plRun.gpxData[x].join(',');
					}
					localStorage.setItem('plRunGpxData', saveData);
				}
			}
		},
		recbuttonclicked : function(event){
			if(navigator.geolocation){
				plRun.recclicked = (new Date()).getTime();
				$('#topbar').addClass('hidden');
				$('#appinfo').addClass('hidden');
				$('#recordbutton').addClass('hidden');
				$('#settingsbutton').addClass('hidden');
				$('#stopbutton').removeClass();
				$('#exportbutton').addClass('hidden');
				$('#boxwrapper').html('');
				$('#time').html('');
				$('#hilldistance').html('');
				$('#avpace').html('');
				$('#speed').html('');
				$('#flatdistance').html('');
				$('#error').html('');
				plRun.gpxData = [];
				plRun.lastrecordtime = 0;
				plRun.firsttime = 0;
				plRun.latold = 'x';
				plRun.lonold = 'x';
				plRun.altold = 'x';
				plRun.dist = 0;
				plRun.equirect = 0;
				plRun.eledist = 0;
				plRun.watchId = navigator
					.geolocation
					.watchPosition(
						plRun
							.ongoingposition,
						plRun.errorfn,
						{
							enableHighAccuracy:true,
							maximumAge:0
						}
					);
			}else{
				alert('Your browser doesn\'t support geolocation.');
			}
		},
		stopbuttonclicked : function(){
			$('#stopbutton').addClass('hidden');
			navigator.geolocation.clearWatch(plRun.watchId);
			window.setTimeout(plRun.saveGpx,100);
			$('#topbar').removeClass();
			$('#appinfo').addClass('details');
			$('#recordbutton').removeClass();
			$('#settingsbutton').removeClass();
			$('#exportbutton').removeClass();
			$('#speed').html('');
			$('#error').html('');
		},
		exportbuttonclicked : function(){
			window.setTimeout(plRun.producegpx,100);
			$('#exportbutton').addClass('hidden');
			$('#updateholder').html('The GPX data is being processed...');
			$('#updateholder').removeClass();
		},
		settingsbuttonclicked : function(){
			$('#accchoice').val(plRun.minrecordingaccuracy);
			$('#gapchoice').val(plRun.minrecordinggap/1000);
			$('#unitchoice').val(plRun.unit);
			$('#settingsbutton').addClass('hidden');
			$('#infoholder').addClass('hidden');
			$('#settingsholder').removeClass();
		},
		settingssavebuttonclicked : function(){
			$('#settingsbutton').removeClass();
			$('#infoholder').removeClass();
			$('#settingsholder').addClass('hidden');
			if($('#accchoice').val().match(plRun.numericExpression)){
				plRun.minrecordingaccuracy = ($('#accchoice').val());
				if(plRun.haslocalstorage){
					localStorage.setItem('plRunSettingsAcc', plRun.minrecordingaccuracy);
				}
			}else{
				alert('The minimum gps accuracy must be a positive whole number');
			}
			if($('#gapchoice').val().match(plRun.numericExpression)){
				plRun.minrecordinggap = ($('#gapchoice').val() * 1000);
				if(plRun.haslocalstorage){
					localStorage.setItem('plRunSettingsGap', plRun.minrecordinggap);
				}
			}else{
				alert('The minimum time gap must be a positive whole number');
			}
			if($('#unitchoice').val() == 'kms'
				|| $('#unitchoice').val() == 'miles'){
				plRun.unit = ($('#unitchoice').val());
				if(plRun.haslocalstorage){
					localStorage.setItem('plRunSettingsUnit', plRun.unit);
				}
			}else{
				alert('The units must be \'kms\' or \'miles\'');
			}
		plRun.setup();
		},
		settingscancelbuttonclicked : function(){
			$('#settingsbutton').removeClass();
			$('#infoholder').removeClass();
			$('#settingsholder').addClass('hidden');
		},
		producegpx : function(){
			if(!plRun.hasOwnProperty('gpxData')  && plRun.haslocalstorage){
				if(typeof(localStorage.getItem('plRunGpxData')) == 'string'){
					plRun.gpxData = localStorage.getItem('plRunGpxData').split('|');
					for(var x=0; x<plRun.gpxData.length; x++){
						plRun.gpxData[x] = plRun.gpxData[x].split(',');
					}
				}
			}
			plRun.gpxoutput = '<?xml version="1.0" encoding="UTF-8" ?><gpx xmlns="http://www.topografix.com/GPX/1/1" creator="http://paul-lockett.co.uk/runrecorder" version="1.1"><trk><trkseg>';
			for (var x=0; x<plRun.gpxData.length; x++) {
				plRun.gpxoutput += '<trkpt lat="' + plRun.gpxData[x][0] + '" lon="' + plRun.gpxData[x][1] + '">';
				if(plRun.gpxData[x][3] != 'x'){
				  plRun.gpxoutput += '<ele>' + plRun.gpxData[x][3] + '</ele>';
				}
				plRun.gpxoutput += '<time>' + plRun.gpxData[x][2] + '</time></trkpt>';
			}
			plRun.gpxoutput += '</trkseg></trk></gpx>';
			$('#boxwrapper').html('<div class="formholder"><p id="linkholder"></p><form><textarea id="gpxbox" readonly="" rows="8"></textarea></form></div>');
			$('#gpxbox').val(plRun.gpxoutput);
			$('#linkholder').html('To save the GPX data, either copy the data in the box, or <a href="mailto:?body=' + encodeURIComponent(plRun.gpxoutput) + '">click here to e-mail it</a>.');
			$('#updateholder').html('');
			$('#updateholder').addClass('hidden');
			$('#gpxbox').focus();
			$('#gpxbox').select();
		},
		ongoingposition : function(position){
			var latnew = position.coords.latitude;
			var lonnew = position.coords.longitude;
			var timenew = position.timestamp;
			$('#error').html(position.coords.accuracy);
			if(position.coords.accuracy <= plRun.minrecordingaccuracy && timenew > plRun.recclicked){
				if(position.coords.speed){
					if(plRun.paceorspeed == 'pace'){
						var currentPace = plRun.pace[plRun.unit] / position.coords.speed; //converts metres per second to minutes per mile or minutes per km
						$('#speed').html(Math.floor(currentPace) + ':' + ('0' + Math.floor((currentPace % 1)*60)).slice(-2));
					}
				}
				if(plRun.latold != 'x' && plRun.lonold != 'x'){
					var elapsed = timenew - plRun.firsttime;
					var hour = Math.floor(elapsed/3600000);
					var minute = ('0' + (Math.floor(elapsed/60000) - hour*60)).slice(-2);
					var second = ('0' + Math.floor((elapsed % 60000)/1000)).slice(-2);
					$('#time').html(hour + ':' + minute + ':' + second);
						if(timenew - plRun.lastdisptime >= plRun.minrecordinggap){
						plRun.lastdisptime = timenew;
						var x = plRun.toRad(lonnew - plRun.lonold) * Math.cos(plRun.toRad(plRun.latold + latnew)/2);
						var y = plRun.toRad(latnew - plRun.latold);
						var e = Math.sqrt(x*x + y*y) * plRun.radius[plRun.unit];
						plRun.equirect += e;
						$('#flatdistance').html(plRun.equirect.toFixed(3));
						if(typeof(position.coords.altitude) == 'number'){
						  var altnew = position.coords.altitude;
						  if(plRun.altold != 'x'){
							var elechange = (altnew - plRun.altold)/plRun.tounit[plRun.unit]; //converts metres to miles or km
							plRun.eledist += (Math.sqrt((e*e) + (elechange*elechange)));
						  }else{
							plRun.eledist += e;
						  }
						  plRun.altold = altnew;
						}else{
						  plRun.eledist += e;
						}
						$('#hilldistance').html(plRun.eledist.toFixed(3));
						if(plRun.equirect > 0){
						  var averagePace = elapsed / (plRun.equirect * 60000);
						  $('#avpace').html(Math.floor(averagePace) + ':' + ('0' + Math.floor((averagePace % 1)*60)).slice(-2));
						}
						plRun.latold = latnew;
						plRun.lonold = lonnew;
					}
				}else{
					plRun.firsttime = timenew;
					plRun.lastdisptime = timenew;
					plRun.latold = latnew;
					plRun.lonold = lonnew;
					$('#time').html('0:00:00');
					$('#hilldistance').html('0');
					$('#flatdistance').html(plRun.equirect.toFixed(3));
				}
				if(timenew - plRun.lastrecordtime >= plRun.minrecordinggap){
				  var pointData = [latnew.toFixed(6),lonnew.toFixed(6),((new Date(timenew)).toISOString()).replace(/\.\d\d\d/, '')]
				  if(typeof(position.coords.altitude) == 'number'){
					pointData.push(position.coords.altitude);
				  }else{
					pointData.push('x');
				  }
				  plRun.gpxData.push(pointData);
				  plRun.lastrecordtime = timenew;
				}
			}
		},
		errorfn : function(){
			alert('error obtaining location');
		},
		setup : function(){
			$('#flatunit').html(plRun.distancelabel[plRun.unit]);
			$('#paceunit').html(plRun.pacelabel[plRun.unit]);
			$('#speedunit').html(plRun.pacelabel[plRun.unit]);
			$('#hillunit').html(plRun.distancelabel[plRun.unit]);
		},
		init : function(){
			plRun.haslocalstorage = plRun.localstoragetest();
			if(plRun.haslocalstorage){
				if(typeof(localStorage.getItem('plRunSettingsUnit')) == 'string'){
					plRun.unit = localStorage.getItem('plRunSettingsUnit');
				}
				if(typeof(localStorage.plRunSettingsGap) == 'string'){
					plRun.minrecordinggap = localStorage.getItem('plRunSettingsGap');
				}
				if(typeof(localStorage.plRunSettingsAcc) == 'string'){
					plRun.minrecordingaccuracy = +localStorage.getItem('plRunSettingsAcc');
				}
			}
			if(window.location.hash){
				plRun.importprocess(window.location.hash);
			}
			plRun.hash = 'unit=' + plRun.unit + '&mintimegap=' + plRun.minrecordinggap/1000 + '&mingpsaccuracy=' + plRun.minrecordingaccuracy;
			plRun.clicklistener('recordbutton', plRun.recbuttonclicked);
			plRun.clicklistener('stopbutton', plRun.stopbuttonclicked);
			plRun.clicklistener('exportbutton', plRun.exportbuttonclicked);
			plRun.clicklistener('settingssavebutton', plRun.settingssavebuttonclicked);
			plRun.clicklistener('settingsbutton', plRun.settingsbuttonclicked);
			plRun.clicklistener('settingscancelbutton', plRun.settingscancelbuttonclicked);
			if(plRun.haslocalstorage){
				if(typeof(localStorage.plRunGpxData) == 'string'){
					$('#exportbutton').removeClass();
				}
			}
			$('#recordbutton').removeClass();
			$('#settingsbutton').removeClass();
			plRun.setup();
		}
	}
	if (window.addEventListener){
		window.addEventListener('load', plRun.init, false);
	}else if(window.attachEvent){
		window.attachEvent('onload', plRun.init);
	}
	if(window.applicationCache){
		window.applicationCache.addEventListener('updateready', plRun.onUpdateReady);
		if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
			plRun.onUpdateReady();
		}
	}
})();