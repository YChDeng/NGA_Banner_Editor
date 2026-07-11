/*
========================
FOR NGACN ONLY
------------
(c) 2005 Zeg All Rights Reserved
========================
bbs.ngacn.cc 广告列表 v1.00
written by zeg 20051010
========================

/* 总表 */
if(!window.ngaAds){
	ngaAds = [];
	ngaAds.location = window.location
	}

ngaAds.maxw=function(){
if(this.maxw.w)return this.maxw.w
return this.maxw.w = __NUKE.position.get().cw-__COLOR.mwm*2-7*2 //广告padding和border
}//

ngaAds.ignore = function(){//一些版面忽略广告
//if(',516,579,578,648,562,665,-152678,479,594,418,'.indexOf(','+window.__CURRENT_FID+',')>-1)
//	return 1
}//

ngaAds.loadGroup=function(g){
if(g=='read' || g=='thread' || g=='other'){
	if(ngaAds.ignore())
		return
	//this.cacheLoadByName('bbs_ads12')
	this.cacheLoadByName('bbs_ads1')
	if(g=='read'){
		this.cacheLoadByName('bbs_ads24')
		this.cacheLoadByName('bbs_ads45')
		if(window.__CURRENT_UID)
			this.cacheLoadByName('bbs_ads22')//
		this.cacheLoadByName('bbs_ads49')
		}
	else if(g=='thread'){
		if(window.__CURRENT_UID)
			this.cacheLoadByName('bbs_ads22')
		this.cacheLoadByName('bbs_ads50')
		}
	else
		this.cacheLoadByName('bbs_ads51')
	}
else if(g=='app'){

	}
else if(g=='mobi'){
	if(ngaAds.ignore())
		return
	this.cacheLoadByName('bbs_ads44')
	this.cacheLoadByName('bbs_ads46')
	this.cacheLoadByName('bbs_ads47')
	//this.cacheLoadByName('bbs_ads48')
	}
else if(g=='insert')
	this.cacheLoadByName('bbs_ads12')
}//

ngaAds.style =function(x) {
var bg = window.__APPEMBED ? __COLOR.bg6 : __COLOR.gbg1
,sh = window.__APPEMBED ? 'none' : (' 0 0 5px 0 '+__COLOR.gbg0+' inset')
switch(x){
	case 'bbs_ds32':
		return 'background:'+bg+';box-shadow:'+sh+';margin-top: -0.4em;'
	case 'bbs_ds32_a':
		return 'color:#ddd;'
	case 'adsc1':
		return 'margin-bottom:'+__COLOR.spc+'px;overflow:hidden;'
	case 'adsc10':
		return 'border-top:3px solid '+__COLOR.border0+';border-bottom:3px solid '+__COLOR.border0+';'
	case 'adshid':
		return 'width:0px;height:0px;padding:0px;margin:0px;font-size:0px;line-height:0px;overflow:hidden;'
	case 'adsc':
		return 'background:'+bg+';box-shadow:'+sh+';vertical-align:top;padding:5px 0;text-align:center;'
	case 'adsh':
		return 'background:'+bg+';box-shadow:'+sh+';padding:0.416em;width:192px;text-align:center;vertical-align:top;'
	case 'dslabel':
		return 'line-height:1.1em;font-size:0.583em;letter-spacing:0.25em;'
	}
}


/*
ngaAds.push( {
	date: "01/5/2015-01/30/2015",
	id: "bbs_ads32",
	rate: "33",
	title: "风暴英雄国服测试发码活动",
	url: "/read.php?tid=7758611"
	})
ngaAds.push( {
	date: "01/5/2015-01/30/2015",
	id: "bbs_ads32",
	rate: "33",
	title: "欢乐甲午年 2014年终盘点",
	url: "/read.php?tid=7727592"
	})
ngaAds.push( {
	date: "01/5/2015-01/30/2015",
	id: "bbs_ads32",
	rate: "33",
	title: "小窗大世界 旅游攻略征集",
	url: "/read.php?tid=7756429"
	})
*/


