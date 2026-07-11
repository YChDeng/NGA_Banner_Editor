/*
========================
FOR NGACN ONLY
------------
(c) 2005 Zeg All Rights Reserved
========================
论坛通用函数 v1.00
written by zeg 2006-4-27
========================
*/

//============================
//即刻执行=====================
if(!window.__APPEMBED || __SETTING.uA.appHa){

//小屏幕隐藏顶部菜单 / 上拉翻页
;(function(){
if(location.pathname!='/read.php' && location.pathname!='/thread.php')return

var t = __NUKE.cpblName(document.getElementsByTagName('head')[0].style,'transition',3)
, x, y = __NUKE.position.get, p=false, j=0, c = commonui, prog = null,flr,fcd=0,mM,q=0
, m=[20,70,0.3,0.0]
,z = function(e){
	x = y(e)
	if(x.ph-x.yf-x.ch<10 && (e.detail>0 || e.wheelDelta<0)){//屏幕下端向上
		if(flr)
			clearTimeout(flr)
		j+=(x.ch>>7)+(x.ch>>8)
		if(prog){
				requestAnimationFrame(function(){
					if(prog._h != j){
						prog._h = j
						prog.style.height=j>0 ? (j+'px') : '0'
						}
					})
			if(j>=(x.ch>>3)){
				f()
				setTimeout(fcl,500)
				}
			else
				flr = setTimeout(fcl,500)
			}
		}
	else if(e.detail<0 || e.wheelDelta>0){
		fcl()
		}
	}
,l,v,s
,w = function(e){
	if(p===false)
		return
	if(e.timeStamp-q < m[0])
		return
	x = y(e)
	l = x.cy-p
	p=x.cy
	q=e.timeStamp
	if(l<0 && x.ph-x.yf-window.innerHeight<5){
		j+=(-l)>>1
		if(j/(e.timeStamp-s)>vv)
			fcl()
		else{
			if(prog){
				requestAnimationFrame(function(){
					if(prog._h != j){
						prog._h = j
						prog.style.height=j>0 ? (j+'px') : '0'
						}
					})
				if(j>=ll){
					f()
					p=false
					}
				}
			}
		}
	else if(l>=0)
		fcl()
	}
,ll,vv,c0=__COLOR.bg0, c1=__COLOR.postUiElm
,u = function(e){
	x = y(e)
	ll = x.ch>>3
	vv = ll/m[1]
	p = x.cy
	s = q = e.timeStamp
	}
,f = function(){
	prog.firstChild.style.fill = c1
	if(c.pageBtn.continueNext && !fcd){
		fcd = 1
		setTimeout(function(){fcd=0},3000)
		c.pageBtn.continueNext()
		}
	}
,fcl = function(){
	//console.log('cancel')
	j=0
	p=false
	if(prog){
		requestAnimationFrame(function(){
				prog._h = 0
				prog.style.height='0'
				prog.firstChild.style.fill = c0
			})
		}
	}
;
__SETTING.pullPagerSetting = m
if((__SETTING.bit & __SETTING.bits.noTopBg) && location.pathname=='/read.php'){
	mM = 1
	__NUKE.addCss('#mainmenu {margin-top:-45px; '+(t?t[0]+':margin-top '+m[2]+'s linear 0s,'+m[3]+'s':'')+' }')
	}
c.aE(window,'touchend',fcl)
c.aE(window,'touchstart',u)
c.aE(window,'touchmove',w)
c.aE(window,'mousewheel',z)
commonui.aE(window,'DOMContentLoaded',function(){
	prog =_$('/div','_h',0,'style','position:fixed;bottom:-0.1em;height:0;width:100%;'+(t[0]?(t[0]+':height '+m[2]+'s linear 0s,'+m[3]+'s'):''),'innerHTML','<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="100%" height="100%" preserveAspectRatio="none" style="fill:'+__COLOR.bg0+'"><path d="m0 50c0 0 12-26 20-35.4 7.9-9.3 16.7-14.6 30-14.6 13.3 0 22.1 5.3 30 14.6 8 9.4 20 35.4 20 35.4z"/></svg>')
	document.body.appendChild(prog)
	if(mM && $('mainmenu'))
		$('mainmenu').$0('onmousedown',function(){this.style.marginTop=0})
	})
})();

//do sth from hash============
commonui.hashAction = function(){
var ha
if(location.hash)
	ha = location.hash
else if(commonui.checkIfInIframe()){
	if(location.search.indexOf('to=1')>-1){
		if(ha = location.search.match(/pid=(\d+)/))
			ha = '#pid'+ha[1]+'Anchor'
		else
			ha = ''
		}
	}

var c=commonui, m = location.hash.match(/^#pid(\d+)Anchor$/)
if(m){
	var x=$(m[0].substr(1))
	if(x)
		commonui.highLightReply(x)
	scroll(0,x.getBoundingClientRect().top)
	return
	}

var m = location.hash.match(/^#do:(item|ifr)(?::(.+))?$/)
if(!m)return
switch(m[1]){
	case 'item':
		var tmp = function(){
			if(m[2]=='codeui')
				c.userItem.codeUi()
			else if(m[2]=='codeanduseui')
				c.userItem.codeUi(true)
			else if(n=m[2].match(/list(?::(.+))?$/)){
				if(n[1])
					c.userItem.list(1,0,0,n[2])
				else
					c.userItem.list()
				}
			}
		if(c.userItem)
			tmp()
		else
			loader.script(__SCRIPTS.userItem,function(){tmp()} )
		break;
	//case 'ifr':
	//	if(window.iframeRead)
	//		iframeRead.initGoUrl=m[2]
	//	else
	//		location.replace(m[2])
	//	break
	}
}//fe
if(location.hash || commonui.checkIfInIframe())
	commonui.aE(window,'DOMContentLoaded',commonui.hashAction);//aE


//全屏中专广告==================
commonui.insAdsChk = function(url){
	if(ngaAds && ngaAds.ignore())
		return
var l=location
if(l.host=='bbs.ngacn.cc')
	l.replace(l.protocol+'//'+'bbs.nga.cn'+l.pathname+l.search+l.hash)

if(l.pathname!='/' && l.pathname!='/thread.php' && l.pathname!='/read.php')
	return

if(!window.__LOAD_BBS_DS_12 || __SETTING.uA[6]==2)
	return

if(window.__GP){
	if(__GP.greater || (__GP._bit & 4194304))
		return
	}

var C = __COOKIE,v = C.getMiscCookie('insad_views')|0, c = C.getMiscCookie('pv_count_for_insad'),d = new Date
d = (24-d.getHours())*3600 + (60-d.getMinutes())*60 + d.getSeconds()
commonui.insAdsChk.current = c
if(c===null){
	C.setMiscCookieInSecond('pv_count_for_insad',0,d)
	C.setMiscCookieInSecond('insad_views',0,d)
	c=0
	}
c|=0
if(c>0){
	v++
	if(v>4)
		v=1
	C.setMiscCookieInSecond('insad_views',v,d)
	C.setMiscCookieInSecond("pv_count_for_insad",0-v*v*48,d)
	if(ngaAds.readCache('bbs_ads12')){
		var u = url ? url : location.href
		setTimeout(function(){l.replace( l.protocol+'//'+l.host+'/misc/adpage_insert_2.html?'+u )});
		return true
		}
	else
		console.log('no insert ad, skip')
	}
else if(c>-1){
	try{
		__SCRIPTS.asyncLoad(ngaAds.scriptKey('bbs_ads12'),2)
		}
	catch(e){
		
		}
	}
	
/*
(function(){
var x=0,j=false,y=''
for(var i=0;i<10000;i++){
if(j===false){j=0
	continue}
if(j>0){x++
	if(x>4)
		x=1
	j=0-x*x*48
	y+=i+','}
j++}
console.log(y)
})()
 */
}//fe
commonui.insAdsChk()


//commonui.checkIfInIframe =function(){return commonui.checkIfInIframe.check};

//防止滚轮影响父页面============

;(function (){

var e = null,c=commonui,g,h,m,vgg,vg,vc,bs=true
,d = function(){
	if(e==0)return
	e=0
	bs.position=bs.overflowY=bs.top =bs.width=g.style.marginTop=document.body.parentNode.style.overflowY=''
	if(vg)
		vg.style.marginTop = vgg.style.marginTop = vc.style.marginTop = ''
	scrollTo(m,h)
	}
;

c.crossDomainCall.setCallBack('iframeReadNoScrollInit', function(){
	if(e!==null)return
	e=0
	g = $('minWidthSpacer')
	vgg = $('videobgbg')
	vg= $('videobg')
	vc= $('videobgcover')
	c.aE(window,'mouseover',d)
	c.aE(window,'touchstart',d)
	})//f

c.crossDomainCall.setCallBack('iframeReadNoScroll', function(){
	if(e==1)
		return
	e=1
	var q = __NUKE.position.get()
	if(bs===true)
		 bs= document.body.style
	bs.position = 'fixed'
	bs.overflowY = 'scroll'
	bs.top =  '-'+q.yf+'px'
	bs.width='100%'
	document.body.parentNode.style.overflowY='visible'
	//g.style.marginTop = '-'+q.yf+'px'
	if(vg)
		vg.style.marginTop = vgg.style.marginTop = vc.style.marginTop = '-'+q.yf+'px'
	
	h = q.yf
	m = q.xf
	})

if(window.parent==window.self)return
try{
	var no = window.parent
	no.iframeReadNoScrollInit()
	var no = no.iframeReadNoScroll,
	f = function(){
		no()
		}
	}
catch(o){
	f = function(){
		c.crossDomainCall(1,'*', "iframeReadNoScroll", null, null)
		}
	c.crossDomainCall(1,'*', "iframeReadNoScrollInit", null, null)
	}

c.aE(window,'touchstart',f)
c.aE(window,'mouseover',f)
//commonui.aE(__UA[0]==1 ? document : window,__UA[0]==3 ? 'DOMMouseScroll' : 'mousewheel',function(e){//防止滚轮影响父页面 manual mousescroll
	//window.scrollBy(0, e.wheelDelta ? e.wheelDelta*-1 : e.detail/3*120)
	//commonui.cancelBubble(e)
	//return commonui.cancelEvent(e)
//	},1)
})();//fe

//============================
//ip change alert=============
/*
;(function(){
if(!window.__GP || !window.__GP['greater'] || !__CURRENT_UID)return
var x = cookieFuncs.getCookie('CheckLog'+__CURRENT_UID)
if (x && x.length>32){
	cookieFuncs.setCookieInSecond('CheckLog'+__CURRENT_UID,x.substr(0,32),86400*7)
	commonui.loadNotiScript(function(){commonui.notification.addMsg(2,{0:9})})
	}
})();//fe
*/

}//be

//----------------------------
//var date = new Date;

var iframeReadSetWindowTitle = function(til){document.title=til}

commonui.loadNotiScript=function(f){loader.script(__SCRIPTS.notification,f)}

commonui.topicArg.init()

commonui.touchMoveInit()
//--------------------------

//============================
//覆盖默认/补齐=================
{
//补api=======================
__API.indexForumList=function(){
//return '/nuke.php?__lib=nga_index&__act=get_all_forums&__output=1'
return __IMG_BASE+'/proxy/cache_attach/bbs_index_data.js?7'+Math.floor(__NOW/7200)
}//fe


//自定义发帖检测================
commonui.postPerCheck =function(arg){//返回true终止发帖
var fid=arg[3],act=arg[1],stid=arg[6]//commonui.newPost
//if(act == postfunc.__NEW){
if(fid==-7){
	var x = commonui.userCache.get('pohint-7')|0
	if(x<2){
		commonui.userCache.set('pohint-7',x+1,86400)
		if(!window.confirm('请勿转载/讨论涉及中国之军/政相关新闻/话题\n可能会遭致禁言或更高处罚\n是否继续发帖'))
			return true;
		}
	}
//if(fid==-43){
	//if(!window.confirm('本版禁止讨论近现代中国相关话题 (1921年~现在)\n违者禁言\n是否继续'))
		//return true;
	//}
else if(fid==400 || fid==318 || fid==395 || fid==396 || fid==446 || fid==397 || fid==398 || fid==399){
	var x = $('d3selector001')
	if(!x)return;
	x.contentWindow.getUrls()
	arg[8] = '[diablo3charsim]'+x.contentDocument.getElementById('sharelink').value + '[/diablo3charsim]\n'+ arg[8].replace(/^\s*/,'')//content
	}
//	}
}//fe

//发短信时提示==================
commonui.preMessageHint = function(){
if(window.__CURRENT_UID && window.__GP && __GP.active<0)
	return _$('/span')._.add(
		_$('/br'),
		_$('/a').$0('href',"/read.php?tid=7504167",'innerHTML','[解锁等帐号安全问题]','target','_blank','className','b ngared'),
		' 请发至收件人 ',
		_$('/a').$0('href',"/read.php?tid=7504167",'innerHTML','34909933','target','_blank','className','b ngared'),
		', 请不要发送给版主 '
		)
else
	return null
}//fe

commonui.ingp = function(){
var w=window,g=w.__GP,j=(g._bit&16)&&(!(g._bit&2097152)),h=w.__CURRENT_UNAME;g.infn=''
if(__COOKIE.getCookie('guestJs') && !j){}
else if(!h){}
else if(h)g.infn = h
}//

//发帖时提示===================
commonui.prePostHintAfterSubject = function(act, fid, tid, pid, stid){

var y = (window.__CURRENT_F_BIT & 8192) ? _$('/span')._.add(
	_$('/br'),
	'未激活的用户可',
	__CURRENT_UID ? _$('/a','href','javascript:void(0)','innerHTML','[绑定手机]','onclick',function(e){__SCRIPTS.load('ucp',function(){commonui.setPhone()})},'className','b ngared') : '绑定手机',
	'进行帐号激活 以在论坛发帖',
	_$('/br'),
	'请不要从任何途径购买论坛帐号 论坛备有详细的用户追踪记录 发现盗用帐号或违规激活会立即封禁',
	_$('/br'),
	'如果账号因安全问题而被锁定 请至银色黎明版查看',_$('/a').$0('href',"/read.php?tid=21913839",'innerHTML','[相关说明]','target','_blank','className','b ngared'),
	_$('/br')
	):_$('/span');

if(fid==400 || fid==318 || fid==395 || fid==396 || fid==446 || fid==397 || fid==398 || fid==399){
	return _$('/span')._.add(' ',
		_$('/button').$0('innerHTML','新版装备与技能模拟器','onclick',function(e){
			ngaAds.open_69124(e,'http://db.178.com/d3/s/',1430)
			}),
		y
		)
	}

return y
}//fe

//特定版面补===================
//if(window.__CURRENT_FID){}

}//be

//============================
//杂项功能=====================
{

function time2date(t){
return commonui.time2date(t)
}//fe

commonui.add_pv_count = function (bdk){
var w = window, pv = __COOKIE.getMiscCookie('pv_count_for_insad')|0
console.log('show ad in '+(-pv)+' pv')
__COOKIE.setMiscCookieInSecond('pv_count_for_insad',pv+1);

if (w.location.href.indexOf('allblank')!=-1){
	var x = document.body.getElementsByTagName('A');
	for (var i=0; i<x.length; i++)
		{
		if (x[i].href.indexOf('read.php') != -1 && x[i].href.indexOf('thread.php') == -1)
			{
			x[i].target='_blank'
			}
		}
	}

if (w.location.href.indexOf('autoreload')!=-1){
	w._reloader=function(){
		var date=new Date;
		if(date.getTime()-w.userlastmove<10000) {w.setTimeout(w._reloader,60*1000);document.title='xxxx'}
		else w.location.reload()
	}
	w.setTimeout(w._reloader,60*5000);
	var tmp = function(){var date=new Date;w.userlastmove=date.getTime();document.title=w.userlastmove}
	addEvent(w,'scroll',tmp);
	addEvent(document.body,'click',tmp);
	}

if(bdk){
	var v,l=location.pathname+location.search,fr=w.__fromUrl?w.__fromUrl:null
	if(!w._hmt){
		v=1
		w._hmt=[]
		}
	if(w.__CURRENT_FID)
		_hmt.push(['_setCustomVar',1,'fid',w.__CURRENT_FID])
	if(w.__CURRENT_STID)
		_hmt.push(['_setCustomVar',2,'stid',w.__CURRENT_STID])
	if(v)
		__SCRIPTS.asyncLoad(location.protocol+'//hm.baidu.com/hm.js?'+bdk, 2)
	else
		setTimeout( function(){_hmt.push(['_trackPageview',l])} )
	}
}//fe
var add_pv_count = commonui.add_pv_count



commonui.tplFootLinks=function(){
var x = "<a key ='5652d13cefbfb049451503f9' logo_size='32x12' logo_type='' href='http://www.anquan.org' style='display:none'></a>"//static.anquan.org/static/outer/js/aq_auth.js
x+="<span style='display:inline-block;vertical-align:middle;'><script src='//kxlogo.knet.cn/seallogo.dll?sn=e18122811010876513vpap000000&size=1' type='text/javascript'></script></span>"
document.write(x)
}//

commonui.highLightReply = function(x){
while(x.nodeName!='TABLE' && x.nodeName!='BODY')
	x = x.parentNode
if(x.nodeName=='TABLE')
	x.className +=' highlightpost'
}//


function nextElement(obj){
var next = obj.nextSibling;
while (next && next.nodeType != 1)
	next = next.nextSibling;
return next;
}
//fe

function prevElement(obj){
var prev = obj.previousSibling;
while (prev && prev.nodeType != 1)
	prev = prev.previousSibling;
return prev;
}
//fe

function findNameInNeighbor(o,n){
o = o.parentNode;
return findNameInChild(o,n);
}
//fe

function findNameInChild(o,n){
for (var i=0; i<o.childNodes.length;i++){
	if (o.childNodes[i].getAttribute && o.childNodes[i].getAttribute('name') == n){
			return o.childNodes[i];
		}
	}
}//fe

function elmIncL3(e1,e2)
{
if (e2 == e1)
	{
		return true;
	}
if (e2.parentNode == e1)
	{
		return true;
	}
if (e2.parentNode.parentNode == e1)
	{
		return true;
	}
return false;
}
//fe

function cutstrbylen(s,l)
{
var j = 0.0;
var c= '';
for (var i=0;i<s.length;i++)
	{
		c = s.charCodeAt(i);
		if (c > 127)
			{
				j = j+1;
			}
		else if ( (c<=122 && c>=97)||(c<=90 && c>=65) )
			{
				j = j+0.65;
			}
		else
			{
				j = j+0.35;
			}
		if (j>=l)
			{
				return (s.substr(0,i+1));
			}
	}
return (s);
}
//fe
function getStyle(o,css)
{
if( document.defaultView && document.defaultView.getComputedStyle )
	{
		return document.defaultView.getComputedStyle( o, '' ).getPropertyValue(
		css.replace( /([A-Z])/g, '-$1'));
	}
else if ( o.currentStyle )
	{
		return o.currentStyle[ css ];
	}
else
	{
		false;
	}
}
//fe
function jsdebug()
{
if (typeof(cookieFuncs.cookieCache[cookieFuncs.misccookiename]) != 'object')
	cookieFuncs.extractMiscCookie();

	function d(f,c)
		{
			for (var k in c)
				{
					if (typeof(c[k])=='object')
						{
							d(f+k+'.',c[k]);
						}
					else
						{
							put(f+k+' = '+c[k]+'\n');
						}
				}
		}
if(commonui  && commonui._debug){
	put('---js debug---\n');
	d('',commonui._debug)
	}
put('---cookies---\n');
var cc = document.cookie.split(';');
for (var k in cc)
	{
		put(cc[k]+'\n');
	}
put('---misccookies---\n');
d('',cookieFuncs.cookieCache[cookieFuncs.misccookiename]);

}
//fe

function addEvent(obj,evt,fn) {
commonui.aE(obj,evt,fn)
}

function addEventDOMContentLoadedAct(){
commonui.triggerEventDOMContentLoadedAct ()
}//fe
}//be
//--------------------------


//============================
//杂项论坛功能==================
{
/**
* 获取论坛背景图================
* @param fid 当前版面ID
* @param int 当前页面宽度
 */
commonui.getForumBg=function(fid,fbit,stid,gfid){
if(window.__UA && __UA[0]==1 && __UA[1]<=6)return 
var w = window,noV = __SETTING.currentClientWidth<1400, h = w.__IMGPATH +'/head'

if(__UFIMG && __UFIMG.constructor==Function){
	var iu = __UFIMG(stid ? 't'+stid : 'f'+fid)
	if(iu || (gfid && (iu = __UFIMG('f'+gfid))) ){
		iu[1] = __IMG_BASE+iu[1]
		if(iu[4])iu[4] = __IMG_BASE+iu[4]
		return iu
		}
	}

var sel=function(){
	if(arguments.length==1)
		return Math.floor(Math.random()*arguments[0])
	return arguments[Math.floor(Math.random()*arguments.length)]
	}//

return [1,h+'/'+sel('20210201_'+(sel(5)+1)+'.jpg','20190322_'+(sel(6)+1)+'.jpg','20160831_'+(sel(20)+1)+'.jpg'),0,190]
}//fe


ngaAds.bbs_ads9_gen_old = ngaAds.bbs_ads9_gen ? ngaAds.bbs_ads9_gen : function(){}
ngaAds.bbs_ads9_gen = function (){
if((__SETTING.bit & 4) || !window.__CURRENT_FID || window.__CURRENT_TID)
	return this.bbs_ads9_gen_old();
var x, p =location.protocol,sf = function(){return ((new Date).getTime()/3600000) | 0}
switch(__CURRENT_FID){
	case 7:
		x = {0:'/misc/forum_news/7.html?'+sf(),1:230}
		break;
	case 693:
		x = '/misc/forum_news/693.html?'+sf()
		break;
	case -152678:
		x = p+'/misc/forum_news/-152678_fix.html'
		break;
		/*
	case -362960:
		x = p+'//ccq.178.com/201411/t_209179391466.html'
		break;
		*/
//	case 422:
//		x = '/misc/forum_news/422.html?'+sf()
//		break;
	case 469:
		x = {0:p+'//game.stargame.com/play/startgame?id=144',1:741}
		break;
		/*
	case 484:
		x = {0:p+'//game.stargame.com/play/startgame?id=87',1:750}
		break;
		*/
	//case 642:
	//	x = p+'//tools.nga.cn/iframe/index.php?fid=642'
	//	break;
	/*
	case 452:
		x = p+'//ccq.178.com/201507/t_230506050628.html'
		break;
		*/
//	case 459:
//		x = '/misc/forum_news/459.html?'+sf()
//		break;
	case 516:
		x = '/misc/forum_news/516.html?'+sf()
		break;
		/*
	case 492:
		x = p+'//ccq.178.com/iframe/index.html?fid=492'
		break;
	case 710:
		x = p+'//tools.nga.cn/iframe/index.php?fid=710'
		break;
		*/
	case 428:
		x = '/misc/forum_news/428.html?'+sf()
		break;
	case 414:
		x = p+'/misc/forum_news/414.html?'+sf()
		break;
		/*
	case 543:
		x = {0:p+'//wgapi.178.com/nga_game.php?game=dzz',1:750}
		break;
	case 546:
		x = {0:p+'//wgapi.178.com/nga_game.php?game=gty',1:750}
		break
	case 563:
		x = p+'//ccq.178.com/iframe/index.html?fid=563'
		break;
	case 482:
		x = p+'//ccq.178.com/iframe/index.html?fid=482'
		break;
	case 540:
		x = p+'//tools.nga.cn/iframe/index.php?fid=540'
		break;
	case -60204499:
		x = p+'//tools.nga.cn/iframe/index.php?fid=-60204499'
		break;
		*/
	case -149110:
		x = '<span style="text-align:center"><table class=" stdbtn" style="margin-left:auto;margin-right:auto"><tbody><tr><td><a href="javascript:void(0)" class="b teal" onclick="ngaAds.open_69124(event,\''+p+'//js.ntwikis.com/?nologin=1\',600)"><nobr><span style="font-size:1.5em">战舰少女资料库</span></nobr></a></td></tr></tbody></table></span>'
	}
if(x){
	var h=190
	if(x.constructor == Object)
		h = x[1],x = x[0]
	var y = $('toptopics').nextSibling
	while(y.nodeType!=1)
		y = y.nextSibling
	y.innerHTML += "<div id='bbs_ads9_add' class='catenew'>"+
		(x.charAt(0)=='/' || x.substr(0,4) == 'http' ? 
		"<ifra"+"me src='"+x+"' style='margin:0px;overflow:hidden;width:100%;height:"+h+"px;border:none' scrolling='no' frameborder='0' allowTransparency='true'></ifr"+"ame>":
		x)+
		"</div>"
	}
this.bbs_ads9_gen_old()
}//fe





//获取附件地址==================
;(function(){
var HTTPS = location.protocol=='https:'?1:0

if(HTTPS){
	__ATTACH_BASE_UPLOAD = __ATTACH_BASE_UPLOAD_SEC
	__ATTACH_BASE_VIEW = __ATTACH_BASE_VIEW_SEC
	__RES_BASE = __RES_BASE_SEC
	_P_ATTACH_BASE_VIEW = 'http://'
	}
else{
	__ATTACH_BASE_UPLOAD_SEC = __ATTACH_BASE_UPLOAD
	__ATTACH_BASE_VIEW_SEC = __ATTACH_BASE_VIEW
	__RES_BASE_SEC = __RES_BASE
	_P_ATTACH_BASE_VIEW = 'http://'+__ATTACH_BASE_VIEW+'/attachments'
	}
_P_ATTACH_BASE_VIEW = location.protocol+'//'+__ATTACH_BASE_VIEW+'/attachments'

commonui.getAttachBase=function(u){//相对地址
//if(u && u.indexOf('mon_202'))
	return _P_ATTACH_BASE_VIEW
//else
//	return _P_ATTACH_BASE_VIEW_OLD
/*
if(u.substr(0,2)!='./')
	u='./'+u
var m = u.match(/^\.\/mon_(\d+)\/(\d+)/)
if(m){
	if(__ATTACH_BASE == 'http://test.attach.ngacn.cc')
		return 'http://test.attach.ngacn.cc/attachments'
	var b = (__ATTACH_BASE == 'http://img6.ngacn.cc:8080') ? true : false
	if(parseInt(m[1].toString()+m[2].toString(),10)>=20130104){
		//if(b)
		//	return 'http://img6.ngacn.cc/attachments'
		//else
			return 'http://img6.nga.178.com/attachments'
		}
	else{
		//if(b)
		//	return 'http://img.ngacn.cc/attachments'
		//else
			return 'http://img.nga.178.com/attachments'
		}
	}
return ''*/
}

commonui.ifSelfDomain==function(d){
if(d=='bbs.ngacn.cc' || d=='nga.178.com' || d=='nga.donews.com' || d=='bbs.nga.cn' || d=='bbs.bigccq.cn' || d=='ngabbs.com')
	return 1
}
/*
 *自动替换帖子中[img]图片的地址
 */
commonui.correctAttachUrl = function(u){
if(u.charAt(0)=='.')
	return _P_ATTACH_BASE_VIEW+u.substr(1)
u= u.replace(/^http(s)?:\/\/img7?\.(?:nga\.cn|ngacn\.cc|nga\.178\.com|nga\.donews\.com|ngabbs\.com)\//,function($0,$1){return HTTPS||$1 ? 'https://'+__ATTACH_BASE_VIEW_SEC+'/' : 'http://'+__ATTACH_BASE_VIEW+'/'})
return u
//if(__ATTACH_BASE == 'http://img6.nga.178.com:8080')
//	return u.replace(/^http:\/\/(img\d?)\.ngacn\.cc\//,'http://$1.nga.178.com/')
//else
//	return u.replace(/^http:\/\/(img\d?)\.nga\.178\.com\//,'http://$1.ngacn.cc/')
}//fe

commonui.toRelAthUrl = function(u){
u= u.replace(/^http(s)?:\/\/img7?\.(?:nga\.cn|ngacn\.cc|nga\.178\.com|nga\.donews\.com|ngabbs\.com)\//,'./')
return u
}//fe

commonui.toRelUrl = function(u){
u= u.replace(/^http(s)?:\/\/(?:bbs\.nga\.cn|bbs\.ngacn\.cc|nga\.178\.com|nga\.donews\.com|ngabbs\.com)\//,'/')
return u
}//fe

commonui.checkSigImg = function(u){
if(commonui.ifUrlAttach(u+'') )
	return 1
if(u.match(/^https?:\/\/user-file\.nga\.178\.com/))
	return 1
if((u+'').match(/^https?:\/\/(card\.psnprofiles\.com|card\.exophase\.com|steamsignature\.com\/card)/))
	return 1
}//

commonui.checkOtherImg = function(u){
if(u.match(/^https?:\/\/(img[0-9]?\.nga\.178\.com|img[0-9]?\.nga\.cn|img[0-9]?\.ngabbs\.com|pic[0-9]?\.178\.com|img\.db\.178\.com|db1?\.178\.com|imgs\.aixifan\.com|pic[0-9]+\.zhimg\.com|[a-z0-9]+\.sinaimg\.cn|image\.sinajs\.cn|pic-bucket\.ws\.126\.net|nimg\.ws\.126\.net|steampipe\.steamcontent\.tnkjmec\.com|st\.dl\.eccdnx\.com|st\.dl\.bscstorage\.net|st\.dl\.pinyuncloud\.com|dl\.steam\.ksyna\.com|cdn\.mileweb\.cs\.steampowered\.com\.8686c\.com|cdn-ws\.content\.steamchina\.com|cdn-qc\.content\.steamchina\.com|cdn-ali\.content\.steamchina\.com|[a-z0-9]+\.csgo\.wmsj\.cn|[a-z0-9]+\.dota2\.wmsj\.cn|cdn\.cloudflare\.steamstatic\.com|pic\.imgdb\.cn|liquipedia\.net|clan\.akamai\.steamstatic\.com\/images|dota2\.fandom\.com|redive\.estertion\.win|bestdori\.com|imgbb\.com|i\.ibb\.co|shp\.qpic\.cn|docimg[0-9]+\.docs\.qq\.com|ricochet\.cn|dragalialost\.akamaized\.net|sh0wer1ee\.gitee\.io|shadowverse\.com|shadowverse\.jp|sv\.163\.com|sv\.res\.netease\.com|shadowverse-portal\.com|imgchr\.com|img\.vim-cn\.com|[a-z0-9]+\.hypergryph\.com|web\.hycdn\.cn|prts\.wiki|news\.fate-go\.jp|game\.bilibili\.com|i0\.hdslb\.com|fgo\.wiki|m\.qpic\.cn|upload-bbs\.mihoyo\.com|pic\.imgdb\.cn|images\.contentstack\.io|ossweb-img\.qq\.com\/upload\/webplat\/info\/lol|img\.expreview\.com|techpowerup\.com|hearthstone\.nosdn\.127\.net|nie\.res\.netease\.com|smhtv-pic\.tga\.qq\.com|img\.crawler\.qq\.com\/cfwebcap|static\.gametalk\.qq\.com\/image|upload-bbs\.miyoushe\.com|sbwsz\.com|xyoss\.g\.com\.cn|shadowverse-wb\.com|webview11\.shadowverse-wb\.jp|hs\.res\.netease\.com)\//))
	return 1;
}//


_ALL_IMG_HOST_REG = /^https?:\/\/img\d*\.(?:ngacn\.cc|nga\.cn|nga\.178\.com|nga\.donews\.com|nga\.bnbsky\.com)\//











var d1 = function(){
	return (window.__CURRENT_FID==570 || window.__CURRENT_TID==18809689) ? 1 : -2
	},
d2 = function(){
	return (window.__CURRENT_FID==-81981 || window.__CURRENT_FID==485) ? 1 : -2
	}
//1未知 2可信
commonui.checkLinkTable = {
'ngacn.cc':{_:2,'bbs.ngacn.cc':3},// _ 指无更多前缀的域名 2为保持原链接 3为替换成当前host
'nga.cn':{_:2,'bbs.nga.cn':3},
'donews.com':{_:2,'nga.donews.com':{_:3,'img.nga.donews.com':2,'img4.nga.donews.com':2}},
'bigccq.cn':{_:4,'bbs.bigccq.cn':4},
'178.com':{_:2,'nga.178.com':{_:3,'img.nga.178.com':2,'img4.nga.178.com':2},'club.178.com':3,'wb.178.com':-2},
'ngabbs.com':{_:3},
'ngacn.com':{_:4,'bbs.ngacn.com':4},
_:1,
'nga.wiki':2,
'worldofwarcraft.com':2,
'ofcard.com':2,
'uusee.com':2,
//'youtube.com':2,
'youku.com':2,
'weplay.cn':2,
'tudou.com':2,
'uencn.com':2,
'sc2.cc':2,
'wowchina.com':2,
//'microsoft.com':2,
'dmzj.com':2,
'com.cn':{_:1,'sina.com.cn':2},
'pixiv.net':{_:1,'embed.pixiv.net':2},
'loli.my':{_:1,'static.loli.my':2},//bilibili视频
'hdslb.com':2, //bilibili视频
'plures.net':{_:1,'r.plures.net':2},//v.longzhu.com视频
'bilibili.us':2,
'bilibili.com':2,
'bilibili.tv':2,
'b23.tv':2,
'66play.com':2,
'acg.tv':2,
'acfun.com':2,//acfun视频
'acfun.cn':2,
'acfun.tv':2,//acfun视频
'173.com':2,
'aixifan.com':{_:1,'cdn.aixifan.com':2},//acfun视频
'pdim.gs':{_:1,'s3.pdim.gs':2},//熊猫TV
'huomaotv.cn':{_:1,'www.huomaotv.cn':2},//熊猫TV
'letv.com':2,
'qq.com':{_:2,'jq.qq.com':-2},
'766.com':2,
'iqiyi.com':2,
'qiyi.com':2,
'pptv.com':2,
'feixiong.tv':2,
'163.com':2, //网易视频
'126.net':2, //网易视频
'netease.com':{_:1,'cc.netease.com':{_:1,'res.cc.netease.com':2}}, //网易视频
'douyu.tv':2, // 斗鱼
'douyutv.com':2, // 斗鱼
'douyucdn.cn':2,
'douyu.com':2, 
'zhanqi.tv':2, // 
'bogou.tv':2, // 播狗
'steampowered.com':2,
'127.net':{_:1,'nosdn.127.net':{_:1,'blz-videos.nosdn.127.net':2,'blz.nosdn.127.net':2}},
'topgamers.cn':{_:1, 'video.topgamers.cn':2, 'r.topgamers.cn':2},//高能时刻
'gaonengshike.com':{_:1, 'h5.gaonengshike.com':2},//同上
'agn-oediv.com':{_:1, 'www.agn-oediv.com':2},//同上
'kaihei.co':2,
'ricochet.cn':2,

'iyingdi.cn':-2,
'skyline.top':-2,
'iplaymtg.com':-2,
'joyme.com':-2,
'duowan.com':-2,
'woweyes.net':-2,
'laoyuegou.com':-2,
'tuwan.com':-2,
'laimaika.com':-2,
'mew.fun':-2,
'iili.io':-2,

'2zhk.com':d1,
't.cn':d1,
'sina.lt':d1,
'url.cn':d1,
't.co':d1,
'goo.gl':d1,
'hiurl.me':d1,
'dwz.cn':d1,
'985.so':d1,
'980.so':d1,
'9.cn':d1,
'qyub.cn':d1,
'ppt.cc':d1,
'qr.net':d1,
'tinyurl.com':d1,
'bocaidj.com':d1,
'bit.ly':d1,
'xici800.cn':d1,
'jiaoyimao.com':d1,
'suo.im':d1,
'hoopchina.com.cn':d2,
'hoopchina.com':d2,
'hupu.com':d2,
'taobao.com':function(u){
	if(u.url.match(/coupon\.|taoquan\.|click\.|activity_id/)){
		if(u.url.indexOf('25978185')>0)
			return 1
		return d1(u)
		}
	else
		return 1
	}
}

commonui.checkIframeTable = {
'wow.178.com/':2,
'challonge.com/':2,
'music.163.com':function(u){
	var m = u.match(/height=(\d+)/i)
	return [u.replace(/(\W)auto=.+?(\W|$)/i,'$1$2'), m[1]>=90?330:298, (m[1]|0)+20]//[url,width,height]
	}
}

})();

commonui.ifNotLoadTopBg = function(){
return __SETTING.bit & (1024 | 64 | 2048)
}//

//地址是否是附件================
commonui.ifUrlAttach = function(u){
var m = u.match(/^https?:\/\/(img\d?\.ngacn\.cc|img\d?\.nga\.cn|ngaimg\.178\.com|img\d?\.nga\.178\.com|img\.nga\.donews\.com|img\.nga\.bnbsky\.com|user-file\.nga\.178\.com)\/(attachments\/)?/)
return m ? (m[2]?2:1) : 0
}//

//body起始处加载================
/**
 * 设置 内嵌/不加载图片 样式
 * 设置论坛背景图
 * 设置178导航
 * 设置顶通栏广告
 * 必须在div#mmc存在后运行
 */
commonui.initAfterBody=function(){
var w = window, b =__SETTING.bit ,x=''
if(w.__LOADERREAD && !__LOADERREAD.aInit)
	__LOADERREAD.init()
__SETTING.setIframe()
if(b & __SETTING.bits.noTopBg){
	x += ' notop'
	if(b & 1024){
		x+=' notLoadImg isInAnIframe embed'
		w.ngaAds.clear()
		}
	else{
		if(b & 64)
			x+=' notLoadImg'
		if(b & 2048)
			x+=' isInAnIframe'
		}
	document.body.className+=x
	}
else{
	//if(window._178NavAll_110906_765453)
	//	w.put(_178NavAll_110906_765453(w.__CURRENT_UNAME,1))
	//if(location.pathname == '/read.php')
	//	w.put(w.ngaAds.bbs_ads1_gen())

	this.customBackgroundInit( this.getForumBg(w.__CURRENT_FID,w.__CURRENT_F_BIT,w.__CURRENT_STID,w.__CURRENT_GFID) )

	}

if((__SETTING.bit & (4|8|16))==0 && __SETTING.uA[0]==2 && w.getComputedStyle){//非小屏幕且是chrome 则用缩放取代小字号
	var y = w.document, x = _$('/span','style','position:absolute;visibility:hidden;fontSize:9px')
	y.body.insertBefore(x,y.body.firstChild)
	var z = parseInt(y.defaultView.getComputedStyle(x,null).getPropertyValue('font-size'),10)
	y.body.removeChild(x)
	if(z && z>9)
		__NUKE.addCss('.xtxt , .stxt , .xxtxt {display:inline-block;font-size:inherit;transform: scale(0.75) translateY(8%);} \n .stxt {transform: scale(0.83) translateY(8%);} \n .xxtxt {transform: scale(0.583) translateY(8%);} ')
	}

if(this.triggerEventBodyInit)//commonui.aE : onbodyInit
	this.triggerEventBodyInit()
/*
//commonui.storageSync()
if(window.getMatchedCSSRules){
	document.document
	document.body.insertBefore(x = _$('/div','className','adsc','style','clear:both;height:0;lineHeight:0;fontSize:0;overflow:hidden'),document.body.firstChild)
	var y = getMatchedCSSRules(x)
	//if(y && y[0] && y[0].parentStyleSheet)
		//y[0].parentStyleSheet.disabled=1		
	}
*/


if(ngaAds && ngaAds.bbs_ads12 && ngaAds.bbs_ads12.o && ngaAds.bbs_ads12.o!==true)
	document.body.insertBefore(ngaAds.bbs_ads12.o,document.body.firstChild)

commonui.aE(window,'DOMContentLoaded',function(){
	commonui.mobanner()
	__SCRIPTS.syncLoad = __SCRIPTS.asyncLoad
	loader.script = function(s,f,c,y){__SCRIPTS.load(s,f,c,0)}
	/*__SCRIPTS.el = function(x){
		if(!this._o){
			this._o = _$('/div','style','position:fixed;font-size:0.8em;right:0;bottom:0;background:#fee;border:1px solid #a00;color:#a00;padding:0.5em;transform:translateX(0);','onclick',function(){this.style.display='none';__SCRIPTS.el=function(){}})
			document.body.insertBefore(this._o,document.body.firstChild)
			}
		this._o.innerHTML+=x+'<br/>'
		}*/

	})
if(this.loginlog)
	this.loginlog()
}//fe

//广告========================
commonui.mobanner = function(){return
var r = 60,t = this.mobanner.unpack(__COOKIE.getMiscCookie('mobanner1')|0), ads, now=false
if(__SETTING.uA[2] ==2 || __SETTING.uA[2] ==4 || __SETTING.uA[2] ==5 ){
	/*if(t.count_a<4){//每天四次
		now = this.mobanner.getMi()
		if(now-t.time_a>r && (ads = ngaAds.bbs_ads44_gen())){//每小时一次
			var $ = _$, x = $('/div','style','position:fixed;backgroundColor:rgba(255, 252, 238, 0.95);bottom:0px;color:#fff;width:100%;lineHeight:3em;textAlign:center;zIndex:6',
				$('/a','style','margin:0 auto 0 0;padding:0.1em 0.6em 0.2em 0.6em;border-radius:1.2em;background:'+__COLOR.border2+';color:'+__COLOR.inverttxt1,'href','javascript:void(0)','innerHTML','\u2573','onclick',function(){x.style.display='none';t.time_a = now;t.count_a++;__COOKIE.setMiscCookieInSecond('mobanner1',commonui.mobanner.pack(t),(1440-now+5)*60)}),//时间和次数存一天
				ads
				)
			document.body.appendChild(x)
			}
		}*/
	if(t.count_b<4 && __SETTING.uA[2]!=4){
		if(now===false)now = this.mobanner.getMi()
		if(now-t.time_b>r && !ads){
			var $ = _$,x = $('/div','style','position:fixed;backgroundColor:rgba(255, 252, 238, 0.95);bottom:0px;color:#fff;width:100%;lineHeight:3em;textAlign:center;zIndex:6',
				$('/a','style','margin:0 0.5em 0 auto;padding:0.1em 1em 0.2em 1em;border-radius:1.2em;background:'+__COLOR.border0+';color:'+__COLOR.inverttxt2,'href','http://app.nga.cn/','target','_blank','innerHTML','下载NGA客户端'),
				$('/a','style','margin:0 auto 0 auto;padding:0.1em 1em 0.2em 1em;border-radius:1.2em;background:'+__COLOR.border2+';color:'+__COLOR.inverttxt1,'href','javascript:void(0)','innerHTML','继续访问','onclick',function(){x.style.display='none';t.time_b = now;t.count_b++;__COOKIE.setMiscCookieInSecond('mobanner1',commonui.mobanner.pack(t),(1440-now+5)*60)})
				)
			document.body.appendChild(x)
			}
		}
	}


/*	if(window.navigator.userAgent.match(/micromessenger/i)){
		var y=5,x = $('/div','style','position:fixed;backgroundColor:rgba(255, 252, 238, 0.95);top:0px;width:100%;fontSize:1.5em;height:6em;lineHeight:2em;marginTop:-6em;transition:margin-top 0.3s ease-out;textAlign:center;zIndex:6')._.add(
			'点击右上角菜单',$('/br'),
			'选择',$('/b')._.add('在浏览器中打开'),'以访问完整内容'
			)
		commonui.aE(window,'scroll',function(){
			if(y==1){
				y=0
				x.style.marginTop = '0'
				}
			else if(y>1)
				y--
			})
		}
	else*/ 
	/*
	if(document.referrer.match(/^https?:\/\/.+?\.(?:baidu\.com|so\.com|sogou\.com|sm\.cn|bing\.com|google\.com)\//))
		var x = $('/table','style','position:fixed;backgroundColor:rgba(255, 252, 238, 0.95);height:100%;bottom:0px;color:#fff;width:100%;zIndex:6',
			$('/tr',
				$('/td','style','textAlign:center;verticalAlign:bottom;lineHeight:2em;',
					$('/img','src',__IMG_STYLE+'/app1024.gif','style','margin:1em auto;width:80%'),
					$('/a','style','display:block;border:0.2em solid #323232;height:2em;width:80%;margin:1em auto;border-radius:1.2em;boxShadow: 0.15em 0.15em #efb973, inset 0.15em 0.15em #fffcee;textShadow: 0.1em 0.1em #fffcee;background:#efb973','href','http://app.nga.cn/kp/phone.html','target','_blank','innerHTML','下载NGA手机客户端'),
					$('/a','style','display:block;border:0.2em solid #323232;height:2em;width:80%;margin:2em auto;border-radius:1.2em;boxShadow: 0.15em 0.15em silver, inset 0.15em 0.15em #fffcee;textShadow: 0.1em 0.1em #fffcee;background:silver','href','javascript:void(0)','innerHTML','继续访问','onclick',function(){x.style.display='none';__COOKIE.setMiscCookieInSecond('mobanner1',3,31600)})
				
					)
				  
				)
			)
	else*/

}//fe
commonui.mobanner.unpack = function(a){
return {time_a:a>>21&2047,count_a:a>>16&31,time_b:a>>5&2047,count_b:a&31}
}//
commonui.mobanner.pack = function(a){
return (a.time_a&2047)<<21|(a.count_a&31)<<16|(a.time_b&2047)<<5|(a.count_b&31)
}//
commonui.mobanner.getMi = function(){
var now=(__NOW-(new Date).getTimezoneOffset()*60)/86400
return (now-(now|0))*86400/60&2047
}//

//search======================
commonui.uniSearchWindow = function (e){
this.createadminwindow()
this.adminwindow._.addContent(null)
this.adminwindow._.addTitle('搜索')
this.adminwindow._.addContent(this.uniSearchInput())
this.adminwindow._.show(e);
}//fe

commonui.uniSearchInput=function(ni){
var s=this,st,stc,sr,sf,su,au,re,fc,fa,fo,foi,foii,ys,ep,ro,k=ni,$=_$,fcs,csf = s.selectForum.get(4)
,sfsc,sfs = function(o,e){
	var cff = s.selectForum.get()
	,sfsw = s.createCommmonWindow(8)
	sfsw._.addTitle('选择搜索的版面')
	for(var i=0;i<cff.i;i++){
		sfsw._.addContent(
			$('/button','innerHTML',cff[i][1],'_value',(cff[i][4]&16?'stid=':'fid=')+cff[i][0],'onclick',function(){
				sfsw._.hide()
				go(o,null,this._value)
				})
			,$('/br')
			)
		}
	sfsw._.show(e);
	}
,v2 = 1//(__GP.greater && location.host=='bbs.nga.cn') ? 1 : 0
,go = function(o,e,usf){
k.value = k.value.replace(/^\s+|\s+$/g,'')
if (!k.value)
	return alert('请输入关键词')
fo.method='get'
if(o==st || o==stc || o==au || o==sr){
	fo.method='post'
	var sop = 0;
	if(o==au){
		if(fcs.checked){
			fcs.checked = ''
			fc.checked = 'checked'
			}
		fo.action = '/thread.php?__inchst=UTF8&author='+encodeURIComponent(k.value)
		}
	else
		fo.action = '/thread.php?key='+encodeURIComponent(k.value)
	if(fcs.checked){
		fo.action += '&fid='+csf.join(',').split(',').slice(0,5).join(',')
		}
	else if(fc.checked){
		if(window.__CURRENT_STID)
			fo.action += '&stid='+__CURRENT_STID
		else if(window.__CURRENT_FID)
			fo.action += '&fid='+__CURRENT_FID
		}
	else if(sfsc.checked){
		if(!usf)
			return sfs(o,e)
		fo.action += '&'+usf
		}
	if(o==stc)
		sop |= 1;
	if(v2){
		if(o==sr){
			sop |= 8;
			if(ys && ys.value)
				fo.action += '&year='+ys.value
			}
		else
			sop |= 4;

		if(ep && ep.checked)
			sop |= (16384|32768)
		if(ro && ro.checked)
			sop |= 2
		}
	if(re.checked){
		fo.action += '&recommend=1'
		sop|=32
		}
	if(sop)
		fo.action += '&content='+sop
	}
if(o==sf){
	fo.action = '/forum.php?'
	foi.name='key'
	foi.value=k.value
	}
if(o==su){
	fo.action = '/nuke.php?'
	foii.name='func'
	foii.value='ucp'
	foi.value=k.value.replace(/^\s*|\s*$/g,'')
	if(foi.value.match(/^\d+$/))
		foi.name='uid'
	else{
		if(foi.value.substr(0,1)=='\\')
			foi.value = foi.value.substr(1)
		foi.name='username'
		}
	}
	/*
if(sd.checked){
	fo.method='post'
	fo.target = '_blank';
	fo.action = 'http://db.178.com/wow/cn/search.html?name='+encodeURIComponent(k.value);
	}*/
fo.submit()
}
if(k)
	$(k).$0('onkeydown',function(e){
		if(e.keyCode==13)__NUKE.fireEvent(st, 'click')
		})
var h = $('/span')._.css({whiteSpace:'nowrap',width:'23em'})._.add(
	fo=$('/form','method','get','target','_blank','action','')._.add(
			foii=$('/input','type','hidden'),
			foi=$('/input','type','hidden')
			),
	k ? null : ([k=$('/input','type','text','autocomplete','off','size','28','maxlength','50','onkeydown',
						function(e){if(e.keyCode==13)__NUKE.fireEvent(st, 'click')}
						),
					//$('/button').$0('type','button','innerHTML','搜索','onclick',function(){go(this)}),
					//' ',
					//$('/a').$0('href','/search.php','className','b','innerHTML','高级搜索'),
					$('/br'),
					$('/br')])
	,st=$('/button','type','button','innerHTML','搜索主题标题','onclick',function(e){go(this,e)})
	,fcs=$('/input','type','radio','name','rsch2','style','marginLeft:5.2em'),'勾选的版面*'
	,$('/br')
	,stc=$('/button','type','button','innerHTML', '搜索主题标题和主题内容','onclick',function(e){go(this,e)})
	,fc=$('/input','type','radio','name','rsch2'),' 当前版面'
	,$('/br')
	,sf=$('/button','type','button','innerHTML', '搜索版面或版主','onclick',function(e){go(this,e)})
	,sfsc = $('/input','type','radio','name','rsch2','style','marginLeft:4.2em'),' 选择一个子版面'
	,$('/br')
	,su=$('/button','type','button','innerHTML','搜索用户**','onclick',function(e){go(this,e)})
	,fa=$('/input','type','radio','name','rsch2','style','marginLeft:5.96em'),' 全部版面'
	,$('/br')
	,au=$('/button','type','button','innerHTML','搜索用户发布的主题**','onclick',function(e){go(this,e)})
	,re=$('/input','type','checkbox','name','recommend','style','marginLeft:0.96em'),' 精华主题'
	,v2 ? 
		[$('/br') 
		, sr=$('/button','type','button','innerHTML','搜索回复','onclick',function(e){go(this,e)})
		, ys = $('/select','style','marginLeft:7em')._.add($('/option','value','')._.add('近两年'))
		]
		:null
	,(__GP.superlesser||__GP.staff) ? [$('/br') 
		, ep = $('/input','type','checkbox','name','export'),' 表格显示'
		, ro = $('/input','type','checkbox','name','kor'),' 多词时OR'
		]:null
//	$('/br'),
//	sd=$('/button','type','button','innerHTML','搜索魔兽世界数据库','onclick',function(){go(this)}),	$('/br'),
	,$('/br')
	,$('/span','className','silver','innerHTML','*包括选中联合版面和版面的镜像 不包括合集的镜像<br/>**输入用户ID或用户名 数字用户名需在前加\x5c')
	)

if(ys){
	var year = (new Date()).getFullYear() , fy = 0
	while(year>2021){
		fy-=2
		year-=2
		ys._.add($('/option','value',fy)._.add((year-1) +' - '+year))
		}
	}

if(__GP.staff || __GP.superlesser){
	var asc,ale,aab,aau,asu
	h._.add(
		$('/div','style','margin:0.3em;padding:0.3em;border:1px solid '+__COLOR.border2)._.add(
			'点赞大于',asc=$('/input','size','5'),' (',aab=$('/input','type','checkbox'),'净点赞)',
			$('/br'),
			'字数大于',ale=$('/input','size','5'),' (一个中文约占2字符)',
			$('/br'),
			aau=$('/input','type','checkbox'),'待审核或审核未通过 ', asu=$('/input','type','checkbox'),'包括子版面 ',
			$('/br'),
			$('/button','type','button','innerHTML','在当前版面内搜索主题***','onclick',function(){
				var opt = 0
				if(aab.checked)opt|=4
				if(aau.checked)opt|=1
				if(asu.checked)opt|=2
				fo.method='post'
				fo.action = '/thread.php?key=:select:a~'+(asc.value|0)+'~b~'+(ale.value|0)+'~c~'+opt+'&fid='+s.selectForum.get(64).join(',')
				fo.submit()
				}),
			$('/br'),
			$('/br'),
			$('/span','className','silver','innerHTML','***很慢 不能隔页翻')
			)
	
	
		)
	}

st.checked=1
if (csf.i==0)
	fa.checked=1,fcs.disabled=1,fc.disabled=1
else if (csf.i==1)
	fc.checked=1,fcs.disabled=1
else if (csf.i>5){
	fc.checked=1
	fcs.nextSibling.textContent+='(最多5个)'
	}
else{
	if(csf.nocfid)
		fc.disabled=1
	fcs.checked=1
	}
return h
}//

//顺序加载脚本=================
commonui.loadScriptInOrder_loadedScript = {}
commonui.loadScriptInOrder = function(s,onready)
{
if (typeof(s)=='string') s=new Array(s);
var cur = s.shift();
if (this.loadScriptInOrder_loadedScript[cur])
	{
	if(s.length)this.loadScriptInOrder(s,onready);
	else onready();
	return;
	}
var h = document.createElement('script');
h.src = cur;
h.onload=h.onreadystatechange = function(){
	if (this.readyState && this.readyState != 'loaded' && this.readyState != 'complete')
		return;
	commonui.loadScriptInOrder_loadedScript[this.src]=1;
	if (s.length==0) onready();
	else commonui.loadScriptInOrder(s,onready);
	}
document.getElementsByTagName('head')[0].appendChild(h)
}


//版主组颜色=======
commonui.modInfo = function(gid, inmodlist){
switch(gid){
	case 3:
	case 86:
		return [__COLOR.utxt3]//['','正式任命的管理员','8a46a0','51325c']
	case 4:
	case 77:
		//return [__COLOR.utxt2]//['','社区正式任命的超级版主','18677e','21505d']
	case 90:
	case 83:
		return [__COLOR.utxt2]//['','社区正式任命的版主','18677e','21505d']
	case 5:
	case 81:
	case 82:
	case 84:
	default:
		if(inmodlist)
			return [__COLOR.utxt1]//['','社区正式任命的版主','18507e','21425d',c==2?'副':'','本版面管理任命的副版主','21425d'] : null
	}

	//c ? (['','','','','非',c==2?'非正式任命副版主':'非正式任命版主',c==2?'aaa':'888']) : null
	
}

//切换显示隐藏==================
commonui.switchDisp = function(o,d,close)
{
if (o.style.display && o.style.display=='none')
	{
	if(d)o.style.display=d
	else o.style.display=''
	if(close)
		{
		o.onmouseout=function(e){
			if (!e) var e = window.event;
			var to = (e.relatedTarget) ? e.relatedTarget : e.toElement;
			if (to && to!=this && to.parentNode!=this && to.parentNode.parentNode!=this)
				{
				this.style.display='none'
				}
			}
		}
	}
else
	o.style.display='none'
}


//金币格式化===================
commonui.calc_money = function (c){
c = parseInt(c,10);
if (!c || c <= 0)
	return ('');
var g = Math.floor(c / 10000), s = Math.floor(c / 100) - g * 100,  h ='' , t = ''
c = c - g * 10000 - s * 100;
if (g){
	t+=g+'金币 '
	h += g+"<img alt='金币' style='margin:2px 1px -2px 0px' src='"+__IMG_STYLE+"/g.gif'/>";
	}
if (s){
	t+=s+'银币 '
	if(g<100)
		h += s+"<img alt='银币' style='margin:2px 1px -2px 0px' src='"+__IMG_STYLE+"/s.gif'>";
	}
if (c){
	t+=c+'铜币 '
	if(!g)
		h += c+"<img alt='铜币' style='margin:2px 1px -2px 0px' src='"+__IMG_STYLE+"/c.gif'/>";
	}
return "<span title='"+t+"'>"+h+"</span>"
}//fe

//小广告=======================
commonui.menuRight = function(){
return ""
}

var __TXT
;(function(){
var g={
		_c:"font-family:'comm_glyphs';webkitFontSmoothing:antialiased;mozOsxFontSmoothing:grayscale;lineHeight:1em",
		star:'\u2605',
		gear:'\u2699',
		menu:'\u2261',
		smile:'\ue813',
		good:'\u2bc5',
		bad:'\u2bc6',
		img:'\ue1bc',
		tbody:'\ue228',
		close:'\xd7',
		link:'\u271a',
		up:'\u25b2',
		label:'\u23fa'
		}
var s = {
	androids:['0 0 730 1000', 'M604.9 348.4H124.4s8-118.1 108.1-176.9l-34.7-67.8a20.3 20.3 0 0 1 11.9-25.3 24.6 24.6 0 0 1 29.8 3.9l36 70.4a283.8 283.8 0 0 1 89.7-13.7 282.4 282.4 0 0 1 90.4 14l36.2-70.6a24.6 24.6 0 0 1 29.8-3.9 20.3 20.3 0 0 1 11.9 25.3L498.6 171.9c99 58.9 106.3 176.4 106.3 176.4Zm-1.9 373.1a65.7 65.7 0 0 1-14.1 26.4 43.5 43.5 0 0 1-23.6 10h-58.4v131.1s-7.5 36.4-52.8 36.4-50.9-36.4-50.9-36.4V757.9h-77.3v131.1s-5.7 36.4-50.8 36.4-52.8-36.4-52.8-36.4V757.9h-58.4a43.5 43.5 0 0 1-23.6-10 65.7 65.7 0 0 1-14.1-26.4V386.6h476.8v334.9ZM50.9 353.8a49 49 0 0 1 49 38.2V641.4s-3.8 36.4-47.1 36.4A52.3 52.3 0 0 1 0 641.4V390.2a51.4 51.4 0 0 1 50.9-36.4Zm627.5 0a49 49 0 0 0-49 38.2V641.4s3.8 36.4 47.1 36.4a52.3 52.3 0 0 0 52.8-36.4V390.2a51.4 51.4 0 0 0-50.9-36.4h-.009Z',''],
	apples:['0 0 707 1000', 'M363.8 356.3a321 321 0 0 0-76.3-49.5A216.2 216.2 0 0 0 209 291.7s-81.8 8.4-132.3 50.7C25.6 385.4 5.8 462.3 5.8 462.3a579.8 579.8 0 0 0-3.9 128.7A504.6 504.6 0 0 0 30 706.5s31.2 66.4 76 112.6a294.7 294.7 0 0 0 105.4 72.7 466 466 0 0 0 61.3 7.4 227.2 227.2 0 0 0 59.2-15.8 166.3 166.3 0 0 0 45.1-32l41.6 28.4L470.3 900h48.4s74.5-21.6 121.6-68.4c46.9-46.7 66.4-118.6 66.4-118.6L643.8 671.9a173.9 173.9 0 0 1-54.9-123.3 185.4 185.4 0 0 1 50.8-123.2l55.8-38.6s-48.9-65.5-110.6-84c-58-17.4-129 12.1-129 12.1l-62.9 41.4h-29Zm19.4-55.3 62.9-41.5 48.4-55.3 38.7-64.5 13.9-64.7-67.8 20.6-72.8 47.4-36 45.7-6.7 52.4Z',''],
	bad:['0 0 896 1000', 'm0 533.8.063-63.1a79.3 79.3 0 0 1 5.8-30.9L132.6 150.2c11.7-29 40.9-50.2 76-50.2l354.1.063c44.8 0 83.8 38.6 83.8 83.1v411.5c0 23.2-9.7 42.5-25.3 58L348.4 925l-44.8-44.4c-11.7-11.6-17.5-25.1-17.5-42.5v-13.5l41-209.1-243.1-.438C39 615 0 578.3 0 533.8Zm896-433.7v494.6H728.4V100.1H896Z'],
	bubble:['0 0 906 1000', 'M453.1 100c249.3 0 453.3 164.3 453.3 368.2S702.3 836.5 453.1 836.5a413 413 0 0 1-68-5.7c-102 96.3-215.3 113.3-328.6 119v-22.7c62.3-34 113.3-85 113.3-147.3v-22.7C67.8 689.2-.206 581.5-.206 468.2-.206 264.3 203.8 100 453.1 100Z'],
	bubble_q:['0 0 907 1000', 'M453.1 100c249.3 0 453.3 164.3 453.3 368.2S702.3 836.5 453.1 836.5a413 413 0 0 1-68-5.7c-102 96.3-215.3 113.3-328.6 119v-22.7c62.3-34 113.3-85 113.3-147.3v-22.7C67.8 689.2-.206 581.5-.206 468.2-.206 264.3 203.8 100 453.1 100ZM226.4 468.2c0 79.3 85 141.6 85 141.6h85c-56.7-51-56.7-141.6-56.7-141.6H396.4v-141.6H226.4v141.6Zm283.3 0c0 79.3 85 141.6 85 141.6h85c-56.7-51-56.7-141.6-56.7-141.6h56.7v-141.6H509.7v141.6Z'],
	bubble_a:['0 0 906 1000', 'M453 100c249 0 453 164 453 368S702 836 453 836a413 413 0 0 1-68-5C283 927 170 944 56 950v-23c63-34 114-85 114-147v-23A358 358 0 0 1 0 468c0-204 204-368 453-368Zm0 103c-53 0-85 29-85 90 0 48 29 66 48 145l22 101h29l23-101c22-79 48-97 48-145 0-61-33-90-85-90Zm0 385a65 65 0 1 1-65 65 65 65 0 0 1 65-65Z'],
	close:['0 0 800 1000', 'M799.9 819.5 480.5 500l319.5-319.5L719.4 100 399.9 419.5 80.5 100-.051 180.5 319.4 500-.051 819.5 80.5 900l319.5-319.5L719.4 900Z'],
	down:['0 0 800 1000', 'M800 340.6 719.5 260 400 579.8 80.5 260 .012 340.6l400 400.4Z'],
	gear:['0 0 831 1000', 'M415.3 649.6c81.9 0 149.8-67.9 149.8-149.7s-67.9-149.7-149.8-149.7S265.5 418.1 265.5 499.9s67.9 149.7 149.8 149.7Zm317.7-107.8 89.9 69.9c8 6 10 18 4 27.9l-85.9 147.7c-6 10-16 12-26 8l-105.9-41.9c-22 16-46 31.9-71.9 41.9L521.2 907.1c-2 10-10 18-20 18H329.4c-10 0-18-8-20-18l-16-111.8a260.9 260.9 0 0 1-71.9-41.9l-105.9 41.9c-10 4-20 2-26-8L3.7 639.7c-6-10-4-22 4-27.9l89.9-69.9c-2-14-2-27.9-2-41.9s0-27.9 2-41.9L7.7 388.2c-8-6-10-18-4-27.9l85.9-147.7c6-10 16-12 26-8l105.9 41.9c22-16 46-31.9 71.9-41.9l16-111.8c2-10 10-18 20-18h171.8c10 0 18 8 20 18l16 111.8a260.9 260.9 0 0 1 71.9 41.9l105.9-41.9c10-4 20-2 26 8l85.9 147.7c6 10 4 22-4 27.9l-89.9 69.9c2 14 2 27.9 2 41.9s-.004 27.9-2 41.9Z'],
	good:['0 0 896 1000', 'm896 466.2-.063 63.1a79.3 79.3 0 0 1-5.8 30.9L763.4 849.8c-11.7 29-40.9 50.2-76 50.2l-354.1-.063c-44.8 0-83.8-38.6-83.8-83.1V405.4c0-23.2 9.7-42.5 25.3-58L547.6 75l44.8 44.4c11.7 11.6 17.5 25.1 17.5 42.5v13.5l-41 209.1 243.1.438c44.9 0 83.9 36.7 83.9 81.2ZM0 899.9V405.4h167.6v494.6H.005Z'],
	help:['0 0 800 1000', 'M522.1 470a127.7 127.7 0 0 0 37.6-90.1 159.6 159.6 0 0 0-319.3 0h78.9c0-43.2 37.6-80.7 80.8-80.7s80.8 37.6 80.8 80.7c0 22.5-9.4 41.3-24.4 56.3l-48.8 50.7c-28.2 30-46.9 69.5-46.9 112.7v20.7h78.9c0-60.1 18.8-82.6 47-112.7Zm-82.6 309.9v-78.9h-78.9v78.9h78.9ZM400 100A400 400 0 1 1-.006 500 399.1 399.1 0 0 1 400 100Z'],
	home:['0 0 874 1000', 'M666.3 900H526.5v-299.3H347v299.3H206.7c-75.7 0-74.7-74.8-74.7-74.8l-.375-326.3H-.006L436.7 50l436.7 448.9h-131.6l.156 326.3s-1 74.8-75.7 74.8Z'],
	img:['0 0 700 1000', 'M69.2 534.4v246.4H315.6v69H69.2c-37.8 0-69-31.2-69-69V534.4h69Zm561.8 246.4V534.4h69v246.4c0 37.8-31.2 69-69 69H384.6v-69h246.4Zm0-630.8c37.8 0 69 31.2 69 69V465.4h-69V219H384.6v-69h246.4Zm-105.1 226.7c0 29.6-23 52.6-52.6 52.6s-52.6-23-52.6-52.6 23-52.6 52.6-52.6 52.6 23 52.6 52.6ZM279.5 534.4 384.6 664.2l70.6-93.6L560.4 710.2H139.8ZM69.2 219V465.4h-69V219c0-37.8 31.2-69 69-69H315.6v69H69.2Z'],
	label:['0 0 816 1000', 'M628.6 763.8 816 500 628.6 236.3a87.8 87.8 0 0 0-70.5-36.2H86.6C40.3 200 0 238.3 0 284.6V715.4c0 46.3 40.3 84.6 86.6 84.6h471.5a87.8 87.8 0 0 0 70.5-36.2Z'],
	left:['0 0 481 1000', 'M481 819.5 161.2 500l319.8-319.5L400.4 100 .007 500 400.4 900Z'],
	link:['0 0 750 1000', 'M321 593.1a39.1 39.1 0 0 1-27.6-11.4 183 183 0 0 1 0-258.4L437.3 179.5A182.8 182.8 0 0 1 695.8 437.9l-65.8 65.8a38.9 38.9 0 0 1-56.9-53.2q.869-.928 1.8-1.8l65.8-65.7a104.9 104.9 0 0 0-148.3-148.3L348.5 378.4a104.9 104.9 0 0 0 0 148.3 38.9 38.9 0 0 1-27.6 66.4H321ZM183 874.8A182.8 182.8 0 0 1 53.8 562.8l65.8-65.7A38.9 38.9 0 0 1 176.4 550.3q-.869.9-1.8 1.8l-65.8 65.7a104.9 104.9 0 0 0 148.3 148.3L401 622.3a104.9 104.9 0 0 0 0-148.3 38.9 38.9 0 1 1 53.3-56.8q.927.9 1.8 1.8a183 183 0 0 1 0 258.4L312.2 821.2A181.6 181.6 0 0 1 183 874.8Z'],
	menu:['0 0 776 1000', 'M0 800h776V699.2H0V800Zm0-250.8h776V448.4H0v100.8Zm0-250.8h776V200H0v98.4Z'],
	pen:['0 0 755 1000', 'M669.8 370.7 514.1 209.5l72.7-72.8a40.7 40.7 0 0 1 57.1 0l98.6 93.6c15.6 20.8 15.6 46.8 0 62.4Zm-207.7-119.6 155.8 161.2-456.9 462.8H.076V719Z'],
	right:['0 0 481 1000', 'M-.012 819.5 319.8 500-.012 180.5 80.6 100l400.4 400L80.6 900Z'],
	share:['0 0 913 1000', 'M899.4 425.9 600.7 134.7c-22.6-24.3-49.8 0-49.8 38.8v145.6c-212.7 0-393.8 140.7-479.8 330-31.7 63.1-49.8 131.1-63.4 199C5.1 862.1 0 900 0 900h79.6s9.4-15.1 14.1-22.7c99.6-169.9 267.1-281.5 457.2-281.5v160.2c0 38.8 27.2 63.1 49.8 38.8l298.7-291.2c18.1-22.2 18.1-55.4 0-77.7Z'],
	smile:['0 0 751 1000', 'M375.3 649.9c56.4 0 103.9-29.9 130.3-74h61.6C537.3 653.4 463.4 706.2 375.3 706.2s-162-52.8-191.9-130.3h61.6c26.4 44 74 74 130.3 74Zm0 151.4c165.5 0 301.1-135.6 301.1-301.1S540.9 199.1 375.3 199.1 74.2 334.6 74.2 500.2 209.8 801.3 375.3 801.3Zm0-676.2A375.1 375.1 0 1 1 .25 500.2a374.3 374.3 0 0 1 375.1-375.1ZM186.9 406.8c0-31.7 24.7-56.3 56.3-56.3s56.4 24.7 56.4 56.3-24.7 56.4-56.4 56.4-56.3-24.7-56.3-56.4Zm264.1 0c0-31.7 24.7-56.3 56.3-56.3s56.4 24.7 56.4 56.3-24.7 56.4-56.4 56.4-56.3-24.7-56.3-56.4Z'],
	star:['0 0 948 1000', 'm473.8 50 123 309.9 350.5 10.5-258.7 211.9 89.7 368.3L473.8 738.4 169.3 950.5l89.7-368.2L.294 370.3l350.4-10.5Z'],
	gift:['0 0 741 1000', 'M710 454H428V271a4494 4494 0 0 1-115 0v183H31a31 31 0 0 1-31-31V301a31 31 0 0 1 31-31h186c-84-8-122-50-122-100 0-54 53-114 150-87 82 23 118 76 128 92 10-16 46-69 128-92 97-27 150 33 150 87 0 50-38 92-122 100h181a31 31 0 0 1 31 31v122a31 31 0 0 1-31 31ZM266 144c-49-22-121-27-121 24s82 47 82 47h112s-24-49-73-71Zm335 24c0-51-72-46-121-24s-73 71-73 71h112s82 4 82-47ZM313 901H66a31 31 0 0 1-31-31V485h278v416Zm394-31a31 31 0 0 1-31 31H428V485h279v385Z'],
	find:['0 0 858 1000', 'M490 836a367 367 0 0 1-218-72L99 938a50 50 0 0 1-72 0l-12-13a50 50 0 0 1 0-71l174-174a367 367 0 0 1-68-213 369 369 0 1 1 369 369Zm1-665a293 293 0 1 0 0 586 293 293 0 0 0 0-586Zm0 538a242 242 0 0 1-201-107c20-43 53-85 104-109 25 16 58 34 96 34s72-17 97-34c52 24 84 67 104 110a242 242 0 0 1-200 106Zm126-354a126 126 0 1 1-126-127 126 126 0 0 1 126 127Z'],
	tbody:['0 0 701 1000', 'M622 461.9V228.4H388.5V461.9h233.5Zm0 310.1V538.5H388.5v233.5h233.5ZM311.9 461.9V228.4H78.4V461.9H311.9Zm0 310.1V538.5H78.4v233.5H311.9ZM0 150h700.4v700.4H0V150Z'],
	turned_in:['0 0 602 1000', 'M516.7 125c46.4 0 84.8 40.4 84.8 86.8v688.6L300.7 771.2 0 900.4V211.8C0 165.4 38.3 125 84.8 125h431.9Z'],
	up:['0 0 800 1000', 'M800 660.4 719.5 741 400 421.2 80.5 741 .012 660.4l400-400.4Z'],
	wechat:['0 0 972 1000', 'M364.2 99.8C-19.1 111.2-109.4 484.4 138.9 641.2L90.9 737.3l130.9-56c28.1 10 57.2 18.2 88.4 22-32.4-160.8 70.2-375.4 411.8-356.8-33.6-151.5-203.8-251.1-357.8-246.5ZM667.8 403.4c-167.7 0-303.7 108.7-303.7 242.8 0 162.4 193.9 276.4 382.9 233.4l163.7 70.1-56.6-113.1C1085.6 686.7 949.3 403.4 667.8 403.4Z'],
	dot3narw:['0 0 622 1000','M311,100a90,90,0,1,1-90,90A90,90,0,0,1,311,100Zm0,620a90,90,0,1,1-90,90A90,90,0,0,1,311,720Zm0-309.75a90,90,0,1,1-90,90A90,90,0,0,1,311,410.25Z'],
	circlenopadding:['0 0 800 800','M0 400a400 400 0 1 1 800 0 400 400 0 1 1-800 0m25 0a375 375 0 1 1 750 0 375 375 0 1 1-750 0'],
	crosss:['0 0 87 56', '72-109-95-108 112v118 116 95A56 99Z50 98m49 52.97v49A101 101Z52.102 99 50-50-98A53 54Z57 50 53 52v100 55 ', '104 108 100v95 95H109 97H114 107A115 45 99.111-110 116 97 105Z110 101.114m', '101 120A116.114H97 83-116 115 '],
	lock:['0 0 1000 1000', 'M829.2 925H174.3a40 40 0 0 1-40-40V465.8a40 40 0 0 1 40-40H226v-77.1a274.7 274.7 0 1 1 549.5 0v77h53.8a40 40 0 0 1 40 40V885a40 40 0 0 1-40 40M691.6 340.2a190.6 190.6 0 1 0-381.3 0v85.6h381.3z'],
	aithink:['0 0 1000 1000',"M184 271c60-173 195-91 195-91 23-47 38-67 108-80 72-13 128 54 128 54 167-67 203 117 203 117 52 8 127 57 127 151s-73 139-73 139c-22 133-136 94-136 94-56 121-152 48-152 48-125 125-221-10-221-10-142 50-172-85-172-85-67-11-134-69-133-167 2-150 126-170 126-170m22 546c0-43 43-81 123-77 84 4 125 45 122 83-3 45-65 71-126 70q-26 0-49-7-14-21-53-28a55 55 0 0 1-17-41m-76 87c0-27 26-50 76-48q9 0 17 2 20 19 52 28 7 11 7 22c-2 28-41 44-78 43s-74-18-74-47m346-646q-11-14-39-14h-19c-18 0-38 5-45 14q-11 13-17 35l-55 185-2 80q0 15 2 27t9 19 25 7 25-7 10-19 2-27v-36h105v36q0 15 2 27t9 19 25 7 25-7 9-19 2-27l-2-80-54-185q-7-22-17-35m-93 194 39-140h5l39 141zm233 129q3 14 13 22 9 8 28 8t28-8 12-22 3-30V304q0-16-3-30-2-14-12-22-9-8-28-8t-29 8-12 22-3 30v247q0 17 3 30"],
	ngalogo:['129.2 30.2 1120.6 411.8', 'm1192.5 335-26.9-115.2-8.6-3 7.7 118.2h-59V82.7l5.7-5.8 46.8-5.5 30.4 118.2 8.8 2.6-7.5-109.2 3.4-5.9 56.5-5.4V335h-57.3zm-234.7-.5-10.3-8.7-9.2-58v-11l9.3-167.2 9.7-9.9 92.1-13.7 28.5 34.5 5.5 40v30.3h-53.2l-11.5-55.5-17.9 3.2-5 149.4 5 23 22.1-3.6 6.7-52.3h53.8v73l-19.4 26.5zm-59.3-45.8h34V335h-34v-46.3zm-75.2-.4h-25.5l-4.2 46.7h-62.7l30.2-248.4 10.4-9.7 81.1-9.3L889 335H827zm-10.3-159-5.9 3.7L797 242.3h24.5zM669.4 316.5l-16.1 18-64.5.1-10.3-8.7-9.2-58v-11l9.3-167.2 9.7-9.9L680.4 66l28.5 34.5 5.5 40v30.3h-53.2l-11.5-55.5-17.8 3.2-5.1 149.4 5 23 22.1-3.6 3-21.4 3.7-30.9h-19.4v-39.5h73.2V335h-39.3zm-123 18.6h-57.3l-26.8-115.2-8.7-3 7.7 118.2h-59V82.7l5.8-5.8 46.7-5.5 30.5 118.2 8.8 2.6L486.6 83l3.3-5.9 62.2-7.5-5.6 31.4v234zM404 366h-13.7v6.6h-11.5V366h-19.4v6.6h-11.3V366h-14v-8.1h14V351h11.3v6.8h19.4V351h11.5v6.8H404v8zM169.2 286l-40-2.9v-253h225L351 75.4l27.8 2v257.7H165.7zm29.6-207.8-11.5 3-11 19.1 17.8 12.3 18.8-5.6.7-2.1-2.7-23.8 3.6-26.8zm44 3.4-10.3 17.6 5.9 20 8.5-4.2 8.8-3 4.8-23.2 4.2-37.1zm41.6 6.8-15.3 23.8 4 15.2 18.9-4 4-16.3 2.8-14 3.7-26.7zm32.2 19.8-15.8 23.5 4.1 11.7 15.7-4.2 9-21.6 5.4-28zm37.3 34-.9-9.2 2-15-13.1 19.8-13.6 3.7 5.8 16.8 14.2.1zM261.5 303l27.3 10.6L308 278l-12.3-31.3-51-7.7-2.6 34.3zM203 165.5l31.5 2 68.3 52.4 12.6 3.6 20.9-11.2-2.2-24.4-76.6-50.4-71.3-8.1-34.9 33.5-3 27.8s12 24.2 20.5 36.5l40.1 1-11.2-54.5zm-31 190.2 2.5 18.4-6.2-.3-2.2-17.4zm17.5 18.4 3-18.4 4.4.7-3.3 17.7h-4zm-22.2 16.5v-8.9h9.5V351h9.8v30.7h8.3v9h-8.4l11.6 24.4-4.5 6.8-3-8-3.6-8.1-.4 36.2H177l.2-36.2-4.2 11.2-4.2 10.2-5.7-8.5 13.7-28h-9.3zm48.1-12.7H203v-5.7h12.6v-8h-13.4v-6.5h13.4V351h11.3v6.7h13.4v6.4h-13.4v8h12.5v5.8h-12.5v8.2h15.3v7.3h-40.9v-7.3h14.3V378zm23.8 64h-9.7l1-2V429h-19V442H203v-41.6h36.4V442zm-20.7-34.2h-7v14.6h7v-14.6zm12 0h-6.7v14.6h6.7v-14.6zm-1 34.3zm112.9-58.6h20.4V375h12.4v8.4h20.4v20.4h7.4v9.3h-22.7l3.2 3.7a83 83 0 0 0 19.5 16.2l-7.2 9a102.8 102.8 0 0 1-24.7-23.5l-1.6-2-1.9 1.7a115.6 115.6 0 0 1-25 23.8l-7.4-9a88.5 88.5 0 0 0 19.4-16.2l3.3-3.7h-23v-9.3h7.5v-20.4zm32.8 20.4h10.8V391h-10.8v12.7zm-23.2 0H363V391h-10.8v12.7zm154.8-10h-6v-11.5h6v-18.5H500v-11.7h25.4V364h-6.2v18.4h5.2v11.5h-5.2v22l7.8-.5v12l-28.8 2v-12l8.6-.6v-22.9zm65.6-42.8v11.2h-37.2V351h37.2zm5 36.7h-7.4v42.8h8.3l.9-.8V441h-21v-53.3H550l-3.7 54.3-11.7-.7 3.5-53.6h-7v-10.9h46.5v11zM697.7 351H712v7.5h28.6v20H730V367h-50.5v11.5H669v-20h28.6V351zm4.8 57-.3-3.4-28 16.1-4.3-6.2 31-17-1.7-7-24.3 13.2-4.2-6.8 23.5-11.8-1-4h-6v-6.8h35.3v6.8h-14l1.3 3a79.4 79.4 0 0 1 3.4 9.2l1 2.9 16.2-11.2 5.9 7.6-17 11.1 21.8 24.8-8.2 7.1-16.7-20.5-.5 5.4a64.2 64.2 0 0 1-6.3 21.5l-13.5-2.8.4-.2.3-.7a77 77 0 0 0 4-11.3l1.2-5.1-26.9 16-4.7-6.7 32.4-18.3v-1.3a34.2 34.2 0 0 0-.1-3.6zm158.1-54.2-5.2 11.6V441h-10.4l.1-54-4 9.4-2.5 5.4-6.8-8 20-42.7zm6.2 1.4h36.8v56.6h6.1v9.1h-48.1v-9.1h5.2v-56.6zm10.1 56.6h16.5v-8h-16.5v8zm0-13.8h16.5v-8.1h-16.5v8zm0-13.3h16.5v-8h-16.5v8zm0-13.7h16.5v-8h-16.5v8zm4.4 59.8L869.3 442l-6.7-7.5 12-11zm29.5 3.7-6.5 7.5-12-11.2 6.4-7.3zm113.7-18.6-15.6 21.9-7.5-7.3 15.6-21zm7-13.7h-28.6v-10.3h5.9v-35.5l53-5.4 1.1 9-42.6 4.5V392h11.1v-20.6h13.8V392h26.3v10.3h-26.3V442h-16.4l2.6-3.3v-36.5zm44.1 28.2-7.6 7.4-15.5-21.8 7.5-6.5zm98.5-61h-3.9v-8.7h13.5V351h11.3v9.7h14.2v8.7h-4.7V387h5.7v9.6H1168V387h6v-17.6zm9.8 17.6h11v-17.6h-11V387zm23.7 55H1172v-35.2h35.6V442zm-10.2-25.3h-14.9v15.7h14.9v-15.7zm42.3-26.9.4.8a46.8 46.8 0 0 1 6.6 23.5c0 10.3-4 21.3-12.9 21.3h-7.2v6.5h-10.3V353h30.8zm-13.2-26.6V388l4.3.4 4.6-25.2h-8.9zm4 29-4 1v30.6h3c4 0 6.5-4.6 6.5-11.7a47 47 0 0 0-5.5-20z','']
	}
window.allk = s
/*
if(__SETTING.uA[0]==1 && __SETTING.uA[1]<9 || __SETTING.uA[4]==2 && __SETTING.uA[5]<9)
	g={
		star:['&#9733;','fontFamily:SimHei,Verdana, Tahoma,Arial,sans-serif'],
		gear:'&#8801;',
		menu:'&#8801;',
		smile:'表情',
		good:'&#9650;',
		bad:'&#9660;',
		img:'图片',
		tbody:'表格',
		close:'&#215;',
		link:'链接'
		}*/
		
__TXT = function(k,opt){
if(opt&2)
	return "<span style=\""+g._c+"\">"+(g[k]?g[k]:'notfound')+"</span>"
return _$('/span')._.add((opt&1) ? null:'\u00A0',_$('/span','style',g._c)._.add(g[k]),(opt&1) ? null:'\u00A0')
}//

__TXT.svg = function(k,y,opt){
if(!y)y=''
if(y.indexOf('height:')==-1)
	y+=';height:1em'
if(y.indexOf('vertical-align:')==-1){
	if(s[k][2]===undefined)
		y+=';transform:translate(0,15%)'
	else if(s[k][2])
		y+=';transform:translate(0,'+s[k][2]+')'
	}

var v = document.createElementNS("http://www.w3.org/2000/svg", "svg")
v.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/1999/xlink")
v.setAttribute('class', 'iconfont')
v.setAttribute('style', y?y:'')
v.setAttribute('viewBox', s[k][0]+' ')
var p = document.createElementNS("http://www.w3.org/2000/svg", "path")
v.appendChild(p)
p.setAttribute('d', s[k][1])
p.setAttribute('fill-rule', "evenodd")

return (opt&4) ? [v,'\u200b'] : ((opt&8)?['\u00a0',v,'\u00a0'] : v)

var v = _$('/span','innerHTML','<svg xmlns="http://www.w3.org/2000/svg" class="iconfont" viewbox="'+s[k][0]+'" style="'+(y?y:'')+'"><path d="'+s[k][1]+'" fill-rule="evenodd"></path></svg>').firstChild
return (opt&4) ? [v,'\u200b'] : ((opt&8)?['\u00a0',v,'\u00a0'] : v)
}//

})();




}//be

//============================
//主菜单=======================
commonui.mainMenuItems={
	//hisAddon:[100],
	hisDefLeft:[7,5,6,8,10,182,186,189],
	hisDef:[0,187,146,162],
	0:{subKeys:[144,18,118,147,184],
		title:'点此打开主菜单',
		innerHTML:'开始',
		className:'invert',
		check:function(){
			commonui.ingp()
			if(__GP.userBit&256){
				this.title='移动验证成功'
				this.className='teal'
				}
			if(__GP.infn)
				this.innerHTML='<div class="half">你好<br/>'+commonui.cutstrbylen(__GP.infn,7,6,'...')+'</div>'
			return 1
			}
		},//0为根菜单
	1:{href:'/thread.php?recommend=1',innerHTML:'精华主题',color:'#80C0C0'},
	2:{u:1,href:'/thread.php?favor=1',innerHTML:'收藏的主题',color:'#80C0C0'},
	3:{u:1,href:'/thread.php?authorid='+__CURRENT_UID,innerHTML:'我的主题',color:'#80C0C0'},
	/*
	4:{u:1,disableDefault:1,html:_$('/div')._.add(_$('/img').$0('src','about:blank','style',{display:'none'},'onerror',function(){
			var i = new Image(),self = this, x=commonui.loadCurUserPortrait(__CURRENT_AVATAR)
			i.src = x
			i.onreadystatechange=i.onload=function(){
				if(this&&this.readyState&&this.readyState!='complete')
					return
				this.onreadystatechange = this.onload=null
				self.parentNode._.css('borderLeft','0.5em solid #591804','height','100%','width',(this.width+2)+'px','background','#FFF0CD url('+i.src+') 1px '+(x.cY ? x.cY*100 : 50)+'% no-repeat','boxShadow','#FFF0CD '+(x*2)+'px 0 '+x+'px -'+x+'px inset')
				}//
			}))},//头像预留
		*/
	5:{href:'https://nga.cn',innerHTML:'首页'},
	6:{href:'/',innerHTML:'论坛',className:'active'},
	7:{disableDefault:1,arg:['style','padding:0.2em 0.5em','href','/',
			typeof SVGRect === 'function' ? __TXT.svg('ngalogo','height:50px;fill:'+__COLOR.border0) : _$('/img','src',__IMG_STYLE+'/logo11-1.png','style',"height:50px")]},
	8:{href:'https://game.nga.cn/',innerHTML:'评分'},
	9:{href:'https://g.nga.cn/',innerHTML:'聚聚'},
	10:{href:'https://app.nga.cn/',innerHTML:'APP下载'},

	//22:{ innerHTML:'用户脚本',on:{event:'click',func:function(e){commonui.loadUserScript(__NUKE.position.dummyEvent(e))} }, check:function(){if(__CURRENT_UID)return true} },

	25:{u:1,href:'/nuke.php?func=ucp&uid='+__CURRENT_UID,innerHTML:'论坛用户中心',disableDefault:1,color:'#551200'},
	26:{u:1,href:'/nuke.php?func=message',innerHTML:'短消息',disableDefault:1,color:'sandybrown'},
	27:{u:1,
		check:function(){
			if(commonui.userCache)
				return true
			},
		innerHTML:'提醒信息',
		on:{
			event:'click',
			func:function(){
				if(commonui.notification)commonui.notification.openIndex()
				else commonui.loadNotiScript(function(){commonui.notification.openIndex()})
				}
			},
		color:'sandybrown'
		},

	93:{u:1,href:'/thread.php?fid=357',innerHTML:'收藏的版面',check:function(){if(window.__GP && __GP['rvrc'] && __GP['rvrc']>=20)return true}},
	//94:{ innerHTML:'考古学',href:"http://wow.178.com/kaogu/" },
//95:custombg
//96:autodomain
	97:{ innerHTML:'控制台',on:{event:'click',func:function(e){commonui.console.open()} } },
	//98:{innerHTML:'游戏数据库',href:"http://db.178.com/d3/"},
	//99:{innerHTML:'技能模拟器',href:"http://db.178.com/d3/calculator/bar.htm"},
	//100:{ check:function(){if(!(__SETTING.bit & 4))return true},innerHTML:'魔兽点卡充值',href:"http://wow.178.com/200909/47347481167.html" },
	101:{ innerHTML:'设置头像',on:{event:'click',func:function(e){commonui.setAvatar(e,__CURRENT_UID)}} },
	102:{ innerHTML:'设置签名',on:{event:'click',func:function(e){commonui.setSign(e,__CURRENT_UID)}} },
	//103:{ innerHTML:'用户脚本',href:"/nuke.php?func=user_script" },
	104:{u:1,href:'/thread.php?searchpost=1&authorid='+__CURRENT_UID,innerHTML:'我的回复',color:'#80C0C0'},
	//105:{u:1,href:'http://i.178.com/?_app=index&_controller=index&_action=index&uid='+__CURRENT_UID,innerHTML:'178用户中心',color:'#551200'},
	
	//106:{href:'http://db.178.com/d3/calculator/dps.htm',innerHTML:'DPS计算器'},
	
	107:{ innerHTML:'物品/道具',color:'gray',check:function(){
			if(window.__CURRENT_UID)
				return true
			},on:{event:'click',func:function(e){
		if(commonui.userItem)
			commonui.userItem.open()
		else
			loader.script(__SCRIPTS.userItem,function(){commonui.userItem.open()} )
		} } },

	108:{u:1,check:function(){if(__GP.admin)return true},innerHTML:'管理密码输入',on:{event:'click',func:function(e){commonui.adminPassInput()}}},
	109:{u:1,check:function(){if(__GP.greater)return true},href:'/nuke.php?func=modifymedal',innerHTML:'论坛徽章设置'},
	110:{u:1,check:function(){if(__GP.admin)return true},href:'/nuke.php?func=modifygroup',innerHTML:'用户组设置'},
	111:{u:1,check:function(){if(__GP.admin)return true},href:'/nuke.php?func=modifyforum',innerHTML:'版面设置'},
	112:{u:1,check:function(){if(__GP.admin)return true},href:'/nuke.php?func=modifyreputation',innerHTML:'论坛声望设置'},
	113:{u:1,check:function(){if(__GP.admin)return true},href:'/nuke.php?func=listuser',innerHTML:'统计'},
	
	114:{on:{event:'click',func:function(e){commonui.mainMenu.menuOpen(e)}},innerHTML:'开始',className:'invert',disableDefault:1},
//115:{u:0,href:'https://'+location.hostname+'/nuke.php?__lib=login&__act=login_ui', target:'_blank',innerHTML:'登录',disableDefault:1,on:{event:'click',func:function(e){
	//	if(__SETTING.bit&24){
	//		this.target=''
	//		this.href=this.href.replace(/(?:&url=.+)|$/,'&url='+encodeURIComponent(location.href))
	//		}
	//	}}},

	115:{arg:['innerHTML','登录','href','/nuke.php?__lib=login&__act=account&login','_noiframeread',1,'onclick',function(e){commonui.accountAction('login');commonui.cancelBubble(e);commonui.cancelEvent(e)}],disableDefault:1},
	//117:{u:1,href:'/nuke.php?func=message', innerHTML:'短消息',disableDefault:1},
	116:{arg:['innerHTML','注册','href','/nuke.php?__lib=login&__act=account&register','_noiframeread',1,'onclick',function(e){commonui.accountAction('register');commonui.cancelBubble(e);commonui.cancelEvent(e)}],disableDefault:1},
	118:{u:1,innerHTML:'搜索',on:{event:'click',func:function(e){commonui.uniSearchWindow(e)}},disableDefault:1},
	119:{u:1,disableDefault:1,arg:['title','登出: 若你的帐号在其他终端登录本站, 亦可一并登出' ,'innerHTML','登出',
		'href','/nuke.php?__lib=login&__act=account&logout','_noiframeread',1,
		'onclick',function(e){commonui.accountAction('logout');commonui.cancelBubble(e);commonui.cancelEvent(e)}]
		},
	//120~140 for custom
	141:{ innerHTML:'界面设置',on:{event:'click', func:function(e){__SETTING.ui()} }},
	142:{ innerHTML:'移动验证器(beta)',on:{event:'click', func:function(e){commonui.extraAuthInput(e)} }},

	144:{u:1,innerHTML:'我的',subKeys:[25,158,146,1,2,3,104,93,107,101,102,154,168,177,178,179]},
	18:{innerHTML:'设置',subKeys:[95,141,108,142,109,110,111,112,113,152,153,155,156,157,164,167,169,170,172,173,174,175,188]},
	146:{innerHTML:'消息',subKeys:[26,27,148,161,163,180,181,185]},
	147:{ innerHTML:'道具',color:'gray',check:function(){
			if(window.__CURRENT_UID)
				return true
			},on:{event:'click',func:function(e){
		if(commonui.userItem)
			commonui.userItem.storeUi()
		else
			loader.script(__SCRIPTS.userItem,function(){commonui.userItem.storeUi()} )
		} } },
	148:{u:1,check:function(){if(__GP.ubSecAct)return true},href:'/nuke.php?func=message&asuid=34909933',innerHTML:'公共收件箱(帐号安全)',disableDefault:1,color:'sandybrown'},
	149:{arg:['innerHTML','修改密码','href','/nuke.php?__lib=login&__act=account&changepass','_noiframeread',1,'onclick',function(e){commonui.accountAction('changepass');commonui.cancelBubble(e);commonui.cancelEvent(e)}],disableDefault:1,u:1},
	150:{arg:['innerHTML','重置密码','href','/nuke.php?__lib=login&__act=account&resetpass','_noiframeread',1,'onclick',function(e){commonui.accountAction('resetpass');commonui.cancelBubble(e);commonui.cancelEvent(e)}],disableDefault:1,u:1},
	151:{href:'https://shop482085632.taobao.com',innerHTML:'商城'},
	152:{u:1,check:function(){if(__GP.ubMod)return true},innerHTML:'debug',on:{event:'click',func:function(e){commonui.userDebug()}}},
	153:{u:1,check:function(){if(__GP['super'] && __GP.ubStaff)return true},innerHTML:'杂项功能',on:{event:'click',func:function(e){adminui.updateSrc()}}},
	154:{u:1,check:function(){if(__GP.greater || __GP.rvrc>=200)return true},innerHTML:'随机头衔',on:{event:'click',func:function(e){commonui.randomTitle()}}},
	155:{check:function(){if(window.__DEBUG)return true},innerHTML:'NGA.CN',on:{event:'click',func:function(){location.href=location.href.replace(/:\/\/[^\/]+/,'://bbs.nga.cn')}}},
	156:{check:function(){if(window.__DEBUG)return true},innerHTML:'NGACN.CC',on:{event:'click',func:function(){location.href=location.href.replace(/:\/\/[^\/]+/,'://bbs.ngacn.cc')}}},
	157:{u:1,check:function(){if(__GP.ubStaff)return true},innerHTML:'设置版面图标',on:{event:'click',func:function(e){adminui.fIconGen()}}},
	158:{innerHTML:'账号设置'  ,subKeys:[149,150,159,166,171,176]},
	159:{arg:['innerHTML','绑定手机号','href','/nuke.php?__lib=login&__act=account&setphone','_noiframeread',1,'onclick',function(e){commonui.accountAction('setphone');commonui.cancelBubble(e);commonui.cancelEvent(e)}],disableDefault:1,u:1},
	160:{href:'http://tv.nga.cn/',innerHTML:'赛事'},
	161:{u:1,check:function(){if(__GP.ubStaff || __GP.lesser)return true},href:'/nuke.php?func=message&asuid=42686479',innerHTML:'公共收件箱(主题推荐)',disableDefault:1,color:'sandybrown'},
	162:{u:1,tagName:'span',disableDefault:1,innerHTML:function(){
		return ['\u00A0',
			_$('/input','id','menusearchinput','disabled',__SETTING.uA[0]==5?'disabled':'','style','width:8em','autocomplete','off','placeholder','\u2003\u2003\u2003\u2003\u2003 搜索','_on',function(){
				var o= this.__w
				if(!o){
					o = (this.__w = commonui.createCommmonWindow(2))
					o._.addContent(
						_$('/span')._.add(
							commonui.uniSearchInput(this)
							)	  
						)
					o.firstChild.lastChild.style.backgroundColor=__COLOR.bg4
					o.$0('style','left:0;top:0;visibility:hidden;display:block;boxShadow:none;borderTop:none;borderColor:'+__COLOR.gbg4+';marginTop:-1px')
					document.body.appendChild(o)
					o._b = (o.offsetWidth-o.clientWidth)/2+o.clientWidth
					var se = this
					commonui.aE(document.body,'click',function(e){
						var h = e.target || e.srcElement
						for(var i=0;i<10;i++){
							if(h==o||h==se.parentNode.parentNode)
								return console.log('p')
							h=h.parentNode
							if(!h)
								break
							}
						o._.hide()
						},false)
					}
				if(!o.parentNode)
					document.body.appendChild(o)
				if(o.style.display == 'none' || o.style.visibility == 'hidden' || o.style.opacity == 0){
					var p = this.parentNode.parentNode.getBoundingClientRect()
					o._.show(p.left+p.width-o._b,p.top+p.height)
					}
				},
				'onchange',function(){this._on()},
				'onclick',function(){this._on()}),
			'\u00A0']
			}
		,check:function(){if(__SETTING.uA[0]==5)setTimeout(function(){$('menusearchinput').disabled=''},2000);return 1}
		},
	163:{u:1,check:function(){if(__GP.superlesser && __GP.greater)return true},href:'/nuke.php?func=message&asuid=42766294',innerHTML:'公共收件箱(版务申诉)',disableDefault:1,color:'sandybrown'},
	164:{innerHTML:'提交debug信息',on:{event:'click',func:function(e){
			if(!confirm('是否要提交debug信息'))
				return
			var x=document.getElementsByTagName('head')[0].outerHTML+"\n"+document.body.outerHTML+"\n\n==============",y=document.getElementsByTagName('script')
			for(var i=0;i<y.length;i++){
				if(y[i])
					x+="\n"+y[i].src
				}
			__NUKE.doRequest({
				u:{u:__API._base,
						a:{__lib:"admin_code",__act:"upload_debug_info",data:binl2b64(str2binl(x)),raw:3}
						}
				})
			}}},
	165:{u:1,check:function(){if(__GP.ubMod && window.__DEBUG)return true},innerHTML:'new post',on:{event:'click',func:function(e){adminui.new_post()}}},
	166:{arg:['innerHTML','更换手机号','href','/nuke.php?__lib=login&__act=account&changephone','_noiframeread',1,'onclick',function(e){commonui.accountAction('changephone');commonui.cancelBubble(e);commonui.cancelEvent(e)}],disableDefault:1,u:1},
	
	167:{check:function(){if(__GP.ubStaff)return true},arg:['innerHTML','管理功能','onclick',function(e){if(adminui.admin_manage)return adminui.admin_manage();__API.evalFromServer('__lib','admin','__act','admin_manage_ui')}],disableDefault:1,u:1},
	
	168:{u:1,arg:['innerHTML','屏蔽帖子','onclick',function(e){commonui.blockword.ui()}]},
	
	169:{check:function(){if(__GP.ubStaff)return true},arg:['innerHTML','其他管理功能','onclick',function(e){__API.evalFromServer([e],'__lib','admin_code','__act','staff_console_ui')}]},
	170:{u:1,check:function(){if(__GP.ubStaff)return true},innerHTML:'设置版面图',on:{event:'click',func:function(e){adminui.fimgGen()}}},
	171:{arg:['innerHTML','注销账号','href','/nuke.php?__lib=login&__act=account&discard','_noiframeread',1,'onclick',function(e){commonui.accountAction('discard');commonui.cancelBubble(e);commonui.cancelEvent(e)}],disableDefault:1,u:1},
	172:{u:1,check:function(){if(__GP.ubStaff)return true},arg:['innerHTML','任务管理','href','/nuke.php?__lib=mission_manage&__act=mission_manage']},
	173:{u:1,check:function(){if(__GP.ubStaff)return true},arg:['innerHTML','N币商店管理','href','/nuke.php?__lib=black_store_manage&__act=goods_manage']},
	174:{u:1,check:function(){if(__GP.ubStaff)return true},arg:['innerHTML','任务管理2','onclick',function(e){
			__SCRIPTS.load('/nuke.php?__lib=mission_manage2&__act=ui_js&__output=2',function(){missionManage.list()})   }]},
	175:{u:1,check:function(){if(__GP.ubStaff)return true},arg:['innerHTML','邀请码管理','onclick',function(e){
			__SCRIPTS.load('/nuke.php?__lib=redeem&__act=ui_js&__output=2',function(){_REDEEM_CODE_MANAGE.list()})   }]},
	176:{arg:['innerHTML','更换邮箱','href','/nuke.php?__lib=login&__act=account&changemail','_noiframeread',1,'onclick',function(e){commonui.accountAction('changemail');commonui.cancelBubble(e);commonui.cancelEvent(e)}],disableDefault:1,u:1},
	177:{arg:['innerHTML','个人验证码','_noiframeread',1,'onclick',function(e){
		__NUKE.doRequest2(
			'f',function(d){if(d.error)return commonui.alert(d.error[0]);commonui.alert(d.data[0],'个人验证码')},
			'u','/nuke.php?__lib=ucp&__act=get_personal_checksum','__output',3)
		}],disableDefault:1,u:1}

	,178:{arg:['innerHTML','我关注的用户','onclick',function(e){
		if(commonui.myfollow)
			commonui.myfollow.get_follow()
		else
			__SCRIPTS.load('ucp',function(){commonui.myfollow.get_follow()} )
		}]}
	,179:{arg:['innerHTML','关注动态','onclick',function(e){
		if(commonui.myfollow)
			commonui.myfollow.get_push_list()
		else
			__SCRIPTS.load('ucp',function(){commonui.myfollow.get_push_list()} )
		}]}
	,180:{u:1,check:function(){if(__GP.staff)return true},href:'/nuke.php?func=message&uid=65642729&asuid=65642729',innerHTML:'公共收件箱(版面管理)',disableDefault:1,color:'sandybrown'}
	,181:{u:1,check:function(){if(__GP.staff)return true},href:'/nuke.php?func=message&uid=65640037&asuid=65640037',innerHTML:'公共收件箱(短信举报)',disableDefault:1,color:'sandybrown'}
	,182:{href:'https://bigfoot.178.com/',innerHTML:'魔兽世界大脚'}
	,183:null
	,184:{arg:['innerHTML','兑换码','onclick',function(e){__API.evalFromServer('__lib','redeem','__act','use_code')}],disableDefault:1,u:1}
	,185:{u:1,check:function(){if(__GP.staff||__GP.superlesser)return true},href:'/nuke.php?func=message&uid=65732430&asuid=65732430',innerHTML:'公共收件箱(广告监控)',disableDefault:1,color:'sandybrown'}
	,186:{href:'https://bigfootgames.178.com/', innerHTML:'大脚游戏中心'}
	,187:{subKeys:[115,119],innerHTML:'登录'}
	,188:{u:1,check:function(){if(__GP.staff||(__GP._bit&524288))return true},arg:['innerHTML','版面统计','onclick',function(){if(window.adminui)adminui.forumStat();else __SCRIPTS.load('admin',function(){adminui.forumStat()})} ]}
	,189:{href:'https://www.ngastore-hk.com/', innerHTML:'NGA游戏商城'}
	}


//============================
//版面icon====================
;(function(){
var f = [320,181,182,183,184,185,186,187,188,189,255,'10',306,'10',336,'10',190,213,218,258,272,191,200,240,274,315,333,327,318,332,321,7,-7,'354',354,310,323,264,10,335,18,13,16,12,8,102,254,355,116,193,201,230,334,335,29,387,388,390,391,-46468,393,394,395,396,397,398,399,-152678,403,-447601,-2371813,-65653,411,412,414,311,'414',420,422,-8725919,425,428,427,-7861121,-6194253,-84,431,430,435,432,442,444,445,426,-362960,452,-187579,-47218,-51095,-452227,-532408,459,-7202235,464,441,-1437546,469,463,474,406,446,-343809,476,477,486,'s8702375',492,-149110,124,494,490,501,482,480,497,-5080470,465,526,489,-81981,485,529,-547859,537,538,540,418,479,'418',545,'418',550,549,555,551,484,-4567100,'-4567100b',-353371,-608808,556,559,-15219445,560,563,-8180483,493,'493_1',564,568,0],
s= [8702375],
uf = window.__UFICON ? __UFICON : [],
us = window.__USICON ? __USICON : [],
g=function(y,x,z){
var p = y.indexOf(x|0)
return (p==-1) ? null : ( (y[p+1] && y[p+1].constructor==String) ? (y[p+1].charAt(0)=='?' ? x+z+y[p+1] : y[p+1]+z) : x+z )
}
if(!f.indexOf)
	f.indexOf=s.indexOf=uf.indexOf=us.indexOf=function(x){
		for(var i=0;i<this.length;i++)
			if(this[i]===x)
				return i
		return -1
		}
commonui.forumIcon = function(fid,stid){
var i
if(stid){
	if(i = g(s,stid,'.png'))
		return __IMG_STYLE+'/f/s'+i
	if(i = g(us,stid,'v.png'))
		return __IMG_BASE+'/proxy/cache_attach/ficon/'+i
	}
if(fid){
	if(i = g(uf,fid,'u.png'))
		return __IMG_BASE+'/proxy/cache_attach/ficon/'+i
	if(i = g(f,fid,'.png'))
		return __IMG_STYLE+'/f/'+i
	}
return __IMG_STYLE+'/f/00.png'
}//fe

})();

//============================
//首页========================
commonui.indexBlock = {

single: 0,
l:null,
r:null,
rr:null,
blkwd:null,
his:null,
data:null,

load:function (l,r,c,rr){
if(!window.__UICON_BASE)return

var self = this
if(this.data===null){
	var ee=1
	this.data = false
	return __NUKE.doRequest({
		u:window.__API.indexForumList(),
		f:function(d){
			var e = __NUKE.doRequestIfErr(d)
			if(e===true && ee){
				ee=false
				return;
				}
			if(e)
				return console.log(e)
			self.data = d.data[0]
			commonui.indexBlock.load(l,r,c,rr)
			return true
			}
		})
	}

if(commonui.waitForumViewHis()){
	var arg =arguments
	return commonui.waitForumViewHis(function(){commonui.indexBlock.load.apply(commonui.indexBlock,arg)})
	}

var x,h,w = window

if(this.single = (__SETTING.width<1200)){
	this.blkwd = $('mc').offsetWidth
	x = this.data.single
	}
else{
	this.blkwd = $('mc').offsetWidth/2
	x = this.data['double']
	}

this.blkwd = this.blkwd>800 ? 4 : 3

var hc=[]
commonui.eachForumViewHis(function(k,v,r){
	if(r<2 && v[2])
		hc.push({
			fid:v[0]|0,
			stid:v[5]|0,
			bit:65536,
			name:v[5] ? v[6] : v[1]
			})
	})
if(hc.length){
	this.add(hc,'fast',0)
	__NUKE.addCss(".indexblock .togcheckblock .togcheck {visibility:hidden;opacity:0;float:right;transition:display 0s linear 0s,opacity 0.3s ease-out;}  \n  .indexblock .togcheckblock:hover .togcheck {visibility:initial;opacity:0.5;}")
	}



if(w.__CURRENT_UID && w.__GP && w.__GP.userBit & 32){//当前用户有个人版
	for(var k in this.data.all.club.content){}
	this.add([ {fid:w.__CURRENT_UID*-1 , name:"我的个人版" , bit:1/*hight light*/} ],'other',k)
	}

if(this.added){
	for(var i in this.added){
		var k = i.split('\t'), y=this.data.all[k[0]].content
		y=y[k[1]]? y[k[1]] : y[0]
		if(k[2]|0)
			y.content[k[2]] = this.added[i]
		else{
			y[k[2]]=this.added[i]
			}
		}				
	}

var y='',z=''

for(var k in x[0]){
	if(this.data.all[x[0][k]])
		y+=this.genBlock( this.data.all[x[0][k]] )
	}
if(x[1]){
	for(var k in x[1]){
		if(this.data.all[x[1][k]])
			z+=this.genBlock( this.data.all[x[1][k]] )
		}
	}
else{
	r.style.display=c.style.display='none'
	l.style.width='100%'
	}

l.innerHTML=y
if(z)
	r.innerHTML=z

	


if ((w.ngaAds.bbs_ads26 || w.ngaAds.bbs_ads27) && !(w.__SETTING.bit & 16)){
	if(x[0] && x[1])
		var z = 75
	else
		var z = 150
	if(x[0])l.style.width=(l.offsetWidth-z)+'px'
	if(x[1])
		r.style.width=(r.offsetWidth-z)+'px', r.style.marginRight='5px'
	else
		l.style.marginRight='5px'
	rr.style.width='144px'
	rr.style.padding='4px 0px'
	rr.style.overflow='hidden'
	rr.style.height=(rr.parentNode.offsetHeight-8)+'px'
	rr.style.display='block'
	}

},//fe


added:null,

/*
将一个版面列表插入到某一块的末尾
x  array 数据数组 [版面数据,版面数据,版面数据 ...]
b  string 欲加入到的块ID 见this.data.all
c  int 欲加入到的子块ID
*/
add:function(x,b,c,i){
if(!this.added)
	this.added = []
var a = this.added
if(!i){
	i=10000
	for(var k in x){
	if(k!='length' && x[k])
		a[b+'\t'+c+'\t'+(i++)]=x[k]
		}
	}
else if(i=='headline'){
	if(!a[b+'\t'+c+'\t'+i])
		a[b+'\t'+c+'\t'+i]=[]
	var r=location.protocol
	for(var k=0;k<x.length;k+=2){
		var d = {txt:x[k]}
		x[k+1].replace(/\[(url|img)\](.+?)\[\/\1\]/g,function($0,$1,$2){
			if($1=='url')
				$2 = commonui.toRelUrl($2)
			else if($1=='img')
				$2 = commonui.correctAttachUrl($2)
			d[$1]=$2
			})
		a[b+'\t'+c+'\t'+i].push(d)
		}
	}
},//fe


addHeadline:function(x,b,c){
if(!this.added)
	this.added = []
var i=10000
for(var k in x){
	if(k!='length' && x[k])
		this.added[b+'\t'+c+'\t'+(i++)]=x[k]
	}
},//fe

genBlock :function(o){
//o = this.data.all[o]
if(o.id=='follow')
	return this.followBlock(o)
var c = ''
for (var k in o.content){
	if(o.content[k])
		c+=this.genSubBlock(o.content[k])
	}
if(!c.length)
	return ''
return "<span id='indexBlock"+o.id+"' class='indexblock'><div class='catenew "+(o.name || c.substr(0,6)!='</div>'?'':'x')+"'><h2 class='catetitle "+(o.name?'':'x')+"' "+(o.info?"title='"+o.info+"'":'')+">:: "+o.name+" ::</h2>"+c+"</div class='catenew'></span id='indexBlock'>"+ngaAds.bbs_ads29_gen(o.id)
//return "<span id='indexBlock"+o.id+"' class='indexblock'><h2 class='catetitle' "+(o.info?"title='"+o.info+"'":'')+">:: "+o.name+" ::<img src='about:blank' onerror='if(commonui.customBackgroundCheckHeight && commonui.customBackgroundCheckHeight(this.parentNode))this.parentNode.className+=\" invertThis\"' class='x'/></h2><div class='catenew' id='indexBlock"+o.id+"Content'>"+(o.pic?this.genPicTitle(o.pic):'')+c+"</div class='catenew'></span id='indexBlock'>"+ngaAds.bbs_ads29_gen(o.id)
},//fe

followBlock:function(o){
	return ''
if(!__CURRENT_UID)return ''
if(!(__GP.userBit & 8192))return ''
var c = "indexBlock"+o.id+"Content" , $ = _$, self = this

return "<span id='indexBlock"+o.id+"' class='indexblock'><div class='catenew' id='indexBlock"+o.id+"Content'><h2 class='catetitle' "+(o.info?"title='"+o.info+"'":'')+">:: "+o.name+" ::</h2>"+c+"</div class='catenew'><img src='about:blank' onerror='commonui.indexBlock.genSubFollow(this.previousSibling)' class='x'/></span id='indexBlock'>"+ngaAds.bbs_ads29_gen(o.id)
//return "<span id='indexBlock"+o.id+"' class='indexblock'><h2 class='catetitle' "+(o.info?"title='"+o.info+"'":'')+">:: "+o.name+" ::</h2><div class='catenew' id='indexBlock"+o.id+"Content'>"+(o.pic?this.genPicTitle(o.pic):'')+"</div class='catenew'><img src='about:blank' onerror='if(commonui.customBackgroundCheckHeight && commonui.customBackgroundCheckHeight(this.previousSibling.previousSibling))this.previousSibling.previousSibling.className+=\" invertThis\";commonui.indexBlock.genSubFollow(this.previousSibling)' class='x'/></span id='indexBlock'>"+ngaAds.bbs_ads29_gen(o.id)
},//fe

genSubFollow:function(c,st){
var $ = _$,c = $(c),
_QPK_TYPE = 0,
_QPK_AID = 1,
_QPK_TID = 2,
_QPK_PID = 3,
_QPK_RPID = 4,
_QPK_TIME = 5,
_QPK_MORE =6,

_P_TID = 0,
_P_FID = 1,
_P_PID = 2,
_P_TYPE = 3,
_P_AID = 4,
_P_TIME = 5,
_P_SUBJ = 6,
_P_CNT = 7,

_Q_TP_USER = 1,//uid发布了tid/pid 回复pid为reply_to的回复
_Q_TP_TOPIC = 2,//tid中uid发布了pid 回复pid为reply_to的回复
_Q_TP_POST = 4//tid中uid发布了pid 回复pid为reply_to的回复


httpDataGetter.script_muti_get({u:__API._base+"__lib=follow&__act=get_push&raw=3",a:{raw:3,start:st?st:0}},
	function(x){
		var e = __NUKE.doRequestIfErr(x)
		if(e)
			return c._.add( $('/table').$0('className','forumbox', 'style','border:none',
				$('/tr').$0(
					$('/td').$0('className','c1','style','padding:0.25em')._.add(e)
					)
				) )

		//console.log(x.data)
		var l = x.data[0][1],//一页数据 lib_follow::get_push_list
		t = x.data[0][2], p = x.data[0][3], u = x.data[0][4], max = x.data[0][0], nextStart = x.data[0][5], i=0, tb= $('/table').$0('className','forumbox', 'style','border:none'), b = $('/tbody'),  prev
		tb._.add(b)

		for(var k in l){
			for(var j in l[k]){//一组数据 lib_follow::get_push_list
				var d = prev = l[k][j], //一个数据
				r,//tr
				tt = t[d[_QPK_TID]],//相关主题信息
				pp//相关帖子信息

				if(d[_QPK_TYPE] & _Q_TP_USER){
					if(d[_QPK_PID])
						pp = p[d[_QPK_PID]]
					else
						pp = t[d[_QPK_TID]]
					}
				else if(d[_QPK_TYPE] & _Q_TP_TOPIC){
					pp = p[d[_QPK_PID]]
					}
				else if(d[_QPK_TYPE] & _Q_TP_POST){
					pp = p[d[_QPK_PID]]
					}

				r = $('/td').$0('className','c1','style','padding:0.25em')._.add(
					$('/span').$0('style','float:right')._.add(
						$('/span')._.cls('gray b stxt')._.add(commonui.time2date(d[_QPK_TIME] , 'y-m-d H:i '))
						),
					'('+k+')',
					$('/a').$0('href','/nuke.php?func=ucp&uid='+d[_QPK_AID],'className','uitxt4','target','_blank','innerHTML',u[d[_QPK_AID]]),
					d[_QPK_PID] ? ' 回复了 ' :  ' 发布了 ',
					$('/a').$0('href','/read.php?tid='+d[_QPK_TID],'className','uitxt3','target','_blank','innerHTML',t[d[_QPK_TID]][_P_SUBJ]),
					d[_QPK_RPID] ? ' 中的 ' : '',
					d[_QPK_RPID] ? $('/a').$0('href','/read.php?tid='+d[_QPK_TID]+'&to=1&pid='+d[_QPK_RPID],'className','uitxt3','innerHTML','回复') : '',
					$('/br'),
					$('/div').$0('className','postcontent ubbcode subtxt_color','style','padding:0.5em',
						'innerHTML',ubbcode.bbsCode({
							txt:pp[_P_CNT].substr(0,pp[_P_CNT].length-2)+'…',
							noImg:1,
							fId:0,
							tId:d[_QPK_TID],
							pId:d[_QPK_PID] ? d[_QPK_PID] : 0,
							authorId:pp[_P_AID],
							rvrc:__GP.rvrc,
							isSig:0,
							isLesser:0,
							isNukePost:(pp[_P_TYPE] & 2048) ? 1 : 0
							})+" <a href='javascript:void(0)' class='small_colored_text_btn block_txt_c0 xtxt' style='font-weight:normal' title='在弹出窗口中浏览这个帖子' onclick='ubbcode.fastViewPost(event,"+d[_QPK_TID]+","+d[_QPK_PID]+")'>&nbsp;+&nbsp;</a> <a href='/read.php?tid="+d[_QPK_TID]+(d[_QPK_PID]?"&pid="+d[_QPK_PID]+"&to=1":'')+"' class='small_colored_text_btn block_txt_c0 xtxt' target='_blank' style='font-weight:normal'>&nbsp;*&nbsp;</a>"
						)
					)
				b._.add($('/tr').$0('className','row'+(1+((i++)&1)), r ))
				}
			}
		b._.add(
			$('/tr').$0(
				$('/td').$0('className','c1','style','padding:0.25em')._.add(
					$('/a').$0('href','javascript:void(0)','className','uitxt3','innerHTML','查看更多1234','onclick',function(){
						var x = this.parentNode.parentNode,y=x.parentNode.parentNode.parentNode
						x.parentNode.removeChild(x)
						commonui.indexBlock.genSubFollow(y,nextStart)
						})
					)
				)
			)
		c._.add(tb)
		return true
		},
	function(){
		c._.add( 'error 2')
		}
	);


},//fe

genPicTitle :function(o){//txt,link,color,shadow
if(!o.shadow)o.shadow = '#000'
if(!o.color)o.color = '#A99877'
if(o.link)
	o.txt = "<a href='"+o.link+"' taeget='_blank' style='color:"+o.color+";text-shadow:"+o.shadow+" 2px 2px'>"+o.txt+"</a>"
else if(o.txt)
	o.txt = "<span style='color:"+o.color+";text-shadow:"+o.shadow+" 2px 2px'>"+o.txt+"</span>"
else
	o.txt = ''
if(o.pic.substr(0,7)!='http://')
	o.pic = __IMG_STYLE+o.pic
return "<div style='height:38px;font-size:18px;font-weight:bold;vertical-align:bottom;text-align:right;padding:5px'>"+o.txt+"</div><img src='about:blank' class='x' onerror=\"this.parentNode.style.backgroundImage='url("+o.pic+")';this.parentNode.style.backgroundRepeat='repeat-x'\"/>"
},//fe

row:0,

genSubBlock:function(o){//content,subWidth,name,dscp,icon,nameWidth
var c='',y,j=0,i=0,sw

y = this.blkwd
for (var k in o.content)
	if(o.content[k])j++
while(y>3 && Math.ceil(j/y)==Math.ceil(j/(y-1)))
	y--
sw = y==4 ? 24.998:(y==3 ? 33.333 : 49.998)

	
if(o.headline){
	for (var k in o.content)
		break
	if(!this.data.hd)this.data.hd= []
	this.data.hd.push(o.headline)
	c += "</div><div class='headline'"+( k?"":" style='margin:0 0 4px 0'")+"><img src='about:blank' style='display:none' onerror='commonui.indexBlock.genHeadline(this.parentNode,"+(this.data.hd.length-1)+")'/></div>"
	i++
	if(!k)
		return c
	c+="<div class='catenew'>"
	}

c+="<div class='contentBlock'>"+(o.name ? "<h3 class='catetitle'>:: "+o.name+" ::</h3>" : '')
var subclp
for (var k in o.content){
	if(o.content[k]){
		if(i%y==0)
			this.row = this.row==0?1:0
		if(o.content[k].clp){
			if(!subclp){
				subclp=1
				c+=this.genforum(o.content[k], null, i==0?1:0, y, i%y, this.row, sw)+'<span style="display:none">'
				}
			delete o.content[k].clp
			}
		c+=this.genforum(o.content[k], null, i==0?1:0, y, i%y, this.row, sw)
		i++
		}
	}
c+=(subclp?'</span>':'')+"<div class='clear'></div></div>"

if(!i)
	return '';

return (o.clp ? '<div class="contentBlock"><div class="c b3" style="width:100%;text-align:center"><div class="a"><div class="b"><a href="javascript:void(0)" onclick="var tmp = this.parentNode.parentNode.parentNode.parentNode;tmp.style.display=\'none\';tmp.nextSibling.style.display=\'\'" class="uitxt3"><span style="font-size:1.15em">显示更多版面</span></a></div></div></div><div class="clear"></div></div><span style="display:none">' : '')+c+(o.clp ? '</span>' :'')



},//fe
/*
genSubBlock :function(o){//content,subWidth,name,dscp,icon,nameWidth

var c='',y,j=0,i=0

	if (!o.subWidth || o.subWidth==33)
		y=3
	else if(o.subWidth==25)
		y=4
	else
		y=2

for (var k in o.content){
	if(o.content[k]){
		if(i%y==0)
			this.row = this.row==0?1:0
		c+=this.genforum(o.content[k], null, i==0?1:0, y, i%y, this.row)
		i++
		}
	}

if(!i)
	return '';


return (o.name ? "<h3 class='catetitle'>:: "+o.name+" ::</h3>" : '')+"<div class='c b2' style='float:none;width:auto;margin:0;height:auto'><div style='height:auto' class='b sw"+o.subWidth+"'>"+(o.clp ? '<div class="c b3" style="width:100%;text-align:center"><div class="a"><div class="b"><a href="javascript:void(0)" onclick="var tmp = this.parentNode.parentNode.parentNode;tmp.style.display=\'none\';tmp.nextSibling.style.display=\'\'" class="uitxt3"><span style="font-size:1.15em">显示更多版面</span></a></div></div></div><span style="display:none">' : '')+c+(o.clp ? '</span>' :'')+"<div class='clear'></div></div class='b sw'></div class='c b2'>"


},//fe
*/
genHeadline:function(o,h){
var x='', w= o.offsetWidth, y = w>800 ? 4 : (w>500 ? 3 : 2), m= function(){return Math.floor(Math.random()*256).toString(16).replace(/^.$/,function($0){return '0'+$0})},r = location.protocol
w = Math.floor((w+8)/y)-8
h = this.data.hd[h]
h.sort(function(x){return x.txt.substr(0,3)=='[1]' || Math.random()>0.5 ? 1 :-1})
for(var i =0;i<y;i++){
	var n = h[i]
	if(n){
		x+="<td style='width:"+w+"px;vertical-align:middle'><a href='"+n.url+"' target='_blank' style='width:"+w+"px;background:"+
			  (n.img ? "url("+n.img+") 50% 50%" : '#'+m()+m()+m())
			  +"'><span style='display:block;height:100%;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAeCAYAAADtlXTHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACdJREFUeNpi+P//PwMTAxSwMMEIVjjBBifYUVkclBLsWAyF2AsQYAD75QP1L3TI8AAAAABJRU5ErkJggg==) bottom repeat-x'>"+(n.txt.substr(0,3)=='[1]' ? n.txt.substr(3) : n.txt)+"</span></a></td><td></td>"
		}
	}
o.innerHTML = "<table style='width:100%;height:100%;' cellspacing='0' cellpadding='0'><tr>"+x.substr(0,x.length-9)+"</tr></table>"
},//fe

genforum :function(x,i,first,cpl,col,row, sw){

if(typeof x=='number')
	var x = this.index[x]
if(typeof x[1] == 'object')
	var link = x[2], icon = x[3], k=x[0], name = this.single && x[1][2]?x[1][2]:x[1][0], info = this.single && x[1][3]?x[1][3]:x[1][1], invert = x[4],stid
else if(x.name)
	var link = x.link, icon = x.icon, k=x.fid, stid=x.stid, name = this.single && x.nameS ? x.nameS : x.name, info = this.single && x.infoS ? x.infoS : x.info, invert = (x.bit & 1) || (x.time && __NOW-x.time<86400*7)
else
	var link = x[3], icon = x[4], k=x[0], name = this.single && x[5]?x[5]:x[1], info = this.single && x[6]?x[6]:x[2], invert = x[7],stid

var target=''
if(!link)link = commonui.domainSelect(k)+(stid ? "/thread.php?stid="+stid : "/thread.php?fid="+k)
else target = "target='_blank'"
if(!info)info=''
if(this.single && col==3){
	name = commonui.cutstrbylen(name,7,6,'…')
	info = commonui.cutstrbylen(info,10,9,'…')
	}
if(x.bit&65536)
	info = "<input class='togcheck' type=checkbox checked=checked onchange='commonui.lockViewHis("+(k|0)+", this.checked?1:0, "+(stid|0)+")'/>"
if(x.clp)
	return "<div class='"+this.bg[cpl+''+row+''+col]+' c b'+cpl+''+row+''+col+(invert?' invert':'')+(first?' first':'')+"' style='"+(sw?"width:"+sw+'%;':'')+"background-image:url("+this.getIcon(0)+")'><div class='a'><div class='b'><a href='javascript:void(0)' onclick='var tmp = this.parentNode.parentNode.parentNode;tmp.style.display=\"none\";tmp.nextSibling.style.display=\"\"' class='uitxt2'>显示更多&gt;&gt;</a><br/><p> </p></div class='b'></div class='a'></div class='c'>"
return "<div class='"
+this.bg[cpl+''+row+''+col]+' c b'+cpl+''+row+''+col+(invert?' invert':'')+(first?' first':'')+((x.bit&65536) ? ' togcheckblock':'')
+"' style='"
+(sw?"width:"+sw+'%;':'')
+(invert ? "background:url("+this.getIcon(k,icon,invert,stid)+") 2px 5px no-repeat, url(data:image/svg+xml;,"+encodeURIComponent('<svg width="42" height="42" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="19" fill="'+__COLOR.bg2+'"/></svg>')+") 2px 5px no-repeat,"+__COLOR.border0:"background-image:url("+this.getIcon(k,icon,invert,stid)+")")
+"'><div class='a'><div class='b'><a href='"+link+"' "+target+" class='"+(this.single?'uitxt3':'uitxt1')+"'>"+name+"</a><br/><p>"+info+" </p></div class='b'></div class='a'></div class='c'>"
},//fe

bg:{
'200':'b3 mol',
'201':'b4 mor',
'210':'b4 mol',
'211':'b3 mor',

'300':'b3 mol',
'301':'b4',
'302':'b3 mor',
'310':'b4 mol',
'311':'b3',
'312':'b4 mor',

'400':'b3 mol',
'401':'b4',
'402':'b3',
'403':'b4 mor',
'410':'b4 mol',
'411':'b3',
'412':'b4',
'413':'b3 mor'
},

change:function(d){
var o=d.previousSibling.previousSibling, w = o.offsetWidth, p = o.parentNode
p._saveChange = [ p.removeChild(o.nextSibling), p.removeChild(o), p.removeChild(d)]
_$(p)._.add(
	_$('/textarea').$0('style', 'height:2.4em;padding:1px;line-height:1.1em;width:90%', 'value', o.innerHTML+"\n"+d.innerHTML, 'onblur', function(){commonui.indexBlock.saveChange(this)})
	)
},//fe

saveChange:function(o){
var p = o.parentNode, n = o.value.match(/.+/g)
if(n&&n[0]){
	p._saveChange[1].innerHTML = n[0]
	p._saveChange[2].innerHTML = n[1]
	}
p.innerHTML = ""
p.appendChild(p._saveChange[1])
p.appendChild(p._saveChange[0])
p.appendChild(p._saveChange[2])
console.log( p._saveChange)
},//fe


getIcon:function (fid,icon,invert,stid){
if(icon){
	if(parseInt(icon,10))
		fid=icon
	else
		return icon
	}
fid = commonui.forumIcon(fid,stid)
if(invert)
	fid = fid+'.invert.png'
return fid
}//fe

}//ce


/**
 * 获取或者设置单一域名上的localStorage
 * @param {type} k key
 * @param {type} v v为函数时获取key的值并做作为v的参数执行 ， 为字符串时将key设置为v
 * @param {type} t 设置时使用的超时时间
 * @returns
 */
commonui.hostStg = function(k,v,t){
if(!this.hostStg.i){
	this.hostStg.i = _$('/iframe').$0('style','display:none','src', location.protocol+'//bbs.ngacn.cc/crossdomain.html','onload',function(){commonui.hostStg(k,v,t)})
	return document.body.insertBefore(this.hostStg.i,document.body.firstChild)
	}
if(typeof v=='function'){
	var n = 'hostGetStg'+Math.floor(Math.random()*100000)
	window[n] = function(a){
		v(a)
		window[n]=null
		delete window[n]
		}
	this.hostStg.i.contentWindow.postMessage('getStorage '+n+' '+k, location.protocol+'//bbs.ngacn.cc')
	//this.hostStg.i.src = location.protocol+'//bbs.ngacn.cc/crossdomain.html?call=getStorage&arg='+k+'&callback='+n
	}
else{
	this.hostStg.i.contentWindow.postMessage('setStorage null '+k+' '+t+' '+v, location.protocol+'//bbs.ngacn.cc')
	//this.hostStg.i.src = location.protocol+'//bbs.ngacn.cc/crossdomain.html?call=setStorage&arg='+k+' '+t+' '+v
	}
}//fe
/*
if(false){
commonui.genHisLink = function(h,f){
var x = _$('/span')._.cls('his_select_c'), self= this

this.hostStg('userCache_'+(window.__CURRENT_UID ? __CURRENT_UID : 0)+'_ForumViewHis', function(h){
	if(!h)
		return null
	h = __COOKIE.json_decode(h)
	if(!h)
		return null
	var $ = _$, t1='点击解除锁定', t2='锁定这个链接 (可添加到首页快速导航中)', sw = function(o,y){
		var x = (o.title == t1)
		self.lockViewHis(y[0],(x ? 0 : 1),y[5])
		o.title = x ? t2 : t1
		o.className = o.className.substr(0,17)+(x ? ' starleft' : ' starright')
		}
	for (var k in h){
		var y = h[k]
		x._.add(
			$('/span')._.add(
				$('/a').$0(
					//'name',y[0]+','+(y[5]?y[5]:''),
					'href','javascript:void(0)',
					'onclick',function(){sw(this,this.parentNode._.gV('data'))},
					'title',(y[2] ? t1:t2),
					'className','inlineBlock star '+(y[2] ? 'starright':'starleft')
					),
				$('/a').$0(
					'href',self.domainSelect(y[0])+'/thread.php?fid='+y[0],
					'innerHTML',y[1],
					f?'onclick':null,
					f? function(e){var z = this.parentNode._.gV('data');z['a']=z[5];delete z[5];var w= f(e,z);z[5]=z['a'];return w} : null
					),
				y[5] ? $('/br') : null,
				y[5] ? $('/a').$0(
					'className','teal sub',
					'href',self.domainSelect(y[0])+'/thread.php?stid='+y[5],
					'innerHTML',y[6],
					f?'onclick':null,
					f? function(e){f(e,this.parentNode._.gV('data'))} : null
					) : null
				)._.sV('data',y),
			$('/br')
			)
		}
	})

return x
}//fe

//锁定历史链接=================
commonui.lockViewHis = function (fid,lock,stid){
this.hostStg('userCache_'+(window.__CURRENT_UID ? __CURRENT_UID : 0)+'_ForumViewHis', function(h){
	h = h ? __COOKIE.json_decode(h) : {}
	var x=null
	for (var i in h){
		x=h[i]
		if (x && x[0]==fid && ( (stid || x[5]) ? x[5]==stid : true )){
			if(typeof lock=='undefined')
				lock=x[2] ? 0 : 1

			if (lock){
				x[2]=1
				delete x[3]
				delete x[4]
				}
			else{
				delete x[2]
				}
			commonui.hostStg('userCache_'+(window.__CURRENT_UID ? __CURRENT_UID : 0)+'_ForumViewHis',__COOKIE.json_encode(h),3600*24*30)
			return lock
			}
		}
	})
}//fe

commonui.addForumViewHis = function(n,id,stidN,stid,p)
{
this.hostStg('userCache_'+(window.__CURRENT_UID ? __CURRENT_UID : 0)+'_ForumViewHis', function(h){

	h = h ? __COOKIE.json_decode(h) : {}

	var p = p|0
	if(!h || typeof(h[0])!='object'){
		h={0:{0:id,1:n}}
		if(stid){
			h[0][5] = stid
			h[0][6] = commonui.cutstrbylen(stidN,11,10,'...')
			}
		if(p)h[0][7] = p
		commonui.hostStg('userCache_'+(window.__CURRENT_UID ? __CURRENT_UID : 0)+'_ForumViewHis',__COOKIE.json_encode(h),3600*24*30)
		return
		}

	var l=null,x=null,limit=22,d,lock,dis,lc=false
	for (var i=0;i<limit;i++){
		if(!h[i]){
			l = i//l is last space
			break
			}
		if(!h[i][2])//l is last unlock
			l = i
		if(id==h[i][0] && 
			( (stid || h[i][5]) ? h[i][5]==stid : true )
				){//if fid hit
			if(lc===false){
				lc=0
				for(var k in h){
					if(h[k][2])
						lc++
					}
				}

			if(lc<8){//少于8个检查自动锁定
				//add hit count
				d=new Date
				d = Math.floor( (d.valueOf()/1000-d.getTimezoneOffset()*60)/86400 ) //本地时间的1970 1 1到当前的天数
				dis = d-h[i][3]
				if(dis<0)//old
					h[i][4] = 0
				else if(dis<1)//当天每次+1
					h[i][4]++
				else if(dis>=1 && dis<2)//隔天+10
					h[i][4]+=10
				else//隔两天重置到10
					h[i][4]=10

				h[i][3]=d

				if(h[i][4]>40)
					lock = true

				}

			//l=i
			x=h[i]
			if(h[i][1]!=n)//if forum rename
				h[i][1] = n
			if(stid && h[i][6]!=stidN)//if set rename
				h[i][6] = stidN
			if(p)h[0][7] = p
			break	
			}
		}

	if(x && x[2])//if hit a lock
		return true


	if(l!==null){//l is the last nolock or last space
		for (var i=l;i>0;i--)
			h[i]=h[i-1]
		h[0]=x ? x : {0:id,1:n,3:d,4:1}
		if(stid){
			h[0][5] = stid
			h[0][6] = this.cutstrbylen(stidN,11,10,'...')
			}
		if(p)h[0][7] = p
		commonui.hostStg('userCache_'+(window.__CURRENT_UID ? __CURRENT_UID : 0)+'_ForumViewHis',__COOKIE.json_encode(h),3600*24*30)
		if(lock)
			this.lockViewHis(id,true)
		return x ? true : false
		}
	})
}//fe

}//if
*/
//============================
//特定domain补=================
;(function(){
//if(!window.__DEBUG)return;
var x = location.hostname, p = location.protocol+'//', l = __LASTDOMAIN, uid = window.__CURRENT_UID?__CURRENT_UID:0

if(x=='bbs.bigccq.cn'){
	commonui.mainMenuItems[7].innerHTML=''
	commonui.customBackgroundLogo =''
	commonui.advNav.rootName = 'CCQ'
	}
else{
	commonui.customBackgroundLogo = __IMG_STYLE+'/logoshadow6.png'
	commonui.advNav.rootName = 'NGA'
	}

commonui.domainIdToHost=function(id){
switch(id){
	case '1':
		return 'bbs.ngacn.cc';
		break;
	case '2':
		return 'nga.178.com';
		break;
	case '4':
		return 'bbs.bigccq.cn';
		break;
	case '3':
	default:
		return 'bbs.nga.cn';
	}
}//fe

var y= p+commonui.domainIdToHost(__LASTDOMAIN.charAt(3))

commonui.domainSelect=function(fid){
	return ''
if(fid==-7){
	if(x!='bbs.bigccq.cn')
		return p+'bbs.bigccq.cn'
	}
else if(fid){
	if(x=='bbs.bigccq.cn')
		return y
	}
return ''}//fe
/*
commonui.storageSync = function(){
if(!l || l.charAt(0)==l.charAt(1) || !window.domStorageFuncs)return
var y = this.domainIdToHost(l.charAt(1)),
i = _$('/iframe').$0('style','display:none','src',p+y+'/crossdomain.html?call=getStorage&arg=userCache_'+uid+'_ForumViewHis&callback=storageSyncFVHCallback')
document.body.insertBefore(i,document.body.firstChild)
}//fe

window.storageSyncFVHCallback = function(a){
try{
	a = __COOKIE.json_decode(a)
	}catch(err){return}
var h = commonui.userCache.get('ForumViewHis'),i=0,j=0
for(var k in h){
	i++
	if(h[k][2])
		j++
	}
for(var k in a){
	i--
	if(a[k][2])
		j--
	}
if(j<0 || (j==0 && i<0)){
	commonui.userCache.set('ForumViewHis',a,3600*24*30)
	}
}//fe
*/
})();

