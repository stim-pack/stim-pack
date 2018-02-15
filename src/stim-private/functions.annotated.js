/*
functions.js Stimuleringsfonds Creatieve Industrie
*/

var sitesettings = {
	factor: 			-1, 
	animmatefilter: 	true,
	animatefilterfield: true,
	ff: 				true,		//filterfield en/dis abled
	startamount: 		{def:0 },
	language: 			'',
	baseurl: 			'',
	directurl:			false,
	isTablet:			false
}

/* history detect */
sitesettings.usehistory = supports_history_api();
function supports_history_api() {
  return !!(window.history && history.pushState);
}


//different speeds
var speed = {
	column: 	300,		//column switch (was 400)
	toc:		300,		//toggle and collapse
	filter: 	300,		//speed for showing/hiding filtered items. same as column?
	filterfield:300,			//speed for enabling disabling filter
	mask:		300,
	loadmore:	400,
	showmore:	300,
	scrollto:	400,
	fast:		100,
	lbx:		{ toc: 	200, fade: 300},
	sfilter:	300,
	tdcn:		200
}

var colData = {
//column data
	colh:	0,
	colw: 	0,			//col width
	colm: 	0,			//col margin
	colwt:	0,			//col width + 2xcolumn
	colwd:	0,			//col width double (when open)
	borw:	1,			//border width
	content: {	h:	0 }, //column content
	header:  {	h:	0 }, //column header
	//currently open?
	isbussy: false,		//is col being animated?
	tcbussy: false,
	scalefactor: 2,	//factor for column 'grow'n 'shrink'
	windowheights: {},//'column-1': { normal: 0, active:0} //mainwindowheights
	culumns: {},		//'column-1': { normal: 0, active:0} //mainwindowheights
	toccs: {},			//notused
	cws: { 	col1: {hn:0, ha:0},
			col3: {hn:0, ha:0},
	 		col4: {hn:0, ha:0}}
}

//var cwData = {};
	
//var fsData = {
//	factor : 2
//}
var fontFactor = {
	normal : 2,
	reversed : (1/2),
}

/*
toccs['toccid']//not used
type normal:
	toccs[id][cwhn]
			 [cwha]
	cwhn: content window normal
	cwha: content window normal
type activeonly: (col2)
	toccs[id][cwhn] (van container?
			 [cwha]
			 [links][ind][cwhn]
						 [cwha]
						 [lofsn] link offset
						 [lofsa]
*/

function AddSiteSettings( settings ){
	sitesettings = $.extend( sitesettings, settings);
	fontFactor.normal = sitesettings.factor;
	console.log( sitesettings );
} 

var colManager = false;

var gifmanagers = { main: false, column:false, lb:false };
var gmActive = false;

var tdcn = false;
var tdcnStick = false;

