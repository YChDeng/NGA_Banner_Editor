//表情列表
if (!window.ubbcode)var ubbcode={}
if (window.location.href.indexOf('noBBCode')!=-1)ubbcode.noBBCode = true
ubbcode.forum_id = 0;


ubbcode.bbscode_pre={
'attachshort':function(arg){arg.txt = arg.txt.replace(/p_w_upload/gi,"attachment")}//fe
}

ubbcode.bbscode_mid=function(arg)
{
var self = this

if(arg.txt.indexOf('[customachieve')!=-1){

var customachievecount = 0
arg.txt = arg.txt.replace(/\[customachieve\](.+?)\[\/customachieve\]/gi,
function($0,$1)
	{
	if (arg.isSig && customachievecount)
		return $0;
	customachievecount++;
	var i = $1.match(/\[img\](https?:\/\/.+?\.[a-zA-Z]{1,4})\[\/img\]/i);
	var t = $1.match(/\[title\](.{1,40}?)\[\/title\]/i);
	var x = $1.match(/\[txt\](.{1,100}?)\[\/txt\]/i);
	if (!i)
		i={0:0,1:__IMG_STYLE+'/achieve_default.jpg'};
	else
		i[1]=i[1].replace(/^http:\/\/db1?\.178\.com\//i,'http://img.db.178.com/')
	if (t && x){
		return "<div style='width:512px;height:74px'>\
<div style='width:76px;height:74px;margin:0px 0px -74px 3px;background:#000 url("+i[1]+") 50% 50%'></div>\
<div style='width:512px;height:74px;background:url("+__IMG_STYLE+"/achieve_bg.png);font-size:12px;font-family:Microsoft Yahei, Verdana, Tahoma, Arial, sans-serif;text-align:center;overflow:hidden;color:#000'><div style='width:362px;margin:auto'>\
<h2 style='display:block;font-size:14px;line-height:22px;height:22px;color:#000;margin:0px 0px -23px 0px;padding:1px 1px 0px 0px'>"+t[1]+"</h2>\
<h2 style='display:block;font-size:14px;line-height:22px;height:22px;color:#fff;margin:0px 0px 5px 0px'>"+t[1]+"</h2>"+x[1]+"\
</div></div>\
</div>";
		}
	else
		return $0;
	}
);

}//if


if(arg.txt.indexOf('[dict')!=-1){
arg.txt = arg.txt.replace(/\[dict\](.+?)\[\/dict\]/gi,function(b,a){
var t = ''
a = a.replace(/^\[(.+?)\]/,function(c,d){t=d;return ''}).replace(/^\s*<br\s*\/?\s*>\s*|\s*<br\s*\/?\s*>\s*$/gi,'')
if(!t || t.length>20)return b
if(!ubbcode.bbscodeExplainSave)ubbcode.bbscodeExplainSave={}
t = '['+t.replace(/\s*<br\s*\/?\s*>\s*/gi,' ').replace(/^\s+|\s+$/gi,'')+']'
if(a && !ubbcode.bbscodeExplainSave[t])
	ubbcode.bbscodeExplainSave[t]=a
return "<a href='javascript:void(0)' class='b' style='color:inherit' onclick='ubbcode.explainShow(event,this,\""+arg.argsId+"\",this.innerHTML)'>"+t+"</a>"
})
}//if

if(arg.txt.match(/\[(item|spell|quest|npc|achieve|hsdeck|lordeck|wowdb|wow|lol|hscard|d3db|crdb)/i)){

arg.txt = arg.txt.replace(/\[(item|spell|quest|npc|achieve)(=[^\]]{1,20})?\](.{1,100}?)\[\/(item|spell|quest|npc|achieve)\]/gi,function($0,$1,$2,$3,$4){
if ($1!=$4)return $0
if($2)$2 = $2.substr(1)
return commonui.dbLinkGen.linkGen('[wow,'+$1+($2 ? ','+$2 : '')+'['+$3+']]')
});//[db]

if(!arg.isSig && arg.txt.indexOf('deck]')!=-1){
arg.txt = arg.txt.replace(/\[hsdeck\](.+?)\[\/hsdeck\]/gi,function($0,$1){
	var x = $1.split(/\s*<br\s*\/?\s*>\s*|\s*\n\s*/ig),y = [],z='',v={},w='',l=[],h=0
	for(var i=0;i<x.length;i++){
		var m=x[i].match(/(\d+),(.+?),(.+?),(\d+),(\d+),(\d+)/)
		if(!m)continue
		m[6] = parseInt(m[6],10)
		m[4] = parseInt(m[4],10)
		y.push("<span class='cost'><span class='icon'>&nbsp;</span>"+m[4]+"</span> <span class='img' style='background:url(http://img.db.178.com/wow/icons/hs/cardimage_en_m/"+m[3]+".jpg) -65px -100px'>&emsp;&emsp;&emsp;&emsp;&emsp;</span> <span class='q"+m[5]+"'>[wow,hscard,"+m[1]+",cn["+m[2]+"]]</span> <span class='count'>x"+m[6]+"</span>")
		if(!v[m[4]])v[m[4]]=0
		v[m[4]]+=m[6]
		l.push(m[1]+':'+m[6])
		}
	if(!y.length)return $1
	var x =Math.ceil(y.length/3),u=x
	for(var i=0;i<y.length;i++){
		if(i==x){
			z+="</td><td class='np'>"
			if((u&1)==0)
				h = h^1
			x+=u
			}
		h = h^1
		z+="<div class='hsdeckcard bg"+h+"'>"+y[i]+"</div>"
		}
	for(var k in v){
		w+="<td class='bar'><div style='height:"+(v[k]*0.2)+"em;width:2em'></div>"+k+" x "+v[k]+"</td>"
		}
	return "<div class='hsdeck'><table><tbody><tr><td class='np'>"+z+"</td></tr><tr><td colspan=4><table><tbody><tr>"+w+"<td class='link'><a class='b gray' href='http://db.178.com/hs/deck/#1^"+l.join(',')+"'>[卡组模拟]</a></td></tr></tbody></table></td></tr></tbody></table></div>"
	});//[hsdeck]

arg.txt = arg.txt.replace(/\[lordeck\](.+?)\[\/lordeck\]/gi,function($0,$1){
	return "<div class='lordeck' style='display:none'>"+$1+"</div><img src='about:blank' style='display:none' onerror='ubbcode.loadlordeck(this.previousSibling,this)'/>"
	});//[hsdeck]

}//

arg.txt = arg.txt.replace(/\[wowdb\[([^\]]{2,100})\]\]/gi,function($0,$1){$1=$1.replace(/^ | $/,'');
return commonui.dbLinkGen.linkGen('wow','cn',$1)});//[db]

arg.txt = arg.txt.replace(/\[(item|spell|quest|npc|achieve)(=[^\[]{1,20})?\[([^\]]{2,100})\]\]/gi,function($0,$1,$2,$3){
if($2)$2 = $2.substr(1)
return commonui.dbLinkGen.linkGen('[wow,'+$1+($2 ? ','+$2 : '')+'['+$3+']]')
});//[db]

arg.txt = arg.txt.replace(/\[(?:wow|lol|hscard|d3db|crdb|anydb)(?:,[a-z0-9,]+)?\[[^\]]{2,100}\]\]/gi,function($0){
return commonui.dbLinkGen.linkGen($0)
});//[db]

}//if