ngaAds.count32 = 0
/*bbs_ads32 一二楼上文字 */
ngaAds.bbs_ads32_gen = function(){
if(__SETTING.bit & 4)
	return ''
if ((this.count32++ <= 1) && this.bbs_ads32)
	return "<span class='small_colored_text_btn' style='"+this.style('bbs_ds32')+"'>"+this.genAds(this.bbs_ads32, this.style('bbs_ds32_a'))+"</span> "
return ''
}

ngaAds.count31 = 0
/*
 * 主题阅读页第一贴上通栏 900×60    bbs_ads1   bbs_ads31   bbs_ads46(mobilebackup_640*150  bbs_ads55(mobile
 * 主题阅读页第十贴上通栏 900×60    bbs_ads33   bbs_ads48(mobile
 * //bbs_ads40 一楼上左半
 * //bbs_ads41 一楼上右半
 * //bbs_ads42 十楼上左半
 * //bbs_ads43 十楼上右半
 */
ngaAds.bbs_ads31_gen = function(id,pl){
ngaAds.count31++
if(ngaAds.count31>20)
	ngaAds.count31 = 1

if(!pl)
	pl=ngaAds.count31

if(pl == 1)
	var b = (__SETTING.bit & 4) ? ['bbs_ads55','bbs_ads46'] : ['bbs_ads1', 'bbs_ads31']
else if(pl == 10)
	var b = (__SETTING.bit & 4) ? ['bbs_ads48'] : ['bbs_ads33']
else
	return
var x='',y=''
for(var i=0;i<b.length;i++){
	if(this[b[i]]){
		x+=this.genAds(this[b[i]], this.maxw(), null, (__SETTING.bit & 4) ? 640 : 900, (__SETTING.bit & 4) ? 150 : 90)
		if(b[i]=='bbs_ads55' && window.__APPEMBED && (this.bbs_ads55.spacerOnly & 2))
			y='display:none'
		}
	}
if(x){
	z=$(id).parentNode
	if(z.nodeName!='TABLE')z = z.parentNode
	z.parentNode.insertBefore(
		_$('/span','innerHTML',
			"<div style='"+this.style('adsc')+y+";border:1px solid "+__COLOR.bg0+";border-top:none;border-bottom:none'>"+x+"<div class='clear'></div></div>"
			),
		z.nextSibling)
	}
}//

/*
主题阅读页页尾(mc外 bbs_ads58(mobile app
*/
ngaAds.bbs_ads58_gen = function(){
if(this.bbs_ads58){
	var x='',y=''
	x=this.genAds(this.bbs_ads58, this.maxw(), null, (__SETTING.bit & 4) ? 640 : 900, (__SETTING.bit & 4) ? 150 : 90)
	if(window.__APPEMBED && (this.bbs_ads58.spacerOnly & 2))
		y='display:none'
	document.body.appendChild(_$('/span','innerHTML',
		"<div style='"+this.style('adsc')+y+";border:1px solid "+__COLOR.bg0+";border-top:none;border-bottom:none'>"+x+"<div class='clear'></div></div>"
		))
	}
}//


/* 
bbs_ads26 论坛首页右1 140*550~1100
bbs_ads27 论坛首页右2 140*550~1100 
*/

function bbs_ads26_27(){/*
if(__SETTING.bit & 8)
	return
var x = ngaAds
if (x.bbs_ads26)
	put(x.genAds(x.bbs_ads26));

if (x.bbs_ads27){
	if(x.bbs_ads26)put("<div style='width:auto;border:none;padding:0;margin:0;float:none;height:20px;font-size:0px;line-height:0px'></div>")
	put(x.genAds(x.bbs_ads27));
	}
*/
}//

