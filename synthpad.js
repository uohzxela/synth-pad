var context = new AudioContext();
var	irHall = new reverbObject('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123941/irHall.ogg');
var ctx;
var javascriptNode = context.createScriptProcessor(2048, 1, 1);
javascriptNode.connect(context.destination);
var analyser = context.createAnalyser();
var gain = context.createGain();
var recorder = new Recorder(gain);
	
analyser.smoothingTimeConstant = 0.3;
analyser.fftSize = 512;

// when the javascript node is called
// we use information from the analyzer node
// to draw the volume
javascriptNode.onaudioprocess = function() {
    // get the average for the first channel
    var array =  new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    // clear the current state
    ctx.clearRect(0, 0, 1310, 325);
    // set the fill style
    ctx.fillStyle=gradient;
    drawSpectrum(array);
}
function drawSpectrum(array) {
    for ( var i = 0; i < (array.length); i++ ){
        var value = array[i];
      	ctx.fillRect(i*10,325-value,3,325);
        //  console.log([i,value])
    }
};

var gradient;

if(!jQuery) {
    //load jquery file
    console.log("jquery not loaded");
}

function loadAudio( object, url) {
 	console.log("load audio");
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
 
    request.onload = function() {
        context.decodeAudioData(request.response, function(buffer) {
            object.buffer = buffer;
        });
    }
    request.send();
}
	function addAudioProperties(object) {
		    object.name = object.id;
		    object.source = $(object).data('sound');
		    loadAudio(object, object.source);
		    object.volume = context.createGain();
		    object.dub = false;
		    object.loop = false;
		    object.reverb = false;
		    object.filter = false;
		    object.fqValue = 350;
		    object.qValue = 500;
		    object.dValue = 3;
		    object.play = function () {
		        var s = context.createBufferSource();
				s.buffer = object.buffer;
				s.connect(analyser);
				analyser.connect(javascriptNode);
				if(this.dub === true) {
					console.log("delay true");
					object.delay = context.createDelay();
					object.delay.delayTime.value = object.dValue;
					var feedback = context.createGain();
					feedback.gain.value = 0.8;

					var filter = context.createBiquadFilter();
					filter.frequency.value = 1000;


					object.delay.connect(feedback);
					feedback.connect(filter);
					filter.connect(object.delay);

					s.connect(object.delay);
					object.delay.connect(object.volume);
					object.delay.connect(gain);
			
				} else {
					console.log("delay false");
		        	
					s.connect(object.volume);
					s.connect(gain);
				}
		        
		        if (this.reverb === true) {
		        	console.log("reverb is true");
		            this.convolver = context.createConvolver();
		            this.convolver.buffer = irHall.buffer;
		            this.volume.connect(this.convolver);
		            gain.connect(this.convolver);
		            this.convolver.connect(context.destination);
		        } else if (this.convolver) {
		            this.volume.disconnect(0);
		            gain.disconnect(0);
		            this.convolver.disconnect(0);
		            this.volume.connect(context.destination);
		            gain.connect(context.destination);
		        } else {
		            this.volume.connect(context.destination);
		            gain.connect(context.destination);
		        }
		        
		        if(this.filter === true) {
		            this.biquad = context.createBiquadFilter();
		            this.biquad.type = this.biquad.LOWPASS;
		            this.biquad.frequency.value = this.fqValue;
		            this.biquad.Q.value = this.qValue;

		            if(this.reverb === true) {
		                this.convolver.disconnect(0);
		                this.convolver.connect(this.biquad);
		                this.biquad.connect(context.destination);
		            } else {
		                this.volume.disconnect(0);
		                gain.disconnect(0);
		                this.volume.connect(this.biquad);
		                gain.connect(this.biquad);
		                this.biquad.connect(context.destination);
		            }
		        } else {
		            if(this.biquad) {
		                if(this.reverb === true) {
		                    this.biquad.disconnect(0);
		                    this.convolver.disconnect(0);
		                    this.convolver.connect(context.destination);
		                } else {
		                    this.biquad.disconnect(0);
		                    this.volume.disconnect(0);
		                    gain.disconnect(0);
		                    this.volume.connect(context.destination);
		                    gain.connect(context.destination);
		                }
		            }
		        }
		        s.loop = object.loop;
		        s.start(0);
		        object.s = s;
		    }

		    object.stop = function () {
		        if(object.s) object.s.stop();
		    }
		}
$(function() {
	ctx = $("#canvas").get()[0].getContext("2d");
	gradient = ctx.createLinearGradient(0,0,0,300);
	gradient.addColorStop(1,'#000000');
	gradient.addColorStop(0.75,'#ff0000');
	gradient.addColorStop(0.25,'#ffff00');
	gradient.addColorStop(0,'#ffffff');
    $('#sp div').each(function() {
        addAudioProperties(this);
    });
 
    $('#sp div').click(function() {
    	console.log("clicked");
        this.play();
    });
    $('#cp input').change(function() {
	    var v = $(this).parent().data('pad'),
	        pad = $('#' + v)[0];
	    console.log("v: " + v);
	    switch ($(this).data('control')) {
	        case 'gain':
	            pad.volume.gain.value = $(this).val();
	            break;
			case 'fq':
				pad.fqValue = $(this).val();
				break;
			case 'q':
				pad.qValue = $(this).val();
				break;
			case 'd':
				pad.dValue = $(this).val();
				break;
	        default:
	            break;
	    }

	});
    $('#cp button').click(function() {
    	var v = $(this).parent().data('pad'),
        	toggle = $(this).text(),
        	pad = $('#' + v)[0];
			$(this).text($(this).data('toggleText')).data('toggleText', toggle);
	            ($(this).val() === 'false') ? $(this).val('true') : $(this).val('false');
	    switch ($(this)[0].className) {
	        case 'loop-button':
	            pad.stop();
	            
	            pad.loop = ($(this).val() == 'false') ? false : true;
	            break;
            case 'reverb-button':
    			pad.stop();
    			pad.reverb = ($(this).val() == 'false') ? false : true;
    			break;
            case 'dub-button':
    			pad.stop();
    			pad.dub = ($(this).val() == 'false') ? false : true;
	            $(this).parent().children('.dub-group').toggleClass('faded');
    			break;
			case 'filter-button':
				pad.stop();
				pad.filter = ($(this).val() == 'false') ? false: true;
				$(this).parent().children('.filter-group').toggleClass('faded');
				break;

	        default:
	            break;
    	}           
	});
	bindEvents();
});

function reverbObject (url) {
  this.source = url;
  loadAudio(this, url);
}

function bindEvents(){

  $('#StartRec').click(recorder.record);
  $('#StopRec').click(recorder.stop);
  $('#ClearRec').click(recorder.clear);
  $('#Export').click(function(){
    recorder.exportWAV(function(blob){
      Recorder.forceDownload(blob);
    });
  });
}