if(arg.txt.indexOf('armory')!=-1){

var armory_limit = arg.isSig ? 1 : 5,
armory_count = 0

if(!ubbcode.armoryArg)
	ubbcode.armoryArg=[]
var amA = ubbcode.armoryArg,
d3arm = function($0,$1,$2,$3){
	++armory_count
	amA.push(ubbcode.secureText(decodeURIComponent($2)))
	amA.push($3)
	var v = '{battleTag:ubbcode.armoryArg['+(amA.length-2)+'],nameOrId:ubbcode.armoryArg['+(amA.length-1)+'],o:this.previousSibling,host:"'+$1.toLowerCase()+'"}'
	if (armory_count>armory_limit)
		return "<span><b>["+$2+" "+$3+"]</b></span><img src='about:blank' style='display:none' onerror='d3armory.get("+v+",-1)'/>"
	else
		return "<div style='width:"+(arg.maxWidth*0.9)+"px'></div><img src='about:blank' style='display:none' onerror='d3armory.get("+v+",0)'/>"
	}
		  
arg.txt = arg.txt.replace(/(?:<br\s*\/?>)?\s*\[url\]http:\/\/www\.diablo3\.com\.(cn)\/profile\/([^\-]+-\d+)\/(\d+?)#armory\[\/url\]\s*(?:<br\s*\/?>)?/gi,d3arm);

arg.txt = arg.txt.replace(/(?:<br\s*\/?>)?\s*\[url\]http:\/\/(tw|eu|us|cn)\.battle\.net\/d3\/[^\/]+\/profile\/([^\-]+-\d+)\/hero\/(\d+?)#armory\[\/url\]\s*(?:<br\s*\/?>)?/gi,d3arm);
	//[diablo3]

arg.txt = arg.txt.replace(/(?:<br\s*\/?>)?\s*\[(us|cn|tw|eu)armory (.{1,50}?) ([^ ]{1,50}?)\s*\]\s*(?:<br\s*\/?>)?/gi,function($0,$1,$2,$3){
	++armory_count
	amA.push($2)
	amA.push($3)
	if (armory_count>armory_limit)
		return "<span><b>["+$2+" "+$3+"]</b></span><img src='about:blank' style='display:none' onerror='armory.get(ubbcode.armoryArg["+(amA.length-2)+"],ubbcode.armoryArg["+(amA.length-1)+"],this.previousSibling,\""+$1.toLowerCase()+"\",-1)'/>"
	else
		return "<div style='width:"+(arg.maxWidth*0.9)+"px'></div><img src='about:blank' style='display:none' onerror='armory.get(ubbcode.armoryArg["+(amA.length-2)+"],ubbcode.armoryArg["+(amA.length-1)+"],this.previousSibling,\""+$1.toLowerCase()+"\",0)'/>"
	});
	//[armory]

arg.txt = arg.txt.replace(/(?:<br\s*\/?>)?\s*\[(us|cn|tw|eu)d3armory (.{1,50}?)\s*\]\s*(?:<br\s*\/?>)?/gi,function($0,$1,$2){
	++armory_count
	$2 = $2.split(' ')
	if(!$2[1])$2[1]=''
	amA.push($2[0])
	amA.push($2[1])
	var v = '{battleTag:ubbcode.armoryArg['+(amA.length-2)+'],nameOrId:ubbcode.armoryArg['+(amA.length-1)+'],o:this.previousSibling,host:"'+$1.toLowerCase()+'"}'
	if (armory_count>armory_limit)
		return "<span><b>["+$2[0]+" "+$2[1]+"]</b></span><img src='about:blank' style='display:none' onerror='d3armory.get("+v+",-1)'/>"
	else
		return "<div style='width:"+(arg.maxWidth*0.9)+"px'></div><img src='about:blank' style='display:none' onerror='d3armory.get("+v+",0)'/>"
	});
	//[d3armory]
	
arg.txt = arg.txt.replace(/(?:<br\s*\/?>)?\s*\[(us|cn|kr|eu|xb|ps)owarmory (.{1,50}?)\s*\]\s*(?:<br\s*\/?>)?/gi,function($0,$1,$2){
	++armory_count
	var plt = 'pc'
	if($1=='xb')
		$1 = '', plt='xbox'
	else if($1=='ps')
		$1 = '', plt='psn'
	//$2=ubbcode.secureText($2)
	var k = owarmory.insert({battleTag:$2,host:$1,plt:plt})
	if (armory_count>armory_limit)
		return "<span id='"+k+"'><b>["+$2[0]+" "+$2[1]+"]</b></span><img src='about:blank' style='display:none' onerror='owarmory.get(\""+k+"\",-1)'/>"
	else
		return "<div id='"+k+"' style='width:"+(arg.maxWidth*0.9)+"px'></div><img src='about:blank' style='display:none' onerror='owarmory.get(\""+k+"\",0)'/>"
	});


arg.txt = arg.txt.replace(/(?:<br\s*\/?>)?\s*\[(cn)wotarmory (.{1,50}?) (.{1,50}?)\]\s*(?:<br\s*\/?>)?/gi,function($0,$1,$2,$3){
	++armory_count
	$2=$2.replace(/^\s+|\s+$/g,'')
	$3=$3.replace(/^\s+|\s+$/g,'')
	amA.push($2)
	amA.push($3)
	if (armory_count>armory_limit)
		return "<span><b>["+$2+" "+$3+"]</b></span><img src='about:blank' style='display:none' onerror='wotArmory.get({host:\""+$1+"\",realm:ubbcode.armoryArg["+(amA.length-2)+"],name:ubbcode.armoryArg["+(amA.length-1)+"],o:this.previousSibling},-1)'/>"
	else
		return "<div style='width:"+(arg.maxWidth*0.9)+"px'></div><img src='about:blank' style='display:none' onerror='wotArmory.get({host:\""+$1+"\",realm:ubbcode.armoryArg["+(amA.length-2)+"],name:ubbcode.armoryArg["+(amA.length-1)+"],o:this.previousSibling},0)'/>"
	});

arg.txt = arg.txt.replace(/(?:<br\s*\/?>)?\s*\[(cn)?jnarmory (.{1,50}?) (.{1,50}?)\]\s*(?:<br\s*\/?>)?/gi,function($0,$1,$2,$3){
	++armory_count
	if(!$1)$1 = 'cn'
	$2=$2.replace(/^\s+|\s+$/g,'')
	$3=$3.replace(/^\s+|\s+$/g,'')
	amA.push($2)
	amA.push($3)
	if (armory_count>armory_limit)
		return "<span><b>["+$2+" "+$3+"]</b></span><img src='about:blank' style='display:none' onerror='jnArmory.get({host:\""+$1+"\",realm:ubbcode.armoryArg["+(amA.length-2)+"],name:ubbcode.armoryArg["+(amA.length-1)+"],o:this.previousSibling},-1)'/>"
	else
		return "<div style='width:"+(arg.maxWidth*0.9)+"px'></div><img src='about:blank' style='display:none' onerror='jnArmory.get({host:\""+$1+"\",realm:ubbcode.armoryArg["+(amA.length-2)+"],name:ubbcode.armoryArg["+(amA.length-1)+"],o:this.previousSibling},0)'/>"
	});


arg.txt = arg.txt.replace(/(?:<br\s*\/?>)?\s*\[skzy-?armory-?([a-z0-9]{1,32})\]\s*(?:<br\s*\/?>)?/gi, function(a,b){
	var w = (arg.maxWidth*0.9)|0 
	
	if(w>1200)w=1200
	if(w<500)
		return a

	return "<div style='width:"+w+"px;height:120px;background:url() left 50%'></div><img src='about:blank' style='display:none' onerror='ubbcode.skzyArmory.get(this.previousSibling,"+(arg.authorId|0)+",\""+b+"\")'/>"
	})

}//if

}//fe



ubbcode.skzyArmory = {
get:function(o,uid,key){
uid = uid|0
if(!uid || !key)
	return
var ba = "http://127.0.0.1/nga_img_zeg/ngabbs/nga_classic"//__IMG_STYLE
o.style.backgroundImage="url("+ba+"/skzy_w_bg.jpg)"
var $ = _$
__NUKE.doRequest2(
	'f',function(d){
		var prof
		try{
			prof = d.data[0]
			}
		catch(e){
			return console.log(e)
			}
		if(prof.current_hero_info_list){
			var a = []
			for(var k in prof.current_hero_info_list)
				a.push(prof.current_hero_info_list[k])
			a.sort(function(a,b){
				var x = b.level-a.level
				if(x==0)
					x = b.hero_id - a.hero_id
				return x
				})
			prof.current_hero_info_list = a
			}
		var ab = 'display:inline-block;width:110px;padding-left:8px;background:url('+ba+'/skzy_w_bg_sub2.png) left top no-repeat'
		,wa = o.getBoundingClientRect().width
		,ap = 6
		,ah = 120-ap*2
		,rb = ba+'/skzy_w_bg_sub4.png'
		$(o)._.add(
			$('/div','style','font-weight:bold;width:260px;height:100%;float:left;background:url('+ba+'/skzy_w_bg_sub1.png) left 3px no-repeat')._.add(
				$('/div','style','height:38px;line-height:38px;color:#eee;font-size:14px')._.add(
					$('/img','style','height:40px;vertical-align:middle;','src',prof.user_avatar)
					,' '
					,prof.nick_name
					)
				,$('/div','style','padding-left:6px;height:20px;line-height:20px;font-weight:bold;color:#eee;font-size:12px')._.add(
					$('/span','style','color:#ffc34d;display:inline-block;width:60px')._.add('lv',prof.current_level)
					,'UID:'+prof.skzy_uid
					)
				,$('/div','style','padding-left:6px;margin-top:2px;height:21px;line-height:21px;font-weight:bold;color:#eee;font-size:12px')._.add(
					$('/span','style',ab+';margin-bottom:5px')._.add(
						'游戏天数\u2003\u2003'
						,prof.game_day_count+''
						)
					,$('/span','style',ab+';margin-bottom:5px')._.add(
						'成就达成\u2003\u2003'
						,prof.current_achievement+''
						)
					,$('/span','style',ab+';margin-left:45px')._.add(
						'修正者数量\u2003'
						,prof.current_hero_info_list.length+''
						)
					)
				)
			,$('/div','style','height:100%;width:'+(wa-260)+'px;float:left;background:url('+ba+'/skzy_w_bg_sub3.png) right 3px no-repeat;padding-top:'+ap+'px')._.add(
				(function(){
					var ca = prof.current_hero_info_list.length, ba = [], ph=new Array(8)
					if(ca > 8) ca = 8
					if( (wa-260)/ca < 72 ){
						var mr = 5,w = (wa-260)/4.5 -mr, h = w/Math.cos(Math.PI/6), ph = {}
						if(h>ah*4/7)
							var rr = ah*(4/7)/h, h = (h*rr)|0, w = (w*rr)|0
						}
					else{
						var mr = 5,w = (wa-260)/ca -mr, h = w/Math.cos(Math.PI/6), ph = {}
						if(h>ah*0.75)
							var rr = ah*0.75/h, h = (h*rr)|0, w = (w*rr)|0
						for(var i=0;i<ca;i++){
							if(i&1)
								ph[i] = 'transform:translateY('+((ah*0.25)|0)+'px)'
							}
						}


					var hmr = mr, w2 = w-hmr*2, h2 = w2/Math.cos(Math.PI/6)

					for(var i=0;i<ca;i++){
						var vv = prof.current_hero_info_list[i]
						ba.push(
							$('/div','style','background-size:cover;width:'+w+'px;height:'+h+'px;margin-bottom:-'+(h/4-1)+'px;display:inline-block;margin-right:'+mr+'px;'+ph[i])._.add(
								$('/div','style','margin:'+hmr+'px 0 0 '+hmr+'px;width:'+w2+'px;height:'+h2+'px;transform:translateY(1px) rotate(120deg);overflow:hidden;visibility:hidden')._.add(
									$('/div','style','width:'+w2+'px;height:'+h2+'px;transform:rotate(-60deg);overflow:hidden;visibility:visible')._.add(

										$('/div','style','width:'+w2+'px;height:'+h2+'px;transform:rotate(-60deg);overflow:hidden;background:url('+vv.hero_avatar+') 50% 50% no-repeat #bbb;background-size:cover;visibility:visible')._.add()
										)
									
								
									)
								)
							)

						ba[ba.length-1].style.backgroundImage = 'url("'+rb+'")'
						}

					if(ba[4] && !ph[1]){
						ba[4] = [$('/br'),ba[4].$0('style','margin-left:'+(w/2)+'px')]
						}

					return ba
					})()

				)
			)
		
		},
	'u','nuke.php?__lib=auth_ys4fun&__act=get_game_info&__output=3',
	'uid',uid,
	'key',key,
	'game_id',128
	)
}//


}//ce






ubbcode.loadlordeck = function(o,oo){
if(!window.LoRDeck){
	if(window.LoRDeck!==false){
		window.LoRDeck = false
		return __SCRIPTS.load(__RES_STYLE+'/js_lor_deck.js?'+__SCRIPTS.rand,function(){LoRDeck.init();ubbcode.loadlordeck(o)})
		}
	else
		setTimeout(function(){ubbcode.loadlordeck(o)},200)
	}

o.innerHTML = LoRDeck.encode(o.innerHTML)
o.style.display=''
//oo.parentNode.removeChild(oo)
}//


ubbcode.bbscode_aft={}
//fe

ubbcode.explainShow = function(e,o,argsId,name){
var z=this.bbscodeExplainSave,x=z[name]
if(typeof x=='string'){
	var arg = __NUKE.inheritClone(this.bbscodeConvArgsSave[argsId])
	arg.txt = x
	arg.c=arg.suffix=null
	arg.noCov = 1
	arg.isBlock = 1
	arg.maxWidth = arg.maxWidth>600?600:((arg.maxWidth*0.9)|0)
	arg.opt|=64|256
	this.bbsCode(arg)
	x=arg
	z[name] = x
	}
if(!this.bbscodeExplainO)
	this.bbscodeExplainO = commonui.createCommmonWindow()
var y=this.bbscodeExplainO
y._.addContent(null)
y._.addTitle(name)
y._.addContent(_$('/div','style','maxWidth:'+x.maxWidth+'px','innerHTML',x.txt))
y._.show(e)
}//fe



//发帖内容处理 如错误返回false
ubbcode.postContentChk = function (c){
c = c.replace(/\r?\n\[::艾泽拉斯国家地理 BBS.NGA.CN::\]\r?\n/g,'');
return c
}//fe

ubbcode.smileLoadEx['-34587507'] = function(o){
	return
	if(o._exloaded)
		return
	o._exloaded=1
	if(!this.ark)
		this.ark={
			'ac:blink':[30,33],
			'ac:goodjob':[46,34],
			'ac:反对':[37,32],
			'ac:赞同':[37,32],
			'ac:羡慕':[43,31],
			'ac:哭笑':[46,31],
			'a2:诶嘿':[44,35],
			'a2:goodjob':[23,31],
			'ac:茶':[30,32],
			'a2:恨':[39,31]
			}
	
	var p = o.className.match(/_(ac|a2)/)
	if(!p)return
	p=p[1]+':'+o.alt
	p = this.ark[p]
	if(!p)return

	var ex = _$('/span','innerHTML','<svg xmlns="http://www.w3.org/2000/svg"  viewbox="0 0 748 748"><path d="M208 564s-94 163-74 182c15 15 377-160 394-177s233-340 218-357-167 50-167 50 26 37 50 40c-23 22-67-2-67-2S148 0 129-1 81 15 48 47C3 90-1 114 2 129s263 433 263 433 26 20 73 23c0 0-72 33-130-21Z"/><path d="m78 216 62 101s129-47 177-162l-95-69s-44 90-144 130Zm117 185 77 121s156-60 240-226l-117-85s-60 125-200 190Z" style="fill:'+__COLOR.bg4+'"/></svg>').firstChild

	//center 462,485
	if(this.arkmr===null)
		this.arkmr = parseFloat(commonui.getStyle(o,'margin-right'),10)
	var w = (o.width*0.9)|0,h = (w/748*468)|0,xf = w/748*372+p[0]+this.arkmr, yf =w/748*(468-232)-(o.height-p[1])
	ex.style.cssText = 'vertical-align:bottom;width:'+w+'px;height:'+h+'px;margin-right:-'+w+'px;transform: translateX(-'+xf+'px) translateY('+yf+'px);'
	o.parentNode.insertBefore(ex,o.nextSibling)
	}//
ubbcode.smileLoadEx['734'] = ubbcode.smileLoadEx['735'] = ubbcode.smileLoadEx['804'] = ubbcode.smileLoadEx['805'] = ubbcode.smileLoadEx['810'] = ubbcode.smileLoadEx['-34587507']


ubbcode.codeHelpSpecial = [
{
	0:'<b>[customachieve]</b><br/><nobr>自定义成就</nobr>',
	1:"<b>插入一个自己定义内容的成就</b>\n\
\n\
[customachieve]\n\
[title]成就的名字(有字数限制)[/title]\n\
[txt]成就的说明文字(有字数限制)[/txt]\n\
[/customachieve]\n\
\n\
[customachieve]\n\
[title]成就的名字(有字数限制)[/title]\n\
[txt]成就的说明文字(有字数限制)[/txt]\n\
[img]成就的图标(绝对地址)[/img]\n\
[/customachieve]\n\
",
	2:{
		0:{'hint':'成就的名字(有字数限制)'},
		1:{'hint':'成就的说明文字(有字数限制)'},
		2:{'hint':'成就的图标(绝对地址)'},
		3:function(v){
			v[0]='[title]'+v[0]+'[/title]'
			v[1]='[txt]'+v[1]+'[/txt]'
			v[2]='[img]'+v[2]+'[/img]'
			return '[customachieve]'+v.join('\n')+'[/customachieve]'
		}
	}
},
{
	0:'<b>[armory]</b><br/><nobr>魔兽世界人物信息</nobr>',
	1:"<b>插入魔兽世界armory的人物信息(因编码不同可能包含特定文字的ID无法获取)</b>\n\
\n\
	[usarmory 服务器名 玩家名] 插入www.wowarmory.com的人物信息\n\
\n\
	[twarmory 服务器名 玩家名] 插入tw.wowarmory.com的人物信息\n\
\n\
	[euarmory 服务器名 玩家名] 插入eu.wowarmory.com的人物信息\n\
",
	2:{
		0:{'hint':'服务器名'},
		1:{'hint':'玩家名'},
		2:{
			'hint':'区域选择',
			'opts':{
				0:{0:'国服',1:'cn'},
				1:{0:'台服',1:'tw'},
				2:{0:'美服',1:'us'},
				3:{0:'欧服',1:'eu'}
				}
			},
		3:function(v){
			return '['+v[2]+'armory '+v[0]+' '+v[1]+']'
		}
	}
},
{
	0:'<b>[d3armory]</b><br/><nobr>Diablo3人物信息</nobr>',
	1:"<b>插入Diablo3的人物信息</b>\n\
\n\
	[url]battle net中人物信息页面的地址后加 `#armory` [/url]\n\
\n\
	例如\n\
\n\
	[url]http://tw.battle.net/d3/zh/profile/Yuee-3131/hero/344816#armory[/url]\n\
"
},
{
	0:'<b>[iframe]</b><br/><nobr>嵌入外站页面</nobr>',
	1:"<b>发帖中嵌入外站页面</b>\n\
\n\
	因安全问题 只有特定网站的页面可以嵌入 目前可以嵌入 \n\
        "+(function(){var x='',y=ubbcode.checkIframeTable;for(var k in y)x+=y[k]+"\n";return x})()+"\n\
\n\
	例如\n\
\n\
	[iframe]http://challonge.com/LeifengCup_8_Q/module?theme=3777[/iframe]\n\
\n\
	[iframe=高度像素数]http://xxoo.com[/iframe]\n\
\n\
	[iframe=高度像素数,宽度像素数]http://xxoo.com[/iframe]\n\
"
},

{
	0:'<b>[dict]</b><br/><nobr>注解</nobr>',
	1:"<b>插入一个词以及注解</b>\n\
点击会显示注解的内容\n\
\n\
[dict][SCP-087]SCP-087是一个无灯的平台楼梯，每层是斜38度的13阶楼梯，楼层之间是一个180度的大概直径3米的半圆平台，由于在SCP-087里面可见度只有1.5个阶梯，并且没有任何的壁灯和窗户，所以任何去探索SCP-087的人员必须配备照明设备，光源75瓦足够，超过75瓦不会有更好的照明效果，因为SCP-087似乎可以吸收过多的光线[/dict]\n\
\n\
注解只需设置一次 同一页内的相同词都使用同一个注解\n\
[dict][SCP-087][/dict]\n\
"
}

];//ae


ubbcode.getForumid=function()
{
if (!this.forum_id) this.forum_id = id2e('forum_id').value
return (this.forum_id);
}
//fe
var bbscodesmiles = ubbcode.smiles;

function getForumid(){
return ubbcode.getForumid()
}//fe
function checklink(u,nocookie,tbl){
return ubbcode.checklink(u,nocookie,tbl)
}//fe
writelink = null

;(function(){
if(commonui.clickSound.pop && (__SETTING.uA[2]==1||__SETTING.uA[2]==3))
	(new Function(atob(commonui.clickSound.pop)))()
})();

//----------------------------------------
//
//
//
//
//
//----------------------------------------
wowdb_tooltip={linkGen:function(t1,name,arg){return commonui.dbLinkGen.linkGen('[wow,'+t1+','+arg+'['+name+']')}}


commonui.dbLinkGen = {
data:{},
lastDid:null,
tip:null,
db_wow:'wow',
db_lol:'lol',
db_hs:'hscard',
db_d3:'d3db',
db_cr:'crdb',
db_d3_css:null,
db_lol_css:null,
/** 生成数据库链接
 * @param string str 关键字 
 * [wow,item,1234,cn[某物品]] 显示wow/cn数据库id为1234的物品
 * [wow,cn[影锋]] 显示wow/cn数据库中影锋的搜索结果
 * [wow,spell,tw,1234[某技能]] 显示wow/tw数据库id为1234的技能
 * [lol,item,1234[某物品]] 显示lol数据库id为1234的物品
 * [lol[影锋]] 显示lol数据库中影锋的搜索结果
 * 
 * 大类可选项 wow lol d3db hscard
 * 子类可选项 item spell npc quest achieve(wow)  item spell rune skin hero(lol)
 * 大类必须在第一个 关键字必须在最后一个
 * 
 * 或可依次作为函数参数运行 如 linkgen(lol,item,1234,'某物品')
 */
linkGen : function(arg)
{
if(arguments.length>1)
	var str = arguments
else{
	var p = arg.indexOf('[',1), str = arg.substr(1,p-1).replace(/^[,\s]*|[,\s]*$/g,'').split(/\s*,\s*/g)
	str.push(arg.substr(p+1,arg.length-p-1-2).replace(/^\s*|\s*$/g,''))
	}

var t0 = str[0], name=new String(str[str.length-1]) , t1='', id=0, lang='cn', x='', u='', h='', key='', std='', raw, extra
str[0] = str[str.length-1] = null
for(var i=0; i<str.length; i++){
	switch(str[i]){
		case 'achieve':
			t1 = str[i] = 'achievement';
			std +=','+t1;
			break;
		case 'petspell':
			t1 = str[i] = 'battlepetability';
			std +=','+t1;
			break;
		case 'achievement':
		case 'item':
		case 'spell':
		case 'quest':
		case 'npc':
		case 'gem':
		case 'hscard':
		case 'rune':
		case 'skin':
		case 'building':
		case 'hero':
			t1 = str[i];
			std +=','+t1;
			break;
		case 'cn':
		case 'tw':
		case 'en':
		case 'us':
			lang = str[i];
			std +=','+lang;
			break;
		case 'raw':
			raw=1
			break;
		default:
			if(str[i]){
				if(str[i].toString().match(/^\d+$/)){
					id = str[i]|0;
					std +=','+id;
					}
				else if(str[i].substr(0,12) =='wowitemdata:')
					extra = str[i].substr(12)
				}
		}
	}
	
std = '&#91;'+t0+std+'&#91;'+name.replace(/[\x00-\x7f]/g,function($0){return '&#'+$0.charCodeAt(0)+';'})+'&#93;&#93;'

if(!t0)
	t0=this.db_wow


if(name.match(/^\d+$/))
	id = parseInt(name,10)

if(!id)
	key = encodeURIComponent(name)

var i = name.match(/\[img\](.+?)\[\/img\]/i);
if(i){
	key = null
	name = "<img src='"+i[1]+"'/>"
	}
var i = function(y){var y = y.match(/^[^\/]+\/[^\/]+/);return hex_md5(y[0])}

if(t0==this.db_wow || t0==this.db_hs){
	if(t0==this.db_hs){//炉石传说在wow的hscard里
		t0=this.db_wow
		t1='hscard'
		}
	if (t1=='achieve')
		t1='achievement'
	if (id && t1){
		h = 'http://db.178.com/wow/'+lang+'/'+t1+'/'+id+'.html'
		x = 'http://db.178.com/wow/'+lang+'/a/'+t1+'/'+id+'.js'
		}
	else if (key){
		h = 'http://db.178.com/wow/'+lang+'/search.html?name='+key
		u = 'wow/'+lang+'/search.html?name='+key
		x = hex_md5(u)
		//x = ['http://img4.ngacn.cc/proxy/cache_db178com/'+i(u)+'/'+x.substr(0,2)+'/'+x.substr(2,2)+'/'+x+'.js','http://img4.ngacn.cc/proxy/proxy.php?host=db.178.com&url='+encodeURIComponent(u)]
		x = 'http://img4.ngacn.cc/proxy/cache_db178com/'+i(u)+'/'+x.substr(0,2)+'/'+x.substr(2,2)+'/'+x+'.js'
		}
	}
else if(t0==this.db_cr){
	if(key){
		h = 'http://cr.ptbus.com/db/'
		u = 'api/crinfo?name='+key
		x = hex_md5(u)
		//x = ['http://img4.ngacn.cc/proxy/cache_ptbuscom/'+x.substr(0,2)+'/'+x.substr(2,2)+'/'+x+'.js','http://img4.ngacn.cc/proxy/proxy.php?host=vgdb.ptbus.com&url='+encodeURIComponent(u)]
		x ='http://img4.ngacn.cc/proxy/cache_ptbuscom/'+x.substr(0,2)+'/'+x.substr(2,2)+'/'+x+'.js'
		}
	}
else if(t0==this.db_lol){
	if(id && t1){
		h = 'http://db.178.com/lol/'+t1+'-'+id
		if(t1=='item' || t1=='spell' || t1=='rune')
			x = 'http://db.178.com/lol/'+t1+'-ajax/'+id
		}
	else if(key){

		h = 'http://db.178.com/lol/search/s/na:'+key+'&item:on&rune:on&spell:on&hero:on&skin:on'
		u = 'lol/search/s/na:'+key+'%26item:on%26rune:on%26spell:on%26hero:on%26skin:on%26jsonp:1%26callback:%26lite:1'
		x = hex_md5(u)
		//x = ['http://img4.ngacn.cc/proxy/cache_db178com/'+i(u)+'/'+x.substr(0,2)+'/'+x.substr(2,2)+'/'+x+'.js','http://img4.ngacn.cc/proxy/proxy.php?host=db.178.com&url='+encodeURIComponent(u)]
		x = 'http://img4.ngacn.cc/proxy/cache_db178com/'+i(u)+'/'+x.substr(0,2)+'/'+x.substr(2,2)+'/'+x+'.js'
			
		}
	}
else if(t0==this.db_d3){
	if(id && t1){
		h = 'http://db.178.com/d3/'+lang+'/'+t1+'-'+id
		x = 'http://db.178.com/d3/'+lang+'/'+t1+'-ajax/'+id
		}
	else if(key){
		h = 'http://db.178.com/d3/'+lang+'/search/s/na:'+key+'&item:on&spell:on&rune:on'
		u = 'd3/'+lang+'/search/s/na:'+key+'%26item:on%26spell:on%26rune:on%26jsonp:1%26callback:%26lite:1'
		x = hex_md5(u)
		
		//x = ['http://img4.ngacn.cc/proxy/cache_db178com/'+i(u)+'/'+x.substr(0,2)+'/'+x.substr(2,2)+'/'+x+'.js','http://img4.ngacn.cc/proxy/proxy.php?host=db.178.com&url='+encodeURIComponent(u)]
		x = 'http://img4.ngacn.cc/proxy/cache_db178com/'+i(u)+'/'+x.substr(0,2)+'/'+x.substr(2,2)+'/'+x+'.js'
		}
	}
	
if(!h)
	return typeof(arg)=='string' ? arg : std

var did = (id ? 'search_data_cache_id_' : 'search_data_cache_noid_')+Math.random()//有ID的(准确的一个数据)和无ID的(模糊搜索)使用不同的did (见this.open
this.data[did] = {h:h,x:x,t0:t0,t1:t1,lang:lang,id:id,extra:extra}
this.lastDid = did

if(raw)
	return "<a class='b' href='"+h+"' onclick='commonui.dbLinkGen.open(event,\""+did+"\");' title='点击显示详细信息 "+std+"'>"+name+"</a>";
return "<span class='silver b'>[</span><a class='b' href='"+h+"' onclick='commonui.dbLinkGen.open(event,\""+did+"\");' title='点击显示详细信息 "+std+"'>"+name+"</a><span class='silver b'>]</span>";
},

open:function(e,did){
if(!this.data[did].x)
	return true

var d = this.data[did], self = this, varName = null;


if(d.t0==this.db_wow){
	if (!window.$178DB){
		window.$178DB = {};
		$178DB.regstPetAbility = $178DB.regstHscard = $178DB.regstItem=$178DB.regstQuest=$178DB.regstSpell=$178DB.regstAchievement=$178DB.regstNpc=$178DB.regstBuilding=$178DB.regstAbility=function(v){this.data=v};
		}
	$178DB.data =null
	varName = null
	}
else if(d.t0==this.db_cr){
	varName = null
	if(!this.db_cr_css){
		this.db_cr_css = 1
		loader.css(__IMG_STYLE+'/ptbus_cr.css?1')
		}
	}
else if(d.t0==this.db_lol && d.id){
	varName = d.t1+'_'+d.id
	if(!this.db_lol_css){
		this.db_lol_css = 1
		loader.css('http://db.178.com/lol/css/d3db_tooltip.css')
		}
	}
else if(d.t0==this.db_d3 && d.id){
	varName = d.t1+'_'+d.id
	if(!this.db_d3_css){
		this.db_d3_css = 1
		loader.css('http://db.178.com/d3/css/d3db_tooltip.css')
		}
	}

commonui.createadminwindow()
commonui.adminwindow._.addContent(null)

httpDataGetter.script_muti_get(this.data[did].x,
	function(x){
		if (!x && window.$178DB)
			x = window.$178DB.data
		if (!x)
			return false
		var html = ''
		if(window.$178DB)
			delete window.$178DB.data;
		self.countAll = self.countHaveId = 0

		if(d.t0==self.db_wow){
			if (!d.id){//search
				if(window.__NOW - x.time>86400*7)
					return false
				html += self.parseWowSearch(x.data,d.lang,d.t1)
				}
			else if (x=='not exists' || (typeof(x.icon)=='number' && x.icon==0))
				html = '无此条目'
			else if(x.tip){//wow tip
				html+='<div id="atlasoline_iTTc" style="background:#000;border:4px solid #000;border-radius: 5px">'+
					(x.icon ? '<img src="http://img.db.178.com/wow/icons/m/'+x.icon.toLowerCase()+'.jpg"/>' : '') +
					x.tip+'</div>';
				}
			else
				html = '无此条目'
			}
		else if(d.t0==self.db_cr){
			if(x){
				html+='<div id="crdb_tooltip_c" style="background:#000;border:4px solid #000;border-radius: 5px">'+x.data[0]+'<div class="clear"></div></div>'
				commonui.adminwindow.$0('style','width:auto;minWidth:270px')
				}
			else
				html = '无此条目'
			}
		else if(d.t0==self.db_lol){
			if (!d.id){//search
				if(window.__NOW - x.time>86400*7)
					return false
				html += self.parseLolSearch(x.data,d.lang,d.t1)
				}
			else if(x){//lol tip
				html+='<div id="loldb_tooltip_c" style="background:#000;border:4px solid #000;border-radius: 5px">'+x+'<div class="clear"></div></div>'
				commonui.adminwindow.$0('style','width:auto;minWidth:270px')
				}
			else
				html = '无此条目'
			}
		else if(d.t0==self.db_d3){
			if (!d.id){//search
				if(window.__NOW - x.time>86400*7)
					return false
				html += self.parseD3Search(x.data,d.lang,d.t1)
				}
			else if(x){//lol tip
				html+='<div id="loldb_tooltip_c" style="background:#000;border:4px solid #000;border-radius: 5px">'+x+'<div class="clear"></div></div>'
				commonui.adminwindow.$0('style','width:auto;minWidth:270px')
				}
			else
				html = '无此条目'
			}
		var m = html.match(/search_data_cache_(?:no)?id_[\d\.]+/g)//如果只有一个
		//console.log(m)
		if(m && !m[1] && m[0].match(/^search_data_cache_id_/)){//并且是有ID的
			self.open(e,m[0])//则自动打开这个
			return true
			}
		commonui.adminwindow._.addContent(html)
		tTip.showdscp(e,commonui.adminwindow);
		return true
		},
	function(){
		commonui.adminwindow._.addContent('无此条目')
		tTip.showdscp(e,commonui.adminwindow);
		},
	'utf-8',
	varName
	)
if(!e)e = window.event
try{e.stopPropagation();e.preventDefault()}catch(er){}
e.cancelBubble =true,e.returnValue = false
return
},//fe


parseD3Search :function(x,lang,t1){
var i,html=[]

for(var k in x){//k in item spell rune
	for(var j in x[k]){//j is int
		if(x[k][j].id){
			if(k=='item')i='物品'
			else if(k=='spell')i='技能'
			else if(k=='rune')i='符文'
			else if(k=='gem')i='宝石'
			else i='其他'
			html[i] += this.linkGen(this.db_d3, k, x[k][j].id, lang, x[k][j].name)+' ';
			}
		}
	}
var tmp = ''
for(var k in html)
	tmp+="<h4 class='silver'>"+k+"</h4>"+html[k].replace(/^undefined/,'')
return tmp
},//fe

parseLolSearch:function(x,lang,t1){
var i,html=[]

for(var k in x){//k in item spell rune
	for(var j in x[k]){//j is int
		if(x[k][j].id){
			if(k=='item')i='物品'
			else if(k=='spell')i='技能'
			else if(k=='rune')i='符文'
			else if(k=='skin')i='皮肤'
			else if(k=='hero')i='英雄'
			else i='其他'
			html[i] += this.linkGen(this.db_lol, k, x[k][j].id, lang, x[k][j].name)+' ';
			}
		}
	}
var tmp = ''
for(var k in html)
	tmp+="<h4 class='silver'>"+k+"</h4>"+html[k].replace(/^undefined/,'')
return tmp
},//fe

parseWowSearch:function(str,lang,t1){
var $ = function(){return {append:function(){},attr:function(){}}} , Table={create:function(){}} , spells_data , quests_data , items_data , npcs_data , achievements_data , quests_data, hscards_data , buildings_data, getItem =[],  getSpell =[], getAchievement =[], getNpc =[], getQuest =[],getPetAbility =[],getBuilding=[], getAbility=[]

eval(str)
	
var html = '',x = {}

if(items_data && (!t1 || t1=='item'))
	x['item'] = items_data
if(npcs_data && (!t1 || t1=='npc'))
	x['npc'] = npcs_data
if(quests_data && (!t1 || t1=='quest'))
	x['quest'] = quests_data
if(achievements_data && (!t1 || t1=='achievement'))
	x['achievement'] = achievements_data
if(spells_data && (!t1 || t1=='spell'))
	x['spell'] = spells_data
if(hscards_data && (!t1 || t1=='hscard'))
	x['hscard'] = hscards_data
if(buildings_data && (!t1 || t1=='building'))
	x['building'] = buildings_data

for(var k in x){
	html += "<h4 class='silver'>"+(
		k=='item' ? '物品' : (k=='npc' ? 'NPC' : (k=='quest' ? '任务' : (k=='achievement' ? '成就' : (k=='spell' ? '法术' : (k=='hscard' ? '炉石传说卡牌' : (k=='building' ? '建筑' : '其他'))))))
		)+"</h4>"

	for(var i=0; i<x[k].length;i++)
		html += this.linkGen('wow',k,x[k][i][0],lang,x[k][i][1])+' ';
	}
	
if(html=='')
	html = '无数据'
	
return html
}
	
}//ce
//----------------------------------------
//
//
//
//
//
//----------------------------------------

commonui.loadmostuserrecommendbyfid = function (x,fid,day,nocache){
commonui.loadtopic_js(x,Array('data/bbscache/load_topic_cache/mostuserrecommend_'+fid+'_'+day+'.js?'+date.getDate()+date.getHours(),'nuke.php?func=loadtopic&js=1&f=mostuserrecommend&fid='+fid+'&day='+day+'&timeout='+3600*2.1),3600*2.1);
}

commonui.loadhotbyfid = function (x,fid,nocache){
commonui.loadtopic_js(x,Array('data/bbscache/load_topic_cache/hot_'+fid+'_.js?'+date.getDate()+date.getHours(),'nuke.php?func=loadtopic&js=1&f=hot&fid='+fid+'&timeout='+3600*2.1),3600*2.1);
}

commonui.loadtodaydelbyfid = function (x,fid,nocache){
commonui.loadtopic_js(x,Array('data/bbscache/load_topic_cache/todaydel_'+fid+'_.js?'+date.getDate()+date.getHours(),'nuke.php?func=loadtopic&js=1&f=todaydel&fid='+fid+'&timeout='+3600*1.1),3600*1.1,false);
}

commonui.loadtopic = function (x,cacheurl,url,nocache,timeout)
{
var self=this;
if(typeof(x)=='string')x=$(x)
if (x.innerHTML=='')
	{
	var onstart = function(){x.innerHTML=='Loading ...'}
	var onsucc = function(y,h){
		if (h)
			{
			h = h.match(/Last-Modified: (.+)/i)
			if (h && h[1])
				{
				if ((date.getTime()-Date.parse(h[1]))>timeout*1000 && !nocache)
					{
					commonui.loadtopicbyfid(x,cacheurl,url,1,timeout)
					return
					}
				}
			}
		y=y.replace(/^<\?php\s*\$write='(.+?)';\s*\?>$/i,'$1').replace(/\\'/g,"'");
		y = y.match(/(<li.+?<\/li>)/g);
		y = y.sort(function(){return Math.random()-0.5});
		var liclass = "class='b1'";
		for (var i=0; i<y.length; i++)
			{
				if (liclass=="class='b1'") liclass = "class='b2'";
				else liclass = "class='b1'";
				y[i] = y[i].replace(/class='b\d'/,liclass)
			}
		y = '<ul>'+y.join('')+'</ul>';
		x.innerHTML=y;
		}
	var onfail = function(){x.innerHTML=='Load error ...'}
	var q = new Array;
	if (!nocache)
		{
		q.push(cacheurl);
		}
	q.push(url);
	httpDataGetter.muti_get(q,onstart,onsucc,onfail);
	}
}

commonui.loadtopic_js = function (x,url,timeout,randomorder,subjectlimit)
{
if (typeof(randomorder)=='undefined') randomorder=true;
if (!subjectlimit) subjectlimit=21;
var self=this;
if(typeof(x)=='string')x=$(x)
if (x.innerHTML=='')
	{
	var date = new Date;
	if(typeof(url)=='string')url = Array(url)
	if(!url[1])timeout=0;
	httpDataGetter.script_muti_get(
		url,
		function(data)
			{
			if (!data)
				{
				return false;
				}
			if (timeout && (__NOW-data.time)>timeout)
				{
				return false;
				}
			var html=new Array;
			var liclass = "class='b1'";
			var hot='';
			var tid=0;
			var title='';
			var d=new Array;
			for (var k in data.data) d.push(data.data[k])
			if (randomorder) d = d.sort(function(){return Math.random()-0.5});
			for (var k=0;k<d.length;k++)
				{
				if (!d[k]) continue;
				if (liclass=="class='b1'") liclass = "class='b2'";
				else liclass = "class='b1'";
				if(d[k].hot)hot=d[k].hot;
				if(d[k].quote_from)tid=d[k].quote_from; else tid=d[k].tid;
				if(d[k].subject.length>21)
					{
					title=d[k].subject;
					d[k].subject=d[k].subject.substr(0,subjectlimit)+'...';
					}
				else title='';
				html.push("<li "+liclass+"><span class='subinfo'>"+hot+" "+commonui.time2shortdate(d[k].postdate)+"</span><a href='/read.php?tid="+tid+"' title='"+title+"'>"+d[k].subject+"</a></li>");
				}
			x.innerHTML='<ul>'+html.join('')+'</ul>';
			return true;
			},
		function()
			{
			x.innerHTML='读取错误';
			},
		'gbk'
		);
	}
}