/*小屏没有
 论坛阅读帖子页面（看帖）0楼右侧190*400 bbs_ads8		bbs_ads24(优先级高于bbs_ads8)		bbs_ads45(与bbs_ads24不同高度互换 自动选择)
 论坛阅读帖子页面（看帖）1楼右侧190*400 bbs_ads21		bbs_ads25(优先级高于bbs_ads21)
 论坛阅读帖子页面（看帖）2楼右侧190*400  bbs_ads17
 */
ngaAds.bbs_ads8_preload = function(){

}//fe
ngaAds.bbs_ads8_load_new = function(o,i,fid){
if(i>2 || o.parentNode.tagName!='TR' || __SETTING.currentClientWidth<1200 || __SETTING.bi.size7)
	return
var a,t=this;
if(i==0)
	a = t.bbs_ads24 ? t.bbs_ads24 : (t.bbs_ads45 ? t.bbs_ads45 : (t.bbs_ads8 ? t.bbs_ads8 : null) )
else if(i==1)
	a = t.bbs_ads25 ? t.bbs_ads25 : (t.bbs_ads21 ? t.bbs_ads21 : null)
else if(i==2)
	a = t.bbs_ads17 ? t.bbs_ads17 : null
if (a)
	{
	//if (typeof(a.file)=='object'){
	//	if (a.file['f'+fid])
	//		a.file = a.file['f'+fid];
	//	else
	//		a.file = a.file['default'];
	//	}
	t.bbs_ads8_load_new[i] = o
	_$(o).$0('style',this.style('adsh')+"width:"+(a.width|0?(a.width|0)+2|0:192)+"px;display:;",'className',null)
	return 1
	}
}//fe
ngaAds.bbs_ads8_load_new_load = function(i){
if(i>2 || !this.bbs_ads8_load_new[i])return
var t = this
if(i==0){
	if(t.bbs_ads24 && t.bbs_ads45){
		var x = t.bbs_ads8_load_new[i].offsetHeight
		if(x>t.bbs_ads24.height && x>t.bbs_ads45.height)
			x = t.bbs_ads24.height > t.bbs_ads45.height ? t.bbs_ads24 : t.bbs_ads45
		else
			x = t.bbs_ads24.height > t.bbs_ads45.height ? t.bbs_ads45 : t.bbs_ads24
		}
	else
		x = t.bbs_ads24 ? t.bbs_ads24 : (t.bbs_ads45 ? t.bbs_ads45 : (t.bbs_ads8 ? t.bbs_ads8 : null) )
	}
else if(i==1)
	x = t.bbs_ads25 ? t.bbs_ads25 : (t.bbs_ads21 ? t.bbs_ads21 : null)
else if(i==2)
	x = t.bbs_ads17 ? t.bbs_ads17 : null
if(x)
	t.bbs_ads8_load_new[i].innerHTML = this.genAds(x , 190, null, 190, 400)
}//



/*
 * 论坛首页上通栏 900×60		bbs_ads1  bbs_ads46(mobilebackup  bbs_ads56(mobile
 */
ngaAds.bbs_ads1_gen=function(){
var b
if(__SETTING.bit & 4)
	b = this.bbs_ads56 ? this.bbs_ads56 : this.bbs_ads46
else
	b = this.bbs_ads1
if (b)
	return "<div style='"+this.style('adsc')+this.style('adsc1')+"'>"+this.genAds(b,this.maxw())+'</div>'
return ''
}

/*
论坛帖子列表页面（版面）中通栏 900*60		bbs_ads1 bbs_ads9 bbs_ads23 bbs_ads28 bbs_ads46(mobilebackup 640*150  bbs_ads57(mobile
*/
ngaAds.bbs_ads9_gen=function(){

if(!window.__CURRENT_FID || window.__CURRENT_TID)
	return
var b = (__SETTING.bit & 4) ? ['bbs_ads57', 'bbs_ads46'] : ['bbs_ads1', 'bbs_ads9', 'bbs_ads23'], x=''

for(var i=0;i<b.length;i++){
	if(this[b[i]])
		x+=this.genAds(this[b[i]], this.maxw(), null, (__SETTING.bit & 4) ? 640 : 900, (__SETTING.bit & 4) ? 150:90)
	}

if(x){
	var y = $('toptopics').nextSibling
	while(y.nodeType!=1)
		y = y.nextSibling

	y.innerHTML += "<div style='"+this.style('adsc')+";margin-bottom:"+__COLOR.spc+"px;'>"+x+"</div>"
	}
}//fe



