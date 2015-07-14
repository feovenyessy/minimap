this.main_object = {};
this.is_main = true;
_self = this;

function init(object,mode) {
	
	if (mode!='main') {
		$('#close img').attr('src','img/back.png');
		$('#close img').unbind();
		$('#close img').click(function(){
			destroy();
			init(_self.main_object,'main');
		});
		_self.is_main = false;
	} else {
		_self.main_object = object;
		$('#close img').attr('src','img/close.png');
		$('#close img').unbind();
		$('#close img').click(function(){
			destroy();
		});
		_self.is_main = true;
	}
	
	$('#close img').load(function(){
		$('#close').css('left',$(window).width()-$('#close').width());
	});

	
	$('#container').height($(window).height());
	$('#container').width($(window).width());
	$("#kep").panzoom('reset');

	


	$('#kep').empty();
	// kép hozzáadása
	var kep = '<img id="kepbmp" src="'+object.src+'" />'
	$('#kep').append(kep);
	
	// only proceed if image is loaded
	$("#kepbmp").load(function(){
		
		// start panzoom
		var panzoom = $("#kep").panzoom({contain: 'invert', minScale: 1, maxScale: 5});	
		
		// mousewheel zoom support for desktops
		$("#container").on("mousewheel",function(e){
			e.preventDefault();
			if (parseInt(e.deltaY)==1) {
				$("#kep").panzoom("zoom");
			} else {
				$("#kep").panzoom("zoom",true);
			}
		});
		
		$('#container').css('display','block');	
		
		// start panzoom update listener
		//panzoom.on('panzoomchange', function(e, panzoom, matrix, changed) {
			//update_map([matrix[3],matrix[4],matrix[5]]);	
		//});
		
		panzoom.on("panzoomend", function( e, panzoom, matrix ) {
			// --- hack for refresh image ----
			$('#kep').hide();
			$('#kep').get(0).offsetHeight; 
			$('#kep').show();
			$('.ikon').qtip('hide');
			// --- hack for refresh image ----		
			
			update_map([matrix[3],matrix[4],matrix[5]]);
		
			//if (_self.is_main) update_icons();
		});
		
		if (_self.is_main) update_icons();
		
		// mini map hozzáadása
		$('#thumb_container').empty();
		$('#thumb_container').append('<div id="mask"></div>');
		var thumb = '<img id="thumb" src="'+object.src+'" />';
		$('#thumb_container').append(thumb);
		 $("#thumb").load(function(){
			$('#thumb_container').height($("#thumb").height());
			$('#thumb_container').css('top',($('#container').height()-$('#thumb_container').height()));
			$('#thumb_container').css('left',($('#container').width()-$('#thumb_container').width()));
			
		 });
		 
		update_map([1,0,0]);
	 });
	
	
	window.addEventListener("orientationchange", function() {
		destroy();
		init(_self.main_object,"main");
	}, false);
	
	window.addEventListener("resize", function() {
		destroy();
		init(_self.main_object,"main");
	}, false);

}

/* Frissíti a térképet panning vagy zoom esetén */
function update_map(matrix) {
	
	var zoomfactor = parseFloat(matrix[0]);
	var kep = document.getElementById('kep').getBoundingClientRect();
	
	// mask meret frissitese
	$('#mask').width(parseInt($('#thumb_container').width() / zoomfactor)) ;
	$('#mask').height(parseInt($('#mask').width() * parseFloat($('#container').height()/$('#container').width())));
	
	// mask pozicio középre helyezése (mátrix origója a kép közepe)
	var kozepX = parseInt($('#thumb_container').width()/2-$('#mask').width()/2);
	var kozepY = 0;
	
	// mask eltolása
	var offsetX = parseInt(($('#thumb_container').width()*matrix[1])/kep.width);
	var nagyut = parseInt(kep.top);
	var kismax = parseInt($('#thumb_container').height()-$('#mask').height());
	var nagymax = parseInt(kep.height-$('#container').height());
	var offsetY = parseInt(nagyut*kismax/nagymax);
	
	$('#mask').css('left',kozepX - offsetX);
	$('#mask').css('top',kozepY - offsetY);

	$(document).trigger( "imageUpdateEvent");
	
	var str = '<table width="100%"><tr><td>mask x: ' + $('#mask').css('left') + '<br>mask y: ' + $('#mask').css('top') + '<br>mask width: ' + $('#mask').width() + '<br>mask height: ' +  $('#mask').height() + '</td>';
	str += '<td>kep x: ' + parseInt(kep.left) + '<br>kep y: ' + parseInt(kep.top) + '<br>kep width: ' + parseInt(kep.width) + '<br>kep height:' +  parseInt(kep.height) + '</td>';
	str += '<td>container width: ' + $('#container').width() + '<br>container height: ' + $('#container').height() + '<br>thumb container width: ' + $('#thumb_container').width() + '<br>thumb container height: ' + $('#thumb_container').height() + '</td>';
	str += '<td>matrix: '+matrix+'<br>offsety:'+offsetY+'nagymax: ' + nagymax + '<br>kismax: '+kismax+'<br>nagyut: '+nagyut+'</td></tr></table>';
	
	$('#debug').html(str);
	//console.log(kep.top);
}

/* ikonok frissítése */
function update_icons() {
	var object = _self.main_object;
	if (object.icons) {
		var arr = object.icons;
		var len = arr.length;
		var kepbmp = document.getElementById('kepbmp');
		var kep = document.getElementById('kep').getBoundingClientRect();
		
		for (var i=0;i<len;i++){
			
			// ikon hozzaadasa
			var id='popup_icon_'+(i+1)+'';
			
			var ikon = '<img id="'+id+'" class="ikon" src="img/tooltip.png" />';
			$('#kep').append(ikon);
			
			switch (arr[i].type) {
				case 'tooltip': 
					$('#'+id).attr('src',"img/tooltip.png");
					
					$('#'+id).qtip({
						content: {
							text: arr[i].txt
						},
						show: {event: 'mouseenter click touchstart'},
						hide: {event: 'mouseleave imageUpdateEvent'}
					});
					
					break;
				case 'popup': 
					$('#'+id).attr('src',"img/popup.png");
					if (arr[i].link) {
						$('#'+id).on('click touchstart',arr[i].link, function(e){
							init(e.data,'sub');
						});
						
					}
					break;
				default:
					break;
			}
			
			
			// ikon pozicio szamitasa
			
			var new_x = parseInt((arr[i].x * kep.width)/_self.main_object.orig_width);
			var new_y = parseInt((arr[i].y * kep.height)/_self.main_object.orig_height);
			
			$('#'+id).css('left',new_x);
			$('#'+id).css('top',new_y);
			
			$('#'+id).css('width','16px');
			$('#'+id).css('height','16px');
			
		}
	}
}


function destroy() {
	$("#kep").panzoom("reset");
	$("#kep").empty();
	$("#debug").empty();
	$("#thumb_container").empty();
	$('#container').css('width',$(window).width());
	$('#container').css('height',$(window).height());
	$('#container').css('display','none');
}