(function($){//sandbox start
	var useLB = false;
	var isHomePage = false;
	var lightbox;
	var filterbussy = false;
	var tcfStickem = false;		
	var infScroll = false;

	function tcfs_engage(){
		if( tcfStickem ){tcfs_destroy();}
		tcfStickem = $('.lico').eq(0).stickem({ /*onStick:onStick*/ item:'.tcf-close', container:'.toc-field',offset:50 });
	}	
	
	function tcfs_update(){
		if( tcfStickem ){tcfStickem.updateOffset( 0 );}
	}
	
	function tcfs_destroy(){
		if( tcfStickem ){tcfStickem.destroy();tcfStickem = false;}
	}
	
	/* DOCREADY */	
	$( document ).ready(function() {
		useLB = sitesettings.pagetype != 'page-program';
		isHomePage = sitesettings.pagetype == 'page-home';
		console.log('load, lb:'+useLB);
		/* handle image load/size */
		if( useLB && $('#lb-outer').hasClass('active') ){
			image_defaultload( '#lb-main', false );
		}
		image_defaultload( '.art', false );
		
		//initiate print button
		$(document).on('click','.sh-b.sh-p',function(e){ 
			if( $(this).hasClass('listprint') ){
				$('body').addClass('listprint').removeClass('mainprint');
			}else{
				$('body').addClass('mainprint').removeClass('listprint');
			}
			window.print();
		});
		var beforePrint = function() {
        	//$('body').addClass('mainprint').removeClass('listprint');
    	};
		var afterPrint = function() {
			$('body').addClass('mainprint').removeClass('listprint');
			//$('body').removeClass('mainprint').removeClass('listprint');
		};
	
		if (window.matchMedia) {
			var mediaQueryList = window.matchMedia('print');
			mediaQueryList.addListener(function(mql) {
				if (mql.matches) {
					beforePrint();
				} else {
					afterPrint();
				}
			});
		}
	
		window.onbeforeprint = beforePrint;
		window.onafterprint = afterPrint;
		
		rspns_start();
		//InitiateColumns( false );
		if( $('.column').length > 0 ){
			colManager = new ColumnManager();
			$('.tc-field.activestart').removeClass('activestart').show();
		}
		
		if( useLB ){
			if( isHomePage ){
				$.ajax( { type:'GET', url: '/inc/lightbox.php', data:{action:'lbframe'}} )
				.done(function( d, t, jq) {//alert('success ' + d);
					setTimeout(function(){$(d).insertAfter( $('#main') );CreateLightBox();},2000);
					
				})
				.fail(function( jq, t, e ) {})
				.always(function() {});	
			}else{
				CreateLightBox();
			}
			//tocfield stickem
			
			tdcn_init();
			
			//loadmore handler
			$(document).on('click', ".loadmore", function(e) {
				var $button = $(this);
				loadmore( $button, false  );
			});
			if( sitesettings.language == 'nl' ){
				//console.log('visible: ' + $('#columnlogo').is(':visible') + ', display: ' + $('#columnlogo').css('display'));
				gmActive = true;
				//gifmanagers.main = $('#sb-left-fixed').gifmanager({enabled:!$('#columnlogo').is(':visible')});
				//gifmanagers.column = $('#columnlogo').gifmanager({enabled:$('#columnlogo').is(':visible')});
				gifmanagers.main = $('#sb-left-fixed').gifmanager({enabled:false});
				gifmanagers.column = $('#columnlogo').gifmanager({enabled:false});
				gifmanagers.lb = $('#lb-logo-left').gifmanager({enabled:false});				
				if( $('#lb-outer').hasClass('active') ){
					gifmanager_play('lb');
				}else{
					gifmanager_play_home();
				}
				//console.log( gifmanagers );
			}
			disclaimer_init();
			ss_init();
			
			//search 
			if( ! sitesettings.isMobile ){
				$(document).on('mouseenter mouseleave','.s-result .pp-link',function(e){
					var $field = $(this).parent().next('.srnv');
					if( e.type == 'mouseenter' ){
						//console.log('ENTER');
						$field.velocity('slideDown',200,function(){});
					}else{
						$field.velocity('slideUp',200,function(){});
					}
				});
			}
		}else{
			//set sb-list top margin
//			var sbList = $('.pp-sb-con.sb-list');
//			if( sbList.length > 0 ){
//				var sbTop = pxToInt($('#pp-sb-right').css('margin-top')) + pxToInt($('#pp-sb-right').css('padding-top')); 
//				var art = $('#pp-content .art').eq(0);
//				var artTop = art.offset().top;
//				var rTop = artTop - sbTop;
//				sbList.css({'padding-top':rTop -10,'visibility':'visible'} );	
//			}
			init_programpage();
		}
		//if( ! sitesettings.isTablet ){
		if( ! sitesettings.isMobile ){
			//alert('filters');
			InitiateFilters();
			InitiateHovers();
		}
		if( sitesettings.usehistory ){
			EngageHistory();
		}
		
		check_video_wrap();
		
		
	});//docready end
	
window.fbAsyncInit = function () {
	var finished_rendering = function() {
//		console.log("finished rendering plugins");
//		var iframe = $('.fb-page-con iframe'); // or some other selector to get the iframe
//		var $col = $('img', iframe.contents());
//		alert( $col.length );
	}
	// In your onload handler
	FB.Event.subscribe('xfbml.render', finished_rendering);
};	


/* TD connect */
var tdConnect = function(){
	var obj = this;
	
	this.$single = false;
	this.$singleInr = false;
	
	this.$tdCons = false;

	this.fullWidth = 200;
	//this.fullHeight = 200;
	this.defWidth = 200;
	//this.defHeight = 200;
	
	this.prevPos = '';
	
	this.setElements = function(){
		//if( $('.tdcn-con.single').length > 0 ){
			obj.$tdCons = $('.tdcn-con');
			obj.$tdCons.show();
		//}
	}
	
	this.previousPosition = function(){
		return obj.prevPos;
	}
	
	this.showCons = function( $col ){
		//if( !obj.$single ){ return false;}
		//obj.$single.removeClass('inactive').css('opacity',1);
		var $cons = $col.find('.tdcn-con');
		$cons.each(function(){
			//if( $(this).css('position') != 'relative' ){obj.resizeCon( $(this) );}
			$(this).removeClass('inactive').css('opacity',1);
		});		
	}
	
	this.hideCons = function( $col ){
		var $cons = $col.find('.tdcn-con');
		$cons.each(function(){
			if( $(this).css('position') != 'relative' ){
				$(this).addClass('inactive').css('opacity',0);
			}
		});
	}
	
	this.destroy = function(){
		obj.$tdCons.hide();
	}
	
	this.openCon = function( $con ){
		if( !$con.hasClass('closing') ){
			var $sTxt = $con.find('.subtext');
			$sTxt.velocity('slideDown',speed.tdcn,function(){});
			$con.addClass('open');
			if( $con.css('position') != 'relative' ){
				var $inr = $con.children('.inr');
				var fH = $inr.attr('data-fullheight'); 
				$inr.velocity({width:obj.fullWidth, height:fH},{duration:speed.tdcn, complete:function(){$inr.css('height','auto');}});
			}
		}
	}
	
	this.closeCon = function( $con ){
		if( !$con.hasClass('closing') ){
			var $sTxt = $con.find('.subtext');
			$sTxt.velocity('slideUp',speed.tdcn,function(){ $con.removeClass('closing') });
			$con.removeClass('open').addClass('closing');
			if( $con.css('position') != 'relative' ){
				$con.addClass('closing');
				var $inr = $con.children('.inr');
				$inr.velocity({width:obj.defWidth},{duration:speed.tdcn,complete:function(){/*$con.removeClass('closing')*/}});
			}
		}
	}
	
	this.openLink = function( $con ){
		$con.find('.tdcn-link')[0].click();
	}
	
	this.update = function(){
		if( $('.tdcn-con').length < 1 ){
			return false;
		}else{
			obj.setElements();
			obj.resize();
			return obj;
		}
	}
	

		
	this.resize = function(){
		obj.prevPos = obj.$tdCons.css('position');
		if( obj.$tdCons.css('position') == 'relative' ){
			return false;
		}
		
		
		var cR = Math.round($('#lb-content').offset().left + $('#lb-content').width());
		var cRR = cR + 17;
		var nW = $(window).width() - cR - (17 + 20);
		nW = Math.max(nW, obj.defWidth);
		nW = Math.min(nW, 400);
		obj.fullWidth = nW;
		
		
		obj.$tdCons.each(function(index, element) {
			var $con = $(this);
            var $inr = $(this).find('.inr');
			$con.width(nW);
			$con.css('left',cRR);
			//get target width/height
			var oW = $inr.css('width');
			var oH = $inr.css('height');
			var $tf = $con.parents('.toc-field');
			if( $tf.length > 0 ){
				var oD = $tf.css('display');
				$tf.show();
			}			
			$inr.css('width',nW);
			$inr.find('.subtext').show();
			$inr.attr('data-fullheight',$inr.outerHeight());
			$inr.css('width', oW);
			$inr.find('.subtext').hide();
			if( $tf.length > 0 ){ $tf.css('display',oD); }		
			if( !$con.hasClass('inactive') ){
				$con.css('opacity',1);
			}
		});
	}
		
	//console.log( 'engage');
	obj.setElements();
	obj.resize();
		
	return obj;
}


function tdcn_update(){
	if( tdcn ){
		//tdcn = tdcn.update();
	}else{
		//tdcn = new tdConnect();
	}
}

function tdcn_resize(){
	if( !tdcn ){return false; }
	var dir = 0;
	var prePos = tdcn.previousPosition();
	var curPos = $('.tdcn-con').eq(0).css('position');
	if( prePos == 'relative' && curPos != 'relative' ){dir = 1;}//klein naar groot
	if( prePos != 'relative' && curPos == 'relative' ){dir = -1;}//groot naar klein

	if( tdcn ){ tdcn.resize();}
	//console.log( prePos + ' - ' + curPos );
	//check position
	if( dir == 0 ){
		tdcn_update_stick();
	}else if( dir == 1 ){		
		tdcn_engage();//activate stickem
	}else if( dir == -1 ){
		//destroy stickem
		tdcn_destroy_stick();
	}
	
}

function tdcn_showhide( show, $col ){
	if( !tdcn ){ return false; }
	if( show ){
		tdcn.showCons( $col );
	}else{
		tdcn.hideCons( $col );
	}
}

function tdcn_destroy(){
	tdcn_destroy_stick();
	if( tdcn ){tdcn.destroy();tdcn = false;/*tdcn.update();*/}
}

function tdcn_engage(){
	tdcn_destroy();
	if( $('.tdcn-con').length > 0 ){
		tdcn = new tdConnect();
		if( $('.tdcn-con').eq(0).css('position') != 'relative' ){
			tdcn_engage_stick();
		}
	}
}

function tdcn_update_stick(){
	if( tdcnStick ){tdcnStick.updateOffset( 0 );}
}

function tdcn_engage_stick(){
	tdcn_destroy_stick();
	tdcnStick = $('#lb-content').rstickem({ /*onStick:onStick*/ item:'.tdcn-con', container:'.siart, .liart',offset:0 });
}

function tdcn_destroy_stick(){
	if( tdcnStick ){ tdcnStick.destroy();tdcnStick=false;}
}

function tdcn_init(){
	
	tdcn_engage();
	
	if( ! sitesettings.isMobile ){
		$(document).on('mouseenter mouseleave','.tdcn-con',function(e){
			if( !tdcn ){ return false;}
			if( e.type == 'mouseenter' ){
				tdcn.openCon( $(this) );
			}else{
				tdcn.closeCon( $(this) );
			}
		});	
		$(document).on('click','.tdcn-con',function(e){
			if( !tdcn ){ return false;}
			tdcn.openLink( $(this) );
		});	
	}else{
		$(document).on('click','.tdcn-con',function(e){
			if( !tdcn ){ return false;}
			if( $(this).hasClass('open') ){
				tdcn.openLink( $(this) );
			}else{
				tdcn.openCon( $(this) );
			}
		});			
	}
	
	$(document).on('click','.tdcn-link',function(e){
		e.stopPropagation();
	});	
}

/****** SCT1 HOMEPAGE FUNCTIONS  ***************************************************************************/	
/* DISCLAIMER */

	function disclaimer_init(){
		if( $('.disclaimer').length <1 ){return false;};
		
		var $disc = $('.disclaimer');
		$(document).on('click', '.disclaimer', function(e) {
			e.preventDefault();
			var tTop = $(this).offset().top + $(this).outerHeight();
			$(this).velocity({top:-1*tTop},{duration:150,complete:function(){$disc.addClass('disabled')}});
		});
		
		if( ! sitesettings.isMobile ){
			$(document).on('mouseenter mouseleave','#wrapper-top .inr',function(e){
				if( $disc.hasClass('disabled') ){
					var nTop = e.type == 'mouseenter' ? 0 : -35;
					$disc.velocity({top:nTop},{duration:200});
				}
			});	
		}
	}

	
/*  COLUMNS   */

	var ColumnManager = function( args ){	
		
		var params = { noclick:true};
		$.extend( params, args ); 
		
		var obj = this;
		
		var cmData = {
			colh:	0,
			colw: 	0,			//col width
			colm: 	0,			//col margin
			colwt:	0,			//col width + 2xcolumn
			colwd:	0,			//col width double (when open)
			borw:	1,			//border width
			content: {	h:	0 }, //column content
			header:  {	h:	0 }, //column header
			isbussy: false,		//is col being animated?	
			maxfont: '0px',
			minfont: '0px'
			
		}
		obj.pxToInt = function( px ){return parseInt( px.replace('px','') );}
		obj.$columns = false;
		
		obj.isBussy = function(){
			return cmData.isbussy;
		}
		
		obj.setup_columns = function(resize){
			var $c = obj.$columns.eq(0);
			if( !resize ){
				var minF = obj.pxToInt( $c.find('.column-content').css('font-size'));
				cmData.maxfont = (minF * 2) + 'px';
				cmData.minfont = minF + 'px';
				//alert( cmData.minfont + ' - ' + cmData.maxfont );
			}
			cmData.colh = $c.height(),
			cmData.colw = $c.width();
			cmData.colm = obj.pxToInt( $c.css('margin-right') );
			cmData.colwt = cmData.colw + (2 * cmData.colm);
			cmData.colwd = 2 * cmData.colw;
			cmData.header.h = $c.find('.column-header').height();
			cmData.content.h = $c.outerHeight(true) - cmData.header.h;
			
			if( resize ){
				obj.$columns.each( function(){ 
					$(this).column().setup_column(resize);
				});	
			}else{
				obj.$columns.each( function(){ 
					$(this).column();
				});	
			}
			
		}
		
		obj.init = function(){		
			obj.$columns = $('.column');
			obj.setup_columns(false);			
			
			if( !params.noclick ){
				$(document).on('click', ".column", function(e) {												
					//obj.handleclick( $(this), e);
				});
			}
			
			InitiateScrollBars();				
		}
		
		obj.handleclick = function($col, e, bytoc){
			if( !params.noclick && !$col.hasClass('nogrow') && !$col.column().isActive() && !cmData.isbussy){
				cmData.isbussy = true;
				//close active
				var $activeCols = obj.$columns.filter('.active');
				$activeCols.each(function(){
					if( !$(this).hasClass('nogrow') ){
						$(this).column().close();
					}
				});
				//open current
				$col.column().open(e, bytoc);
			}			
		}
		
		obj.resize = function(){
			obj.setup_columns( true );
		}
		
		obj.openColumn = function( num, bytoc ){
			var $col = obj.$columns.eq(num-1);
			obj.handleclick( $col, false, bytoc);
		}
		
		/** independent columns **/
		
		var Column = function(element, params){	   
			var $col = $(element);
			var col = this;
			col.opts = $.extend({}, params);	
			col.pxToInt = function( px ){return parseInt( px.replace('px','') );}
			col.id = $col.attr('id');
			col.dat = {cwhn: 0,cwha: 0}
				
			col.elms = {
				$content: false,
				$scontent_a: false,
				$scontent_b: false,
				$cwindow: false,
				$tocc:false, 
				$links:false 
			}
			
			col.init = function(){
				//set elements
				col.elms.$content = $col.find('.column-content');
				col.elms.$cwindow = $col.find('.content-window');
				col.elms.$tocc = $col.find('.toc-container');
				col.elms.$links = $col.find('.tc-link');
				
				if( $col.find('#sub-column-1a').length > 0 ){
					col.elms.$scontent_a = $col.find('#column-1a-content');
					col.elms.$scontent_b = $col.find('#column-1b-content');
				}
				col.setup_column( false );
			};
			
			col.setup_column = function( resize ){
				if( resize ){
					col.setup_window();
				}else{
					//handle active started elements
					var $activecol = $('.column.activestart');
					if( $col.hasClass('activestart')){
						if( $col.hasClass('nogrow') ){
							$col.removeClass('activestart');
						}else{
							col.elms.$content.css({ fontSize: '100%'})
							$col.width( cmData.colwd ).removeClass('activestart').addClass('active');
						}
					}
					//if( col.id != 'column-1' && col.id != 'column-2' && col.id != 'column-4'){col.elms.$content.height(cmData.content.h);}
					col.setup_window();//setup windows (col1,3,4)
				}
			};
			
			col.setup_window = function(){	
				if( col.id == 'column-3' ){
					var lhn = 0,lha = 0 ;//link height
					col.elms.$links.each(function(index, element){							 
						var $lnk = $(this);
						lhn += $lnk.outerHeight();//normal
						lha += $lnk.outerHeight();//active
					});
					col.dat.cwhn = cmData.content.h - lhn;
					col.dat.cwha = cmData.content.h - lha;
					var cwh = col.dat.cwha;//content window height
					//col.elms.$cwindow.height( cwh );
					//different heights for different cwindows
					
					// !!!!!!! what if agenda is active?
					$('#cw-agenda').css('height','auto');
					var a_ch = $('#cw-agenda').height();
					var n_minh, n_maxh = cwh;//news min/max height
					if( a_ch >= cwh ){
						$('#cw-agenda').height(cwh);
						a_ch = cwh;
						n_minh = 0;
					}else{
						$('#cw-agenda').height( $('#cw-agenda').height() );
						n_minh = cmData.content.h - lhn - a_ch;
					}
					$('#cw-news').height( n_maxh );
					$('#cw-news').attr('data-maxh', n_maxh );
					$('#cw-news').attr('data-minh', n_minh );
				}
				if( col.id == 'column-2' ){
					//col.elms.$cwindow.height(col.isActive() ? col.dat.cwha : col.dat.cwhn);
					//col.elms.$content.height(cmData.content.h);
					//CheckColumnScrollFit($col);
				}
			};
			
			
			col.open = function( e, bytoc){
				var anims = { width: cmData.colwd };
				var fAnims = {	fontSize: cmData.maxfont };//var fAnims = {	fontSize: "*=" + fontFactor.normal};//-f-//
				//animate column content
				var nST = col.get_new_scrolltop(e);
				col.elms.$content.velocity(fAnims, { duration: speed.column  } );
				//animate column 
				$col.removeClass('inactive').addClass('active').velocity(anims, speed.column, function(){ 
					cmData.isbussy = false;
					CheckColumnScrollFit($col);
				});
				col.actions(true, e, nST, bytoc);
			}
	
			col.close = function(){
				var anims = { 	width:	cmData.colw }	
				var fAnims = {	fontSize: cmData.minfont };//var fAnims = {	fontSize: "/=" + fontFactor.normal };
				col.elms.$content.velocity(fAnims, { duration: speed.column  } );//animate column content
				$col.velocity( anims, speed.column, function(){//animate column 
					CheckColumnScrollFit($col);
				});
				$col.removeClass('active').addClass('inactive');	
				col.actions( false, false);
			}
			
			col.actions = function( opencol, e, nST, bytoc){
				if( col.id == 'column-3' /*||  col.id == 'column-4'*/ ){
					//resize conten windows
					col.elms.$cwindow.each(function(){
						var th = {height: ( opencol ? col.dat.cwha : col.dat.cwhn ) };
						if( bytoc /*&& $(this).hasClass('active')*/ ){
							//console.log('w ' + col.id + ' th '+ th.height);
							if( opencol ){ $(this).css(th); }
							//inactive cw height setten after
						}else{
							if(col.id == 'column-4' || $(this).hasClass('active') ){
								$(this).velocity(th, speed.column );
							}else{
								$(this).css(th);
							}	
						}
					})
					if( opencol ){ ss_start(); }else{ ss_stop(false);	}
				}			
				
				/* animate scrollbar */
				var $sw = $col.find('.addscroll:visible').eq(0);
				var $sc = $col.find('.mCSB_container:visible').eq(0);
				var type = ( col.id == 'column-3' && $('#tc-agenda').hasClass('active') ) ? 'cal' : 'normal';
		
				if( $sc.length > 0 ){
					var oldTop = parseInt( $sc.css('top').replace('px','') );
					$sw.mCustomScrollbar("disable");
					var after = function(){
						if( opencol ){};
						$sw.mCustomScrollbar("update");
					}
					if( opencol ){
						var nTop = nST;//(oldTop * 2) - 400;//"*=2";//nST;
						if( col.id == 'column-3' || col.id == 'column-4' ){
							var $lnks = type == 'normal' ? $sc.children('.liart') : $sc.find('.lb-link');
							//$lnks.velocity('stop').velocity({height: "*=2"}, speed.column);
						}
						$sc.velocity({top: nTop}, speed.column, after);
					}else{
						var nTop = oldTop * 0.5;
						if( col.id == 'column-3' || col.id == 'column-4' ){
							var mTop = 0;
							if( type == 'cal'){
								mTop = $sw.height() - ( $sc.height() * 0.5 );
							}
							if( type == 'normal'){
								mTop = ($sw.height()+50) - ( ($sc.height() * 0.5)-10 );//50=diff in sw,20=loadmore
							}
							nTop = Math.round( Math.max( nTop, mTop ) );
						}
						$sc.velocity({top: nTop}, speed.column, after);
						if( col.id == 'column-3' || col.id == 'column-4' ){
							var $lnks = type == 'normal' ? $sc.children('.liart') : $sc.find('.lb-link');
							//$lnks.velocity('stop').velocity({height: "/=2"}, speed.column, function(elms){ $lnks.css('height','auto');});
						}
					}
				}
			}
			
			col.get_new_scrolltop = function(e){
				//scrollpos for agenda items on colopen
				var nTop = "*=2";
		
				if( col.id != 'column-4' && col.id != 'column-3' ){ return nTop; }
				var type = ( col.id == 'column-3' && $('#tc-agenda').hasClass('active') ) ? 'cal' : 'normal';	
		
				var $sw = $col.find('.addscroll:visible').eq(0);
				var $sc = $col.find('.mCSB_container:visible').eq(0);
		
				if( $sc.length > 0 ){
		
					var oldTop = parseInt( $sc.css('top').replace('px','') );
					if( oldTop < 0 || col.id == 'column-4' || col.id == 'column-3'){
				
						var contOfs = $sw.offset().top; //only used for relative y pos
						//console.log('offset:'+contOfs);
						var relY = e.pageY - contOfs;//clicked point 
						
						if( type == 'cal' ){
							var nMc = parseInt( (2 * oldTop) - ( relY ) );
							//find item under pos
							$sc.find('.tcpco').each(function(index, element) {
								var t = $(this).offset().top - contOfs - oldTop ;
								var b = t + ( $(this).outerHeight(true));
								var rt = t + oldTop;
								var rb = b + oldTop;
								var p = relY - oldTop;
								//console.log(index + '  t:'+parseInt(t)+', b:'+parseInt(b)+', p:' + p +', rt:'+rt);
								
								if( p >= t && p <= b ){
									//alert( $content.height() );
									//console.log( 'rt:'+rt+',rely:'+relY );
									var c = rt + (0.5*(rb-rt));//center
									var nt = rt - (c-rt) ;//top when open
									var nb = rb + (rb-c) ;//bottom when open
									var ct = 0;// - oldTop;
									var cb = ct + col.elms.$content.height();
			
									//console.log( 'ct:'+ct+',cb:'+cb+' -- nt:'+nt+',nb:'+nb+' -- rh:' + $(this).outerHeight() + ',fh:'+(b-t) );
									if( nt < ct ){
										c -= ((ct - nt));
										//console.log( 'hit top:' + (ct - nt));//increase nMC
									}else if(nb > cb){
										//console.log( 'hit bottom:' + (nb - cb) );
										c += ((nb - cb));
									}else{
										//relY = c + oldTop;
									}	
									nMc = parseInt( (2 * oldTop) - (parseInt(c)));//(c + oldTop) );
								}
							});
							nTop = nMc;
						}
						if( type == 'normal'){
							//console.log('offset:'+contOfs);
							$sc.children('.liart').each(function(index, element) {
								var t = $(this).position().top;
								var b = t + ( $(this).outerHeight(true));
								var rt = t + oldTop;
								var rb = b + oldTop;
								var p = relY - oldTop;
								//console.log(index + '  t:'+parseInt(t)+', b:'+parseInt(b)+', p:' + p +', rt:'+rt+',rh:' + $(this).outerHeight(true));
								
								if( p >= t && p <= b ){
									
									nTop = (-2 * t) + 10;//10=little offset
									//console.log( 'ntop:'+ nTop );
									var mTop = ($sw.height()-50) - ( ($sc.height() * 2)-20 );//50=diff in sw,20=loadmore
									//console.log( 'sw:'+ $sw.height() + ',sc:'+$sc.height() );
									nTop = Math.round( Math.max( nTop, mTop ) );
								}
							});					
						}
					}
				}
				return nTop;
			}
			
			col.isActive = function(){
				return $col.hasClass('active');
			}
			
			col.update = function(){
				console.log( 'update' );
			}	
			
			col.init();

		}//$.column	
		$.fn.column = function(params){	
			var oo = false;
			var name = 'column';
			this.each(function(){
				var element = $(this);		
				if (element.data(name)){oo = element.data(name);return;}
				oo = new Column(this, params);
				element.data(name, oo );
			});
			return oo;
		};/* $column */
		
		obj.init();
		
	};//ColumnManager	

/* COLUMN LOGO */

	function handleColumLogo( show ){
		var $cl = $('#columnlogo');
		if( $cl.css('max-height') == 'none' ){
			var sl = show ? "slideDown" : "slideUp";
			if( !show ){ $cl.show(); }
		
			$cl.velocity(sl, speed.column, function(){
				//afterAnims();	
			});
		}
	}
	
/* COLUMN TOC */

	$(document).on('click', ".tc-link", function(e) {
		//alert(1);	
		if( $(this).hasClass('active') && $(this).hasClass('noclose') ){
			e.preventDefault();	
		}else{
			e.stopPropagation();
			e.preventDefault();	
			HandleToc($(this), true, e);
		}
	});
	
	$(document).on('click', ".tc-link.active.noclose .close", function(e) {	
		e.preventDefault();	
		e.stopPropagation();
		var $link = $(this).parent('.tc-link');
		if( $link.length > 0 ){
			HandleToc($link, true, e);
		}
	});
	
	$(document).on('click', "#cw-news .tochover", function(e) {
		var $link = $('#tc-news');
		if( $link.length > 0 ){
			HandleToc($link, true, e);
		}		
	});

	function HandleToc($link, fromclick, e){
		
		//console.log('-handletoc' ) ;
		//e.stopPropagation();
		var $link = $link;
		var $field = $link.next('.tc-field');//content window
		//find tc-field
		if( $field.length > 0){
			if( $link.hasClass('active') ){	
				OpenCloseToc( $link, {field:$field,clickevent:e,action:'close'} );
			}else{
				OpenCloseToc( $link, {field:$field,clickevent:e,action:'open'} );
			}
		}
		e.preventDefault();
		//prevent column click etc.
	}
	
	function OpenCloseToc($link, params){
		//col 3 only?
		var opts =  {
			action: 		'open',		//open or close
			clickevent: 	false,		//called by tclink self or initiated by other function
			field: 			false,
			fromother: 		false,		//closed/opened because other toc opens?
			fromchild:		false,		//currently not used
			openparents:	false,		//open parents if closed
			recursive: 		true,
		};
		$.extend(opts, params);	
		
		var openToc = opts.action == 'open';
			
		/* vars */
		var $link = $link;
		var linkId = $link.attr('id');
		var $field = opts.field ? opts.field : $link.next('.tc-field');//content window
		var $tocc = $link.parents('.toc-container').eq(0);
		var toccId = $tocc.attr('id');
		var toctype = $tocc.attr('data-toctype') ? $tocc.attr('data-toctype') : 'normal';//naar parent?	
		var $column = $link.parents('.column');
		var colId = $column.attr('id');
		var colActive = $column.hasClass('active');	
			
		/* return conditions */
		
		if( ( openToc && $link.hasClass('active') ) || ( !openToc && !$link.hasClass('active') ) ){
			return false;
		}	
		
		if( $link.hasClass('active') && $link.hasClass('noclose') ){
			//alert('ca:'+colActive +' ot:'+openToc + ' cid:'+ (colId == 'column-3') );	
			//if( !colActive && colId == 'column-3' && colManager ){//open col manually
//					
//				if( opts.clickevent ){ opts.clickevent.stopPropagation();}//prevent col click
//				colManager.openColumn(3,true);				
//			}
			//return false;
		}
			
		/* open parents */
		if( openToc && opts.openparents ){//!opts.fromclick &&
			//no filter, no column, no parents
			$link.parents('.tc-field').each(function(){
				var $plink = $(this).prev('.tc-link');//open parents
				if( $plink.length > 0 ){ OpenCloseToc($plink, {action:'open',field:$(this), fromchild:true });}
			})
		}
		
		/* pre actions */
		if(!openToc){//remove classes before activecheck (when closing );
			$link.removeClass('active');
			$field.removeClass('active');
		}else{
			if( !colActive && colId == 'column-3' ){//open col manually
				if( colManager ){
					if( opts.clickevent ){ opts.clickevent.stopPropagation();}//prevent col click
					//colManager.openColumn(3,true);
				}
			}
		}	
		
			
		
		/* handle active siblings */
		var $actives = GetActiveSiblings($link, '.tc-link');
		var nH = -1;//new height
		if( $actives.length > 0){	
			
			if( openToc ){
				$actives.each(function(){OpenCloseToc( $(this), {action:'close', fromother:true } );});	
			}	
		}else{//no actives	
			if( !openToc && toctype == 'allowothers' && !opts.fromother ){
				var $sib = linkId == 'tc-news' ? $('#tc-agenda') : $('#tc-news');
				if( $sib.length > 0 ){OpenCloseToc( $sib, {action:'open', fromother:true } );}
			}
		}

		/* toc actions */
//		if( openToc ){
//			$column.addClass('hasactive');
//		}else{
//			if( !opts.fromother ){$column.removeClass('hasactive');}	
//		}
		
		var afterAnims = function(){
			handle_async_media( $field );//only first time?
			CheckColumnScrollFit($column);
		}
		
		/* close toc */
		if( !openToc ){
			//$field.slideUp( speed.column );
			if( linkId == 'tc-news'){
				var minH = $field.attr('data-minh') ? $field.attr('data-minh') : 0;
				$field.velocity({height:minH},{duration: speed.toc, complete:function(){afterAnims();$field.css('overflow','hidden')}});
				$field.mCustomScrollbar("disable");
			}else{
				$field.velocity("slideUp", speed.toc, function(){afterAnims();});
			}

			ss_stop();
		}
		
		/* open toc */
		if( openToc ){		
			$link.addClass('active');
			$field.addClass('active');
			//$field.slideDown( speed.column,function(){
			if( linkId == 'tc-news'){
				var maxH = $field.attr('data-maxh') ? $field.attr('data-maxh') : 50;//50 is bla (komt niet voor)
				$field.velocity({height:maxH},{duration: speed.toc, complete:function(){afterAnims();$field.css('overflow','visible')}});
				$field.mCustomScrollbar("update");
			}else{
				$field.velocity("slideDown", speed.toc, function(){afterAnims();});
			}								
				
			ss_start();		
		}
	}
	
/* SLIDESHOW */
	
	var ss_initialized = false;
	function ss_init(){
		//console.log('init:'  );
		$('.slideshow#slideshow-news').slideShow( { tclink:$('#tc-news'), column:$('#column-3') } );
		$('.slideshow#slideshow-projects').slideShow( { tclink:$('#column-4'),column:$('#column-4') } );
		ss_initialized = true;
		ss_resize();
	}
	
	function ss_resize( fromevent ){
		//reset adjustments (height/weight)
		//console.log('ss resize');
		if( $('#cw-news').length < 1 ){ return false;}
		if( $('#cw-news .htile-con').length < 1 ){ return false;}
		if( fromevent && !$('#cw-news').hasClass('active') ){
			//
		}
		//return false;
		if( $('#cw-agenda').hasClass('active') ){$('#cw-agenda').hide();}
		
		//reset scroll?
		var oldTop = $('#cw-news .mCSB_container').css('top');
		$('#cw-news .mCSB_container').css('top',0);
		$('#slideshow-news .arth').css('width','auto');
		$('#slideshow-news .slide-con').css('height','auto');
		var bof = 60;//bottom offset
		var tbof = ($(window).height() - $('#cw-news .htile-con').offset().top) +20;//tile bottom offset
		//console.log('tbfo: ' + tbof );
		
		//return false;
		var $slides = $('#slideshow-news .slide').sort(function (a, b) { return $(a).height() < $(b).height() ? 1 : -1;});
		var height = $slides.eq(0).height();//console.log(height);
		//set container height?
		
		var cwt = $('#cw-news').offset().top;//content window top
		var ast = $(window).height() - cwt;//available space total
		//calculate available space for 1 slide
		var as = ast - bof;//available space for slide (max)
		as = Math.max(350, as);
			
			
		//if( tbof < bof ){//only checks for first slide...
		if( height > as ){


			//$('#slideshow-news').height(as);
			
			$slides.each(function(){
				var bH = $(this).find('.slide-body').outerHeight();
				var ais = as - bH;//available image space
				var $arth = $(this).find('.arth');
				if( $arth.height() > ais ){
					var ratio = $arth.width() / $arth.height();
					var nw = ais * ratio;
					$arth.width( nw );
				}
			});
			
			//$slides = $('#slideshow-news .slide').sort(function (a, b) { return $(a).height() < $(b).height() ? 1 : -1;});
			//height = $slides.eq(0).height();//console.log(height);
			$('#slideshow-news .slide-con').height(as).addClass('nosizing');
		}else{
			$('#slideshow-news .slide-con').height(height).addClass('nosizing');
		}
		
		if( $('#cw-agenda').hasClass('active') ){$('#cw-agenda').show();}	
		$('#cw-news .mCSB_container').css('top',oldTop);
	}

	function ss_start(){
		if( !ss_initialized || (lightbox && lightbox.isActive()) ){return false;}
		//console.log('start:'  );
		ss_start_id('.slideshow#slideshow-news');
		ss_start_id('.slideshow#slideshow-projects');
		//$('.slideshow#slideshow-news').slideShow().start();
		//$('.slideshow#slideshow-projects').slideShow().start();
	}
	
	function ss_start_id( slct ){
		if( $(slct).length > 0 ){ $(slct).slideShow().start() };
	}
	function ss_stop_id( slct ){
		if( $(slct).length > 0 ){ $(slct).slideShow().stop() };
	}
	
	function ss_stop(id){
		if( !ss_initialized ){return false;}
		//id = false,news or projects
		//console.log('stop' );
		if( !id ){
			ss_stop_id( '.slideshow#slideshow-news' );
			ss_stop_id( '.slideshow#slideshow-projects' );
		}else{
			ss_stop_id( '.slideshow#slideshow-'+id );
		}
	}	
	
		/* slideshow plugin */
	
	var SlideShow = function(element, params){
	   
		var $el = $(element);
		var obj = this;
		var iId = '';//instance id
		
		//alert($el.attr('class'));
		var opts = {
			enabled:	true,
			speed: 		500,			//transition speed
			duration: 	5000,			//timout speed
			timeout: 	false,
			current:	0,
			total:		0,
			bussy:		false,
			slides:		'',
			//elements
			tclink:	'',
			column: '',
			navl:   '',
			navr:   '',
			con:	'',
			callbacks: 	{	beforeslide: 	false, 		
						 	afterslide: 	false, 	
			}, 
			autosize: false
		}
	
		$.extend(opts, params);	
		
		/*** Vars **/
		
		iId = '#' + $el.attr('id');
		opts.navl = $el.find('.slide-nav-left');
		opts.navr = $el.find('.slide-nav-right');
		opts.con  = $el.find('.slide-con');
		opts.slides = $el.find('.slide-con').children('.slide');
		opts.total = opts.slides.length;
		//disable if only 1 slide
		if( opts.total < 2 ){
			opts.enabled = false;
		}
		
		/*** Functions **/
		
		this.checknav = function(){
			opts.navl.show();
			opts.navr.show();
		}
		
		this.nav = function( dir, auto ){
			if( opts.bussy ){ return false;}
			
			//console.log( 'nav '+iId );
			var getRealNext = function(ndx, dirr, getElm){
				var nNdx = ndx + dirr;
				if( nNdx < 0){  nNdx = opts.total-1;}
				if( nNdx > opts.total -1){  nNdx = 0; }
				if( !getElm ){
					return nNdx;
				}else{
					return opts.slides.eq( nNdx );
				}
			}
			
//			var nxtI = opts.current + dir;
//			if(nxtI < 0){ nxtI = opts.total-1;}
//			if(nxtI > opts.total -1){ nxtI = 0; }
			var nxtI = getRealNext( opts.current, dir);
			
			var $current = opts.slides.eq( opts.current );
			var $next = opts.slides.eq( nxtI );
				
			opts.bussy = true;
			//check heights?
			if( opts.autosize ){
				var cH = opts.con.height();
				var nH = $next.outerHeight();
				if( cH != nH ){
					opts.con.height(cH);
					opts.con.velocity({ height: nH }, { duration:opts.speed,  complete: function(elements) {  
						
					}});
				}
			}
			
			
			$current.velocity({ opacity: 0 }, { visibility: "hidden", duration:opts.speed*0.5,  complete: function(elements) {  
				$current.removeClass('first').removeClass('active').css('left','-100%').hide();
				$next.addClass('active').show().css({left:0,opacity:0});
				//console.log( opts.con.height() );
				$next.velocity({ opacity: 1 }, { visibility: "visible", display:"block", duration:opts.speed*0.5,  complete: function(elements) {  
					opts.bussy = false;
					if( opts.autosize ){opts.con.css('height','auto');}
					
					// find 
					
					//var $nNxt = $next.next('.slide');
					var $nNxt = getRealNext( nxtI, 1, true);
					if( $nNxt.length > 0 ){load_async_media( $nNxt, 'toload-s' );}
					var $pRev = getRealNext( nxtI, -1, true);
					if( $pRev.length > 0 ){load_async_media( $pRev, 'toload-s' );}
					//
					if( auto ){
						obj.start();
					}else{
						obj.restart();
					}
				} });
			} });
			
			opts.current = nxtI;
		}
		
		this.restart = function(){
			if( !opts.enabled ){return false; }
			clearTimeout(opts.timeout);
			opts.timeout = setTimeout( function(){obj.nav( 1, true );}, opts.duration );
		}
		
		this.start = function(){
			if( !opts.enabled ){return false; }
			if( opts.tclink.hasClass('active') && opts.column.hasClass('active') ){
				clearTimeout(opts.timeout);
				opts.timeout = setTimeout( function(){obj.nav( 1, true );}, opts.duration );
			}	
		}
		
		this.stop = function(){
			if( !opts.enabled ){return false; }
			clearTimeout(opts.timeout);
		}
		
		
		/*** Initiate **/
		
		if( opts.enabled ){
			//alert(1);
			obj.checknav();
			
			$(document).on('click', iId + ' .slide-nav', function(e){
				var dir = $(this).hasClass('slide-nav-left') ? -1 : 1;
				obj.nav( dir, false );
			});
			
			//only start if lb != active
			if( !$('#lb-outer').hasClass('active') ){
				obj.start();
			}
			
					
		}
	}
		
	$.fn.slideShow = function(params){	
	   	var ss = false;
		this.each(function(){
			var element = $(this);		
			// Return early if this element already has a plugin instance
			if (element.data('slideshow')){
				ss = element.data('slideshow');//element.data('scrollfont');
				return;
			}
			// pass options to plugin constructor
			ss = new SlideShow(this, params);
			// Store plugin object in this element's data
			element.data('slideshow', ss );
		});
		return ss;
   	};

/* SCROLLBAR */

	function InitiateScrollBars(){
		//return;
		$(".addscroll").mCustomScrollbar({	 
			theme:"minimal-dark", 
			scrollbarPosition: "outside",
			autoHideScrollbar: false,
			axis:"y",
			callbacks:{	alwaysTriggerOffsets: false,
						//onTotalScrollOffset: 300,
						onTotalScrollBackOffset: -100,
						onTotalScroll: function(){ OnTotalScroll( $(this) ); },
						onTotalScrollBack: function(){ OnTotalScrollBack( $(this) ) },
						onScrollStart: function(){ OnScrollStart( $(this) ); },						
						},
			mouseWheel:{ normalizeDelta: true,
			 			 scrollAmount: 300  },
			//scrollInertia:100
		});
		
		/* add gradients */
		$('.addscroll').each(function(index, element) {
			var $sBox = $(this).find('.mCustomScrollBox').eq( 0 );
			if( $sBox.length > 0 ){AddShadow( $sBox );}
        });	
		CheckAllColumnScrollFit();
	}
	
	function CheckAllColumnScrollFit(){
		$('.column').each(function(index, element) {CheckColumnScrollFit( $(element) );});	  
	}
	
	function CheckColumnScrollFit($column){
		//console.log('scrollfit:'+$column.attr('id') );
		$column.find('.addscroll').each(function(){ CheckScrollFit( $(this) )});	
	}
	
	function CheckScrollFit($addscroll){
		//per column? per scrollwindow?
		//check if scrollcontent fits window.
		//console.log('check scrollfit');
		var $sw = $addscroll;// $('.addscroll');
		var $sc = $sw.find('.mCSB_container').eq(0);
		var $shadBot =  $sw.find('.shadcon.bot').eq(0);
		var cls = 'forcefit';
		if( $sw.is(':visible') ){
			//console.log('fit sc:'+$sc.height()+', sw:'+ $sw.height());
			if( ($sc.height()) <= $sw.height() ){
				$shadBot.hide();
				OnTotalScrollBack( $sw );
			}else{
				$shadBot.show();
			}
		}
	}
	
	/* scroll callbacks  */
	function OnScrollStart( $subject ){
		//hide top shadow
		var $shade = $subject.find('.shadcon.top').eq(0);
		if( $shade.length > 0 && !$shade.hasClass('enabled')){	
			$shade.addClass('enabled').velocity({ marginTop: '-6%' }, { duration:200, display:'block' });
		}
		ss_stop(false);
	}
	
	function OnTotalScrollBack( $subject ){
		//hide bot shad
		var $shade = $subject.find('.shadcon.top').eq(0);
		if( $shade.length > 0 ){
			$shade.velocity({ marginTop: '-12%' }, 200, function(e){ $shade.removeClass('enabled'); });
		}	
		ss_start();
	}
	
	function OnTotalScroll( $subject ){
		var $lmbutton = $subject.find('.loadmore').eq(0);
		if( $lmbutton.length > 0 ){
			$lmbutton.click();//trigger( click?)
		}
	}	
	
/* SCROLLBAR SHADE */
	
	function AddShadow($el){
		//append to scrollbox
		$('<div>').addClass('shadcon top').append( $('<div>').addClass('scrollshade').addClass('shadtop') ).appendTo( $el );	
		$('<div>').addClass('shadcon bot').append( $('<div>').addClass('scrollshade').addClass('shadbot') ).appendTo( $el );
	}
	
	function CheckShadow($el){
		//only works for 'small' columns
		var $gb = $el.find(".gradbot");
		var $sb = $el.find(".shadbot");
		var $scrolcon = $el.find(".mCSB_container");
		$gb.addClass('enabled');
		$sb.addClass('enabled');
	}
	
	function shadow_hide($shadcon, oncomplete){
		var top = $shadcon.hasClass('top');
		if( top ){
			$shadow.velocity({ marginTop: '*=2' }, 200, function(e){ if( oncomplete ){ oncomplete()} });
		}else{
			$shadow.velocity({ marginBot: '*=2' }, 200, function(e){ if( oncomplete ){ oncomplete()} });
		}
	}
	
	function shadow_show(){
		
	}	

/* RELATION FILTER */
	
	function InitiateFilters(){
		$(document).on('mouseleave', ".ftl", function(e){ HoverFilter($(this), false );});
		$(document).on('mouseenter', ".ftl", function(e){ HoverFilter($(this), true );});
	}
	
	function HoverFilter( $ftl, $enter ){
		var df = $ftl.attr('data-filter');//master link filter
		if( !df){return false;}
		//on hover: highlight 
		var fthl = 'fthl';
		//create class list from df
		var prts = df.split(","); 
		var dfcl = '.' + prts.join(",."); 
		//console.log( $(dfcl).length );
		
		//alert('df: ' + df );
		//add fthl to slave parent, to prevent double highlight
		//tc-link slave==master, .tcpco .liart
		//var addProgHL = $('.tc-link[data-special=programmas]').not('.active').next('.tc-field').find('.' + df).length > 0;

		var $parslave = $(dfcl);
		if( $parslave.length > 0){
			if($enter){  
				$parslave.addClass('fthl'); 
				//if(addProgHL){  $('.tc-link[data-special=programmas]').not('.active').addClass('fth'); }
			}else{  
				$parslave.removeClass('fthl');
				
			};
		}
		return false;
		//add hightlight class to wrapper
		var wrhl = 'wrhl';
		if( $enter ){ 
			$('#wrapper').addClass(wrhl); 
		}else{ 
			$('#wrapper').removeClass(wrhl); 
		};
		
		//handle slaves
		var $slaves = $('.' + df).not('.fth');
		if($slaves.length > -1){
			//var fcl = 'fthl';
			if( $enter ){//mouseenter
				$slaves.addClass(fthl);
				$ftl.addClass(fthl);
				if(addProgHL){  $('.tc-link[data-special=programmas]').not('.active').addClass(fthl); }
			}else{//mouseleave
				$slaves.removeClass(fthl);
				$ftl.removeClass(fthl);		
				if(addProgHL){  $('.tc-link[data-special=programmas]').not('.active').removeClass(fthl); }
			}
		}
	}


/* SARCH / NEWSLETTER / AANMELDEN */

	$(document).on('click', "#inlogfield.inactive", function(e) {
		ShowHideInlog(true);
		//close active tc-links in column 1?
		e.preventDefault();	
	});
	
	function ShowHideInlog(show){
		var $inlog_f = $('#inlogfield');
		var $inlog_t = $('#inlog-top');
		var $inlog_b = $('#inlog-body');
		
		var hdiff = parseInt( $inlog_b.css('height').replace('px','') ) - parseInt( $inlog_t.css('height').replace('px','') );
		var $colContent = $('#column-1-content');
		//alert( hdiff );
		if( show ){
			if( $inlog_f.hasClass('inactive') ){
				$inlog_t.velocity("slideUp", { duration: speed.toc });
				$inlog_b.velocity("slideDown", { duration: speed.toc });
				$inlog_f.addClass('active');
				$inlog_f.removeClass('inactive');
				$colContent.velocity( { height: "-="+hdiff+"px"}, speed.toc );
			}
		}else{
			if( $inlog_f.hasClass('active') ){
				$inlog_t.velocity("slideDown", { duration: speed.toc });
				$inlog_b.velocity("slideUp", { duration: speed.toc });
				$inlog_f.removeClass('active');
				$inlog_f.addClass('inactive');
				$colContent.velocity( { height: "+="+hdiff+"px"}, speed.toc );
			}
		}
	}
	
	
	$(document).on('click', "#nwl-link", function(e) {
		if( $(this).hasClass('active') ){
			$(this).removeClass('active');
			$('#nwl-con').velocity("slideUp", speed.toc, function(){});
		}else{
			$(this).addClass('active');
			$('#nwl-con').velocity("slideDown", speed.toc, function(){});
		}
		e.preventDefault();	
	});	

/* HOME ASYNC LOAD */
	function home_load_async(){
		load_async_media( $('#wrapper') );
		//load_async_media( $nNxt, 'toload-s' );
	}


/* S ANIMATI */
	var gifmanager = function(element, params){
	   
		var $el = $(element);
		var obj = this;
		
		obj.timeout = null;
		
		var defaults = {	
			enabled:	true,
			to_fixed:	30000,
			to_min:		500,
			to_max:		2000,
		}
		
		obj.opts = $.extend({}, defaults, params);
		
		obj.current = -1;//index?
		
		obj.title = $el.find('img').attr('title');
		
		obj.gifs = [];
		for( var i=1;i<18;i++ ){
			var v = i;
			if( i < 10 ){ v = '0' + v;};
			obj.gifs.push(v);
		}
		//console.log( obj.gifs );

		
		obj.doalert = function(){
			
		}
		
		obj.preswitch = function(){
			//get next gif
			//get vals to choose from
			var stack = obj.gifs.slice();
			if( obj.current != -1 ){	stack.splice(obj.current,1); }//remove current
			//select random
			var ndx = Math.floor(Math.random() * stack.length );
			var src = 'graphics/gifs/SCI_website_auto_'+stack[ ndx ]+'.gif';
			//append random to make chrome replay the gif
			src += '?'+(Math.round(Math.random()*1000));
			//console.log( ndx );
			//console.log( stack );
			
			var $nGif = $('<img>');
			
			$nGif.load( function() {
				obj.switchgif( stack[ ndx ] );
			});
			
			$el.find('img').addClass('old');
			$el.append( $nGif );
			$nGif.attr('src',src).addClass('new').attr('title',obj.title); 
			
	//		if (this.complete) {
//				//alert('complete');
//				//if( cb ){cb(pref + ' completed: ' + ( Date.now() - start ) + ' ms</br>' );}
//				onComplete( $img, $parent  );
//			} else {

//			}


			
			//console.log( stack[ ndx ] );
			//
		}
		
		obj.pause = function(){
			clearTimeout(obj.timeout);
			obj.opts.enabled = false;
			//console.log($el.attr('id') + ' pause');
		}
		
		obj.play = function(){
			obj.opts.enabled = true;
			obj.starttimeout();
			//console.log($el.attr('id') + ' play');
		}
		
		obj.switchgif = function(val){
			$el.find('img.old').remove();
			$el.find('img.new').removeClass('new');
			obj.current = obj.gifs.indexOf(val);
			obj.starttimeout();
			//console.log('switchgif ' + $el.attr('id'));
		}
		
		obj.starttimeout = function(){		
			if( obj.opts.enabled ){
				//console.log($el.attr('id') + ' enabled:'+obj.opts.enabled);
				clearTimeout(obj.timeout);
				var to = Math.floor( obj.opts.to_fixed + (Math.random() * (obj.opts.to_max - obj.opts.to_min)));
				//console.log($el.attr('id') + ' dotimeout');
				obj.timeout = setTimeout( function(){obj.preswitch()}, to);
			}
		}
		
		//console.log($el.attr('id') + 'enabled:'+obj.opts.enabled);
		obj.starttimeout();
		return obj;
	}
	
//	$.gifmanager.options = {
//		enabled:	true,
//		to_fixed:	10000,
//		to_min:		500,
//		to_max:		2000,
//	};
		
	$.fn.gifmanager = function(params){	
	   	var oo = false;
		var name = 'gifmanager';
		this.each(function(){
			var element = $(this);		
			if (element.data(name)){oo = element.data(name);}else{
			oo = new gifmanager(this, params);
			element.data(name, oo );}
		});
		return oo;
   	};
	
	function gifmanager_play( target ){
		if( !gmActive ){ return false;}
		for (var key in gifmanagers) {
			if( gifmanagers[ key ] ){
				if( key == target ){
					gifmanagers[ key ].play();
				}else{
					gifmanagers[ key ].pause();
				}
			}
		}	
	}
	
	function gifmanager_play_home(){
		if( !gmActive ){ return false;}
		if( $('#columnlogo').is(':visible') ){
			gifmanager_play( 'column' );
		}else{
			gifmanager_play( 'main' );
		}
		
	}

/****** SCT2 PROGRAMMAPAGE FUNCTIONS  ***********************************************************************/	

/* SIDEBAR TOC */
	var sidebarStick = false;
	
	function update_sidebarstick(){
		if( sidebarStick ){ sidebarStick.update();}
	}
	

	
	
	
	function init_programpage(){
		
		/* load tile images */
		
		$('.imco-tile img').each(function(index, element) {//program
            //$(this).imageScale({scale:'fill', centerhor:true, centerver:true, inpercentage:true});
			image_show( $(this), false, {parent:'.imco-tile',con:'imco-tile'});
        });
		$('.tm-logo img').each(function(index, element) {//program
            //$(this).imageScale({scale:'fill', centerhor:true, centerver:true, inpercentage:true});
			image_show( $(this), false, {parent:'.tm-logo',con:'tm-logo'});
        });
		
		
		if( $('#tag-fltr-con').length > 0 ){
			tagfilter_setup(false);
		}
		if( $('.rfltr-con').length >0 ){
			tagfilter_setup(true);
		}
		
		
		//loadmore
		$(document).on('click', ".prog-lm.loadmore", function(e) { //moved to docready
			var $button = $(this);
			prog_loadmore( $button );
		});
		$('.loadmore.prog-lm.complete').hide().removeClass('complete');
		
		/* create infscroll */
		if( !sitesettings.isMobile ){
			var $lmE = $('.prog-lm.loadmore');
			if( $lmE.length > 0 && !$lmE.hasClass('noinfinite')){
				infScroll = new function(){
					this.elem = $lmE;
					this.checkScroll = function(scrolldir){
						var obj = this;
						if( scrolldir > 0 ){
							var btm = obj.elem.offset().top + obj.elem.outerHeight();
							var st = $(window).scrollTop() + $(window).height();
							if( st > btm ){ prog_loadmore( obj.elem );}
						}
					}	
				}
			}
		}
		
		/* check astoc height */
		var asToc = $('p.astoc');
		if( asToc.length > 0 ){
			var mxH = pxToInt(asToc.css('max-height'));
			asToc.css('max-height','none');
			var h = asToc.height();
			if( h < (mxH*2) ){
				asToc.next('.stoc-link').hide();
			}else{
				asToc.css('max-height',mxH);
			}
		}
		//check of srm bar verwijderd moet worden
		
//		$('.pp-sb-con .astoc').each(function(){
//			var mh = pxToInt( $(this).css('max-height') );
//			if( $(this).height() < mh ){
//				$(this).next('.srm-bar').remove();
//			}
//		})
		
		/* init sidebar stick */
		//console.log( sitesettings );
		if( ! sitesettings.isMobile ){
			sidebarStick = $('body').stickfit({ item:'.pp-sidebar', container:'#pp-outer', offset:0});	
		}	
		
		
		$(document).on('click','.astoc + .srm-bar', function(e){
			var $stoc = $(this).prev('.astoc');
			if( $stoc.length > 0 ){
				if( $stoc.hasClass('active') ){
					openclose_stoc( $stoc, false );
				}else{
					openclose_stoc( $stoc, true );
				}
			}
		});
		function openclose_stoc( $stoc, open ){
			var after = function(){
				update_sidebarstick();
			}
			if( open ){
				var h = $stoc.height();
				if( !$stoc.attr('data-sheight') ){
					$stoc.attr('data-sheight', h );
				}
				$stoc.css({'max-height':'none',height:'auto'});
				var nh = $stoc.height();
				$stoc.height(h);
				$stoc.velocity({height: nh},{duration:200,complete:function(e){after()}});
				$stoc.addClass('active');
			}else{
				var h = $stoc.attr('data-sheight');
				$stoc.velocity({height:h},{duration:200,complete:function(e){after()}});
				$stoc.removeClass('active');
			}
		}
		
		//liart programma
		$(document).on('click', ".liart.liart-program", function(e) {														
			if( !$(this).hasClass('style-lstyle-tile') ){
				var $ml = $(this).find('.more-link');
				if( $ml.length > 0 ){
					$ml[0].click();
				}else{
					if( $(this).attr('data-path') ){
						window.location.href = $(this).attr('data-path');
					}
				}
				e.stopPropagation();
			}
		});
		
		//sidebar liart
		$(document).on('click','.pp-sb-con.sb-list .liart', function(e){
			if( $(this).attr('data-path') ){
				var href = $(this).attr('data-path');
				window.location.href = href;
			}
		});
	
/* TILE */
	
		$(document).on('click','.liart.style-lstyle-tile',function(e){
			$(this).find('.tile-link')[0].click();
			e.preventDefault();
			e.stopPropagation();
		});
		$(document).on('click','.tile-link',function(e){
			e.stopPropagation();
		});	
	
/* CALENDAR */
	
		$(document).on('click','.pp-cal-con .tcpco.dotoc .in',function(e){
			
			var openclose_cal = function($cal, open, update){
				var $short = $cal.parents('.liart').find('.cal-short');
				if( open ){
					var $actives = $('.pp-cal-con .tcpco .in.active');
					if( $actives.length > 0){ openclose_cal( $actives, false, false);}
					$cal.addClass('active');
					$short.velocity("slideDown", { duration: 200,complete:function(e){if(update){update_sidebarstick()};} });
				}else{
					$cal.removeClass('active');
					$short.velocity("slideUp", { duration: 200,complete:function(e){if(update){update_sidebarstick()};} });
				}				
			}			
			
			var $cal = $(this);
			if( !$cal.hasClass('active') ){
				openclose_cal( $cal, true, true);
			}else{
				openclose_cal( $cal, false, true);
			}
		});
		
		init_showmore();
	
	}//init_programpage()
	
/* SHOWMORE */

	function init_showmore(){
		if( $('.showmore').length < 1 ){ return false; }
		
		$(document).on('click','.smallbar.showmore',function(e){
			//showmore
			var $bar = $(this);
			var $con = $bar.prev('.sm-con');
			var $items = $con.find('.sm-item');
			
			if( $bar.hasClass('showless') ){
				var def = $bar.attr('data-default');
				$tohide = false;
				$items.each(function(index){
					if( index > def-1 ){ $tohide = $tohide ? $tohide.add($(this)) : $(this);}
				});
				var oh = $con.height();
				$tohide.hide();
				var nh = $con.height();
				$tohide.show();
				$con.height( oh );
				$con.velocity({height:nh},{duration:speed.showmore, complete:function(e){
					$con.css('height','auto');
					$bar.removeClass('showless');
					$tohide.hide().addClass('noshow');
					update_sidebarstick();	
				}});
			}else{
			
				var $toshow = false;
				
				var step = $bar.attr('data-step');
				var showall = step == 'all';
				if( showall ){
					$toshow = $items.filter('.noshow');
				}else{
					$toshow = $items.filter('.noshow').slice(0,step);
				}
				//animate con height.
				var oh = $con.height();
				$toshow.removeClass('noshow').show();
				var nh = $con.height();
				$con.height( oh );
				$con.velocity({height:nh},{duration:speed.showmore, complete:function(e){
					$con.css('height','auto');
					if( showall ){
						$bar.addClass('showless');
					}else{
						//load $toshow images
						handle_async_media( $toshow );
						if( $items.filter('.noshow').length < 1 ){ $bar.remove(); };
					}
					update_sidebarstick();
				}});
			
			}
			//showless?
		})
	} 
/* PROGRAMMA LOADMORE */
	function prog_loadmore( $button ){	
		//alert(1);
		if( $button.hasClass('bussy') || !$button.is(':visible') ){ return false; }
		
		var special = $button.attr('data-special');
		var path = '/'+sitesettings.language+'/';//$button.attr('data-path');
		var isSearch = special == 'search_td';
		if( path ){
			
			var $target;
			var itmcls = '';//item lass
			var url = '/inc/lightbox.php';	
			
			$target = $('#pp-content .lico .artlico');
			itmcls =  '.liart';
			
			//set target
			//if( $target && $target.length < 1 ){ return false; }
			
			var offset = $target.children(itmcls).length;
			//alert( offset );
			
			//do ajax
			var data = { 
				path: 			path,
				special: 		special,
				offset: 		offset,
				action:			'ploadmore',
				tags:			$button.attr('data-tags') ? $button.attr('data-tags') : '',
				progid: 		$button.attr('data-progid')
			};
			
			if( $button.attr('data-amount') ){
				data.amount = $button.attr('data-amount');
			}
			if( $button.attr('data-listindex') ){
				data.listindex = $button.attr('data-listindex');
			}

			if( $button.attr('data-lmtype') ){
				data.lmtype = $button.attr('data-lmtype');
			}			
			if( $button.attr('data-listindex') ){
				data.listindex = $button.attr('data-listindex');
			}

			if( isSearch && $button.attr('data-query')){
				data.query = $button.attr('data-query');
				if(  $button.attr('data-sfilters') ){
					data.sfilters = $button.attr('data-sfilters');
				}
			}
			
			//check for other data (by loop?) exclude date?
			if( $button.attr('data-excludepath') ){
				data['excludepath'] = $button.attr('data-excludepath');
			}

			var fail = function(d, nod){
				console.log( 'fail') ;
				//nod = no data, wel success
				//remove button
				$button.velocity("slideUp", speed.loadmore, function(){
					$button.hide().removeClass('bussy');	
				});
			}			
			
			var success = function(d){
				//console.log( d );
				if( d && $target.length > 0 ){
					var animate = true;
					var $d = $( d );
					//add new class
					//$d.find('.imco').addClass('new');
					
					if( animate ){
						var oldH = $target.height();
						$target.append($d);
						var newH = $target.height();
						$target.height(oldH);
						$target.velocity({height:newH}, speed.loadmore, function(){
							$target.css('height','auto');
							$button.removeClass('bussy');
							var fl = tag_get_active_filters(false);
							$('.inline-tag.active').removeClass('active');
							$('.inline-tag.tag-hl').removeClass('tag-hl');
							for( var f=0;f<fl.length;f++){
								$('.inline-tag[data-tag="'+fl[f]+'"]').addClass('active');
							}
						});
					}
					
					image_partload( $d );
					check_video_wrap();

					//check if loadmore needs removin
					var cnt = $button.attr('data-amount') ? parseInt($button.attr('data-amount')):10;
					if( $d.filter(itmcls).length < cnt ){
						$button.velocity("slideUp", speed.loadmore, function(){
							$button.hide();
						});
					}else{
						$button.show();
					}
					
					if( isSearch ){
						if( !sFilter ){sFilter = new searchFilter(true);}
						sFilter.afterLoadmore($d);
					}
				}else{
					fail(d, true);
				}
			}
			//alert('check3');
			$button.addClass('bussy');
			DoLBAjax( { url:url, data:data, callback:{success:success, fail:fail} } );
		}else{
			
		}
		//get target?
	};
	
/* TAGFILTER */
	
	var tagFiltering = false;
	//var tagAjax = false;
	var tagLico = false;
	var $tagCon = false;
	var $tagTarget = false;
	//var $tagOriginal = false;
	var tagAjax = { call: false};
	var $tagMsk = false;
	
	function tagfilter_setup(related){
		//store original?
		tagLico = related ? '#pp-content .lico-progitem' : '#pp-content .lico-programma';
		$tagCon = related ? $('.rfltr-con') : $('#tag-fltr-con');
		$tagTarget = $(tagLico + ' .artlico');
		$tagMsk = $('<div>').addClass('tag-msk fullabs').appendTo( $(tagLico) );

		if( related ){
			/*click*/
			$(document).on('click','.inline-tag',function(e){
				e.preventDefault();
				e.stopPropagation();
				$(this).remove();
				tag_do_filter(related)
			});
		}
		
		
		if( !related ){
			/*click*/
			$(document).on('click','.tag-link',function(e){
				e.preventDefault();
				e.stopPropagation();
				if( $(this).hasClass('active') ){
					$(this).removeClass('active');
				}else{
					//$('.tag-link.active').removeClass('active');
					$(this).addClass('active');
				}
				tag_do_filter(related)
			});
			
			
			$(document).on('mouseenter mouseleave','.tag-link',function(e){
				//new
				var tag = $(this).attr('data-tag');
				if( tag ){	
					if( e.type == 'mouseenter'){
						/* active filters en filterstring opslaan? om steeds ophalen te voorkomen */
						var fltrs = tag_get_active_filters(related).slice();
						fltrs.push(tag);
						/* loop items */
						$('.lico-programma .liart').each(function(){
							var fail = false;
							for( var f=0;f<fltrs.length;f++){
								if( !$(this).hasClass('tag'+fltrs[f]) ){ fail = true; }
							}
							
							if( fail ){
								$(this).addClass('noselect');
							}else{
								$(this).find('.inline-tag[data-tag="'+tag+'"]').addClass('tag-hl');
							}
						});
					}else{
						var $col = $('.inline-tag[data-tag="'+tag+'"]');
						$col.removeClass('tag-hl');
						$('.lico-programma .liart.noselect').removeClass('noselect');
					}
				}	
			});	
		}
	}
	
	function tag_get_active_filters(related){
		var fAr = [];
		var $active = related ? $tagCon.find('.inline-tag') : $('.tag-link.active');
		$active.each(function(){ if( $(this).attr('data-tag') ){ fAr.push( $(this).attr('data-tag') );}})
		return fAr;				
	}
	
	function tag_do_filter(related){
		//if( !$tagOriginal ){$tagOriginal = $tagTarget.clone();}
		
		var $button = $('.loadmore.prog-lm').length > 0 ? $('.loadmore.prog-lm') : false;
		
		var startLoad = function(){
			$tagCon.addClass('bussy');
			if( $tagMsk.css('opacity') == 0){
				$tagMsk.velocity({opacity:0.5},{duration:300,visibility:'visible'});
			}
		}
		var stopLoad = function(){
			$tagCon.removeClass('bussy');
			$tagMsk.velocity({opacity:0},{duration:900,visibility:'hidden'});
		}
		
		var setFilters = function(before){
			var fl = tag_get_active_filters(related);
			if( !related ){
				$('.inline-tag.active').removeClass('active');
				$('.inline-tag.tag-hl').removeClass('tag-hl');
				for( var f=0;f<fl.length;f++){
					$('.inline-tag[data-tag="'+fl[f]+'"]').addClass('active');
				}
				if( before ){
					var q = window.location.href;
					var subQ = decodeURIComponent(window.location.search.substring(1));
					q = q.replace( '?'+subQ, '');
					var fltrArr = fl;
					var f = fltrArr.join();
					if( fltrArr.length > 0 ){
						
						q += '?f='+f;
						history.replaceState(null,null,q);
						//alert( decodeURIComponent(window.location.search.substring(1)) );
					}else{
						//history.pushState( null, null, '/' );
						history.replaceState(null,null,q);
						//history.replaceState(null,null,'/blog/');
					}
				}
			}
			
			if( $button ){$button.attr('data-tags',fl.join());}

		}
		
		var addContent = function( $content ){
			var oh = $tagTarget.height();
			$tagTarget.empty().append( $content );
			var nh = $tagTarget.height();
			$tagTarget.height(oh);
			$tagTarget.velocity({height:nh},{duration:300,complete:function(){$tagTarget.css('height','auto')}});
			var $sTar = related ? $tagCon : $tagTarget.find('.liart').eq(0);
			if( !related){
			$sTar.velocity("scroll", { duration: 300, offset: -45, mobileHA: false,complete:function(){$tagTarget.css('height','auto');update_sidebarstick();} });
			}
			stopLoad();	
			image_partload( $content );
			//check filters		
			setFilters();
			
			if( $button ){
				var cnt = 10;
				if( $content.filter('.liart').length < cnt ){
					$button.velocity("slideUp", 300, function(){
						$button.hide();
						update_sidebarstick();
					});
				}else{
					$button.show();
					update_sidebarstick();
				}
			}
		}
		
		var fltrs = tag_get_active_filters(related);
		
		//alert( sitesettings.language );
		var data = { 
			action:		'taglist',//function name ine funcs_ajax.php
			tags: 		fltrs.join(),
			progid:		$tagCon.attr('data-progid'),
			path:		'/'+sitesettings.language+'/',
			ppath:		$tagCon.attr('data-ppath'),
			tagtype:    related ? 'related' : 'normal',
			lang: 		sitesettings.language
		};
		
		var fail = function(e, nod){
			//alert( 'fail:'+e ) ;
			//stopload(false, e=='abort');
			if( e != 'abort'){
				stopLoad();
			}else{
				if( tag_get_active_filters(related).length ==0 ){ stopLoad(); }
			}
		}			
		
		var success = function(d){//alert( 'success:' + d ) ;		
			if( d ){
				var $d = $( d );
				addContent( $d );
			}else{//alert('s fail');
				stopLoad();
			}
		}
		
		setFilters(true);
		
//		if( fltrs.length < 1 ){
//			//reset
//			startLoad();
//			AjaxAbort( tagAjax )
//			addContent( $tagOriginal.html() );
//		}else{
			startLoad();
			DoTagAjax( { data:data, callback:{success:success, fail:fail}, ajaxcall:tagAjax } );
			//console.log( tagAjax.call );
//		}	
	}
	
	function AjaxAbort( ajaxcall ){
		if( ajaxcall.call ){
			console.log( 'abort' );
			ajaxcall.call.abort();
			ajaxcall.call = false;
		}		
	}
	
	function DoTagAjax( args ){	
		
		var params = {
			data : {},
			url : '/inc/lightbox.php',
			type : 'GET',
			dataType: 'html',
			callback: {fail: false, success: false, always: false},
			ajaxcall: false
		}	
		
		$.extend( params, args ); 

		var ajaxvars = { type: params.type, url: params.url, data: params.data, dataType: params.dataType };		
		//abort previous if not loaded
		if( params.ajaxcall ){AjaxAbort( params.ajaxcall );}
		//do new one
		params.ajaxcall.call = $.ajax( ajaxvars )
		.done(function( d, t, jq) {//alert('success ' + d);
			if( params.callback.success ){params.callback.success(d);}
		})
		.fail(function( jq, t, e ) {//alert("error: " + t + ', ' + e );
			if( params.callback.fail ){params.callback.fail(e, false);}
		})
		.always(function() {
			if( params.callback.always ){params.callback.always(d);}
			params.ajaxcall.call = false;
		});	
	}


/****** SCT3 LIGHTBOX  FUNCTIONS  ***********************************************************************/	

/* LB CREATE */

	function CreateLightBox(){
		lightbox = $('body').lightBox({	
			handlepage: 'freeze',
			openmanual: true,
			callbacks: {	onmain: 		function(){LBonMain()},
							beforeclose: 	function(lbd){LBbeforeClose(lbd)},
							onopen: 		function(){LBonOpen();},
							onclose: 		function(){LBonClose();},
							beforechange:	function(){LBbeforeChange();},
							//afterchange:	function(){LBafterChange();},
							afterload:		function(){LBafterLoad();},
							parsedata:		LBparseData
			},
			//tempcontent: $('#lb-wrapper.temp'),
		});
		
		if( $('#lb-outer').hasClass('active') ){
			//alert('sa');
			lightbox.setActive();
		}
		
		lb_handlers();
	}

/* LB CALLBACKS */

	function LBonOpen(){
		$('#main').addClass('fixed');
		gifmanager_play('lb');
		ovv_hidelogos();
		ss_stop(false);	
		tcfs_engage();
		//tdcn_engage();
		$('#lb-close').removeClass('faded');
		sitesettings.projectPage = lightbox.currentPath() == sitesettings.projectsPath;
		ajaxlist_check( $('#lb-main'),'.alnormal');
		console.log('lb open:'+sitesettings.projectPage);
	}
	var homeOnClose = true;
	function LBonClose(){
		$('#main').removeClass('fixed');
		$('#wrapper').removeClass('showall');
		ovv_showlogos();
		history_push( '/' );
		home_load_async();
		gifmanager_play_home();
		filterbussy = false;
		sFilter = false;
		tdcn_update();
		if( homeOnClose && sitesettings.baseurl){
			//te traag...
			//window.location.href = sitesettings.baseurl;
		}
		tcfs_destroy();
		ss_start();
	}
	function LBonMain(){

	}	
	function LBbeforeClose(lbd){
//		alert( lbd.lbtype );
		if( lbd.lbtype == 'search'){
			history_back();
			//lightbox.disableClose();
		}
		tdcn_destroy();
	}
	function LBbeforeChange(){
		//tdcn_showhide( false );
		tdcn_destroy();
	}
	function LBafterChange(){
		
	}

	function LBafterLoad(){
		image_defaultload( '#lb-main', false );
		tcfs_engage();
		ajaxlist_check( $('#lb-main'),'.alnormal');
		check_video_wrap();
		sitesettings.projectPage = lightbox.currentPath() == sitesettings.projectsPath;
		console.log( 'lb afterload:' + sitesettings.projectPage);
		tdcn_engage();
		if( $('#lbptitle').length > 0 && $('#lbptitle').html() ){
			//alert( $('#lbptitle').html() );
			window.title = $('#lbptitle').text();
			document.title = $('#lbptitle').text();
			$('#lbptitle').remove();
		}
		
		//get scripts (ymlp signup)
		var $scripts = $('#lb-content script');
		console.log( 'scripts found: ' + $scripts.length );
		if( $scripts.length > 0 ){
			
//			$scripts.each(function(index, element) {
//				var src = 'https://signup.ymlp.com/xghjssjegmgj';//$(this).attr('src');
//				$.ajax( {type: 'GET', url: src, data: {}, dataType: 'text'} )
//				.done(function( d, t, jq) { console.log('s success ' + d);console.log(t);console.log(jq);})
//				.fail(function( jq, t, e ) { console.log("s error: " + t + ', ' + e );})
//				.always(function() {console.log('s always');});	
			
//				$.getScript( src, function( data, textStatus, jqxhr ) {
//					console.log( data ); // Data returned
//					console.log( textStatus ); // Success
//					console.log( jqxhr.status ); // 200
//					console.log( "Load was performed." );
//				});	
//			});
//			$scripts.each(function(index, element) {
//				var src = $(this).attr('src');
//				$.getScript( src )
//				 .done(function( script, textStatus ) {
//					console.log( script );
//				  })
//				  .fail(function( jqxhr, settings, exception ) {
//					console.log('fail');
//});
//			});
	
		}
//		$scripts.each(function(index, element) {
//			var src = $(this).attr('src');
//            $(this).attr('src','');
//			$(this).attr('src',src);
//        });
//		$scripts.each(function (index, element) {
//			var val = eval(element.innerHTML);
//			console.log('val');
//			 console.log(val);
//			  })
	}

/* LB HOVER */

	function lbHover(){
		$(document).on('mouseenter mouseleave', ".lb-sb-fixed", function(e){ 
			//alleen column 1?
			//var $column = $(this).parent('.column');
			var ovl = $('#lb-overlay');
			if( ovl.length < 1 || ovl.hasClass('semi') ){ 
				return false;
			}
			var $wrp = $('#wrapper');
			if( e.type == 'mouseenter'){
				//hide header or add class?
				$('#lb-outer').addClass('hovering');
				$(e.target).addClass('hovering');
				$('#lb-overlay').velocity('stop').velocity({opacity:0.9}, speed.lbx.fade);
				$wrp.addClass('showall');
			}else{
				$('#lb-outer').removeClass('hovering');
				$(e.target).removeClass('hovering');
				$('#lb-overlay').velocity('stop').velocity({opacity:1}, speed.lbx.fade, function(){$wrp.removeClass('showall')});
			}
		});
	}

/* LB OPEN/CLOSE */

	function openlb($lnk){
		if( !useLB ){ return false;}
		if( $lnk.attr('data-path') ){
			var path = $lnk.attr('data-path');
			var type = $lnk.attr('data-lbtype');
			openlbpath( path, type );
		}else{//fallback to href
			var href = $lnk.attr('href');
			//alert(0);
			if(  href.substring(0, 1) == '/' ){
				openlbpath( href, false )
			}
		}
	}
	function openlbpath( path, type ){
		if( !useLB ){ return false;}
		//type: to pass 'search' to lb
		//if(type)alert(type);
		//check if path not open already
		//alert( 'cp:' + lightbox.currentPath() + ',path:' + path + ',check:' + lightbox.checkPath(path));	
		var cp = lightbox.currentPath();
		if( cp == path || cp == (path + '/') ){
			//alert( 'return false' );
			return false;
			
		}
		
		ga_pageview( path );
		history_push( path );
		var args = { data:{ 'path' : path, 'action' : 'lb' } };
		if(type){args.lbtype = type;}
		lightbox.openLightbox(args); 		
	}
	function openlbsearch( path, query ){
		history_push( path );
		//alert( sitesettings.language );
		lightbox.openLightbox({data:{ 'action' : '', 's':query, 'lang':sitesettings.language  }}); 		
		//{'action':'', 's':q, 'lang':lang },
	}
	
	function lb_handlers(){

		$(document).on('click', ".q-link", function(e) {
			e.preventDefault();
		});
		$(document).on('click', ".ttlink", function(e) {
			//e.preventDefault();
		});
		
		$(document).on('click', "#lb-header a", function(e) {
			var href = $(this).attr('href');
			openlbpath( href );
			e.preventDefault();
		});
		
				
		$(document).on('click', ".lb-link, .lbx-link, .hd-link", function(e) {	
			//lbx is from withtin lb
				
			if( $(this).hasClass('go') ){
				if( $(this).find('.ttlink').length > 0 ){
					$(this).find('.ttlink')[0].click();
				}
			}else{
				e.preventDefault();	
				openlb($(this));
			}
		});
		$(document).on('click', ".column .liart", function(e) {													
//			if( $(this).hasClass('liart-program') ){
//				if( !$(this).hasClass('style-lstyle-tile') ){
//					var $ml = $(this).find('.more-link');
//					if( $ml.length > 0 ){
//						$ml[0].click();
//					}
//					e.stopPropagation();
//				}
//			}else{
				e.preventDefault();	
				openlb($(this));
//			}
		});
	}
	

	
	var LBparseData = function(d){
		//alert('paaarse ' + d);
		//function to manipulate the ajax return (d) from lb.
		return 'kaas';
	}
	
/* LB TOC */

	$(document).on('click', ".toc-link", function(e) {	
		e.preventDefault();
		var $link = $(this);
		//var $field = $link.next('.toc-field');//content window
		if( $link.hasClass('iscurrent') ){
			//alert('current');
			scrollto_top_el( $('#lb-content') );
			//$('#lb-content').velocity("scroll", { duration: speed.scrollto, mobileHA: false });
			return false;
		}

		var action = $link.hasClass('active') ? 'close' : 'open';
		toc_openclose( $link, {action:action, clickevent:e } );									
	});
	
	$(document).on('click', '.tcf-close', function(e){
		var $link = $(this).parents('.toc-field').prev('.toc-link');
		$link[0].click();
	})
	
	function toc_openclose($link, params){
		
		var opts =  {
			action: 		'open',		//open or close
			clickevent: 	false,		//called by tclink self or initiated by other function
			field: 			false,
			openparents:	false,		//open parents if closed
			recursive: 		true,
			fromother: 		false,
		};
		
		$.extend(opts, params);	
		
		var $field =  opts.field ? opts.field : $link.next('.toc-field');//content window
		var $tocc = $link.parents('.toc-con').eq(0);	
		var toctype = $tocc.attr('data-toctype') ? $tocc.attr('data-toctype') : 'normal';//naar parent?	
		var openToc = opts.action == 'open';
		

		/* return conditions */
		if( !$field || ( openToc && $link.hasClass('active') ) || ( !openToc && !$link.hasClass('active') ) ){
			return false;
		}
	
		/* pre actions */
		if(!openToc){//remove classes before activecheck (when closing );
			$link.removeClass('active');
			$field.removeClass('active');
			if( $tocc.hasClass('multi') ){
				$('.toc-link.mlt.tmpfirst').removeClass('tmpfirst');
			}
		}
		
//		/* handle active siblings */// moved to open toc
//		var $actives = GetActiveSiblings($link, '.toc-link');
//		var nH = -1;//accumulate height for scroll target
//		if( $actives.length > 0){		
//			if( openToc ){
//				$actives.each(function(){
//					toc_openclose( $(this), {action:'close',fromother:true} );			   
//				});
//			}
//		}

		/* close toc */
		if( !openToc ){
			tdcn_showhide(false,$field);
			if( !opts.fromother ){ 
			$tocc.removeClass('hasactive');$('#lb-close').removeClass('faded');/*tdcn_showhide(true);*/}
			//close subs
			if( opts.recursive ){//close field childrem
				var $subLinks = $field.find('.toc-link.active');
				if( $subLinks.length > -1 ){
					$subLinks.each(function(){
						//CloseToc( $(this), false, false, false, true );				   
					});
				}
			}
			$field.velocity("slideUp", speed.lbx.toc, function(){
				tdcn_update_stick();
			});
		}
		
		/* open toc */
		if( openToc ){	
			var $actives = GetActiveSiblings($link, '.toc-link');	
			var $af = $actives.next('.toc-field');	
			$actives.each(function(){//af = $(this).next('.toc-field');alert( af.length );	
				toc_openclose( $(this), {action:'close',fromother:true} );			   
			});			
			
			$link.addClass('active');
			$field.addClass('active');
			
			
			
			if( $tocc.hasClass('list') ){
				//check for new scrolltop 'link'
				var ft = $link.offset().top;
				if( $af.length > 0 ){ $af.hide(); }
				$field.show();
				var lt = $link.offset().top;
				if( $af.length > 0 ){ $af.show(); }
				$field.hide();
				//alert( 'ft:'+ft+',lt:'+lt);
				var st = parseInt( lt ) - 30;
				var stpx = st + 'px';
				//$(window).scrollTop( st );
				$("html").velocity("scroll", { duration: speed.lbx.toc, offset: stpx, mobileHA: false });
				
				tdcn_showhide(true,$field);
			}
					
			$field.velocity("slideDown", speed.lbx.toc, function(){
				if( $tocc.hasClass('list')){ handle_async_media( $field ); };
				if( $tocc.hasClass('multi')){ 
				image_partload( $field ); }; 
				/* stickem */
				tcfs_update();
				tdcn_update_stick();
			});	
			$tocc.addClass('hasactive');
			
			if( $tocc.hasClass('list') ){
				//target scroll
				//$link.velocity("scroll", { duration: speed.lbx.toc, mobileHA: false });	
			}
			if( $tocc.hasClass('multi') ){
				//multi_removenextborder( $link );
				ajaxlist_check( $field,  '.almulti' );
			}
			if( $link.attr('data-path') ){
				ga_pageview( $link.attr('data-path') );
			}
			$('#lb-close').addClass('faded');
			
		}		
	}
	
	function scroll_toggle(){
		
	}
	
	function multi_removenextborder( $link ){
		//temporary remove border from the next multi toc link
		var $nxt = $link.parent().next().children('.toc-link.mlt');
		if( $nxt.length > 0 ){

			$nxt.addClass('tmpfirst');
		}
		//alert( $nxt.length );
	}	
	
	function GetActiveSiblings($link, sibclass){//clas= .tc-link
		//var $actives;// = $link.siblings('.tc-link.active');//$tocc.find('.tc-link.active');
		var $siblings = $link.siblings( sibclass );
		$siblings = $siblings.length > 0 ? $siblings : $link.parent().siblings().find(sibclass);
		var $actives = $siblings.filter('.active');	
		return $actives;
	} 
		
/* LB LOGOS */

	function ovv_hidelogos(){
		$('#sb-right-fixed').velocity({ opacity: 0 }, { display: "none", duration:0 });
		$('#sb-left-fixed').velocity({ opacity: 0 }, { display: "none", duration:0 });
		$('#clogo').velocity({ opacity: 0 }, { duration:0 });
	}
	function ovv_showlogos(){
		$('#sb-right-fixed').velocity({ opacity: 1 }, { display: "block", duration:0 });
		$('#sb-left-fixed').velocity({ opacity: 1 }, { display: "block", duration:0 });
		$('#clogo').velocity({ opacity: 1 }, { duration:0 });
	}	

/* LB PROJECTFILTR */

	$(document).on('click', '#fltr-toggle', function(e) {
		e.preventDefault();

		var $fld = $(this).parents('.filter-con').find('.filter-list-wrap');
		if( $(this).hasClass('active') ){
			$(this).removeClass('active');
			$fld.velocity("slideUp", { duration: speed.toc });
		}else{
			$(this).addClass('active');
			$fld.velocity("slideDown", { duration: speed.toc });
		}
	
	})
	//var pfiltering = false;
	
	$(document).on('click', '.pfltr', function(e) {
		e.preventDefault();
		var type = $(this).attr('data-type');
		if( $(this).hasClass('active') ){
			$(this).removeClass('active');
		}else{
			$('.pfltr.'+type+'.active').removeClass('active');
			//if( type == 'dreg' ){
//				$('.pfltr.prog.active').removeClass('active');
//			}else if( type == 'prog' ){
//				$('.pfltr.dreg.active').removeClass('active');
//			}
			$(this).addClass('active');
		}
	
		//find loadmore
		var lmb = $('.artlico.hasfilter').find('.loadmore');
		
		var afA = [];
		//console.log( 'filter loadmore 1');
		if(lmb.length < 1 ){return false;}
		//console.log( 'filter loadmore 2');
		//get active filters
		var dreg = '';
		if( $('.pfltr.dreg.active').length > 0 ){
			dreg = $('.pfltr.dreg.active').eq(0).attr('data-id');
		}
		var pvorm = '';
		if( $('.pfltr.pvorm.active').length > 0 ){
			pvorm = $('.pfltr.pvorm.active').eq(0).attr('data-id');
		}
		//jaartal
		var jtal = '';
		if( $('.pfltr.jtal.active').length > 0 ){
			jtal = $('.pfltr.jtal.active').eq(0).attr('data-id');
		}
		//afgerond
		var status = '';
		if( $('.pfltr.status.active').length > 0 ){
			status= $('.pfltr.status.active').eq(0).attr('data-id');
		}	
		//programma
		var program = '';
		if( $('.pfltr.prog.active').length > 0 ){
			program = $('.pfltr.prog.active').eq(0).attr('data-id');
		}
		//progtype
		var progtype = '';
		if( $('.pfltr.progtype.active').length > 0 ){
			progtype = $('.pfltr.progtype.active').eq(0).attr('data-id');
		}		
		//alert( progtype );		
		//subdiscipline
		var subdiscipline = '';
		if( $('.pfltr.subdiscipline.active').length > 0 ){
			subdiscipline = $('.pfltr.subdiscipline.active').eq(0).attr('data-id');
		}	
		
		
					
		//set loadmore button atts accordingly
		if( dreg == '' ){
			lmb.removeAttr('data-regeling');
		}else{
			afA.push('rg:'+dreg);
			lmb.attr('data-regeling', dreg );
		}
		if( pvorm == '' ){
			lmb.removeAttr('data-projectvorm');
		}else{
			afA.push('pv:'+pvorm);
			lmb.attr('data-projectvorm', pvorm );
		}
		if( jtal == '' ){
			lmb.removeAttr('data-jaartal');
		}else{
			afA.push('jt:'+jtal);
			lmb.attr('data-jaartal', jtal );
		}
		if( status == '' || dreg != 1){
			lmb.removeAttr('data-status');
		}else{
			afA.push('st:'+status);
			lmb.attr('data-status', status );
		}
		if( program == '' ){
			lmb.removeAttr('data-programma');
		}else{
			afA.push('pg:'+program);
			lmb.attr('data-programma', program );
		}
		if( progtype == '' ){
			lmb.removeAttr('data-progtype');
		}else{
			afA.push('pgt:'+progtype);
			lmb.attr('data-progtype', progtype );
		}
		if( subdiscipline == '' ){
			lmb.removeAttr('data-subdiscipline');
		}else{
			afA.push('sd:'+subdiscipline);
			lmb.attr('data-subdiscipline', subdiscipline );
		}
		
		if(sitesettings.projectPage == true ){
			//add string
			
			var q = window.location.href; // current url
			var subQ = decodeURIComponent(window.location.search.substring(1)); // substring is '?foo=bar', substring(1) is 'foo=bar'
			q = q.replace( '?'+subQ, ''); // take substrgin '?foo=bar' and replaces it with ''
			
			if( afA.length > 0){
				var afS = afA.join();
				q += '?pf='+afS;
			}
			//alert( q );
			history.replaceState(null,null,q);
			//alert( decodeURIComponent(window.location.search.substring(1)) );
		}
		//return false;
		filter_start();
		//alert('loasdmore');
		var success = function( data, $d ){
			//console.log('reg: ' + parseInt(data.regeling));
			if( parseInt(data.regeling) == 1 ){
				$('#filter-list-status').removeClass('hidden');
			}else{
				$('#filter-list-status').addClass('hidden');
			}
			
			//check available options
			var $aops = $d.filter('#available_options');
			if( $aops.length > 0 ){
				var avj = $aops.html();
				var ava = $.parseJSON(avj);
				//console.log(ava);
				$('.pfltr').addClass('disabled').removeAttr('title');
				//loop
				for (var ftype in ava) {
					if (ava.hasOwnProperty(ftype)) {
						for( var fid in ava[ftype] ){
							var id = parseInt( fid );
							$('.pfltr.'+ftype+'[data-id="'+id+'"]').removeClass('disabled').attr('title',ava[ftype][fid]);
						}
				  	}
				}
				$aops.remove();
				//$('.pfltr.status').removeClass('disabled');
			}
			if( parseInt(data.regeling) == 1 ){
				$('.pfltr.status').removeClass('disabled');
			}else{
				$('.pfltr.status').addClass('disabled');
			}

		}
		//console.log( 'filter loadmore');
		loadmore( lmb, true, success );
		//alert( 'dreg:'+dreg+',pvorm:'+pvorm );
	})	
	
	$(document).on('click', '.fltr-selected', function(e) {
		e.preventDefault();
		if( filterbussy ){return false; };
		var id = $(this).attr('data-id');
		var type = $(this).attr('data-type');
		var fltr = $('.pfltr.'+type+'.active');
		if( fltr.length > 0 ){ fltr.click();} 
		
	});
	function filter_start(){
		filterbussy = true;
		$('#filterloader').velocity({ opacity: 0.7 }, { display: "block" });
		$('#filterloaderhead').velocity({ opacity: 0.7 }, { display: "block" });
		$('#fltr-selection .fltr-selected').velocity({ opacity: 0 }, { display: "none" });
	}

	function filter_stop(){
		filterbussy = false;
		$('#filterloader').velocity({ opacity: 0 }, { display: "none" });
		$('#filterloaderhead').velocity({ opacity: 0 }, { display: "none" });
		//add .fltr-selected
		var $slctd = $('.fltr-selected.hidden');
		if( $slctd.length > 0 ){
			$('#fltr-selection').append( $slctd );
			$slctd.removeClass('hidden');
		}
	}
	
/* LB SEARCHFILTR */

	var sFilter = false;
	
	var searchFilter = function(isProgram){
		var obj = this;
		
		obj.$ = {};
		obj.$.filters = $('.sfltr');
		obj.$.results = $('.s-result');
		obj.$.loadmore = $('.loadmore');
		obj.$.resultcon = isProgram ?  $('.list-search .artlico') : $('.s-result-con');
		obj.$.filtercon = isProgram ? $('#search-fltr-con') :$('.filter-list-con.search');
		obj.$.filterlist = obj.$.filtercon.find('.filter-list');
		
		obj.filterClick = function( $fltr ){
			$fltr.toggleClass('active');
			//if( !isProgram ){
			obj.doFilter();		
			//}
		}
		
		obj.showHide = function($result, show){
			var after = function(){$result.removeClass('changing');}
			$result.addClass('changing');
			if( show ){
				$result.removeClass('disabled').hide().velocity("slideDown", speed.sfilter, function(){after()});
			}else{
				$result.addClass('disabled').show().velocity("slideUp", speed.sfilter, function(){after()});
			}
		}
		
		obj.afterLoadmore = function($d){
			//var $newFcon = $d.filter('.filter-list-con.search.new');
			if( $d.filter('.newlistcon').length > 0){
				var $newFcon = $d.filter('.newlistcon');
				$newFcon.find('.sfltr').each(function(){
					var typ = $(this).attr('data-id');
					var amnt = parseInt( $(this).attr('data-amount') );
					var $of = obj.$.filtercon.find('.sfltr[data-id='+typ+']');
					if( $of.length > 0 ){//filter exists
						var o_amnt = parseInt($of.attr('data-amount'));
						var n_amnt = o_amnt + amnt;
						$of.attr('data-amount',n_amnt);
						if( isProgram ){
							//console.log( $of.html() );
							var $span = $of.find('span');
							$span.html( $span.html().replace(o_amnt, n_amnt) );
						}else{
							$of.html( $of.html().replace(o_amnt, n_amnt) );
						}
						if( n_amnt > 0 ){$of.removeClass('disabled');}
						//console.log( 'nope:' + typ + ', ' + n_amnt );
					}else{
						obj.$.filterlist.append( $(this) );
					}
				});
				$newFcon.remove();
				obj.$.filters = $('.sfltr');
				obj.$.results = $('.s-result');
			}
		}
		
		obj.doFilter = function(){
			var afltrs = [];
			//get active filters
			obj.$.filters.filter('.active').each(function(){
				afltrs.push( $(this).attr('data-id'));
			})
			if( !afltrs || afltrs.length < 1 ){//no filters selected (show all)
				obj.$.loadmore.removeAttr('data-sfilters');
				obj.showHide( obj.$.results.filter('.disabled'), true );
			}else{
				obj.$.loadmore.attr('data-sfilters',afltrs.join());
				obj.$.results.each(function(){
					var type = $(this).attr('data-type');
					if( afltrs.indexOf( type ) > -1 ){//active (show)
						if( $(this).hasClass('disabled') ){obj.showHide( $(this), true );}					
					}else{//inactive (hide)
						if( !$(this).hasClass('disabled') ){obj.showHide( $(this), false );}						
					}
				})
			}
		}
			
		return obj;
	}

	$(document).on('click', '.sfltr', function(e) {
		e.preventDefault();
		if( !$(this).hasClass('disabled') ){
			if( !sFilter ){sFilter = new searchFilter($(this).hasClass('td'));}
			sFilter.filterClick($(this));
		}
	});
	
	


/* LB SHARE LINKS */

	$(document).on('click', '.sh-l', function(e){
		$(this).find('.l-sh').click();	
	});	
	
	$(document).on('click', '.l-sh', function(e){
		e.preventDefault();
		var $fld = $(this).parents('.slink-upper').next('.slink-lower');
		if( $(this).hasClass('active') ){
			$(this).removeClass('active');
			$fld.velocity("slideUp", { duration: speed.fast });
		}else{
			$(this).addClass('active');
			$fld.velocity("slideDown", { duration: speed.fast,complete: function(elements) { $fld.find('.dlink-input').select();} });	
		}
		e.stopPropagation();
	});
	
	$(document).on('click','.sh-link', function(e){
		var href = $(this).attr('href');
		if(!href){return false; }
		e.preventDefault();
		var fbpopup = window.open(href, "pop", "width=600, height=400, scrollbars=no");
	});

/* LB SEARCH */

	$(document).on('submit','#sform',function(e) {
		e.preventDefault();
		var $form = $( this );
		var lang = $form.attr( 'action' );
		var q = $('#sq').val();
		if( !q ){ return false; }
		//q = q.replace(' ','+');
		var params = {
			data : {'action':'', 's':q, 'lang':lang },
		}
		var path = lang == 'nl' ? '' : '/en/';
		path += '?s=' + q;
		history_push( path );
		//var path = 
		lightbox.openLightbox(params); 
	});


/****** SCT4 HOVER / MASK FUNCTIONS  ***********************************************************************/	

	function InitiateHovers(){
		lbHover();
		toc_colHover();
	}
	
	function toc_colHover(){
	
		$(document).on('mouseenter mouseleave', ".tc-link, .toc-link", function(e){ 
			//alleen column 1?
			//var $column = $(this).parent('.column');
			var $parent = $(this).hasClass('tc-link') ? $(this).parents('.column').eq(0) : $(this).parents('.toc-con').eq(0);
			var $link = $(this);
			var parClass = 'hashover';//active column class (to activate masks on current active column)
			var elClass = 'hover';
			//console.log('event:' + e.type);
			if( e.type == 'mouseenter'){
				$parent.addClass( parClass );
				$link.addClass( elClass );
			}else{
				$parent.removeClass( parClass );
				$link.removeClass( elClass );
			}
		});
		
		$(document).on('mouseenter mouseleave', ".tc-field, .tochover", function(e){ 
			//alleen column 1?
			//var $column = $(this).parent('.column');
			var $parent = $(this).parents('.column').eq(0);
			var $field = $(this).hasClass('tc-field') ? $(this) : $(this).parents('.tc-field').eq(0);
			var $link =  $field.prev('.tc-link');
			var parClass = 'hashover';//active column class (to activate masks on current active column)
			var elClass = 'hover';
			//console.log('event:' + e.type);
			if( e.type == 'mouseenter'){
				$parent.addClass( parClass );
				$link.addClass( elClass );
			}else{
				$parent.removeClass( parClass );
				$link.removeClass( elClass );
			}
		});
		$(document).on('mouseenter mouseleave', ".column.inactive", function(e){ 
			//var $column = $(this).parent('.column');
			var $column = $(this);
			var wrapClass = 'hovering';//wrapper class
			var aColClass = 'disabled';//active column class (to activate masks on current active column)
			//console.log('event:' + e.type);
			var $activeColumn = $('.column.active');
			
			if( e.type == 'mouseenter'){
				//$('#wrapper').addClass( wrapClass );
				$activeColumn.addClass( aColClass );
			}else{
				//$('#wrapper').removeClass( wrapClass );
				$activeColumn.removeClass( aColClass );
			}
		});
	
	}
	
	
/****** SCT5 IMAGE / MEDIA FUNCTIONS  ***********************************************************************/	

	function handle_async_media( $target ){
		//add class to mark as checked?
		load_async_media( $target );
	}
	function load_async_media( $target, clss ){
		//look for data-src and data-type to handle async load of images and video
		//called when opening toc
		//$target = tc-field
		clss = clss ? clss : 'toload';
		
		$target.find('.imco.' + clss).each(function(){//[data-ratio]vr
			var $con = $(this);
			var $inr = $con.find('.inr');
			var $img = $inr.find('img[data-src]');
			if( $img.length > 0 ){
				$imgc = $img.clone();
				$img.remove();
				$imgc.attr('src', $img.attr('data-src') );
				$con.removeClass(clss);
				$imgc.appendTo( $inr );
				image_show( $imgc, false );
			}
		})
		
	}
	
	function image_partload( $collection ){
		//load images within given collection (for ajax results of load more)
		$collection.find('.imco img').each(function(){//[data-ratio]
			if(!$(this).parents('.imco').hasClass('defimage')){
				image_show( $(this), false);
			}
		})		
	}
	
	function image_show( $img, cb, args){
		
		var params = {
			parent 	: '.inr',
			con		: '.imco'
		}	
		
		$.extend( params, args );
		
		var inr = params.parent;
		var con = params.con;
		var $inr = inr ? $img.parent(inr) : $inr.parent(con);
		var $con = $inr.parent(params.con);
		if( !$con.hasClass('toload') ){
			//$con.height( $img.data('ratio') * $con.width() );
			var afterload = function(r){
				if( cb ){ cb(r);}
				//r.parent.css({ /*height:'auto',*/ opacity: 1, visibility: 'visible' } );
				r.parent.velocity({opacity:1}, speed.fast);
			}
			
			$inr.css({ opacity: 0.5, visibility: 'visible' } );
			
			if( $img.attr('data-ratio') && $img.attr('data-owidth') ){//prescale?
				var w = parseInt($img.attr('data-owidth'));
				var h = parseInt(w * $img.attr('data-ratio'));
				if( w < $con.width() ){ $con.css('max-width', w); }
					
				
				$img.imageScale({scale:'fill', parent:inr,centerhor:true, centerver:true, inpercentage:true, 
								 imgw:w, imgh:h, prescale:true});
				$img.imageLoad({parent:inr}, afterload);				 
			}else{
				console.log('other image');
				var d = {scale:'fill', parent:inr, centerhor:true, centerver:true, inpercentage:true};
				$img.imageScale(d, afterload);
			}	
		};
	}
	
	function image_show_old( $img, cb){
		var $inr = $img.parent('.inr');
		var $con = $inr.parent('.imco');
		if( !$con.hasClass('toload') ){
			//$con.height( $img.data('ratio') * $con.width() );
			var afterload = function(r){
				if( cb ){ cb(r);}
				//r.parent.css({ /*height:'auto',*/ opacity: 1, visibility: 'visible' } );
				r.parent.velocity({opacity:1}, speed.fast);
			}
			
			$inr.css({ opacity: 0.5, visibility: 'visible' } );
			
			if( $img.attr('data-ratio') && $img.attr('data-owidth') ){//prescale?
				var w = parseInt($img.attr('data-owidth'));
				var h = parseInt(w * $img.attr('data-ratio'));
				if( w < $con.width() ){ $con.css('max-width', w); }
					
				
				$img.imageScale({scale:'fill', parent:'.inr',centerhor:true, centerver:true, inpercentage:true, 
								 imgw:w, imgh:h, prescale:true});
				$img.imageLoad({parent:'.inr'}, afterload);				 
			}else{
				console.log('other image');
				$img.imageScale({scale:'fill', parent:'.inr', centerhor:true, centerver:true, inpercentage:true}, afterload);
			}
			
				
		};
	}
	
	function image_defaultload( selector, imco_cls ){
		imco_cls = imco_cls ? imco_cls : ''; //.new for example
		var conslct = '.imco'+imco_cls;
		//set container height from ratio, load images
		$(selector).find('.imco img').each(function(){
			if( !$(this).parents('.imco').hasClass('defimage') && $(this).parents('.multi').length < 1 ){//prevent multi lists to be loaded (not visible yet)
				//alert( 'multi');
				image_show( $(this), false);
			}
				  
		})		
	}
	
	function check_video_wrap(){
		$('iframe.vid').each(function(){
			if($(this).parent('.vidcon').length < 1 ){
				$(this).wrap( "<div class='vidcon'></div>" );
			}
		})
	}
	
	
/****** SCT6 RESIZE FUNCTIONS  *******************************************************************************/	

    var rspns = { val:0, el:false };
	var resizeTO;
	function BubbledResize(){
		//resize content
		if( colManager){
			colManager.resize();
			//check scrollbars
			CheckAllColumnScrollFit();
		}
		if( useLB ){
			ss_resize(true);
			tdcn_resize();
		}else{
			update_sidebarstick();
		}
		//responsive
		rspns_check();
	}
	
	function rspns_start(){
		rspns.el = $('#rspns');
		rspns.val = rspns.el.width();
		//alert( $('#columnlogo').css('max-height') );
	}
	
	function rspns_check(){
		if( !rspns.el ){return false;}
		var nval = rspns.el.width();
		//do stuff
		if( rspns.val != nval ){
			rspns_do(rspns.val, nval);
		}
		rspns.val = nval;
	}
	
	function rspns_do(from, to){
		//console.log('from:' + from + ', to:' + to);
		var dir = from > to ? -1 : 1;
		if(dir == -1){
			if( to == 1024 ){
				$('#columnlogo').addClass('enabled');
				if( !$('#column-1').hasClass('active') ){
					$('#columnlogo').show();
				}
				console.log( 'show clogo');
				//gifmanagers.column.play();//if !lbactive
				//gifmanagers.main.pause();
				if( !$('#lb-outer').hasClass('active') ){
					gifmanager_play('column');
				}
			}
		}
		
		if( dir == 1){
			if( from == 1024 ){
				$('#columnlogo').hide().removeClass('enabled');
				//console.log( 'hide clogo');
				//gifmanagers.column.pause();
				//gifmanagers.main.play();//if !lbactive
				if( !$('#lb-outer').hasClass('active') ){
					gifmanager_play('main');	
				}
			}
		}
	}

	function Resize(e){
		clearTimeout(resizeTO);
		resizeTO = setTimeout( function(){BubbledResize();}, 100 );		
	}
	
	$(window).resize(function (e) {
		Resize(e);
	});	    
	
/*//////////////////*/
/*   SCROLL EVENT   */	
	    	
	var scrollData = {
		last: -1,
		dir: 1,
		timeout: null
	}

	function BubbledScroll(){
		if( infScroll ){
			infScroll.checkScroll( scrollData.dir );
		}
		
		//console.log( 'filterbussy: ' + filterbussy );
		if( !sitesettings.isMobile && !filterbussy){
			var $lmE = $('.loadmore.lbx-lm');
			if( scrollData.dir > 0 ){
				$lmE.each(function() {
                	if( !$(this).hasClass('noinfinite') && $(this).is(':visible') ){
						var btm = $(this).offset().top + $(this).outerHeight();
						var st = $(window).scrollTop() + $(window).height();
						if( st > btm ){ loadmore( $(this) );}
					}
				});
			};
		}
	}
	
	$(window).scroll(function (e) {
		scrollData.dir = ($(window).scrollTop() - scrollData.last) < 0 ? -1 : 1;
		clearTimeout(scrollData.timeout);
		scrollData.timeout = setTimeout( function(){BubbledScroll();}, 100 );
		if( scrollData.dir == 1 ){} 	 	
		scrollData.last = $(window).scrollTop();
	});	

/****** SCT7 LOADMORE FUNCTIONS  *******************************************************************************/	

/* LOADMORE */
	
//	$(document).on('click', ".loadmore", function(e) { //moved to docready
//		var $button = $(this);
//		loadmore( $button, false  );
//	});
	
	function loadmore( $button, $filter, cb ){	
		//alert('check1:'+$button.hasClass('bussy')+':'+( !$filter && filterbussy));	
		if( $button.hasClass('bussy') || ( !$filter && filterbussy) ){ return false; }
		//alert('check2');

		var inLB = $button.hasClass('lbx-lm'); //lb or overview
		
		var special = $button.attr('data-special'); // 'toekenningen'
		var path = $button.attr('data-path'); // f.e. '/nl/toekenningen'
		var isSearch = special == 'search';
		var filterType = $button.attr('data-lmtype') == 'filter'; // f.e. 'filter'
		
		if( path && special ){
			
			var $target;
			var itmcls = '';//item lass
			var url;
			var hasfilter = false;
			
			if( inLB ){
				$target = isSearch ? $button.prev('.s-result-con') : $button.prev('.toc-con');
				hasfilter = $target.parent().hasClass('hasfilter');
				
				itmcls =  isSearch ? '.s-result' : '.toc-link';
				var url = '/inc/lightbox.php';
			}else{
				var url = '/inc/ajax.php';
				if( special == 'kalender' ){
					$target = $button.parents('.lico').eq(0);
					itmcls = '.cico';
				}else{
//					$target = $button.parents('.mCSB_container').eq(0);
//					itmcls = '.art';
					$target = $button.prev('.htile-con');
					itmcls = '.htile';
				}
			}
			
			//set target
			if( $target && $target.length < 1 ){ return false; }
			
			var offset = $filter ? 0 : ( inLB ? $target.children(itmcls).length : $target.find(itmcls).length);
			//alert( offset );
			//return false;
			
			//do ajax
			var data = { 
				path: 			path,
				special: 		special,
				offset: 		offset,
				hasfilter:		hasfilter,
				action:			'loadmore',
				regeling: 		$button.attr('data-regeling'),
				projectvorm:	$button.attr('data-projectvorm')
			};
			if( $button.attr('data-jaartal') ){
				data.jaartal = $button.attr('data-jaartal');
			}
			if( $button.attr('data-status') ){
				data.status = $button.attr('data-status');
			}
			if( $button.attr('data-programma') ){
				data.programma = $button.attr('data-programma');
			}
			if( $button.attr('data-progtype') ){
				data.progtype = $button.attr('data-progtype');
			}
			if( $button.attr('data-subdiscipline') ){
				data.subdiscipline = $button.attr('data-subdiscipline');
			}
			if( $button.attr('data-amount') ){
				data.amount = $button.attr('data-amount');
			}
			if( $button.attr('data-lmtype') ){
				data.lmtype = $button.attr('data-lmtype');
			}			
			if( $button.attr('data-listindex') ){
				data.listindex = $button.attr('data-listindex');
			}
			if( $filter ){
				//alert( 'filter');
				data.type = 'filter';
			}
			if( isSearch ){
				data.query = $button.attr('data-query');
				if(  $button.attr('data-sfilters') ){
					data.sfilters = $button.attr('data-sfilters');
				}
			}
			//alert( data.regeling );
			//alert(data.path);
			
			
			//check for other data (by loop?) exclude date?
			if( $button.attr('data-excludepath') ){
				data['excludepath'] = $button.attr('data-excludepath');
			}

			var fail = function(d, nod){
				//alert( 'fail') ;
				//nod = no data, wel success
				//remove button
				$button.velocity("slideUp", speed.loadmore, function(){
					if( $filter || filterType){
						$button.hide().removeClass('bussy');
					}else{
						//console.log('removed');
						$button.remove();
					}
				});
				if( $filter && nod ){
					//no data?
					//alert( 'nod' );
					$target.empty();
					
				}
				if( $filter ){
					filter_stop();
				}
				//console.log( 'fail: ' + filterbussy );
			}			
			
			var success = function(d){
				//
				if( d && $target.length > 0 ){
					var animate = inLB;
					var $d = $( d );
					//add new class
					//$d.find('.imco').addClass('new');
					if( cb ){cb(data,$d);}
					if( ! animate ){
						$button.removeClass('bussy');
						if( inLB ){
							if( $filter ){ $target.empty(); }
							$target.append($d);
						}else{
							$target.append($d);
							//$d.insertBefore( $button );
						}
					}else{
						var oldH = $target.height();
						if( inLB ){
							if( $filter ){ $target.empty(); }
							$target.append($d);
						}else{
							$target.append($d);
							//$d.insertBefore( $button );
						}
						var newH = $target.height();
						$target.height(oldH);
						$target.velocity({height:newH}, speed.loadmore, function(){
							$target.css('height','auto');
							$button.removeClass('bussy');
						});
					}
					
					if( isSearch ){
						if( !sFilter ){sFilter = new searchFilter();}
						sFilter.afterLoadmore($d);
					}
					
					//if( !inLB ){
						image_partload( $d );
						check_video_wrap();
						//image_defaultload( '.art', '.new' );
					//}
					//check if loadmore needs removin
					if( inLB ){
						//alert( $d.filter('.toc-link').length );
						var cnt = isSearch ? 10 : 5;
						if( $d.filter(itmcls).length < cnt ){
							$button.velocity("slideUp", speed.loadmore, function(){
								if( $filter || filterType){
									$button.hide();
								}else{
									$button.remove();
								}
							});
						}else{
							if( $filter || filterType ){
								$button.removeClass('hidden').show();
							}
						}
						if( $filter ){ filter_stop(); }
						tdcn_engage();
					}
					//console.log( 'success: ' + filterbussy );
				}else{
					fail(d, true);
				}
			}
			//alert('check3');
			if( !$filter ){
				$button.addClass('bussy');
			}
			DoLBAjax( { url:url, data:data, callback:{success:success, fail:fail} } );
		}else{
			
		}
		//get target?
	};

/* AJAX  */

	function ajaxlist_check( $target, cls ){ //collection?
	//cls = .almulti of .alnormal
	console.log('check ajaxlist');
	//alert( $target.find('.ajaxlist' + cls).length );
		$target.find('.ajaxlist' + cls).each(function(index, element) {
            var datar = $(this).children('.ajaxdata').html();
			//console.log(datar);
			//console.log('parse1 ' + cls);
			//console.log( datar );
			var data = {};//$.parseJSON(datar);
			//console.log('parse2');
			data.datar = datar;
			data.callback = {success : function(){ tcfs_engage();tdcn_engage();/*console.log('after ajaxlist load');*/}};
			//data = JSON.parse(data);
			DoLBAjaxPost( data, $(this) );
        });
	}

	function DoLBAjaxPost( data, $alist  ){	//loadmore
		data.action = 'loadlist';
		//console.log( data );
		var params = {
			data : data,
			url : '/inc/lightbox.php',
			type : 'GET',
			dataType: 'html',
			callback: {fail: false, success: false, always: false}
		}
		
		//$.extend( params, args ); 

		var ajaxvars = { type: params.type, url: params.url, data: data, dataType: params.dataType };
		
		//return;
		$.ajax( ajaxvars )
		.done(function( d, t, jq) {
			var $d=$(d);
			$d.insertBefore($alist);
			$alist.remove();
			image_partload( $d );
			check_video_wrap();
			//alert('success ' + d);	
			if( params.callback.success ){
				params.callback.success(d);
			}
			
		})
		.fail(function( jq, t, e ) {
			//alert("error: " + t + ', ' + e );
			$alist.remove();
			if( params.callback.fail ){
				params.callback.fail(d);
			}
		})//
		.always(function() {
			if( params.callback.always ){
				params.callback.always(d);
			}
		});	
	}
	
	function DoLBAjax( args ){	//loadmore
		
		var params = {
			data : {},
			url : '/inc/lightbox.php',
			type : 'GET',
			dataType: 'html',
			callback: {fail: false, success: false, always: false}
		}
		
		$.extend( params, args ); 

		var ajaxvars = { type: params.type, url: params.url, data: params.data, dataType: params.dataType };
		
		//return;
		$.ajax( ajaxvars )
		.done(function( d, t, jq) {
			//alert('success ' + d);	
			if( params.callback.success ){
				params.callback.success(d);
			}
		})
		.fail(function( jq, t, e ) {
			//alert("error: " + t + ', ' + e );
			if( params.callback.fail ){
				params.callback.fail(d, false);
			}
		})//
		.always(function() {
			if( params.callback.always ){
				params.callback.always(d);
			}
		});	
	}
	

/****** SCT8 GENERAL FUNCTIONS  *******************************************************************************/

/*  KEYBOARD NAV  */
	
	$(document).on("keyup", function(e) {				
	
		if ( e == null ) {// To ie
			keycode = event.keyCode;
			escapeKey = 27;
		} else {// To Mozilla
			keycode = e.keyCode;
			escapeKey = e.DOM_VK_ESCAPE;
		}
	
		// Get the key in lower case form
		key = String.fromCharCode(keycode).toLowerCase();
	
		// esc key
		if ( ( key == 'x' ) || ( keycode == 27 ) ) {
			CloseLB();
		}
		// up arrow
		if (( keycode == 38 )) {
			//$('.msk').velocity( {opacity:0.8}, { duration: speed.mask  } );
			//e.preventDefault();
			//return false;
		}
		// down arrow
		if (( keycode == 40 )) {
			//$('.msk').velocity( {opacity:0}, { duration: speed.mask  } );
			//e.preventDefault();
			//return false;
		}
		// right arrow
		if (( keycode == 39 )) {
			//history_push( 'kaas' );
			//history_back();
			e.preventDefault();
			return false;
			
		}
		
		// left arrow
		if (( keycode == 37 )) {
			//$('#cw1').mCustomScrollbar("scrollTo",300);
			//DoLBAjaxPost( {} );
			e.preventDefault();
			return false;
		}
		
		if (( keycode == 49 )) {
			//$('body').toggleClass('demi');
			e.preventDefault();
			return false;
		}
	})


/* SCROLLTO */

	$(document).on('click', ".qlinks li.disabled", function(e) {	
		scrollto_top_lb();
	});
	
	function scrollto_top_lb(){
		scrollto_top_el($('#lb-content'));
	}
	
	function scrollto_top_el($el){
		$($el).velocity("scroll", { duration: speed.scrollto, mobileHA: false });
	}
	
/* ANALYTICS */
			
	function ga_pageview( path ){
		_gaq.push(['_trackPageview', path]);
	}

/*  HISTORY  */
	
	function EngageHistory(){
		window.addEventListener("popstate", function(e) {
			//alert(location.search);
			history_pop( location.pathname, location.search );
		});
	}
	
	function history_pop( path, srch ){
		//path, srch
		//alert( 'pop:'+path);
		//check for s=blabla
		if( !useLB ){return false;}
		if( srch && srch.indexOf("s=") > -1){	
			var q = srch.replace('?s=','');//regex? tot volgende &?
			//alert(q);
			openlbsearch( path+srch, q );
		}else{
			if( path == '/' || path == '/en/' ){
				// || path == '/en/'
				if( lightbox ){
					lightbox.closeLightbox();
				}
				window.title = $('#mainptitle').text();
				document.title = $('#mainptitle').text();
			}else{
				openlbpath( path );
				//
			}
		}
	}
	
	function history_push( path ){
		if( !sitesettings.usehistory ){return false;}
		
		if( path == '/'){
			if( sitesettings.language == 'en' ){
				path += 'en/'
			}
			window.title = $('#mainptitle').text();
			document.title = $('#mainptitle').text();
		}
		history.pushState( null, null, path );
		//alert( 'push:'+path);
	}
	
	function history_back(){
		window.history.back();
	}	

/* INNER LINKS */

	$(document).on('click','.artb a', function(e){
		//! niets als het een link naar een programma pagina is (dus eigenlijk nooit)
		var href = $(this).attr('href');
		var parts = href.split('/');
		var first = href.substring(0, 4);
		//alert(first); 
		if( first == '/nl/' || first == '/en/' ){
			//alert( parts[0] + ' - ' + parts[1] + ' - ' + parts[2] );
			var second = href.substring(3, 7);
			if( second == '/nl/' || second == '/en/' ){
				href = href.substring(3);
			}
			openlbpath( href );
			e.preventDefault();
		}	
	});
	
	$(document).on('click','a.langlink', function(e){
		e.stopPropagation();
	});

})(jQuery);//sandbox end