ngaAds.open_69124=function(e,u,h){
if(!this.open_69124.w){
	this.open_69124.w = commonui.createCommmonWindow()
	this.open_69124.w._.addContent(null)._.addContent(
		_$('/iframe').$0('src',u,'style',{margin:'0px',overflow:'hidden',width:'100%',height:h+'px',border:'none'})
		)
	}
this.open_69124.w._.show(null,null,2)
}//fe

ngaAds.bbs_ads30_gen = function(){

}//fe

/*
 * 主题列表页下部导航下通栏 900×60  bbs_ads50 bbs_ads14(backup bbs_ads47(mobilebackup_640*150 bbs_ads52(mobile
 * 主题阅读页下部导航下通栏 900×60 bbs_ads49 bbs_ads14(backup bbs_ads47(mobilebackup bbs_ads53(mobile
 * 首页下部通栏 900×60            bbs_ads51 bbs_ads14(backup bbs_ads47(mobilebackup bbs_ads54(mobile
 * bbs_ads34
 * bbs_ads35
 * bbs_ads36
 * bbs_ads37
 * bbs_ads38
 * bbs_ads39
 * */
ngaAds.bbs_ads14_gen = function(){
//if(window.__CURRENT_TID)//主题
//	var b = 
//else if(window.__CURRENT_FID)//版面
	
//else//首页
var x='', b
if(__SETTING.bit & 4){
	if(this.location.pathname=='/read.php')
		b = this.bbs_ads53
	else if(this.location.pathname=='/thread.php')
		b = this.bbs_ads52
	else
		b = this.bbs_ads54
	if(!b && this.bbs_ads47)
		b = this.bbs_ads47
	}
else{
	if(this.location.pathname=='/read.php')
		b = this.bbs_ads49
	else if(this.location.pathname=='/thread.php')
		b = this.bbs_ads50
	else
		b = this.bbs_ads51
	if(!b && this.bbs_ads14)
		b = this.bbs_ads14
	}

if(b)
	x+=this.genAds(b,this.maxw(), null, (__SETTING.bit & 4) ? 640 : 900, (__SETTING.bit & 4) ? 150 : 90)

if(x){
	var y = $('b_nav')
	if(!y)y = $('m_cate5')
	y.appendChild( _$('/div','style',this.style('adsc')+'marginBottom:'+__COLOR.spc+'px;','innerHTML',x,_$('/div','className','clear')))
	}
}

/*论坛全页面中转			bbs_ads12*/
//代码在js_default.js


/*半擎天柱组合A 论坛帖子列表页面（版面）底部快速发帖右侧 190*400 bbs_ads16*/
/*阅读帖子页面底部快速发帖右侧 190*400 bbs_ads22*/
ngaAds.bbs_ads16_gen=function(){
if(__SETTING.bit & 4)
	return null

/*
var ad = null
if (this.ckurl('/thread.php')){
	if (this.bbs_ads24)
		this.bbs_ads16=this.bbs_ads24
	if (this.bbs_ads16)
		ad = this.genAds(this.bbs_ads16)
	}
if (this.bbs_ads22 && this.ckurl('/read.php'))
	ad = this.genAds(this.bbs_ads22)
if (ad)
	return _$('/td').$0('id','bbs_ads16','className','adsh','innerHTML',ad)
*/
if (this.bbs_ads22)
	return _$('/td','className','c2','style','verticalAlign:top;padding:0;width:'+((this.bbs_ads22.width|0)+2+12)+'px',
		_$('/div','style', this.style('adsh')+'verticalAlign:middle;padding:6px;'+(this.bbs_ads22.width ? 'width:'+((this.bbs_ads22.width|0)+2)+'px;' : ''),'innerHTML',this.genAds(this.bbs_ads22, 190, null, 190, 400))
		)
return null
}

