//============================
//版面主题列表杂项ui============
{

/**
置顶解析
opt &1折叠的置顶点击打开时(不限制高度), &2纵向置顶时(允许较大的图) &4允许较大的图但是较少高度 &8拆分表格成一列 &16拆分成两列 &32不拆分 &64(dont set this) &128允许高级功能
 */
commonui.parseToppedTopic = function(o,opt){
o.style.display='none'

if((opt&(8|16|32)) === 0)
	if(__SETTING.bit&8)
		opt|=8
	else if(__SETTING.bit&4)
		opt|=16
	else
		opt|=32


if((__SETTING.bit & (4|8|16|1024))==0 
	&& (opt&64)==0
	&& o.innerHTML.substr(0,13)=='[verticalTop]'){
	this.parseToppedTopic.sideToped = 1


	return this.parseToppedTopic.delayLoad = function(){
		var x = $('toptopics'),y=$('topicrows'),z= _$('/div','class','topicrowsLeftC')
		x.className+=' toptopicsRight'
		x.parentNode.removeChild(x)
		y.parentNode.replaceChild(z,y)
		z.appendChild(y)
		z.parentNode.insertBefore(x,z)
		opt&=(~(8|16|32))
		opt|=(2|8|64)
		commonui.parseToppedTopic(o,opt)
		return opt
		}
	}
opt &= ~64
this.parseToppedTopic.sideToped = opt&2 ? 1 : 0

if((__SETTING.bit & (1024 | 8)) && (opt&3)==0){//7inch embe
	o.parentNode.insertBefore(
		_$('/div','className','collapse_btn', 
			_$('/button','type','button','innerHTML','点击显示隐藏的置顶内容','onclick',function(){
				this.parentNode.style.display='none'
				this.parentNode.nextSibling.style.display=''
				commonui.parseToppedTopic(this.parentNode.nextSibling,1)
				})
			),
		o)
	return
	}

var x, y, z
if((x=o.getElementsByTagName('span')) && x[0] && x[0].id=='toptopicadd'){
	z='_toptopicadd_'+Math.random()+'_'
	o.replaceChild(document.createTextNode(z),x[0])
	}

x = o.innerHTML
if(x.match(/\[headline|fixsize/i))
	opt|=4
x = commonui.parseImgInToppedTopic(x).replace(/\[quote\]|\[\/quote\]/gi,'').replace(/^(\s*<br\s*\/?>\s*)+|(\s*<br\s*\/?>\s*)+$/gi,'').replace(/^\[verticalTop\]/,'')//.replace(/\s*<br\s*\/?>\s*\[size=\d+%\]\s*\[\/size\]/gi,'')

x = ubbcode.bbsCode({
	maxWidthO:o,
	//maxWidth:o.offsetWidth,
	txt:x,
	opt:4|1|16|
		( opt&2 ? 4096 : (opt&4?0:32) )
		| ( opt&8 ? 8192 : (opt&16 ? 16384 : 0) )
		| (opt&128 ? 32768 : 0)
		,
	noImg:(__SETTING.bit & 64)? 1:0,
	fId:window.__CURRENT_FID ? __CURRENT_FID : 0,
	//tId:tid,
	//pId:pid,
	//authorId:aid,
	//rvrc:rvrc,
	inTopImg:[0,0],
	isSig:0,
	//callBack: type & 4096 ? function(a){commonui.autoTranslate.main(a.c,a.fId)} : null,
	isLesser:true
	})
if(z){
	x = x.split(z)
	z = _$('/span','innerHTML',x[1].replace(/^(?:<br ?\/?>)*/,''))
	x=x[0].replace(/(?:<br ?\/?>)*$/,'')
	}


x = _$('/div','className','ubbcode','style',"maxHeight:"
			+( (opt&1) ? '' : ( (opt&2) ? '130em' : (opt&4?'23.05em':'54em') ))
			+";overflow:auto;"
		,'onclick',function(e){
			var o = e.target ? e.target : e.srcElement
			if(o.name=='collapseSwitchButton' || o.name=='randomblockButton')this.style.height=this.style.maxHeight=''
			}
		,'innerHTML',x)
if(opt&2)
	commonui.aE(null,'topicrowLoad',function(){
		if($('topicrows').offsetHeight){
			x.style.maxHeight=(
				x.getBoundingClientRect().height
				+($('topicrows').getBoundingClientRect().height-$('toptopics').getBoundingClientRect().height)
				)+'px'
			}
		})

o.innerHTML=''
o.appendChild(x)
if(z)
	o.appendChild(z)
o.style.display='block'

//if have scroll disable it
if(window.requestAnimationFrame && (opt&1)==0){
var i=0,dy = function(){
	if(x.scrollHeight - x.offsetHeight){
		var sw = x.offsetWidth-x.clientWidth
		x._noscroll=1
		x.style.overflow = 'hidden'
		if(sw)
			x.style.borderRight=sw+'px solid #ccc'
		x._.on('click',function(){
			if(this._noscroll){//remuse scroll onclick
				this._noscroll = 0
				this.style.overflow='auto'
				this.style.borderRight=''
				}
			})
		return
		}
	if(i++<10)
		window.requestAnimationFrame(dy)
	}
requestAnimationFrame(dy)
}//if

}//fe

commonui.parseToppedTopic.vTopWidth = 35//em
__NUKE.addCss(".topicrowsLeftC {margin-right:"+commonui.parseToppedTopic.vTopWidth+"em;} \n #m_threads .toptopicsRight {width:"+(commonui.parseToppedTopic.vTopWidth-0.5)+"em;float:right} ")


//窗帘生成======================
commonui.imgInToppedTopic={}
commonui.parseImgInToppedTopic = function(txt){

var j=0

txt = txt.replace(/\[(randomblock|iframe|flash|headline)=?([0-9,]+)?\](.+?)\[\/\1\]/ig , function($0,$1,$2,$3){
	j++
	if($1=='headline' || $1=='randomblock')return $0
	if( $1=='flash' && j==1)
		return '[flash]'+$3+'[/flash]'
	return '['+$1+' not load]'
	})

return txt
}//fe

//排序链接======================
commonui.setThreadOrder = function (o,oo)
{
var x = window.location.href.toLowerCase()
x = x.replace(/(?:(\?)|&)order_by=\w*/,'$1')
if (o=='postdatedesc' || o=='lastpostdesc'){
	if (x.substr(x.length-1)=='?')
		x+='order_by='+o
	else
		x+='&order_by='+o
	}
oo.href=x;
oo.onclick=function(){};
return true;
}//fe

commonui.threadOrder = function (o,oo)
{
if(oo){
	var x = location.href.replace(/(?:(\?)|&)order_by=\w*/,'$1')
	x+=(x.charAt(x.length-1)=='?'?'':'&')+'order_by='+(o?'postdatedesc' :'lastpostdesc')
	location.href=x;
	}
else{
	return _$('/div','style','border-radius:0.5em;width:1.5em;height:1.5em;lineHeight:1.5em;float:right;overflow:hidden;margin-top:-5px;background:'+__COLOR.border2,
		_$('/a','title',o?'按发布时间排序':'按最后回复时间排序','onclick',function(){commonui.threadOrder(o,this)},'innerHTML','&#9660;','style','fontSize:10px;color:#fff','href','javascript:void(0)')
		)
	
	}
}//fe


//主题分类转为连接==============
/***********************
*o (string 主题链接
*fid (string 主题的版面id
*stid (string 主题的合集id
*cfids (string 当前版面id 逗号分隔
*cstid (string 当前合集id
*/
;(function(){
var d = commonui.domainSelect, t=commonui.genTip, p = /\[.+?\]/g, c
commonui.topicLinkTipLoad = function (o,fid,stid,cfids,cstid){
if(c===undefined){
	c = window.__TOPIC_KEY_COLOR ? __TOPIC_KEY_COLOR : false
	if(typeof c=='string'){
		c = c.split("\t")
		var cc={}
		for(var i=0;i<c.length;i+=2){
			if(c[i+1]){
				var g = c[i].split(',')
				g[0] = g[0]|0
				g[2] = g[1]
				g[1] = (g[1]&16370) >> 4
				for(var j=1;j<=10;j++){//color1:16 ~ color10:8192
					if(g[1] & 1){
						g[1]=j
						break
						}
					g[1] = g[1]>>1
					}
				cc[c[i+1]] = g
				}
			}
		c=cc
		}
	}
var y = ''
o.innerHTML=o.innerHTML.replace(/\[.+?\]/g,function($0){
	y += "<a href='"+d(fid)+"/thread.php?key="+encodeURIComponent($0)+
			  (cstid ? '&stid='+cstid : ('&fid='+(cfids ? cfids : fid)))+
			  "'>"+$0+"</a> "
	if(c && c[$0])
		return '<span class="t_k_c'+c[$0][1]+'">'+$0+'</span>'
	else
		return '<span class="silver">'+$0+'</span>'})
if (y!='')
	t.add(o,y)
}//fe
})();



}//be





//============================
//版面主题列表格式化============
{
//数据输入=====================
commonui.topicArg = {
opt:0,
data:[],
add:function(
idReplies,idTopic,idAuthor,idPostTime,
idReplier,idReplyTime,idPagelinks,
fid,tid,pid,quoteTid,quoteFrom,postdate,lastpost,replies,
type,topicMisc,font,
avatar,admin,attath
){
idReplies = $(idReplies)
idTopic = $(idTopic)
idAuthor = $(idAuthor)
idPostTime = $(idPostTime)
idReplier = $(idReplier)
idReplyTime = $(idReplyTime)
idPagelinks = $(idPagelinks)
admin = admin|0
type = type|0
quoteTid = quoteTid|0
quoteFrom = quoteFrom|0
if(this.opt&1)
	idTopic.target = idReplyTime.target ='_blank'
if(this.data.length==0)
	idPostTime._first=1
this.data.push(arguments)
},//fe
init:function(){
__NUKE.addCss('#toppedtopic, .topicrowsnone {display:none}')
commonui.blockword.init()
},//fe
preLoad:function(){

},//fe
loadAll:function(){
if(window.__SEARCHING)
	for(var i=0;i<this.data.length;i++){
		this.data[i][1].target='_blank'
		this.data[i][1]._useloadread|=32
		}
var c = commonui
this.topicrowsEmWidth = (__SETTING.width - __SETTING.moduleWrapMargin) / __SETTING.fontSize
if(c.parseToppedTopic.delayLoad){
	if(c.parseToppedTopic.delayLoad() & 2)
		this.topicrowsEmWidth -= c.parseToppedTopic.vTopWidth
	c.parseToppedTopic.delayLoad = null
	}

for(var i=0;i<this.data.length;i++){
	if(this.data[i].loaded)continue
	c.loadThreadInfo.apply(c,this.data[i])
	this.data[i].loaded = 1
	}
$('topicrows').className = $('topicrows').className.replace('topicrowsnone', '')
if(c.loadThreadInfoSetAvatarList.length)
	c.loadThreadInfoSetAvatar();
setTimeout(function(){commonui.triggerEventTopicrowLoad()})
}//fe
,clearCache:function(){this.data = []}//
}//ce

//解析========================
commonui.loadThreadInfo = function(
o_replies,o_topic,o_author,o_ptime,
o_replier,o_rtime,o_pagelinks,
fid,tid,pid,quote_tid,quote_from,postdate,lastpost,replies,
type,topicMisc,font,
avatar,admin,ath
){

var $ = _$, self = this, w = window, __GP=w.__GP, document=w.document, now = w.__NOW, selBox

,lite = this.topicArg.topicrowsEmWidth
if(lite){
	if(lite<60)
		lite = 2//标题单占一行
	else if(lite<70)
		lite = 1//发帖人回复人合并成一格
	else
		lite=0
	}
else
	lite = __SETTING.bit & 16 ? 2 : 0

o_topic._useloadread|=1
//==================================
var x = this.htmlName(o_author.innerHTML,lite?6:7), y=this.htmlName(o_replier.innerHTML,lite?6:7)
if(x!=o_author.innerHTML)
	o_author.innerHTML = x
if(y!=o_replier.innerHTML)
	o_replier.innerHTML = y
//get replies number bg color =============================

var bgC = this.loadThreadInfo.getBgHsv(o_ptime.parentNode)

//hide ===================

//topicMisc
if(!topicMisc)
	topicMisc = {_BIT1:0}
else if(topicMisc.match(/~1?$/)){
	font = topicMisc;
	topicMisc = {_BIT1:0}
	}
else
	topicMisc = commonui.topicMiscVar.unpack(topicMisc)


//font ===================
if(topicMisc._BIT1){
	var x = '',tmp = commonui.topicMiscVar,i=topicMisc._BIT1
	if(i&tmp._FONT_RED)
		x+='red ';
	else if(i&tmp._FONT_BLUE)
		x+='blue ';
	else if(i&tmp._FONT_GREEN)
		x+='green ';
	else if(i&tmp._FONT_ORANGE)
		x+='orange ';
	else if(i&tmp._FONT_SILVER)
		x+='silver ';
	if(i&tmp._FONT_B)
		x+='b ';
	if(i&tmp._FONT_I)
		o_topic.style.fontStyle='italic'
	if(i&tmp._FONT_U)
		o_topic.style.textDecoration='line-through'
	if(x)
		o_topic.className+=' '+x;
	}
else if (font){
	font = font.split('~')
	if(font[1])font[0] += ' b'
	if(font[2])font[0] += ' italic'
	o_topic.className+=' '+font[0];
	}

var ds = this.domainSelect(fid)
if(ds){
	o_topic.href=o_replies.href = ds+o_topic.getAttribute("href")
	}

//page===================
if (replies+1>20){//每页20
	var pn = Math.ceil((replies+1)/20), pc=o_topic.target?1:0, pb = ds+'/read.php?tid='+(quote_from ? quote_from : tid) , ph = $('/span','className','pager')._.add('\u2003[ ')
	for(var i=1; i<=pn; i++){
		if (i==6){
			i=pn
			ph._.add(" ... ")
			}
		ph._.add(' ',$('/a','href',pb+"&page="+i,'className','silver','_useloadread',1,pc?{target:'_blank'}:null)._.add(i))
		}
	ph._.add(' ]')
	o_pagelinks.appendChild(ph)
	}

//add from forum ===================
var x = o_pagelinks.getElementsByTagName('a')
for (var i=0; i<x.length; i++)
	this.addFrom2Therad(x[i])
this.addFrom2Therad(o_topic)
this.addFrom2Therad(o_rtime)

//link tip ===================
this.topicLinkTipLoad(o_topic, fid, topicMisc._STID, w.__SELECTED_FORUM, w.__CURRENT_STID);

/*
//union forum ===================
if (w.__CURRENT_FID && w.__SELECTED_FORUM && o_topic.parentNode.parentNode.className.indexOf('ufindex')!=-1){
	var tmp = o_topic.parentNode.getElementsByTagName('a')
	var x = null
	for (var k=0;k<tmp.length;k++){
		if (tmp[k].className.indexOf('nomatch')!=-1){
			x = tmp[k]
			break;
			}
		}
	if(x){
		tmp = x.href.match(/thread\.php\?fid=(\d+)/)
		if(tmp){
			this.genTip.add(x,"<a href='javascript:void(0)' class='red' onclick='commonui.unionforumSubscribe("+tmp[1]+",__CURRENT_FID,2)'>不在主题列表中显示这个版面</a>")
			x.parentNode.style.cssFloat='right'
			}
		}
	}
*/
//topic tip ===================
var tmp = document.createElement('span');
if(quote_from)
	tmp.innerHTML+=' '+commonui.txtTagTemplate('镜像','链接到另一个主题 点此可进入镜像', (admin&2)? 'read.php?tid='+tid :'', '#909090')

tmp.innerHTML+=this.getPostBitInfo(fid, tid, pid , type, topicMisc._BIT1, 1, admin)

if(admin && o_topic.getAttribute("href").indexOf('tid='+tid)==-1)
	tmp.innerHTML+=commonui.txtTagTemplate('本体','','/read.php?tid='+tid,'#909090','')

if (now-lastpost<=3600)
	tmp.innerHTML+=" <b style='color:#BD7E6D'>&#8226;</b>";
//if (__GP.lesser && lastpost>postdate && (lastpost-postdate)<24*3600)
//	tmp.innerHTML+=" <span class='orange nobr' title='平均回复间隔时间'>["+Math.floor((lastpost-postdate)/replies)+"]</span>";

if (type & 8192){
	if(ath){
		var o_ath
		if(o_ath = commonui.loadThreadInfoLoadAttach(ath , o_topic , topicMisc._BIT1, this.topicArg.topicrowsEmWidth))
			o_topic.parentNode.appendChild(o_ath)
		}
	}

if(type & 32768){
	o_topic.href = '/thread.php?stid='+(this.loadThreadInfo.lastSet = (quote_from ? quote_from : tid))
	o_replies.innerHTML="<img src='"+commonui.forumIcon(null,this.loadThreadInfo.lastSet)+"' style='vertical-align:middle'/>"
	if(!w.__CURRENT_STID)o_topic.parentNode.parentNode.className+=' set_topic'
	}
else if(type & 65536){
	if(!w.__CURRENT_STID)
		o_topic.parentNode.parentNode.className+=' set_topic_elm'
	}
else
	this.loadThreadInfo.lastSet = 0

if(type & 2097152){
	o_replies.href=o_topic.href = '/thread.php?fid='+topicMisc._SFID
	o_replies.innerHTML="<img src='"+commonui.forumIcon(topicMisc._SFID)+"' style='vertical-align:middle'/>"
	}
if((type & (2097152 | 32768)) && w.__CURRENT_FID)
	tmp.appendChild(
		$('/input','type','checkbox','style',{marginLeft:'0.5em'},'title','是否显示此版面的主题','style','marginLeft:0.5em',
		'checked',((type & 1)?'':'checked'),
		'value',tid,'onclick',function(){
			self.ignoreTopic(this,__CURRENT_FID,this.value,this.checked?0:1)
			})
		)
o_topic.parentNode.insertBefore(tmp,o_topic.nextSibling);

if(topicMisc._BIT1&134217728)
	commonui.loadThreadInfoLoadReply(o_topic.parentNode,(quote_from ? quote_from : tid))

/*
if ((topicMisc._BIT1 & this.topicMiscVar._ALL_FONT)==0) {
	if (o_topic.innerText.match(/剧透/)) {
		var tmp=__NUKE.cpblName(o_topic.style,'transition')
		o_topic.parentNode.insertBefore($('/span','className','silver','innerHTML','[剧透]'), o_topic);
		$(o_topic).$0('style',tmp[0]+':opacity 2s;opacity:0','onmouseover',function(){this.style.opacity = 1},'onmouseout',function(){this.style.opacity = 0})
		}
	}
*/
//o_replies.style.display=o_ptime.style.display=o_rtime.style.display='none'

if (admin&1)
	selBox = $('/input','type','checkbox','onclick',function(){self.massAdmin.check(this,this.value)}
		,'value',(pid? tid+'_'+pid: tid),'_authorid',(o_author.href.match(/uid=(\d+)/)||[])[1])
	

if(lite & 2){
	if(this.loadThreadInfo.removeTableHeader){
		this.loadThreadInfo.removeTableHeader()
		this.loadThreadInfo.removeTableHeader = null
		}
	var z = o_ptime.parentNode, 
	y = o_rtime.parentNode, 
	u= o_replies.parentNode,
	v=o_topic.parentNode,
	//c=this.hsvToRgb(bgC[0]*0.98,bgC[1]*1.1904,bgC[2])
	x = $('/div').$0(
		'className','posterInfoLine',
		'style','marginBottom:1em;textAlign:right',/*backgroundColor:'rgb('+c[0]+','+c[1]+','+c[2]+')',*/
		(type & 2097152) ? null : $(o_replies).$0('style','marginLeft:0.5em;cssFloat:left;fontWeight:900'),
		$(o_author).$0('className','smoke nobr','style','marginLeft:1.5em'),
		$(o_ptime).$0('className','smoke nobr','style','marginLeft:1em;display:inline'),
		$(o_replier).$0('className','smoke nobr','style','marginLeft:1.5em'),
		$(o_rtime).$0('className','smoke nobr','style','marginLeft:1em;display:inline'),
		selBox ? $(selBox).$0('style','marginLeft:1em;cssFloat:none') : null
		)
	if(type & 2097152)
		v.insertBefore(o_replies,o_topic)
	//o_topic.style.fontSize='1.2em'
	v.insertBefore(x,v.firstChild)
	v.style.paddingBottom='1em'
	v=v.parentNode
	v.removeChild(z)
	v.removeChild(y)
	v.removeChild(u)
	}
else{
	if (selBox){
		o_replies.parentNode.style.position = 'relative'
		o_replies.parentNode.appendChild(selBox.$0('style',{margin:'0.25em',position:'absolute',top:0,right:0,opacity:0.50}))
		}
	if(lite & 1){
		$(o_replier).parentNode.style.display='none'
		$(o_ptime).$0('style','display:inline;marginLeft:0.3em')
		$(o_author).parentNode.appendChild(
			$('/div','style','padding-top:0.83em')._.add(
				$(o_rtime).$0('style','display:inline;marginRight:0.3em'),$(o_replier)
				)
			)
		$(o_author).parentNode.style.lineHeight='1em'
		$(o_author).parentNode.style.width='21%'
		}
	}

//format time ===================
o_ptime.innerHTML = this.time2dis(postdate)
o_rtime.innerHTML = this.time2dis(lastpost)
if(o_ptime._first){
	if(!(lite&2)){
		o_ptime.parentNode.insertBefore(commonui.threadOrder(1,null),o_ptime.parentNode.firstChild)
		if(!(lite&1))
			o_rtime.parentNode.insertBefore(commonui.threadOrder(0,null),o_rtime.parentNode.firstChild)
		}
	}
	
o_ptime.title = this.time2date(postdate,'y-m-d H:i')
o_rtime.title = this.time2date(lastpost,'y-m-d H:i')

//time font ===================
if (w.__SETTING.bit & 512)//雅黑11px
	o_rtime.style.fontSize=o_ptime.style.fontSize=o_author.style.fontSize=o_replier.style.fontSize='0.916em'
else{
	if (o_ptime.innerHTML.match(/^[0-9\-: ]+$/))
		o_ptime.style.fontSize='0.916em'
	if (o_rtime.innerHTML.match(/^[0-9\-: ]+$/))
		o_rtime.style.fontSize='0.916em'
	}
	
//replies font size ===================
if(lite&2){
	var s=1.167
	}
else{
	var s=1.667
	if(replies>99){
		if(replies>999){
			if(replies>9999)
				s=1.083
			else
				s=1.167
			}
		else
			s=1.333
		}
	}
o_replies.style.fontSize=s+'em'

//replies color ===================
if(replies>100)replies=100
if(bgC && (type & 1024)==0){
	if(this.genReplyColor)
		var x=this.genReplyColor(bgC,replies)
	else
		var x=this.genReplyColorDefault(bgC,replies)
	o_replies.style.color='rgb('+x[0]+','+x[1]+','+x[2]+')'
	}
else
	o_replies.style.color=__COLOR.gbg3

if(!lite && (topicMisc._BIT1 & 8388608))
	this.loadThreadInfoSetAvatarList.push( o_author )

var tmp=0
if(this.blockword.ru && o_author && o_author.href){
	var m = o_author.href.match(/uid=(\d+)/)
	if(m && this.blockword.checkUsername(m[1],o_author.textContent)){
		if(window.__CURRENT_F_MODS && __CURRENT_F_MODS.indexOf(','+m[1]+',')==-1)
			tmp=1
		}
	}
if(tmp==0 && this.blockword.rc && o_topic && this.blockword.checkContent(o_topic.textContent))
	tmp = 2
if(tmp){
	o_topic.parentNode.style.height='3em'
	o_topic.parentNode.title='用户屏蔽的内容';
	([o_replies,o_topic,o_author,o_ptime,
	o_replier,o_rtime,o_pagelinks,(ath && o_ath) ? o_ath : null]).forEach(function(o){
		if(o)o.style.display='none'
		})
	//o_topic.className+=' userblockcontents'
	}

}//fe



commonui.loadThreadInfoLoadAttach = function(ath , o_topic , tmbit1, rowEmWidth){
var $=_$,athc=0,atho,brw = ((__SETTING.fontSize*0.2)|0)+'px solid '+__COLOR.border0
for(var k=0;k<ath.length;k++){
	ath[k] = ubbcode.attach.parseName(ath[k].url)
	if(ath[k] && ath[k].type && ath[k].type=='img'){
		var athimgs = this.getAttachBase(ath[k].url)+'/'+ath[k].url, athimgm = athimgs

		if( tmbit1 & 67108864 ){
			if(rowEmWidth>50){
				var opb=o_topic.parentNode,opbc = commonui.getStyle(opb,'background-color')
				if(opbc && opbc.substr(0,4)=='rgb(' ){
					opb=opb.style
					opb.backgroundImage = 'linear-gradient(to right,'+opbc+', '
					+opbc.replace(/rgb\((.+)\)/,'rgba($1,0)')
					+')'
					if(opb.backgroundImage.substr(0,15)=='linear-gradient'){//if support gradient
						opb.backgroundImage+=', url('+athimgs+')'
						opb.backgroundPosition = '100% 50%, 100% 50%'
						opb.backgroundRepeat = 'no-repeat, no-repeat'
						opb.backgroundSize = ((rowEmWidth/3)|0)+'em 5em, '+((rowEmWidth/3)|0)+'em auto'
						o_topic.style.textShadow='0 0 0.25em '+opbc;
						break;
						}
					else{
						opb.backgroundImage=''
						}
					}
				}
			}

		if(tmbit1 & 67108864){
			if(!atho)atho=$('/div')
			atho._.add( ' ', 
					$('/a', 'href',o_topic.getAttribute("href"),
						$('/img','src',athimgs,'style','max-height:6em;max-width:'+(rowEmWidth-4)+'em;border:'+brw)
						)
					)
			break
			}
		else{
			if(ath[k].thumb){
				if(ath[k].thumb<=2 || ath[k].thumb & 16)
					athimgs +='.thumb_s.jpg'
				if(ath[k].thumb & 64)
					athimgm +='.medium.jpg'
				}
			else if(ath[k].w>0 && ath[k].h>0 && ath[k].w<=130){
				}
			else
				continue
			if(!atho)atho=$('/div')
			atho._.add( ' ', 
					$('/a',
						'href','javascript:void(0)',
						'_imgorg',athimgm,
						'onclick',function(e){
							commonui.createadminwindow()
							._.addContent(null)
							._.addTitle('&emsp;')
							._.addContent($('/img','src',this._imgorg,'style','border:'+brw))
							._.show(e);
							},
						$('/img','src',athimgs,'style','border:'+brw)
						)
					)
			}
		athc++
		if(athc>=2)
			break
		
		}
	}

return atho

}//fe

commonui.loadThreadInfoSetAvatarList=[]
commonui.loadThreadInfoSetAvatar = function(){
if(__SETTING.uA[0]==1 && __SETTING.uA[1]<9)
	return
for(var i = 0;i<this.loadThreadInfoSetAvatarList.length;i++){
	var o = this.loadThreadInfoSetAvatarList[i],m
	if(o.href && (m=o.href.match(/uid=(\d+)/))){
		var p = o.parentNode, rp = o.parentNode.getBoundingClientRect(), h = rp.bottom-rp.top, w = rp.right-rp.left, u, s
		if(w>h*3 && (u=this.userInfo.users[m[1]]) && (s = this.selectUserPortrait( u.avatar , u.buffs, u.uid))){
			var d = _$('/div').$0(
				'style',{
						borderRight:'1px solid '+__COLOR.bg0,
						overflow:'hidden',
						width:h+'px',height:h+'px',
						cssFloat:'left',
						margin:'-6px 0 -6px -'+h+'px'},
				_$('/img').$0(
					'onload',function(){
						if(this.height>this.width){
							var r = h/this.width
							this.width = h
							this.height *= r
							this.style.marginTop = (Math.abs(h-this.height)/3*-1)+'px'
							}
						else{
							var r = h/this.height
							this.height = h
							this.width *= r
							this.style.marginLeft = (Math.abs(h-this.width)/2*-1)+'px'
							}
						this.style.opacity = 0.7
						this.style.display=''
						},
					'style',{display:'none'},
					'src',s
					)
				)
			p.style.paddingLeft=h+'px'
			p.insertBefore(
				d,
				p.firstChild
				)
			}
		}
	}
}//fe

commonui.loadThreadInfo.bgColor={}
commonui.loadThreadInfo.getBgHsv = function(o){/*
if(!this.bgColor){
	if(o.nodeName=='TD'){
		var bg =[],i,c=commonui
		bg[0] = c.getRGBFromStyle(c.getStyle(o,'backgroundColor'))
		var r = o.nextSibling
		if(r && r.nodeName=='TD')
			bg.push( c.getRGBFromStyle(c.getStyle(o,'backgroundColor')) )
		try{
			r = o.parentNode.nextSibling.firstChild
		}catch(i){}
		if(r && r.nodeName=='TD')
			bg.push( c.getRGBFromStyle(c.getStyle(o,'backgroundColor')) )
		r = o.nextSibling
		if(r && r.nodeName=='TD')
			bg.push( c.getRGBFromStyle(c.getStyle(o,'backgroundColor')) )
		console.log(bg)
		for(var i=1;i<bg.length;i++){
			bg[0][0]+=bg[i][0]
			bg[0][1]+=bg[i][1]
			bg[0][2]+=bg[i][2]
			}
		bg[0][0]/=i
		bg[0][1]/=i
		bg[0][2]/=i
		this.bgColor = c.rgbToHsv( bg[0])
		}
	else
		this.bgColor = [0,0,0]
	}
return this.bgColor*/
var id = (o.nodeName=='TD' ? o.parentNode.className+' '+o.className : null)
if(id){
	if(!this.bgColor || !this.bgColor[id]){
		var c=commonui
		bgC = c.getRGBFromStyle(c.getStyle(o,'backgroundColor'))
		if(!bgC)bgC=[0,0,0]
		this.bgColor[id] = c.rgbToHsv(bgC[0], bgC[1], bgC[2])
		return this.bgColor[id]
		}
	else
		return this.bgColor[id]
	}
return [0,0,0]
}//fe

commonui.loadThreadInfo.removeTableHeader = function(){
	var x = $('topic_table_header')
	if(x){
		var y=x.getElementsByTagName('td');
		if(y[3]){
			x.removeChild(y[3])
			x.removeChild(y[2])
			x.removeChild(y[0])
			}
		}
	}//fe
	
commonui.loadThreadInfoLoadReply = function(o,tid){
if(!commonui.postArg){
	if(!this.loadThreadInfoLoadReply.loadjs){
		__SCRIPTS.load('read')
		this.loadThreadInfoLoadReply.loadjs=1
		}
	if(this.loadThreadInfoLoadReply.loadjs<10){
		this.loadThreadInfoLoadReply.loadjs++
		return setTimeout(function(){commonui.loadThreadInfoLoadReply(o,tid)},500)
		}
	}

var $ = _$
__NUKE.doRequest({
	u:{u:'read.php?opt=1&lite=htmljs',
		a:{tid:tid}
		},
	f:function(d){
		var e = __NUKE.doRequestIfErr(d)
		if(e)
			return console.log(e)
		o.appendChild($('/div','className','topic_content',
				e=$('/div','className','postbox comment_c postcontent subtxt_color'
					)
				)
			)
		var D = d.data,M = commonui.topicMiscVar.unpack(D.__T.topic_misc),c = D.__R__ROWS,c = c>6?6:c
		commonui.userInfo.setAll(D.__U)
		commonui.postArg.setDefault(D.__T.fid,D.__T.stid,D.__T.tid,D.__T.authorid,M._bit1,'',0,'')
		for(var i=1;i<c;i++){
			var R = D.__R[i]
			if(!R.pid)
				continue;
			e._.add(
				$('/div','style','width:47%;float:left;'+((i&1)?'clear:both':'marginTop:1.83em'),
					$('/span','id','commentposterinfo_'+R.pid,'className','posterinfo'),
					$('/table','className','comment_c_0',
						$('/tr',
							$('/td','className','comment_c_1'),
							$('/td','className','comment_c_2 c5',
								$('/span','id','postcommentcontentandsubject_'+R.pid,'className','comment_c_3',
									$('/span','id','commentInfo_'+R.pid,'className','c1 postInfo'),
									$('/span','id','postcommentsubject_'+R.pid),
									$('/span','id','postcomment_'+R.pid,'innerHTML',R.content)
									)
								)
							)
						)
					)
				)
			commonui.postArg.proc( '_'+R.pid,
				$('postcommentcontainer_'+R.pid),$('postcommentsubject_'+R.pid),$('postcomment_'+R.pid),null,$('commentposterinfo_'+R.pid),$('commentInfo_'+R.pid),null,
				null,null,R.pid,R.type,
				null,R.authorid,R.postdatetimestamp,null,null,
				'','',null,'',null,null,1 )
			if(i>9)
				break
			}
		}
	})

}//fe

commonui.ignoreTopic = function(o,fid,tid,ignore){
__NUKE.doRequest({
	u:{u:__API._base+'__lib=user_option&__act=set&raw=3&'+(ignore ? 'add':'del')+'='+tid,
		a:{'fid':fid,'type':1,'info':'add_to_block_tids'}
		},
	b:o
	})
}//fe

//回复的颜色===================
commonui.genReplyColorDefault = function(bgC,replies){
if(replies>100)replies=100
var ma = 120,//最多变化步数 回复数越多变化步数越多
mi = 20,//最少变化步数
Hs = (60/360)/ma,//色调变化步长 总和60度
Ss = (0.4-bgC[1])/ma,//饱和度变化步长 最大0.4
h = Hs*(replies+mi), 
h = bgC[0]+h*(bgC[0]>0.25 ? 1 : -1),//黄色一侧向红色变化 绿色一侧向蓝色变化
s = bgC[1]+Ss*(replies+mi),
v = bgC[2],
Vv = (0.6-v)/ma,//0.6以下变亮 以上变暗
v = v+Vv*(replies+mi)
if(h<0)h+=1
if(h>1)h-=1
return this.hsvToRgb(h, s, v)
}

//添加来源参数=================
commonui.addFrom2Therad = function(o){
o.href+= (window.__CURRENT_FID && window.__UNION_FORUM? '&_ff='+__CURRENT_FID : '')  +  (window.__CURRENT_PAGE && __CURRENT_PAGE!=1? '&_fp='+__CURRENT_PAGE : '')  +  (window.__CURRENT_ORDER ? '&forder_by='+__CURRENT_ORDER : '')
}



}//be

//============================
//版面功能按钮=================
commonui.forumBtns ={
parent:commonui,

d:{
1:{n1:'<span style="font-size:1.23em">精华区</span>',u:'/thread.php',ck:function(a){if(a.fid)return 1}
	,init:function(o,a){
		o.href=__API.digest(a.fid|0,a.stid|0)		
		}
	},

2:{n1:'<span style="font-size:1.23em">收藏版面</span>',
	on:function(e,a){
		__NUKE.doRequest({
			u:__API.toUri('','__lib','forum_favor2','__act','forum_favor','__output',3,'action','add', 'fid', a.stid?'t'+a.stid:a.fid)
			,f:function(d){
				var e = __NUKE.doRequestIfErr(d)
				alert(e ? e : d.data[0])
				commonui.mergeViewHis()
				}
			})
		
		//commonui.unionforumSubscribe(a.fid,0,1)
		},
	ck:function(a){if(window.__CURRENT_UID)return 1} },

3:{n1:'权限/版主',u:__API.viewFPg('{fid}')},

4:{n1:'用户声望',
	on:function(e,a){commonui.setUserRepu(e,a.fid)},
	ck:function(a){if(!a.stid && a.fid<0 && a.admin)return 1} },

5:{n1:'版面功能',on:function(e,a){commonui.forumBtn(e,a.fid)},
	ck:function(a){if(!a.stid && a.fid<0 && a.admin)return 1} },

6:{n1:'<span style="font-size:1.23em">发表新帖</span>',c:'disable_tap_menu uitxt1',
	init:function(o,a){
		if(o._longClick)
			return
		o._longClick=1
		o.className+=' noselectmenu'//禁止ios长按弹出
		commonui.stdBtnsLongClickInit(o
			,function(e,opt){
				var sfid = commonui.selectForum.getCurrent(a.fid),stid = a.stid ? a.stid : (window.__CURRENT_STID ?  window.__CURRENT_STID  : null)
				if(!sfid){
					commonui.selectForum.selectWindow(e,a.fid,
						function(sf,name,st){
							if(stat){
								commonui.openPostWindow(e,postfunc.__NEW,sf,null,null,st?st:stid,null,null)
								return false//cancel event
								}
							return true
							}
						)
					return commonui.cancelEvent(e)
					}
				var c=0//默认走链接
				if(window.__APPEMBED){
					//if(opt&1)//长按
					//	c=2|8
					//else
						c=1|8
					}
				else{
					if(opt&2){//touch
						if(opt&1)//长按
							c=4|8
						else
							c=2|8
						}
					else{
						if(opt&1)
							c=2|8
						else
							c=0
						}
					}
				if(c&1)
					commonui.postBtn.appDoSync('newPost', {'tid':a.tid, 'pid':a.pid},3,e)
				else if(c&2)
					commonui.openPostWindow(e,postfunc.__NEW,a.fid,null,null,stid)
				else if(c&4)
					location.assign(o.href)
				if(c&8)
					return commonui.cancelEvent(e)
				}
			)
		},
	_useloadread:48,
	u:'/post.php?fid={fid}&stid={stid}&_newui',
	ck:function(a){if(a.fid && __CURRENT_UID)return 1} },

7:{n1:'重置…',
	on:function(e,a){commonui.massAdmin.unCheckAll($('m_threads'))},
	ck:function(a){if(a.admin)return 1} },

8:{n1:'锁定…',
	on:function(e,a){commonui.setPost(e,null,null,a.fid)},
	ck:function(a){if(a.admin)return 1} },

//9:{n1:'移动…',
//	on:function(e,a){adminui.movemass(e)},
//	ck:function(a){if(a.admin)return 1} },

10:{n1:'移/删…',
	on:function(e,a){adminui.movetopic(e,null,a.fid,1)},
	ck:function(a){if(a.admin&2)return 1} },

11:{n1:'版面功能',
	on:function(e,a){commonui.forumBtn(e,a.fid)},
	ck:function(a){if(a.fid && a.admin)return 1} },

12:{n1:'重置选择',
	on:function(e,a){commonui.massAdmin.unCheckAll($('m_threads'))},
	ck:function(a){if(a.admin)return 1} },

13:{n1:'从收藏中移除选中的主题',
	on:function(e,a){commonui.favordelmass(this)},
	ck:function(a){if(__CURRENT_UID)return 1} },

14:{n1:'全选',
	//title:'全选只能选择前15个',
	id:"selectallbtn",
	on:function(e,a){commonui.massAdmin.checkAll($('m_threads'))},
	ck:function(a){if(a.admin)return 1} },

15:{n1:'合集操作',
	on:function(e,a){
		var aa = {fid:a.fid,tid:a.stid,admin:a.admin,anyAdmin:a.anyAdmin,minorAdmin:a.minorAdmin,pid:0,greater:window.__GP.greater}
		commonui.topicBtn.allBtn(e,aa)
		},
	ck:function(a){if(a.stid && a.admin){
						if(!commonui.topicBtn)
							loader.script(__SCRIPTS.read)//no sync
						return 1
						}
				} },

16:null,

17:{n1:'作者…',
	on:function(e,a){
		x = '';
		Array.from($('m_threads').getElementsByTagName('input')).forEach(function(o){
			if(o.checked && o._authorid)
				x+=o._authorid+'\n';
			})
		commonui.createCommmonWindow()
			._.addTitle('勾选主题的作者')
			._.addContent(_$('/textarea','style','width:100%;height:10em','innerHTML',x))
			._.show(e)
		},
	ck:function(a){if(a.admin)return 1} },
},

18:{n1:'.新帖.web',
	on:function(e,a){
		commonui.openPostWindow(e,postfunc.__NEW,a.fid,null,null,stid)
		},
	ck:function(a){if(a.fid && __CURRENT_UID && window.__APPEMBED)return 1} },

replaceUrl:commonui.buttonBase.replaceUrl,

def1 : [1,2,6],
def2 : [3,4,15,5,6],
def3 : [14,8,10,17,11],
def4 : [12,13],

genU:commonui.buttonBase.genU,

genT:commonui.buttonBase.genT,

genC:commonui.buttonBase.genC,

genA:commonui.buttonBase.genA,

load:function(o,type,fid,admin){
if(!o || o.nodeType!=1)
	return
if(window.__CURRENT_FID)fid = window.__CURRENT_FID


var arg={fid:fid,
	admin:admin? admin : window.__GP.admincheck,
	stid:(window.__CURRENT_STID?window.__CURRENT_STID:'')
	}, xx=null,l, oo = commonui.stdBtns()
if(type==3)
	l = this.def3
else if(type==4)
	l = this.def4
else{
	if(!fid)return
	var l = this.def2, x= o.parentNode
	while(x.nodeName!='BODY'){
		x = x.parentNode
		if(x.id=='m_pbtntop'){
			l = this.def1
			break;
			}
		}
	}
for (var k=0;k<l.length;k++){
	if(xx=this.genA(arg,l[k],1))
		oo._.__add(xx)
	}
o.innerHTML=''
if(!oo._.__length)
	return

o.appendChild(oo)
if(oo._.__vml)
	oo._.__vml()

}//fe


}//ce



//============================
//管理员版面功能按钮============
commonui.forumBtn = function _thisf(e,fid,stid){
if(!fid || !window.__GP.admincheck)
	return

if(!_thisf.infocache || !_thisf.infocache[fid]){
	if(!_thisf.infocache)_thisf.infocache={}
	var arg = arguments
	return __NUKE.doRequest2(
		'f',function(d){
			var e
			if(e=__NUKE.doRequestIfErr(d))
				return alert(e)
			_thisf.infocache[fid] = d.data[0]
			_thisf.apply(commonui,arg)
			},
		'u','/nuke.php?__lib=modify_forum&__act=get_modify_info',
		'fid',fid,'__output',3
		)
	}

var w = window, __GP = w.__GP , $ = w._$, __API = w.__API, finfo = _thisf.infocache[fid]
if(!stid)stid = window.__CURRENT_STID
this.createadminwindow()
this.adminwindow._.addTitle('版面功能')
this.adminwindow._.addContent(null)

var x= $('/div','className','ltxt','style',((__SETTING.bit&16) ? 'width:22.3em' : 'max-width:44em'))._.add(
	finfo['owner_id'] ? [
		$('/h4','className',"textTitle",'innerHTML','用户版'),
		$('/span',
			__GP.admincheck ? $('/a','href','javascript:void(0)','onclick',function(e){commonui.setUserRepu(e,fid)},'innerHTML','用户版面声望') : null,
			__GP.admincheck ? $('/a','href','javascript:void(0)','onclick',function(e){adminui.modifyUserForum(null,fid)},'innerHTML','用户版面设置') : null
			)
		] : null,

	$('/h4','className',"textTitle",'innerHTML','版面设置'),
	$('/span',
		__GP.admin ? $('/a','className','red','href','javascript:void(0)','innerHTML','修改版面','onclick',function(e){adminui.modifyForum(null,fid)}) : null,
		__GP.admin ? $('/a','className','red','href',__API.user_forum_nuke(fid),'innerHTML','封禁版面') : null,
		(__GP.admincheck && (__GP._bit&131072)==0) ? $('/a','href','javascript:void(0)','innerHTML','副版主','onclick',function(e){__API.evalFromServer('__lib','minor_moderator','__act','get_ui',[null,fid])/*adminui.minorModerator(null,fid)*/}) : null,
		$('/a','href','javascript:void(0)','innerHTML','子版面设置','onclick',function(e){adminui.setSets(e,fid)}),
		$('/a','href','javascript:void(0)','innerHTML','镜像到主题','onclick',function(e){adminui.quoteForum(e,fid)})
		),

	$('/h4','className',"textTitle",'innerHTML','杂项功能'),
	$('/span',
		$('/a','href','javascript:void(0)','innerHTML','主题分类','onclick',function(e){adminui.topic_key_admin(fid)}),
		$('/a','href','javascript:void(0)','innerHTML','声望级别','onclick',function(e){adminui.reputationLevel(e,fid)}),
		$('/a','href',__API.auto_trans_set(fid),'innerHTML','术语翻译'),
		$('/a','href','javascript:void(0)','innerHTML','新用户限制','onclick',function(e){adminui.setNewUserPostLimit(e,fid)}),
		$('/a','href','javascript:void(0)','innerHTML','发帖提示','onclick',function(e){adminui.setHint(e,fid)}),
		__GP.ubStaff ? $('/a','href','javascript:void(0)','innerHTML','相关信息','onclick',function(e){adminui.modifyForumRel(null,fid)})  : null
		),

	$('/h4','className',"textTitle",'innerHTML','统计'),
	$('/span',
		__GP.greater ? $('/a','href',__API.forum_stat(stid ? stid:fid),'innerHTML',(stid?'合集':'')+'版主统计') : null,
		(__GP.greater  && !window._TMPCTL) ? $('/a','href','javascript:void(0)','innerHTML','访问统计','onclick',function(e){adminui.forumStat(null,fid)}) : null,
		$('/a','href','javascript:void(0)','innerHTML','关键词统计','onclick',function(e){adminui.keywordStat(e,fid)})
		),

	$('/h4','className',"textTitle",'innerHTML','审核'),
	$('/span',
		__GP.admincheck ? $('/a','href','javascript:void(0)','innerHTML','审核关键词','onclick',function(e){adminui.setFilter(null,fid,2)}) : null,
		__GP.superlesser ? $('/a','href','javascript:void(0)','innerHTML','自动删除','onclick',function(e){adminui.setFilterG()}) :null
		)

	

	//__GP.admincheck ? $('/a').$0('href','javascript:void(0)','innerHTML','版面背景图','onclick',function(e){adminui.setForumPic(e)}) : null,

	)

var a = x.getElementsByTagName('a')
for(var i=0;i<a.length;i++)
	a[i].className+=' nobr cell'

commonui.buttonBase.altStyle(x)



this.adminwindow._.addContent(x)
this.adminwindow._.show(e)
}//fe


//============================
//订阅========================
/**
 *@param 添加或去除的版面id
 *@param 主版面id
 *@param type ==1 add, ==2 del 
 */
commonui.unionforumSubscribe = function (o,ufid,type){
//if (!__CURRENT_UID)
//	return window.alert('必须登录')
if(typeof(o)=='string')
	o=o.replace(ufid,'').replace(/(^),|,($)|(,),+/,'$1$2$3')
if (!o && type)
	return window.alert('必须选择一个')

if (!__CURRENT_UID){
	if (!window.__UNION_FORUM)
		return window.alert('参数错误')
	var s = cookieFuncs.getCookie('unionForumSelect');
	if(s)s=__NUKE.scDe(s)
	else s={}
	if (!s[ufid])
		s[ufid] = window.__UNION_FORUM_DEFAULT.split(',')
	else
		s[ufid] = s[ufid].split(',')

	if (type==1)
		s[ufid]=s[ufid].concat(o.split(','))
	else if (type==2){
		var x= new RegExp(o.replace(',','|'),'g')
		s[ufid] = s[ufid].join(',').replace(x,'').split(',')
		}
	else
		s[ufid]=o.split(',')

	s[ufid]=s[ufid].sort().join(',').replace(/(^),|,($)|(,),+/,'$1$2$3')

	if(s[ufid]!= window.__UNION_FORUM_DEFAULT.split(',').sort().join(',').replace(/(^),|,($)|(,),+/,'$1$2$3'))
		cookieFuncs.setCookieInSecond('unionForumSelect',__NUKE.scEn(s),3600*24*7);
	else
		cookieFuncs.setMiscCookieInSecond('unionForumSelect',null,0);
	return window.alert('操作成功，刷新页面后将显示选中版面的主题')
	}

__NUKE.doRequest({u:__API.forumSubscription(ufid,o,type)})
}//fe
commonui.unionforum_subscribe = function (o,ufid,s){//旧接口兼容
if(typeof(o)=='number')
	commonui.unionforumSubscribe(o,ufid,1)
else if(s){
	var i = o.getElementsByTagName('select')[0]
	if(i && i.options[i.selectedIndex].value)
		commonui.unionforumSubscribe(i.options[i.selectedIndex].value,ufid,1)
	else
		return
	}
else{
	var x = '';
	var i = o.getElementsByTagName('input')
	for (var k in i){
		if (i[k].checked && i[k].value)
			x+=','+i[k].value
		}
	commonui.unionforumSubscribe(x.substr(1),ufid)
	}
}//fe



//////////////nouse
;(function(){
if(!XMLHttpRequest)
	return
var pageStat={} ,//{页n:[贴1,2,3,...], 页n+1:[贴1,2,3,...], ...}
$ = _$, HTTP = new XMLHttpRequest(), l = location, tmp, 
minp ,//当前最小页 
maxp ,//当前最大页
iPo, //当前第一条
iPc,
ot = 0,
count = 1,//当前显示的总页数
progr = function(){
	commonui.loadReadHidden.lock = 0
	},
progt = function(v,o){
	commonui.progbar(v*10,o?o:5000,v==10?progr:null)
	},
cs = document.characterSet || document.defaultCharset || document.charset;

HTTP.onerror = function(e){
	error('HTTP ERROR')
	}
	
HTTP.onload = HTTP.onabout = function(e){
	progt(10)
	}

HTTP.onprogress = function(e){
/*
	if (e.lengthComputable)
		progv = (e.loaded / e.total)*prog.offsetWidth
	else if(progv = this.getResponseHeader('X-NGA-CONTENT-LENGTH'))
		progv = (e.loaded / progv)*prog.offsetWidth
	else{
		progv = e.loaded/100
		if(progv>prog.offsetWidth) progv = prog.offsetWidth
		}
		*/
	progt(3)
	}
	
var
ifp = function(o,opt){
	if(opt & 1024){
		if(o.nodeName=='TBODY')
			return 1
		}
	else
		if(o.className=='forumbox postbox')
			return 1
	}
pr = function(txt,opt){
	if(opt & 1024){
		//console.log(txt)
		var x = cut(txt,['<!--topicliststart-->','<!--topiclistend-->','//topicloadallstart','//topicloadallend'],0,1)
		if(x.length<2)
			return error('parse page error')
		var y = cut(x[0],["<script type='text/javascript'>",'</script>'],0,0)
		y.push(x[1])
		return [
			null,
			x[0],//内容
			y//取出内容加载脚本
			]
		}
	var x = cut(txt,['//userinfostart','//userinfoend','<!--postliststart-->','<!--postlistend-->'],0,1)
	if(x.length<2)
		return error('parse page error')
	return [x[0],//用户信息脚本
		x[1],//内容
		cut(x[1],['<script>','</script>'],0,0)//取出内容加载脚本
		]
	}

commonui.loadReadHidden = function(p,opt){// 页， &1替换加载指定页 &2连续加载下一页 &4连续加载上一页
if(this.loadReadHidden.lock)
	return
this.loadReadHidden.lock = 1
if(!iPc){
	iPc = $('m_posts_c')
	if(!iPc){
		iPc = $('topicrows')
		ot |= 1024
		}
	}

opt|=ot

if(!minp){
	minp = maxp = __PAGE[2]
	pageStat[maxp] = []
	for(var i = 0;i<iPc.childNodes.length;i++){
		if(ifp(iPc.childNodes[i], opt))
			pageStat[maxp].push(iPc.childNodes[i])
		}
	}

if(opt & 2)
	p = maxp+1
else if(opt & 4)
	p = minp-1

if(p<1 || (__PAGE[1]>0 && p>__PAGE[1]))
	return error('page error '+p,1)

var ugo = __PAGE[0]+'&page='+p
HTTP.__rep = 0
HTTP.abort()
HTTP.open('GET', ugo)
HTTP.onreadystatechange = function () {
	if (HTTP.readyState !== HTTP.DONE)
		return
	var all = HTTP.responseText
	if (HTTP.status !== 200 || HTTP.getResponseHeader("X-NGA-CONTENT-TYPE")=='short-message') {
		var c = all.match(/<!--msgcodestart-->(\d+)<!--msgcodeend-->/)
		if(c && c[1]==15 && HTTP.__rep<1){
			__COOKIE.setCookieInSecond('guestJs',__NOW,1200)
			HTTP.__rep++
			return setTimeout(function(){
				HTTP.abort()
				HTTP.open('GET',ugo)
				HTTP.send()
				},500)
			}
		var c = all.match(/<!--msginfostart-->(.+?)<!--msginfoend-->/)
		if(c)
			return error(c[1].replace(/<br\s*\/>/g,"\n").replace(/<\/?[A-Za-z]+(\s[^>]*)?>/g," ").replace(/^\s+|\s+$/g,''),2)
		return error('HTTP ERROR '+HTTP.status,2);
		}

	progt(5)
			
	var data = pr(all,opt)

	if(commonui.eval.call(window,data[0]))
		return error('parse data 0 error')

	progt(6)
	
	__PAGE[2] = p
	if(opt&1){
		minp = maxp = p
		pageStat={}
		count = 1
		iPo = null
		for(var i = iPc.childNodes.length-1;i>=0;i--){
			//if(ifp(iPc.childNodes[i], opt) || iPc.childNodes[i].nodeName=='SCRIPT')
				iPc.removeChild(iPc.childNodes[i])
			}
		if(history.replaceState)
			history.replaceState('object or string', document.title, __PAGE[0]+'&page='+p)
		}
	else if(opt & 6){

		count++
		if(count>10){
			count--
			if(opt & 2)
				tmp = minp, minp++
			else if(opt & 4)
				tmp = maxp, maxp--
			for(var i = 0;i<pageStat[tmp].length;i++){
				pageStat[tmp][i].parentNode.removeChild(pageStat[tmp][i])
				pageStat[tmp][i] = null
				}
			pageStat[tmp] = null
			delete pageStat[tmp]
			}
		
		if(opt & 2)
			maxp = p, iPo = null
		else if(opt & 4)
			iPo = pageStat[minp][0], minp = p
		commonui.topicArg.opt |=1
		//console.log('replacehis '+p)
		//if(history.replaceState)
			//history.replaceState('object or string', document.title, __PAGE[0]+'&page='+p)
		}

	progt(7)
		
	var c = data[1].match(/\s*<tbody/) ? $('/table') : $('/span')
	c.innerHTML = data[1]

	pageStat[p] = []
	for(var i=0;i<c.childNodes.length;i++){
		if(ifp(c.childNodes[i], opt)){
			pageStat[p].push(c.childNodes[i])
			iPc.insertBefore(c.childNodes[i],  iPo)
			}
		}
		
	progt(8)
	
	for(var i = 0;i<data[2].length;i++){
		if(commonui.eval.call(window,data[2][i]))
			return error('parse data 2 error')
		}

	var c= document.getElementsByName('pageball')
	if(opt & 1){
		commonui.pageBtn(c[0],{0:__PAGE[0],1:__PAGE[1],2:p,3:__PAGE[3]},16)
		commonui.pageBtn(c[1],{0:__PAGE[0],1:__PAGE[1],2:p,3:__PAGE[3]},8)
		}
	else{
		commonui.pageBtn(c[0],{0:__PAGE[0],1:__PAGE[1],2:minp,3:__PAGE[3]},4|16)
		commonui.pageBtn(c[1],{0:__PAGE[0],1:__PAGE[1],2:maxp,3:__PAGE[3]},2|8)
		}
	
	progt(9)

	if(window._czc)//cnzz统计
		_czc.push(["_trackPageview", __PAGE[0]+'&page='+p]);

	if(opt &1){
		//console.log('scroll top')
		scroll(0,0)
		}
	}

HTTP.overrideMimeType("text/html; charset="+cs);  

progt(1)

HTTP.send()

}//fe

commonui.loadReadHidden.reset = function(){
tmp = null
minp = null 
maxp = null
iPo = null
iPc = null
ot = 0
count = 1
}//

var error = function(e,a){
progt(10)
if((a&1)==0)
	alert(e)
console.log(e)
if(a&2)
	history.back()
}


var cut = function(txt,match,offset,opt){
var m,n, r=[], start = match.shift(), end = match.shift()
while(1){
	m = txt.indexOf(start,offset)
	if(m==-1)
		break
	n = txt.indexOf(end,m)
	if(n==-1)
		break
	r.push(txt.substr(m+start.length,n-m-start.length))
	offset = n+end.length
	if(opt&1){
		var start = match.shift(), end = match.shift()
		if(!start || !end)
			break
		}
	}
return r
}//fe

})();