function pxToInt( px ){return parseInt( px.replace('px','') );}

;(function($, window, document, undefined) {

	var Stickfit = function(elem, options) {
		this.elem = elem;
		this.$elem = $(elem);
		this.options = options;
		this.metadata = this.$elem.data("stickfit-options");
		this.$win = $(window);
	};

	Stickfit.prototype = {
		defaults: {
			item: '.stickfit',
			container: '.stickfit-container',
			stickTopClass: 'sticktop',
			stickBotClass: 'stickbot',
			offset: 0,
			onStickTop: null,
			onStickBot: null,
			paused: 	false
		},
		
		removeTopAtt : function(_itm){
			var stl = _itm.$elem.attr('style')
			if( stl ){
				stl = stl.replace(/top\:([^"]*?)\;/,"")
				_itm.$elem.attr('style',stl); 
			}
		},

		init: function() {
			var _self = this;
			
			_self.scrollData = {last: -1,dir: 1}

			_self.config = $.extend({}, _self.defaults, _self.options, _self.metadata);
			
			_self.config.allClasses = _self.config.stickTopClass + ' ' + _self.config.stickBotClass
			_self.setWindowHeight();
			_self.getItems();
			_self.bindEvents();
			
			_self.$elem.data('stickfit',_self);
			_self.handleScroll();
			return _self;
		},

		bindEvents: function() {
			var _self = this;
			_self.$win.on('scroll.stickfit', $.proxy(_self.handleScroll, _self));
			_self.$win.on('resize.stickfit', $.proxy(_self.handleResize, _self));
		},

		destroy: function() {
			var _self = this;
			_self.$win.off('scroll.stickfit');
			_self.$win.off('resize.stickfit');
		},

		getItem: function(index, element) {
			
			var _self = this;
			var $this = $(element);
			//console.log( $this.attr('id') );
			//console.log( $this );
			var item = {
				$elem: $this,
				elemHeight: $this.outerHeight( true ),
				$container: $this.parents(_self.config.container),
				isFitting: false,
				stickTop: false,
				stickBot: false,
				mTop: $this.css('margin-top') ? parseInt( $this.css('margin-top').replace('px','') ) : 0,
				mBot: $this.css('margin-bottom') ? parseInt( $this.css('margin-bottom').replace('px','') ) : 0,
			};
			
			$this.css({top:'',bottom:''});
			$this.removeClass(_self.config.allClasses);

			//If the element is smaller than the window
			//console.log( item.$elem.attr('id') + ': wh=' + _self.windowHeight + ',ih='+item.elemHeight);
			if(_self.windowHeight > item.elemHeight) {
				//console.log( item.$elem.attr('id') + ':isFitting');
				item.isFitting = true;
				item.stickTop = true;
				item.$elem.addClass( _self.config.stickTopClass );
			}

			_self.items.push(item);
		},

		getItems: function() {
			var _self = this;
			_self.items = [];
			_self.$elem.find(_self.config.item).each($.proxy(_self.getItem, _self));
		},

		handleResize: function() {
			var _self = this;
			_self.getItems();
			_self.setWindowHeight();
			//handlescroll?
		},

		handleScroll: function( forced ) {
			
			var _self = this;
			
			if(_self.items.length > 0) {
				var pos = _self.$win.scrollTop();
				
				_self.scrollData.dir = (_self.$win.scrollTop() - _self.scrollData.last) < 0 ? -1 : 1;
				_self.scrollData.last = _self.$win.scrollTop();
		
				var scrBot = _self.$win.scrollTop() + _self.windowHeight;

				for(var i = 0, len = _self.items.length; i < len; i++) {
					var item = _self.items[i];
					if( !item.isFitting ){
						var itmTop = item.$elem.offset().top - item.mTop;
						var itmBot = itmTop + item.elemHeight;
						
						if( _self.scrollData.dir > 0 ){
							if( item.stickTop ){//cancel sticktop
								item.stickTop = false;
								item.$elem.removeClass( _self.config.stickTopClass ).css({top:itmTop,bottom:''});
							}else{	
								if( !item.stickBot && itmBot < scrBot ){//activate stickbot
									item.stickBot = true;
									item.$elem.css({top:'',bottom:''}).addClass( _self.config.stickBotClass );
								}
							}
						}
						
						if( _self.scrollData.dir < 0 ){
							if( item.stickBot ){//cancel stickbot
								item.stickBot = false;
								item.$elem.removeClass( _self.config.stickBotClass ).css({top:itmTop,bottom:''});
							}else{
								if( !item.stickTop && itmTop > pos ){//activate sticktop
									item.stickTop = true;
									item.$elem.css({top:'',bottom:''}).addClass( _self.config.stickTopClass );
								}
								
							}
						}
					}
				}
			}
		},

		setWindowHeight: function() {
			var _self = this;
			_self.windowHeight = _self.$win.height() - _self.config.offset;
		},
		
		update: function( toAdd ) {	
			var _self = this;
			//console.log('update:' +_self.config.container );
			if( toAdd ){ _self.config.offset += toAdd; }
			_self.getItems();
			_self.setWindowHeight();
			_self.handleScroll();			
		},
		
		pause: function(){
			var _self = this;
			_self.config.paused = true;
		},
		
		unpause: function(){
			var _self = this;
			_self.config.paused = false;
		}
		
	};

	Stickfit.defaults = Stickfit.prototype.defaults;

	$.fn.stickfit = function(options) {
		//Create a destroy method so that you can kill it and call it again.
		this.destroy = function() {
			this.each(function() {
				new Stickfit(this, options).destroy();
			});
		};
		
		this.update = function( toAdd ){
			this.each(function() {
				$(this).data('stickfit').update( toAdd );
			});
		}
		
		this.pause = function(){
			this.each(function() {
				$(this).data('stickfit').pause();
			});
		}
		this.unpause = function(){
			this.each(function() {
				$(this).data('stickfit').unpause();
			});
		}
		return this.each(function() {
			new Stickfit(this, options).init();
		});
	};

})(jQuery, window , document);
		
		
/* real stickem */
;(function($, window, document, undefined) {

	var Stickem = function(elem, options) {
		this.elem = elem;
		this.$elem = $(elem);
		this.options = options;
		this.metadata = this.$elem.data("stickem-options");
		this.$win = $(window);
	};

	Stickem.prototype = {
		defaults: {
			item: '.stickem',
			container: '.stickem-container',
			stickClass: 'stickit',
			endStickClass: 'stickit-end',
			offset: 0,
			start: 0,
			onStick: null,
			onUnstick: null,
			onUnstickTop: null,
			stickTop: false,		//false, int or 'offset'
			stickTopVal:	0,
			endTop:		false,
			endTopVal: 	0,
			paused: 	false
		},
		
		removeTopAtt : function(_itm){
			var stl = _itm.$elem.attr('style')
			if( stl ){
				stl = stl.replace(/top\:([^"]*?)\;/,"")
				_itm.$elem.attr('style',stl); 
			}
		},

		init: function() {
			var _self = this;

			//Merge options
			_self.config = $.extend({}, _self.defaults, _self.options, _self.metadata);
			
			if( _self.config.stickTop == 'offset'){ _self.config.stickTopVal = _self.config.offset;};
			if( _self.config.endTop == 'offset'){ _self.config.endTopVal = _self.config.offset;};
			
			_self.setWindowHeight();
			_self.getItems();
			_self.bindEvents();
			
			_self.$elem.data('stickem',_self);
			_self.handleScroll();
			return _self;
		},

		bindEvents: function() {
			var _self = this;

			_self.$win.on('scroll.stickem', $.proxy(_self.handleScroll, _self));
			_self.$win.on('resize.stickem', $.proxy(_self.handleResize, _self));
		},

		destroy: function() {
			var _self = this;

			_self.$win.off('scroll.stickem');
			_self.$win.off('resize.stickem');
		},

		getItem: function(index, element) {
			var _self = this;
			var $this = $(element);
			var item = {
				$elem: $this,
				elemHeight: $this.height(),
				$container: $this.parents(_self.config.container),
				isStuck: false
			};
			
			$this.css({top:'',bottom:'',left:''});
			$this.removeClass(_self.config.stickClass + ' ' + _self.config.endStickClass);
			
			//console.log( 'class:' + item.$container.attr('class'));
			if( item.$container.hasClass('active') ){ 
				//If the element is smaller than the window
				if(_self.windowHeight > item.elemHeight) {
					item.containerHeight = item.$container.outerHeight();
					item.containerInner = {
						border: {
							bottom: parseInt(item.$container.css('border-bottom'), 10) || 0,
							top: parseInt(item.$container.css('border-top'), 10) || 0
						},
						padding: {
							bottom: parseInt(item.$container.css('padding-bottom'), 10) || 0,
							top: parseInt(item.$container.css('padding-top'), 10) || 0
						}
					};
					item.containerRight = (item.$container.offset().left + item.$container.outerWidth(true)) - item.$elem.width();
					//console.log( item.containerRight );
					item.containerInnerHeight = item.$container.height();
					item.containerStart = item.$container.offset().top - _self.config.offset + _self.config.start + item.containerInner.padding.top + item.containerInner.border.top;
					//console.log( 'cs:' + item.$container.attr('id') + ' - ' + $(window).scrollTop() + ' - ' + item.containerStart );
					item.scrollFinish = item.containerStart - _self.config.start + (item.containerInnerHeight - item.elemHeight);
					item.scrollFinish += (item.containerInner.padding.bottom -20);
					//If the element is smaller than the container
					if(item.containerInnerHeight > item.elemHeight) {
						_self.items.push(item);
						
					}
				} else {
					item.$elem.removeClass(_self.config.stickClass + ' ' + _self.config.endStickClass);
				}
			}
		},

		getItems: function() {
			var _self = this;

			_self.items = [];

			_self.$elem.find(_self.config.item).each($.proxy(_self.getItem, _self));
			//console.log( 'items:' + _self.items.length );
		},

		handleResize: function() {
			var _self = this;

			_self.getItems();
			_self.setWindowHeight();
		},

		handleScroll: function( forced ) {
			var _self = this;
			
			if(_self.items.length > 0) {
				var pos = _self.$win.scrollTop();

				for(var i = 0, len = _self.items.length; i < len; i++) {
					var item = _self.items[i];

					//If it's stuck, and we need to unstick it, or if the page loads below it
					if((item.isStuck && (pos < item.containerStart || pos > item.scrollFinish)) || pos > item.scrollFinish) {
						item.$elem.removeClass(_self.config.stickClass);
						item.$elem.css('left', '');
						//console.log('removed');
						item.isStuck = false;

						//only at the bottom
						var top = false;
						if(pos > item.scrollFinish) {
							item.$elem.addClass(_self.config.endStickClass);
							item.$elem.css('left', '');
							if( _self.config.endTop ){ 
								//console.log('added:' + _self.config.endTop + ', con:' +_self.config.container );
								item.$elem.css('top', _self.config.endTopVal);
								//console.log('added end con:' +_self.config.container );
							}else{
								_self.removeTopAtt(item);
								//item.$elem.removeAttr('style');/*console.log('remove3');*/;
							}
						}else{
							var top = true;
							if( _self.config.stickTop ){
								_self.removeTopAtt(item);
								//item.$elem.removeAttr('style');/*console.log('remove2');*/
							}
						}

						//if supplied fire the onUnstick callback
						if(_self.config.onUnstick) {
							_self.config.onUnstick(item, top);
						}

					//If we need to stick it
					} else if(item.isStuck === false && pos > item.containerStart && pos < item.scrollFinish) {
							item.$elem.removeClass(_self.config.endStickClass).addClass(_self.config.stickClass);
							item.isStuck = true;
							item.$elem.css('left', item.containerRight);
							//console.log( item.containerRight );
							
							if( _self.config.endTop ){
								_self.removeTopAtt(item);
								//item.$elem.removeAttr('style');/*console.log('remove');*/
							}
							if( _self.config.stickTop ){
								item.$elem.css('top', _self.config.stickTopVal);
								//console.log('added self con:' +_self.config.container );
								//console.log('added:' + _self.config.endTop + ', con:' +_self.config.container );
							}
							//if supplied fire the onStick callback
							if(_self.config.onStick) {
								_self.config.onStick(item);
							}
					}else{
						
					}
				}
			}
		},

		setWindowHeight: function() {
			var _self = this;

			_self.windowHeight = _self.$win.height() - _self.config.offset;
		},
		
		updateOffset: function( toAdd ) {
			
			var _self = this;
			//console.log('update:' +_self.config.container );
			_self.config.offset += toAdd;
			if( _self.config.stickTop == 'offset'){ _self.config.stickTopVal = _self.config.offset;};
			if( _self.config.endTop == 'offset'){ _self.config.endTopVal = _self.config.offset;};
			_self.getItems();
			_self.setWindowHeight();
			_self.handleScroll();			
		},
		
		pause: function(){
			var _self = this;
			_self.config.paused = true;
		},
		
		unpause: function(){
			var _self = this;
			_self.config.paused = false;
		}
		
	};

	Stickem.defaults = Stickem.prototype.defaults;

	$.fn.stickem = function(options) {
		//Create a destroy method so that you can kill it and call it again.
		this.destroy = function() {
			this.each(function() {
				new Stickem(this, options).destroy();
			});
		};
		
		this.updateOffset = function( toAdd ){
			this.each(function() {
				//console.log( $(this) );
				$(this).data('stickem').updateOffset( toAdd );
			});
		}
		
		this.pause = function(){
			this.each(function() {
				//console.log( $(this) );
				$(this).data('stickem').pause();
			});
		}
		this.unpause = function(){
			this.each(function() {
				//console.log( $(this) );
				$(this).data('stickem').unpause();
			});
		}
		return this.each(function() {
			new Stickem(this, options).init();
		});
	};

})(jQuery, window , document);


/* reversed stickem */

;(function($, window, document, undefined) {

	var Rstickem = function(elem, options) {
		this.elem = elem;
		this.$elem = $(elem);
		this.options = options;
		this.metadata = this.$elem.data("rstickem-options");
		this.$win = $(window);
	};

	Rstickem.prototype = {
		defaults: {
			item: '.rstickem',
			container: '.rstickem-container',
			stickClass: 'stickit',
			endStickClass: 'stickit-end',
			endTopStickClass: 'stickit-endtop',
			offset: 0,
			offsetLeft: 17,
			start: 0,
			onStick: null,
			onUnstick: null,
			onUnstickTop: null,
			stickTop: false,		//false, int or 'offset'
			stickTopVal:	0,
			endTop:		false,
			endTopVal: 	0,
			paused: 	false
		},
		
		removeTopAtt : function(_itm){
			var stl = _itm.$elem.attr('style')
			if( stl ){
				stl = stl.replace(/top\:([^"]*?)\;/,"")
				_itm.$elem.attr('style',stl); 
			}
		},

		init: function() {
			var _self = this;

			//Merge options
			_self.config = $.extend({}, _self.defaults, _self.options, _self.metadata);
			
			if( _self.config.stickTop == 'offset'){ _self.config.stickTopVal = _self.config.offset;};
			if( _self.config.endTop == 'offset'){ _self.config.endTopVal = _self.config.offset;};
			
			_self.setWindowHeight();
			_self.getItems();
			_self.bindEvents();
			
			_self.$elem.data('rstickem',_self);
//			console.log( _self.$elem.attr('id') );
//			console.log( _self.$elem.data('rstickem') );
			_self.handleScroll();
			return _self;
		},

		bindEvents: function() {
			var _self = this;

			_self.$win.on('scroll.rstickem', $.proxy(_self.handleScroll, _self));
			_self.$win.on('resize.rstickem', $.proxy(_self.handleResize, _self));
		},
		
		destroyItems: function(){
			var _self = this;
			if(_self.items.length > 0) {
				for(var i = 0, len = _self.items.length; i < len; i++) {
					var item = _self.items[i];
					item.$elem.css({top:'',bottom:'',left:''});
					item.$elem.removeClass(_self.config.stickClass + ' ' + _self.config.endStickClass + ' ' + _self.config.endTopStickClass);
				}
			}
		},

		destroy: function() {
			var _self = this;
			_self.destroyItems();
			_self.$win.off('scroll.rstickem');
			_self.$win.off('resize.rstickem');
		},

		getItem: function(index, element) {
			var _self = this;
			var $this = $(element);
			var item = {
				$elem: $this,
				elemHeight: $this.height(),
				$container: $this.parents(_self.config.container),
				isStuck: false
			};
			
			$this.css({top:'',bottom:''/*,left:''*/});
			$this.removeClass(_self.config.stickClass + ' ' + _self.config.endStickClass + ' ' + _self.config.endTopStickClass);
			
			var bOffset = item.$container.hasClass('liart') ? 75 : 0;
			
			//console.log( 'class:' + item.$container.attr('class'));
			if( item.$elem.parents('.active').length > 0 || item.$container.hasClass('siart') ){ 
			//
				//If the element is smaller than the window
				if(_self.windowHeight > item.elemHeight) {
					item.containerHeight = item.$container.outerHeight();
					item.containerInner = {
						border: {
							bottom: parseInt(item.$container.css('border-bottom'), 10) || 0,
							top: parseInt(item.$container.css('border-top'), 10) || 0
						},
						padding: {
							bottom: parseInt(item.$container.css('padding-bottom'), 10) || 0,
							top: parseInt(item.$container.css('padding-top'), 10) || 0
						}
					};
					var xtra = item.$elem.offset().top - _self.$win.scrollTop();;
					item.containerRightRel = (item.$container.outerWidth(true)) + 17;// rev- item.$elem.width();
					item.containerRight = item.containerRightRel + item.$container.offset().left;// rev- item.$elem.width();
					//console.log( item.containerRight );
					item.containerInnerHeight = item.$container.height();
					item.containerStart = item.$container.offset().top - _self.config.offset + _self.config.start;/* + item.containerInner.padding.top + item.containerInner.border.top*/;
					item.containerStart -= xtra;
					
					item.containerStart = item.$container.offset().top - xtra;
					
					//console.log( 'cs:' + item.$container.attr('id') + ' - ' + $(window).scrollTop() + ' - ' + item.containerStart );
					item.scrollFinish = item.containerStart - _self.config.start + (item.containerInnerHeight)// - item.elemHeight);//rev
					item.scrollFinish += _self.config.offset;
					item.scrollFinish += xtra + (item.containerInner.padding.bottom)+17;
					item.scrollFinish -= bOffset;
					
					//rev
					item.scrollFinish -= _self.$win.height();
					//If the element is smaller than the container
					//console.log( item.containerInnerHeight );
					if(item.containerInnerHeight > item.elemHeight) {
						_self.items.push(item);
					}
				} else {
					item.$elem.removeClass(_self.config.stickClass + ' ' + _self.config.endStickClass);
				}
			}
		},

		getItems: function() {
			var _self = this;

			_self.items = [];

			_self.$elem.find(_self.config.item).each($.proxy(_self.getItem, _self));
			//console.log( 'items:' + _self.items.length );
		},

		handleResize: function() {
			var _self = this;

			_self.getItems();
			_self.setWindowHeight();
		},

		handleScroll: function( forced ) {
			var _self = this;
			
			if(_self.items.length > 0) {
				
				var pos = _self.$win.scrollTop();

				for(var i = 0, len = _self.items.length; i < len; i++) {
					var item = _self.items[i];
					//console.log('jaaaaaaa');
					//If it's stuck, and we need to unstick it, or if the page loads below it
					if((item.isStuck && (pos < item.containerStart || pos > item.scrollFinish)) || pos > item.scrollFinish) {
						item.$elem.removeClass(_self.config.stickClass);
						//item.$elem.css('left', '');
						//console.log('removed');
						item.isStuck = false;

						//only at the bottom
						var top = false;
						if(pos > item.scrollFinish) {
							item.$elem.removeClass(_self.config.endTopStickClass);
							item.$elem.addClass(_self.config.endStickClass);
							item.$elem.css('left', item.containerRightRel );
							if( _self.config.endTop ){ 
								//console.log('added:' + _self.config.endTop + ', con:' +_self.config.container );
								item.$elem.css('top', _self.config.endTopVal);
								//console.log('added end con:' +_self.config.container );
							}else{
								_self.removeTopAtt(item);
								//item.$elem.removeAttr('style');/*console.log('remove3');*/;
							}
						}else{
							var top = true;
							item.$elem.removeClass(_self.config.endStickClass);
							item.$elem.addClass(_self.config.endTopStickClass);
							item.$elem.css('left', item.containerRightRel );
							if( _self.config.stickTop ){
								_self.removeTopAtt(item);
								//item.$elem.removeAttr('style');/*console.log('remove2');*/
							}
						}

						//if supplied fire the onUnstick callback
						if(_self.config.onUnstick) {
							_self.config.onUnstick(item, top);
						}

					//If we need to stick it
					} else if(item.isStuck === false && pos > item.containerStart && pos < item.scrollFinish) {
							item.$elem.removeClass(_self.config.endTopStickClass);
							item.$elem.removeClass(_self.config.endStickClass).addClass(_self.config.stickClass);
							item.isStuck = true;
							item.$elem.css('left', item.containerRight);
							//console.log( item.containerRight );
							
							if( _self.config.endTop ){
								_self.removeTopAtt(item);
								//item.$elem.removeAttr('style');/*console.log('remove');*/
							}
							if( _self.config.stickTop ){
								item.$elem.css('top', _self.config.stickTopVal);
								//console.log('added self con:' +_self.config.container );
								//console.log('added:' + _self.config.endTop + ', con:' +_self.config.container );
							}
							//if supplied fire the onStick callback
							if(_self.config.onStick) {
								_self.config.onStick(item);
							}
					}else{
						
					}
				}
			}
		},

		setWindowHeight: function() {
			var _self = this;

			_self.windowHeight = _self.$win.height() - _self.config.offset;
		},
		
		updateOffset: function( toAdd ) {
			
			var _self = this;
			//console.log('update:' +_self.config.container );
			_self.config.offset += toAdd;
			if( _self.config.stickTop == 'offset'){ _self.config.stickTopVal = _self.config.offset;};
			if( _self.config.endTop == 'offset'){ _self.config.endTopVal = _self.config.offset;};
			_self.getItems();
			_self.setWindowHeight();
			_self.handleScroll();			
		},
		
		pause: function(){
			var _self = this;
			_self.config.paused = true;
		},
		
		unpause: function(){
			var _self = this;
			_self.config.paused = false;
		}
		
	};

	Rstickem.defaults = Rstickem.prototype.defaults;

	$.fn.rstickem = function(options) {
		//Create a destroy method so that you can kill it and call it again.
		this.destroy = function() {
			
			this.each(function() {
				//new Rstickem(this, options).destroy();
				//console.log(  $(this).attr('id') );
				//console.log( $(this).length );
				//if( $(this).data('rstickem') ){
				$(this).data('rstickem').destroy();
				//}
			});
		};
		
		this.updateOffset = function( toAdd ){
			this.each(function() {
				//console.log( $(this) );
				$(this).data('rstickem').updateOffset( toAdd );
			});
		}
		
		this.pause = function(){
			this.each(function() {
				//console.log( $(this) );
				$(this).data('rstickem').pause();
			});
		}
		this.unpause = function(){
			this.each(function() {
				//console.log( $(this) );
				$(this).data('rstickem').unpause();
			});
		}
		return this.each(function() {
			new Rstickem(this, options).init();
		});
	};

})(jQuery, window , document);