/**/
ngaAds.bbs_ads29_gen = function(id){
if((__SETTING.bit & 8)==0 && id==1 && this.bbs_ads29)
	return "<div style='"+this.style('adsc')+"' style='margin-top:1em'>"+this.genAds(this.bbs_ads29)+"<div class='clear'></div></div>"
return ''
}
	
//移动页面下浮动 固定尺寸比例640*150
ngaAds.bbs_ads44_gen = function(){
if((__SETTING.bit & 16) && this.bbs_ads44)
	return _$('/div','style',this.style('adsc'),_$('/div','innerHTML',this.genAds(this.bbs_ads44,this.maxw(), null, 640, 150)))
return null
}//
ngaAds.bbs_ads44_perproc = function(x){
return x
}

/*特殊广告加载*/
ngaAds.loadCustomAds=function(arg)
{/*
if (arg.uid && parseInt(arg.uid,10)==3213167){
ngaAds['bbs_ads23'] = {
	'id':'bbs_ads23',
	'file': __IMG_BASE+'/misc/self/tmp090903.jpg',
	'url':'',
	'title':'',
	'width':'900',
	'height':'60',
	'date':'8/4/2009-8/30/2009',
	'rate':100,
	'nolog':1,
	'type':''
	}
}*/
}//fe











/*
ngaAds.push({
	'id':'bbs_ads21',				//广告位ID
	'file':'http://xin.178.com/s/zt/sc2.html',		//文件 图片 或 flash 或 嵌入页面地址 如果为空则使用文字链接 文字为.title
	'url':'',			//链接地址 如flash自带链接则不必填写
	'title':'178新游推荐',			//图片说明 flash不必填写
	'width':'190',				//宽度(像素数，比如190)
	'height':'400',				//高度(像素数，比如400)
	'date':'3/17/2009-11/1/2009',	//日期(留空不显示此条广告) 比如 2/15/2006 7/1/2006-7/31/2006 8/1/2006-8/31/2006 意为在2月15日和7月与8月显示 如填all则为一直显示
	'rate':25,					//显示的几率（百分比），同一个广告位的所有当天显示的广告显示几率相加应不超过100，如超出100，则排在前面的优先（比如第一个70第二个60第三个20，实际则为第一个70第二个30第三个不显示）
	'nolog':1,					//为1时不统计点击数 0时统计点击数
	'type':'iframe'					//类型 如图片或flash广告留空 嵌入页面广告填iframe
	'onload':function(){...			//容器加载后运行 
	'onreset':function(){...		//无刷新重载页面时运行 返回true时不删除genlist的广告obj
});
*/
/*
ngaAds.push({
	'id':'bbs_ads17',
	'file':'http://wow.178.com/s/zt/sjk4.html',
	'url':'',
	'date':'all',
	'rate':15,
	'width':'190',
	'height':'400',
	'nolog':1,
	'type':'iframe'
});

// baidu
ngaAds.push({
	id:'bbs_ads14',
	//'file':'http://cpro.baidu.com/cpro/ui/cp.js',//cpro_client
	type:'baidu',
	date:'all',
	rate:100,
	cpro_id:'u1365489',
	ifShow:function(){
		if(window.__CURRENT_FID && (__CURRENT_FID==-7 || __CURRENT_FID==-152678) && location.pathname.indexOf('/thread.php')===0)
			return true
		}
});

// taobao

ngaAds.push({
	id:'bbs_ads29',
	'file':'http://p.tanx.com/ex?i=mm_44474956_4200394_13764006',//cpro_client
	type:'taobao',
	date:'all',
	rate:100,
	mmid:'tanx-a-mm_44474956_4200394_13764006'
});

ngaAds.push({
	'id':'bbs_ads13',
	'file':__IMG_BASE+'/misc/self/20060830.jpg',
	'url':'',
	'title':'提高防范意识，保护帐号安全',
	'width':'',
	'height':'',
	'date':'all',
	'rate':2,
	'nolog':1
});

ngaAds.push({
	'id':'bbs_ads13',
	'file':__IMG_BASE+'/misc/self/20060829.jpg',
	'title':'停止购买金币，让盗号无利可图',
	'date':'all',
	'rate':4,
	'nolog':1
});


*/

//版面

/*
(function(){
var fAds = []
//插件区
fAds.push({
	'file':'f1.jpg',
	'url':'200'
});
//作家
fAds.push({
	'file':'f2.jpg',
	'url':'102'
});
//圣光
fAds.push({
	'file':new Array('f184a.jpg','f3.jpg'),
	'url':'184'
});
//魔法
fAds.push({
	'file':'f4.jpg',
	'url':'182'
});
//猎手
fAds.push({
	'file':new Array('f187a.jpg','f5.jpg'),
	'url':'187'
});
//牧师
fAds.push({
	'file':'f6.jpg',
	'url':'183'
});
//术士
fAds.push({
	'file':'f7.jpg',
	'url':'188'
});
//der
fAds.push({
	'file':'f8.jpg',
	'url':'186'
});
//地精
fAds.push({
	'file':'f9.jpg',
	'url':'191'
});
//竞技
fAds.push({
	'file':'f10.jpg',
	'url':'272'
});
//战士
fAds.push({
	'file':new Array('f12.jpg','f181a.jpg'),
	'url':'181'
});
//萨满
fAds.push({
	'file':'f185.jpg',
	'url':'185'
});
//贼
fAds.push({
	'file':new Array('f189a.jpg','f189.jpg'),
	'url':'189'
});
//任务
fAds.push({
	'file':'f11.jpg',
	'url':'190'
});
var j = Math.floor(Math.random()*(fAds.length));
if (typeof(fAds[j]['file'])=='object')
	fAds[j].file = fAds[j].file[ Math.floor(Math.random()*fAds[j]['file'].length)]
ngaAds.push({
	'file':__IMG_BASE+'/misc/self/f/'+fAds[j]['file'],
	'url':'/thread.php?fid='+fAds[j]['url'],
	'id':'bbs_ads13',
	'date':'all',
	'rate':5,
	'nolog':1
});
})()
*/

/*
ngaAds.push({
	date: "02/19/2025",
	id: "bbs_ads51",
	rate: 100,
	title: "...",
	width:970,
	height:90,
	file:__IMG_BASE+'/misc/self/20250219/bbs_ads49.jpg',
	url: "https://ow.blizzard.cn"
	})
ngaAds.wait=0 //临时使用固定广告时关掉wait
*/






;(function(){
var tmp = window.navigator.userAgent.toLowerCase()
if(tmp.indexOf('iphone ')==-1  && tmp.indexOf('android')==-1)
	return

for(var k in ngaAds){//remove fullscreen for mobi
	if(ngaAds[k] && ngaAds[k].id && ngaAds[k].id=="bbs_ads12")
		ngaAds[k].date=null
	}
	/*
ngaAds.push( {
	date: "all",
	file: tmp.indexOf('ipad')!=-1 ? __IMG_STYLE+"/mobile_app_banner5.jpg" : __IMG_STYLE+"/mobile_app_banner4.jpg?342",
	height: "600",
	id: "bbs_ads12",
	nolog: "1",
	now: 1398355200000,
	rate: "100",
	refreshid: "",
	title: "",
	type: "",
	url: "http://app.178.com",
	width: "600"
	})
	*/
})();

