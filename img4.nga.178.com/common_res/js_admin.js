if(!window.adminui)
	var adminui = {};
if(!window.commonui)
	var commonui = {}


adminui.getValue = function(f,n){
var x = f.elements.namedItem(n)
if(!x.nodeName && x.length){
	for(var i=0;i<x.length;i++){
		if(x[i].checked)
			return x[i].value
		}
	return
	}
if(x.nodeName=='select')
	return x.options[x.selectedIndex].value
if(x.type=='checkbox')
	return x.checked ? 1 :''
return x.value
}

adminui.txt = function(x){
return document.createTextNode(x)
}

adminui.createadminwindow = function(id)
{
if(this.w)return
this.w = commonui.createCommmonWindow()
if(!id)
	this.w.id = 'adminwindow';
else
	this.w.id = id;
if($('massAdminForm')) $('massAdminForm').appendChild(this.w);
else document.body.appendChild(this.w);
}
//fe

adminui.hide=function (){
this.w.style.display='none'
}//fe



/**
 * 提前主题
 * @param {type} e
 * @param {type} tid
 * @returns {undefined}
 */
adminui.pushtopic = function(e,tid)
{
this.createadminwindow()
this.w._.addContent(null)
this.w._.addTitle('提前主题');
this.w._.addContent(		
	_$('/button','innerHTML','提前主题','type','button','onclick',function(){
			__NUKE.doRequest2(
				'b',this,
				'u',__API._base+'__lib=topic_push&__act=push&__output=3',
				'tid',tid)
			}
		),
	_$('/button','innerHTML','下沉主题','type','button','onclick',function(){
			__NUKE.doRequest2(
				'b',this,
				'u',__API._base+'__lib=topic_push&__act=push&__output=3',
				'tid',tid,
				'down',1)
			}
		),
	(__GP.staff&&__GP.super) ? 
		_$('/div')._.add(
			'每',_$('/input','size','2'),'~',_$('/input','size','2'),'分钟 持续',_$('/input','size','2'),'小时'
			,_$('/button','innerHTML','提前主题','type','button','onclick',function(){
				var x=this.parentNode.getElementsByTagName('input')
				__NUKE.doRequest2(
					'b',this,
					'u',__API._base+'__lib=topic_push&__act=push&__output=3',
					'tid',tid,
					'min',x[0].value|0,
					'max',x[1].value|0,
					'until',x[2].value|0,
					'hold',1)
				}
			)) : null
	)
this.w._.show();
}
//fe

/**
 * 加分
 * @param {type} e
 * @param {type} tid
 * @param {type} pid
 * @param {type} fid
 * @returns {undefined}

adminui.addpoint = function (e,tid,pid,fid)
{
this.createadminwindow()

if (__GP['super'] || fid<0)
	var apinput = "<input type='text' size='10' name='rcvc' value=''>(-1500~1500)";
else
	var apinput = "只需判断好坏，不要考虑具体分数<br/><select name='rcvc'><option value='lv01'>悲剧奖</option><option value='lv02'>安慰奖</option><option value='lv0'>鼓励奖</option><option value='lv1'>好</option><option value='lv2'>很好</option><option value='lv3'>巨好</option><option value='lv-1' style='background:#fdd'>不好</option><option value='lv-2' style='background:#fdd'>很不好</option><option value='lv-3' style='background:#fdd'>巨不好</option></select>";
this.w._.addContent(null)
this.w._.addContent( "\
	<form action='' target='_blank' method='post'>\
	<table>\
		<tr>\
			<td>\
				声望\
			</td>\
			<td>\
				"+apinput+"\
			</td>\
		</tr>\
		<tr>\
			<td>\
				理由\
			</td>\
			<td>\
				<input type='text' size='10' name='info' value=''>\
			</td>\
		</tr>\
		<tr>\
			<td>\
				PM\
			</td>\
			<td>\
				<input type='radio' name='pm' value='1' checked='checked'>是\
				<input type='radio' name='pm' value=''>否\
			</td>\
		</tr>\
		<tr>\
			<td>\
				增加金钱\
			</td>\
			<td>\
				<input type='radio' name='addmoney' value='1' checked='checked'>是\
				<input type='radio' name='addmoney' value=''>否\
			</td>\
		</tr>\
		<tr>\
			<td>\
				增加威望\
			</td>\
			<td>\
				<input type='radio' name='norvrc' value='' checked='checked'>是\
				<input type='radio' name='norvrc' value='1'>否\
			</td>\
		</tr>\
		<tr>\
			<td colspan=2>\
				<input name='submit' value='提交' type='submit'> <input value='取消' type='button' onclick='adminui.hide()'><br/>\
				请勿连续对一个帖子加分或扣分，如需超标准加分或扣分请使用举报或直接联络超版\
			</td>\
		</tr>\
	</table>\
	</form>\
	<iframe name='adminwindowiframe' id='adminwindowiframe' scrolling='no' frameBorder=0 allowtransparency='true' src='./nuke.php?func=addpoint&f=show_add_point_left&fid="+fid+"' style='height:150px;width:330px;border:none;overflow:hidden'></iframe>\
")
this.w._.show(e)
this.w.getElementsByTagName('form')[0].action = 'nuke.php?func=addpoint&tid='+tid+'&pid='+pid;
this.w.getElementsByTagName('form')[0].target = 'adminwindowiframe';
}
*/

commonui.sliderInput = function(w,min,max,start,step){
var i,v
return _$('/span',
	i = _$('/input','type','range','style','verticalAlign:bottom;width:'+w+'em','value',start, 'min',min, 'max',max, 'step',step,'onchange',function(){v.value=i.value},'onmousemove',function(){v.value=i.value}),
	v = _$('/input','value',start,'style','width:'+(Math.abs(min)+Math.abs(max)+'').length+'em','onchange',function(){
		if(v.value>max)v.value=max
		if(v.value<min)v.value=min
		i.value=v.value
		})
	)
}//fe


adminui.addpoint = function (e,tid,pid,fid)
{

this.createadminwindow()
this.w._.addContent(null)
var $ = _$, n, de=function(x){return $('/span','className','silver','innerHTML',x)},dig,rr,rs,ri,rv,ni,rg,rt,rx,
lv = function(v){
	return $('/input').$0('type','radio','name','level','value',v,'onclick',function(){
		dig.checked=(this.value&(16|32|64|128)) ? false :true
		if(dig.checked){
			rt.checked = true
			if(rr)
				rr.checked=true
			}
		})
	},
sw = function(x){
	if(x){
		rs.style.display=''
		ri.style.display='none'
		on(dig)
		on(rt)
		if(rr)
			on(rr)
		on(rv)
		on(rg)
		}
	else{
		rs.style.display='none'
		ri.style.display=''
		off(dig)
		off(rt)
		if(rr)
			off(rr)
		off(rv)
		if(!__GP.superlesser)
			off(rg,'需要Superlesser权限')
		}
	},
on = function(o){
	if(o._x)return
	//if(o._c)o.checked = o._c 
	//if(o._v)o.value = o._v
	o.disabled=''
	o.title=''
	o.onclick = function(){}
	},
off = function(o,t,x){
	if(x)o._x = x
	if(t){
		o.title = t
		o.onclick = function(){alert(this.title)}
		}
	//o._c = o.checked
	//o._v = o.value
	//o.checked=o.value=''
	o.disabled=true
	}

this.w._.addTitle('评分');


this.w._.addContent(
	$('/span')._.add(
		$('/input').$0('type','radio','name','act','value',0,'checked',1,'onclick',function(){
			if(this.checked)sw(1)
			}),'评分 ',
		$('/input').$0('type','radio','name','act','value',4194304,'onclick',function(){
			if(this.checked)sw()
			}),'加减声望 ',$('/br'),
		$('/br'),
		rs=$('/span')._.add(
		'增加声望值',$('/br'),
			$('/table',
				$('/tr',
					$('/td')._.add(
						lv('16'),'15',de('(象征性) ')
						),
					$('/td')._.add(
						lv('32'),'30 '
						),
					$('/td')._.add(
						lv('64'),'45 '
						)
					),
				$('/tr',
					$('/td')._.add(
						lv('128'),'60 '
						),
					$('/td')._.add(
						lv('256'),'75',de('(鼓励) ')
						),
					$('/td')._.add(
						lv('512'),'105 '
						)
					),
				$('/tr',
					$('/td')._.add(
						lv('1024'),'150',de('(好) ')
						),
					$('/td')._.add(
						lv('2048'),'225 '
						),
					$('/td')._.add(
						lv('4096'),'300',de('(+好) ')
						)
					),
				$('/tr',
					$('/td')._.add(
						lv('8192'),'375 '
						),
					$('/td')._.add(
						lv('16384'),'450 '
						),
					$('/td')._.add(
						lv('32768'),'525 '
						)
					),
				$('/tr',
					$('/td')._.add(
						lv('65536'),'600',de('(双+好) ')
						)
					)
				)
			),
		ri=$('/input','placeholder','声望-1500~1500','value','','style','display:none'),
		$('/br'),$('/br'),
		rv = $('/input').$0('type','checkbox','value','2','checked','1'),' 增加威望* ',
		$('/br'),
		rg = $('/input').$0('type','checkbox','value','1','checked','1'),' 增加/扣除金钱** ',
		$('/br'),
		dig = $('/input').$0('type','checkbox','value','8'),' 主题加入精华区 ',
		$('/br'),
		rt = $('/input').$0('type','checkbox','value','16777216','_negvalue','67108864'),' 增加主题的推荐值 ',
		$('/br'),
		pid ? [rr = $('/input').$0('type','checkbox','value','8388608','_negvalue','33554432'),' 增加回复的推荐值 ',
		$('/br')] : null,
		rx = $('/input').$0('type','checkbox','value','4','checked','1'),' 给作者发送PM ',
		$('/br'),
		ni = $('/input').$0('type','text','placeholder','加分说明','value',''),
		$('/br'),
		$('/br'),
		$('/button').$0('innerHTML','确定','class','larger','type','button','onclick',function(){
				var x = this.parentNode.getElementsByTagName('input'),opt=0
				for (var i=0;i<x.length;i++){
					if(!x[i].disabled){
						if (x[i].checked)
							opt |= x[i].value
						else if(x[i]._negvalue)
							opt |= x[i]._negvalue
						}
					}
				commonui.userCache.set('lastTipOpt', opt, 86400 * 30);
				commonui.userCache.set('lastTipInfo', ni.value, 86400 * 30);
				commonui.userCache.set('lastTipAmt', ri.value, 86400 * 30);
				__NUKE.doRequest({
					u:{u:__API._base,
							a:{__lib:"add_point_v3",__act:"add",opt:opt,fid:fid,tid:tid,pid:pid,info:ni.value,value:ri.value,raw:3}
							},
					b:this
					})
				}
			),
		$('/br'),
		$('/br'),
		__GP.superlesser ? [
			'批量加分 填入本主题内要加分的pid 每行一个',$('/br'),
			$('/textarea'),$('/br'),
			$('/button').$0('innerHTML','批量加分','type','button','onclick',function(){
					var x = this.parentNode.getElementsByTagName('input'),opt=0
					for (var i=0;i<x.length;i++)
						if (x[i].checked) opt |= x[i].value
					var pids = this.previousSibling.previousSibling.value.match(/\d+/g), results='',
					mas = function(pids){
						if(pids.length){
							var pp = pids.shift()
							__NUKE.doRequest({
								u:{u:__API._base,
										a:{__lib:"add_point_v3",__act:"add",opt:opt,fid:fid,tid:tid,pid:pp,info:ni.value,value:ri.value,raw:3}
										},
								f:function(d){
									if(d.error)
										return alert('pid:'+pp+' '+d.error[0])
									var result = 'pid:'+pp+' '+d.data[0]
									results += result+'\n'
									console.log(result)
									mas(pids)
									}
								})
							}
						else
							alert('操作完毕\n'+results)
						}//
					if(confirm('请检查加分参数并继续\n加分过程中不要关闭窗口或离开本页面\n出现错误时会中断'))
						mas(pids)
					}
				),$('/br'),$('/br')
			] : null,
		de('* 150声望合1威望<br/>** 100声望合1金币 扣减声望时可以扣除金钱<br/><br/>'),n = de('')
		)
	)
// Restore tip settings from userCache, if any.
var lto = commonui.userCache.get('lastTipOpt')|0
if (lto) {
	var lti = commonui.userCache.get('lastTipInfo'), lta = commonui.userCache.get('lastTipAmt'), x = rs.parentNode.getElementsByTagName('input')
	for (var i=0;i<x.length;i++){
		if ((x[i].type=='checkbox' ||x[i].type=='radio')  && x[i].value && (lto & x[i].value)==x[i].value){
			x[i].checked='checked'
			if(x[i].value==4194304)
				sw()
			}
		}
	ni._.on('focus',function(){if(!this.value && lti)this.value = lti})
	ri._.on('focus',function(){if(!this.value && lta)this.value = lta})
	}

this.w._.show(e)
if(!__GP.greater){
	off(rv,'需要Moderator权限',1)
	off(rg,'需要Moderator权限',1)
	}
	
__NUKE.doRequest({
	u:{u:__API._base,
			a:{__lib:"add_point_v3",__act:"get_limit",fid:fid,raw:3}
			},
	f:function(d){
		if(d.data){
			var x = ''
			for(var k in d.data)
				x += d.data[k]+'</br>'
			if(!x.match(/本月加分额度剩余/)){
				off(rv,'需要版面有正式声望',1)
				off(rg,'需要版面有正式声望',1)
				}
			n.innerHTML = x
			}
		}
	})

}
//fe


adminui.new_post = function ()
{
	if(!__CURRENT_FID)
		return
this.createadminwindow()
this.w._.addContent(null)
var $ = _$, x,y
this.w._.addTitle('当前版批量主题');

this.w._.addContent(
	$('/span')._.add(
		'每行一个 主题\\t内容 返回结果显示在控制台',
		$('/br'),
		y = $('/textarea').$0('name','info','rows','5','cols','40'),
		$('/br'),
		$('/button').$0('innerHTML','确定','class','larger','type','button','onclick',function(){
console.log('go')
				x = y.value.split("\n")
				for(var i=0;i<x.length;i++){
					if(x[i]){
						x[i]=x[i].split("\t")
						x[i][0]=x[i][0].replace(/^\s+|\s+$/g,'')
						x[i][1]=x[i][1].replace(/^\s+|\s+$/g,'')
						}
					else
						x[i]=[]
					}
				var al = window.alert
				window.alert=function(x){console.log(x)}
				var to = function(){
							var y = x.shift()
							if(y){
								if(y[0] && y[1]){
									console.log(y[0]+'\t'+y[1])
									commonui.newPost(
										{_nojump:1},
										postfunc.__NEW,//操作
										__CURRENT_F_BIT,//版面bit type
										__CURRENT_FID,//版面id
										null,//主题id
										null,//回复id
										null,//o_setTopic
										y[0],//标题
										y[1],//内容
										0,//隐藏帖子 仅版主可见
										0,//只有作者和版主可回复
										null,//附件
										null,//附件校验
										null,//投票内容
										null,// 0投票 1投注铜币
										null,//每人最多可投 0不限
										null,//小时后结束
										null,//投注最大值
										null,//投注最小值
										null,//投票的声望限制
										null,
										null,
										null
										)
									}
								}
							if(x.length)
								setTimeout(to,1000*30)
							else{
								clearTimeout(to)
								window.alert=al
								console.log('all done')
								}
							}//
				setTimeout(to,1000*30)

				}
			)
		)
	)
this.w._.show()

}//fe



adminui.system_trade = function(e){
this.createadminwindow()
this.w._.addContent(null)
var $ = _$,n = 'give_n_take_8wyd',
ii=function(y,z){
return $('/input','name',n,'placeholder',y,'size',z)
},//fe
sl = function(x){
return $('/span',
	$('/select','name',n,
		$('/option').$0('value','','innerHTML','无'),
		$('/option').$0('value',2,'innerHTML','金钱'),
		$('/option').$0('value',1,'innerHTML','道具'),
		$('/option').$0('value',3,'innerHTML','声望'),
		$('/option').$0('value',4,'innerHTML','威望'),
		$('/option').$0('value',5,'innerHTML','其他'),
		'onchange',function(){
			this.nextSibling.innerHTML = ''
			switch(parseInt(this.value)){
				case 2:
					this.nextSibling._.add(
						ii('金币',5),
						ii('银币',5),
						ii('铜币',5),
						$('/a','innerHTML',' ? ','href','javascript:void(0)','target','_blank','onclick',
							function(e){
								alert('1金币=100银币 1银币=100铜币')
								})
						)
					break
				case 1:
					this.nextSibling._.add(
						ii('类别',5),
						ii('子类',5),
						ii('数量',5),
						$('/a','innerHTML',' ? ','href','javascript:void(0)','target','_blank','onclick',
							function(e){
								if(!this.previousSibling.value || !this.previousSibling.previousSibling.value)
									return commonui.cancelEvent(e)
								__NUKE.doRequest({
									u:{u:'/nuke.php?func=item&act=info&raw=3', a:{types:this.previousSibling.previousSibling.value+','+this.previousSibling.value}},
									f:function(r){
										if (!r || !r.data)
											return alert('NOT FOUND')
										alert(commonui._debug._d('',r.data[0]))
										}
									})
								})
						)
					break
				case 3:
					this.nextSibling._.add(
						ii('声望ID',11),
						ii('声望值',5),
						$('/a','innerHTML',' ? ','href','javascript:void(0)','target','_blank','onclick',
							function(e){
								if(!this.previousSibling.value)
									return commonui.cancelEvent(e)
								__NUKE.doRequest({
									u:{u:'/nuke.php?__lib=modify_reputation&__act=get_info&rid='+this.previousSibling.value+'&raw=3'},
									f:function(r){
										if (!r || !r.data)
											return alert('NOT FOUND')
										alert(r.data[0])
										}
									})
								})
						)
					break	
				case 4:
					this.nextSibling._.add(
						ii('威望值(显示值)',5)
						)
					break
				case 5:
					this.nextSibling._.add(
						ii('相关说明',11)
						)
					break	
				}
			}
		),
	$('/span')
	)
},//fe
dv = function(){
return 	$('/div')._.add(
	$('/input','name',n,'placeholder','用户UID','size',11),
	' \u00A0 收取',
	sl(),
	' \u00A0 发放',
	sl(1),
	' \u00A0 ',
	ii('项目相关主题ID',11),
	$('/a','innerHTML',' ? ','href','about:blank','target','_blank','onclick',
		function(e){
			if(!this.previousSibling.value)
				return commonui.cancelEvent(e)
			this.href='/read.php?tid='+this.previousSibling.value
			}),
	ii('项目文字说明',20),
	$('/br')
	)
}//fe


this.w._.addTitle('发放/收取');




this.w._.addContent(
	$('/span')._.add(
		dv(),
		$('/br'),
		$('/button').$0('innerHTML','增加一行','type','button','onclick',function(){
				this.parentNode.insertBefore(
					dv(),
					this.previousSibling
					)
				}
			),
		$('/button').$0('innerHTML','确定','class','larger','type','button','onclick',function(){
				return
				__NUKE.doRequest({
					u:{u:__API._base,
							a:{__lib:"add_point_v",__act:"add",opt:opt,fid:fid,tid:tid,pid:pid,raw:3}
							},
					b:this
					})
				}
			),
		$('/br'),
		$('/br')
		)
	)
this.w._.show(e)


}//fe


/** 
 * 置顶主题
 * @param {type} e
 * @param {type} tid
 * @returns {undefined}
 */
adminui.toptopic = function (e,tid)
{

this.createadminwindow()
this.w._.addContent(null)
var $ = _$, ff,tid = tid
this.w._.addTitle('主题置顶');

this.w._.addContent(
	ff = $('/form')._.add(
		$('/input','type','radio','name','level','value','0','onchange',function(){f.dno.checked=true; f.rno.checked=true;}),' 解除',
		$('/br'),
		$('/br'),
		$('/input','type','radio','name','level','value','9','onchange',function(){f.dadd.checked=true; f.radd.checked=true;}),' 版面内直接显示',
		$('/br'),
		'将 主题内容 显示在版头',$('/br'),
		'(过大的图片可能无法显示 详细错误信息可打开浏览器控制台查看)',
		$('/br'),
		$('/br'),

		$('/input','type','radio','name','level','value','8','onchange',function(){f.dadd.checked=true; f.radd.checked=true;}),' 固定首位',
		$('/br'),
		'固定第一页第一个主题 可以使用[jumpurl]...[/jumpurl]指定链接地址',
		$('/br'),
		$('/br'),

		$('/input','type','radio','name','level','value','7','onchange',function(){f.dadd.checked=true; f.radd.checked=true;}),' APP专用',
		$('/br'),
		'APP专用置顶 标题不能太长 必须以"[APP]"开头 内容需适合小屏阅读',

		$('/br'),
		$('/br'),
		$('/input','type','radio','name','level','value','1','onchange',function(){f.dadd.checked=true; f.radd.checked=true;}),' 普通置顶',
		$('/br'),
		'将主题的标题显示在版头下部',
		$('/br'),
		'最近一次普通置顶的主题会显示在版面第一页(且最后改动时间在一周内)',
		$('/br'),
		$('/br'),
		$('/input','_na','dadd','type','radio','name','opt','value','1'),' 加入精华区',$('/br'),
		$('/input','_na','ddel','type','radio','name','opt','value','2'),' 移出精华区',$('/br'),
		$('/input','_na','dno','type','radio','name','opt','value','16','checked',1),' 不改变',$('/br'),
		$('/br'),
		$('/input','_na','radd','type','radio','name','opt1','value','4'),' 增加推荐值',$('/br'),
		$('/input','_na','rdel','type','radio','name','opt1','value','8'),' 移除推荐值',$('/br'),
		$('/input','_na','rno','type','radio','name','opt1','value','32','checked',1),' 不改变',$('/br'),
		$('/br'),
		$('/button','innerHTML','确定','class','larger','type','button','onclick',function(){
				var level=0,opt=0
				for(var i=0;i<5;i++){
					if(f[i].checked)
						level= f[i].value
					}
				for(var i=4;i<10;i++){
					if(f[i].checked)
						opt |= f[i].value
					}
				__NUKE.doRequest({
					u:{u:__API._base,
						a:{__lib:"topic_top",__act:"set",level:level,tid:tid,opt:opt,raw:3}
						},
					b:this
					})
				}
			)
		)
	)
var f = ff.parentNode.getElementsByTagName('input')
for(var i=0;i<f.length;i++){
	if(f[i]._na)
		f[f[i]._na] = f[i]
	}
this.w._.show(e)
}
//fe
/**
 * 置顶主题
 * @param {type} e
 * @param {type} tid
 * @returns {undefined}
 */
adminui.updateSrc = function ()
{

this.createadminwindow()
this.w._.addContent(null)
var $ = _$, x = $('/span')

var s = window.__SCRIPTS_DEBUGBAK ? __SCRIPTS_DEBUGBAK : __SCRIPTS
s['tmpcss'] = __STYLE[0][2];
for(var k in s){
	if(typeof s[k]=='string'){
		var m = s[k].match(/(\/js_[0-9a-zA-Z_]+\.js)\?(\d{7})$/)
		if(m)
			x._.add(
			  $('/input').$0('type','checkbox','value',m[2]),
				m[1].toString(),
				$('/br'))
		}
	}

this.w._.addTitle('杂项功能');

this.w._.addContent(
	x,
	$('/button','innerHTML','刷新资源地址','type','button','onclick',function(){
			var f = this.parentNode.getElementsByTagName('input'),set=''
			for(var i=0;i<f.length;i++){
				if(f[i].checked)
					set += f[i].value+'\t'+(1000000+Math.floor(Math.random()*8999999))+'\t'
				}
			__NUKE.doRequest({
				u:{u:__API._base,
						a:{__lib:"misc",__act:"update_src_in_tpl",set:set,raw:3}
						},
				b:this,
				f:function(d){alert((d.error && d.error[0] ? d.error[0] : d.data[0])+' 请刷新页面');location.reload()}
				})
			}
		),
	$('/br'),
	$('/br'),
	$('/hr'),
	$('/br'),
	$('/button','innerHTML','关闭web广告','type','button','onclick',function(){
			__NUKE.doRequest({
				u:{u:__API._base,
						a:{__lib:"misc",__act:"dsbase_off_in_tpl",off:1,raw:3}
						},
				b:this,
				f:function(d){alert((d.error && d.error[0] ? d.error[0] : d.data[0]))}
				})
			}
		),
	$('/button','innerHTML','开启web广告','type','button','onclick',function(){
			__NUKE.doRequest({
				u:{u:__API._base,
						a:{__lib:"misc",__act:"dsbase_off_in_tpl",off:2,raw:3}
						},
				b:this,
				f:function(d){alert((d.error && d.error[0] ? d.error[0] : d.data[0]))}
				})
			}
		),$('/br'),
	$('/button','innerHTML','关闭app广告','type','button','onclick',function(){
			__NUKE.doRequest({
				u:{u:__API._base,
						a:{__lib:"misc",__act:"dsbase_off_in_tpl",off:4,raw:3}
						},
				b:this,
				f:function(d){alert((d.error && d.error[0] ? d.error[0] : d.data[0]))}
				})
			}
		),
	$('/button','innerHTML','开启app广告','type','button','onclick',function(){
			__NUKE.doRequest({
				u:{u:__API._base,
						a:{__lib:"misc",__act:"dsbase_off_in_tpl",off:8,raw:3}
						},
				b:this,
				f:function(d){alert((d.error && d.error[0] ? d.error[0] : d.data[0]))}
				})
			}
		)
	)
this.w._.show()
	

}
//fe

/**
 * 标题颜色
 * @param {type} e
 * @param {type} tid
 * @returns {undefined}
 */
adminui.colortopic = function (e,tid)
{
this.createadminwindow()
this.w._.addContent(null)
var $ = _$,tid = tid,ff,fff,ffn
this.w._.addTitle('改变标题字体');

this.w._.addContent(
	ff = $('/div')._.add(
		$('/input','type','checkbox','name','fontB','value','B'),' 粗体',
		$('/br'),
		$('/input','type','checkbox','name','fontI','value','I'),' 斜体',
		$('/br'),
		$('/input','type','checkbox','name','fontU','value','U'),' 划线',
		$('/br'),$('/br'),
		$('/input','type','radio','name','color','value','red'),$('/span','class','red','innerHTML',' 红色'),
		$('/br'),
		$('/input','type','radio','name','color','value','blue'),$('/span','class','blue','innerHTML',' 蓝色'),
		$('/br'),
		$('/input','type','radio','name','color','value','green'),$('/span','class','green','innerHTML',' 绿色'),
		$('/br'),
		$('/input','type','radio','name','color','value','orange'),$('/span','class','orange','innerHTML',' 橙色'),
		$('/br'),
		$('/input','type','radio','name','color','value','silver'),$('/span','class','silver','innerHTML',' 银色'),
		$('/br'),
		$('/input','type','radio','name','color','value',''),' 无',
		$('/br'),
		$('/br'),		
		$('/input','type','radio','name','opt','value','1'),' 加入精华区',$('/br'),
		$('/input','type','radio','name','opt','value','2'),' 移出精华区',$('/br'),
		$('/input','type','radio','name','opt','value','16','checked',1),' 不改变',$('/br'),
		$('/br'),
		$('/input','type','radio','name','opt1','value','4'),' 增加推荐值',$('/br'),
		$('/input','type','radio','name','opt1','value','8'),' 移除推荐值',$('/br'),
		$('/input','type','radio','name','opt1','value','32','checked',1),' 不改变',$('/br'),
		$('/br'),
		$('/br'),
		$('/button','innerHTML','确定','class','larger','type','button','onclick',function(){
				var set='',opt=0
				for(var i=0;i<8;i++){
					if(f[i].checked)
						set+=','+f[i].value
					}
				for(var i=9;i<15;i++){
					if(f[i].checked)
						opt|=f[i].value
					}
				__NUKE.doRequest2(
					'b',this,
					'u',__API._base+'__lib=topic_color&__act=set&__output=3',
					'tid',tid,
					'font',set,
					'opt',opt)
				}
			)
		),
	fff = (__GP.staff ? $('/div')._.add(
		$('/br'),$('/br'),
		'名义发布, 主题列表中不显示发布人 而显示为',$('/br'),
		ffn=$('/input','value',''),$('/br'),
		'(颜色/字体同标题 ',
		$('/button','innerHTML','确定','class','larger','type','button','onclick',function(){
				__NUKE.doRequest2(
					'b',this,
					'u',__API._base+'__lib=topic_color&__act=set_in_name&__output=3',
					'tid',tid,
					'name',ffn.value
					)
				}
			)
		) : null)
	)
var f = ff.getElementsByTagName('input')

for(var i=0;i<8;i++)
	f[i].onchange=function(){
		for(var i=0;i<8;i++){
			if(f[i].checked && window.__CURRENT_FID!=10){
				f[9].checked=1
				f[12].checked=1
				return
		}}
		f[10].checked=1
		f[13].checked=1
		}

this.w._.show(e)

}
//fe


adminui.topic_key_admin = function(fid){

if(!this.topic_key_admin.current){
	return __NUKE.doRequest2(
		'f',function(d){
			var e = __NUKE.doRequestIfErr(d)
			if(e)return alert(e)
			adminui.topic_key_admin.current = d.data
			setTimeout(function(){adminui.topic_key_admin(fid)})
			},
		'u',__API._base+'__lib=topic_key_admin&__act=get&__output=3',
		'fid',fid)
	}

var data = this.topic_key_admin.current
console.log(data)
delete this.topic_key_admin.current

this.createadminwindow()

this.w._.addContent(null)
this.w._.addTitle('主题分类管理')

var $ = _$, x = $('/span'), add,rem, cell1 = function(name,value){
	var c = $('/span')
	c._.add(
		c._link=$('/input','type','checkbox','style','outline: 0.2em solid red;'),
		c._dig=$('/input','type','checkbox','style','outline: 0.2em solid blue'),
		c._del=$('/input','type','checkbox','style','outline: 0.2em solid gray'),
		c._color=$('/select','onchange',function(){this.style.backgroundColor = this.childNodes[this.selectedIndex].style.backgroundColor})._.add(
			$('/option','innerHTML','无颜色'),
			$('/option','innerHTML','颜色1','style','background-color:#8080C5'),
			$('/option','innerHTML','颜色2','style','background-color:#C58080'),
			$('/option','innerHTML','颜色3','style','background-color:#80C080'),
			$('/option','innerHTML','颜色4','style','background-color:#80C0C0'),
			$('/option','innerHTML','颜色5','style','background-color:#FF8AC9'),
			$('/option','innerHTML','颜色6','style','background-color:#C080C0'),
			$('/option','innerHTML','颜色7','style','background-color:#D0A996'),
			$('/option','innerHTML','颜色8','style','background-color:#909090'),
			$('/option','innerHTML','颜色9','style','background-color:#FFA280')
			),
		c._txt=$('/input','name',name,'value',value,'style','width:8em'),
		' '
		)
	return c
	}//

this.w._.addContent($('/span')._.add(


	$('/span')._.add(
		'强制分类',$('/br'),
		foc = $('/select',
			data[1] ? $('/option','selected','1','value','keep','innerHTML','强制到'+commonui.time2date(data[1])) : null,
			$('/option','innerHTML','不强制','value','cl'),
			$('/option','innerHTML','从现在开始三个月强制分类','value','3m'),
			$('/option','innerHTML','从现在开始一年强制分类','value','1y')
			),
		$('/br'),
		$('/button','innerHTML','提交','onclick',function(){
			if(foc.value==4)
				return alert('保持不变')
			return __NUKE.doRequest2(
						'f',function(d){
							var e = __NUKE.doRequestIfErr(d)
							if(e)return alert(e)
							return alert(d.data[0])
							},
						'u',__API._base+'__lib=topic_key_admin&__act=force&__output=3',
						'force',foc.value,
						'fid',fid)
			}),$('/br')
		),
	$('/br'),
	'版主预设分类',$('/br'),
	'每个不要超过20字节，两端要加中括号(比如 [新闻])，内容不要包含中括号',$('/br'),
	'超过四个将不显示用户添加的分类',$('/br'),
	add = $('/span','style','display:block;width:63em')._.add(
		
		(function(){
			var oo = [],daa = data[0]

			for(var k in daa){
				if(daa[k][2] & 1){//&1 版主设置的
					var onek,ck1,ck2,sl1,tx1,ck3
					oo.push( onek=cell1(daa[k][0],daa[k][1]) )
					for(var i=1;i<10;i++){
						if(daa[k][2] & (8<<i)){
							onek._color.selectedIndex = i
							onek._color.style.backgroundColor = onek._color.childNodes[i].style.backgroundColor
							}
						}
					if(daa[k][2] & 16777216)
						onek._link.checked = 'checked'
					if(daa[k][2] & 33554432)
						onek._dig.checked = 'checked' 
					}
				}
			return oo
			})()

		),
	$('/br'),
	$('/button','innerHTML','增加一个','onclick',function(){
		var ad = cell1('','')
		add._.add(ad)
		}),' ',
	$('/button','innerHTML','提交','onclick',function(){
		var all = '',one=[]
		for(var i=0;i<add.childNodes.length;i++){

				var onek = add.childNodes[i], type=1, id=onek._txt.name|0, txt=onek._txt.value
				if(txt || id){
					if(onek._link.checked)
						type|=16777216
					if(onek._dig.checked)
						type|=33554432
					if(onek._color.selectedIndex)
						type|=(8<<onek._color.selectedIndex)
					if(onek._del.checked)
						txt=''
					all += id+"\t"+type+"\t"+txt+"\t"
					}
				
			}
		console.log(all)
		return __NUKE.doRequest2(
				'f',function(d){
					var e = __NUKE.doRequestIfErr(d)
					if(e)return alert(e)
					return alert(d.data[0])
					},
				'u',__API._base+'__lib=topic_key_admin&__act=set&__output=3',
				'all',all,
				'fid',fid)
		}),$('/br')

	,$('/br')
	,'清除用户输入的分类',$('/br')
	,rem = $('/span','style','display:block;width:54em')._.add(
		
		(function(){
			var oo = [],daa = data[0]

			for(var k in daa){
				if((daa[k][2] & 1) ==0){
					var onek=$('/span')
					oo.push(
						onek._.add(
							onek._del = $('/input','type','checkbox','style','outline: 0.2em solid gray;'),
							onek._hid = $('/input','type','checkbox','style','outline: 0.2em solid silver;'),
							onek._txt = $('/input','name',daa[k][0],'value',daa[k][1],'style','width:8em'),
							' '
							)
						)
					if(daa[k][2] & 4)
						onek._hid.checked = 'checked' 
					}
				}
				
			return oo
			})()
		)
	,$('/br')
	,$('/button','innerHTML','提交','_action','67108864','onclick',function(){
		var all = ''
		for(var i=0;i<rem.childNodes.length;i++){
			var onek=rem.childNodes[i]
				if(onek._del.checked)
					all += (onek._txt.name|0)+"\t0\t\t"
				else if(onek._hid.checked)
					all += (onek._txt.name|0)+"\t4\t"+onek._txt.value+"\t"
				
			}
		console.log(all)
		return __NUKE.doRequest2(
				'f',function(d){
					var e = __NUKE.doRequestIfErr(d)
					if(e)return alert(e)
					return alert(d.data[0])
					},
				'u',__API._base+'__lib=topic_key_admin&__act=set&__output=3',
				'all',all,
				'fid',fid)
		})
		
	,$('/br')
	,$('/br')
	,'* 红色 在版面显示一个入口',$('/br')
	,'** 蓝色 入口只限精华',$('/br')
	,'*** 灰色 删除',$('/br')
	,'**** 银色 隐藏',$('/br')



	))

this.w._.show()
}//







/**
 * 设置声望级别
 * @param {type} e
 * @param {type} fid
 * @returns {undefined}
 */
adminui.reputationLevel = function (e,fid)
{
this.createadminwindow()
this.w._.addContent(null)
var $ = _$, level;
this.w._.addTitle('声望级别');
this.w._.addContent(
	'用户根据声望不同显示为不同的等级',
	$('/br'),
	'依次填入等级名称和此等级所需的声望下限(用户声望在-21000~21000之间)',
	$('/br'),
	'等级名最长16 byte(8个汉字) 宽度超过4个汉字可能在较小的显示器上无法完全显示',
	$('/br'),
	'每行一个 总数不能超过30个 修改后可能不会马上生效(缓存)',
	$('/br'),
	'例如:',
	$('/br'),
	$('/span').$0('className','gray')._.add(
		'渣滓 -21000',
		$('/br'),
		'废柴 0',
		$('/br'),
		'强者 10000',
		$('/br'),
		'逆天强者 20000'
		),
	$('/br'),
	'意为 声望-21000~-1为渣滓 0~9999为废柴 10000~19999为强者 20000以上为逆天强者',
	$('/br'),
	$('/br'),
	level = $('/textarea').$0('name','level','rows','10','cols','30'),
	$('/br'),
	$('/button').$0('innerHTML','确定','class','larger','type','button','onclick',function(){
			var t = level.value.replace(/^\s+|\s+$/,'')
			__NUKE.doRequest({
				u:__API.reputationLevelSet(fid,t),
				b:this
				})
			}
		)

	)
__NUKE.doRequest({
	u:__API.reputationLevel(fid),
	f:function(d){
		if(d.error)
			return alert(d.error[0])
		if(d.data && d.data[0]){
			var x = d.data[0].substr(0,1)
			if(x=='[' || x=='{'){
				eval('var x='+d.data[0])
				var y=''
				for (var i=0;i<x.length;i++)
					y+=x[i].n+' '+x[i].r+"\n"
				level.value=y
				}
			}

		}//fe
	})
this.w._.show(e)
}
//fe


/**
 * 精华主题
 * @param {type} e
 * @param {type} tid
 * @returns {undefined}
 */
adminui.digesttopic = function (e,tid){
return this.colortopic(e,tid)
}
//fe


/**
 * 
 * @param {*} e 
 * @param {*} tid 
 * @param {*} tf 用来获取说明的fid t开头为tid
 * @param {*} op nouse
 * @param {*} to {name:... ,stid:... ,fid:...}
 */
adminui.movetopic = function (e,tid,tf,op,to){
this.createadminwindow()
this.w._.addContent(null)
this.w._.addTitle('删除/移动/镜像 '+(tid?'':'选中的')+'主题');

var self = this,$ = _$, fid='', stid='', info,infoss,tff, pm, de, sl, am, aq, an, af, ad, ao, ap,nl, btn,pa={}, hf=0
, cl = function(e,h){
	if(h.stid){
		fid=''
		stid = h.stid
		sl.innerHTML = '到 > '+h.name+'('+h.stid+')'
		}
	else if(h.fid){
		stid = ''
		fid = h.fid
		sl.innerHTML = '到 > '+h.name+'('+h.fid+')'
		}
	if(e){
		commonui.adminwindow._.hide(e)
		commonui.cancelEvent(e)
		}
	return false
	},
icl = function(f,s){
	if(f){
		stid=''
		fid = f
		sl.innerHTML = '到 > FID:'+f
		}
	else if(s){
		fid=''
		stid=s
		sl.innerHTML = '到 > STID:'+s
		}
	},
oc = function(){
	if(this.checked){
		if(this.value=='ad' || this.value=='ao')
			sl.disabled=1
		else
			sl.disabled=0
		}
	}

if(tf && ((tf|0) || (tf+'').match(/t\d+/)))
	hf=tf
else
	hf=668//default info

this.w._.addContent(
	$('/span')._.add(
		de = $('/select').$0($('/option').$0('value','','innerHTML','立刻'),$('/option').$0('value',30,'innerHTML','30秒后')),
		$('/br'),$('/br'),
		am = $('/input','type','radio','name','action','onchange',oc),'移动 ',
		ab = $('/input','type','radio','name','action','onchange',oc),'移动(不提前) ',
		ad = $('/input','type','radio','name','action','value','ad','onchange',oc),'删除 ',
		$('/br'),
		ao = $('/input','type','radio','name','action','value','ao','onchange',oc),'移出合集 ',
		ap = $('/input','type','radio','name','action','value','ap','onchange',oc),'合集所有子主题移出到 ',
		$('/br'),
		aq = $('/input','type','radio','name','action','title','在另一版面新建镜像主题 与本主题保持同步','onchange',oc),'镜像 ',
		af = $('/input','type','radio','name','action','title','将主题移动到另一版面 在本版新建镜像','onchange',oc),'反向镜像',
		an = $('/input','type','radio','name','action','title','在另一版面新建镜像主题 不与本主题保持同步','onchange',oc),'镜像(不同步) ',
		$('/br'),$('/br'),
		sl = $('/button','innerHTML','到...','onclick',function(e){
			var c = commonui,hs
			c.createadminwindow()
			c.adminwindow._.addContent(null)
			c.adminwindow._.addContent(
				$('/input').$0('value','版面ID','name','no','maxlength','20','onfocus',function(){if(!this.name)return;this.name='',this.value=''},'onchange',function(){icl(this.value);c.adminwindow._.hide()}),$('/br'),
				$('/input').$0('value','或主题集合ID','name','no','maxlength','20','onfocus',function(){if(!this.name)return;this.name='',this.value=''},'onchange',function(){icl(0,this.value);c.adminwindow._.hide()}),$('/br'),hs=$('/span')
				)
			c.genHisLink(hs,cl)
			c.adminwindow._.show(e)
			}),
		//$('/br'),$('/br'),
		//$('/input').$0('type','checkbox','name','tag'),t(' 在原版保留一个链接'),
		$('/br'),$('/br'),
		info = $('/input').$0('placeholder','操作说明','value',commonui.lessernuke['info_'+tid+'_0']?commonui.lessernuke['info_'+tid+'_0']:'','maxlength','20','onchange',function(){if(this.value)pm.checked='checked'}),
		hf ? $('/span')._.add(
			$('/br'),
			infoss = $('/select').$0($('/option').$0('innerHTML','预设说明','style',{color:'silver'}), 'onchange',function(){if(this.selectedIndex)this.parentNode.previousSibling.value+=' '+this.options[this.selectedIndex].innerHTML;pm.checked='checked'}),
			$('/button','innerHTML','编辑','type','button','onclick',function(e){commonui.editRule(e,hf)})
			) :null,
		$('/br'),$('/br'),
		pm = $('/input','type','checkbox'),' 同时将说明发送给用户',
		(__GP.staff|__GP.audit) ? [$('/br'), pa = $('/input','type','checkbox'),' 记入审核日志'] : null,
		__GP.admin ? [$('/br'),(nl = $('/input','type','checkbox')),'无log'] : null,
		$('/br'),$('/br'),
		btn = $('/button','innerHTML','确定','class','larger','onclick',function(e){
				var op = ''
				if(ad.checked)
					op = 1
				else if(ao.checked)
					op = 2
				else if(aq.checked)
					op = 4
				else if(af.checked)
					op = 8
				else if(an.checked)
					op = 4|4096
				else if(ab.checked)
					op = 2048
				else if(ap.checked){
					if(!confirm("你确定要将合集内的所有主题移走吗"))
						return
					op = 16
					}
				if(nl && nl.checked)
					op |= 8192
				if(pa.checked)
					op |= 131072
				var iv = info.value.replace(/^\s+|\s+$/g,'')
				if(ad.checked && !iv)
					return alert("需要操作说明")

				if(!tid){
					var tids = commonui.massAdmin.getChecked()
					if(!tids)return
					}
					
				__NUKE.doRequest({
					u:__API.topicMove2(
						tid ? tid : tids, 
						fid, 
						pm.checked ? 1 : '', 
						iv, 
						op|16384|32768|65536, 
						de.value, stid
						),
					b:this
					})
				}
			)
		)
	)
		
for (var i=0.5;i<24;i+=0.5)
	de.$0($('/option').$0('value',i*3600,'innerHTML',i+"小时后"))

if(op==1)
	ad.checked=1, sl.disabled=1
else if(op==2)
	aq.checked=1
else
	am.checked=1

this.w._.show(e)

if(to)
	cl(null,to)

if(infoss)
	__NUKE.doRequest({
		u:{u:'/nuke.php?__lib=modify_forum&__act=get_rule&raw=3',a:{
			fid: hf,
			tid: (typeof tf=='string' && tf.charAt(0)=='t') ? tf.substr(1) : 0,
			ffid:((tff=location.search.match(/_ff=(\d+)/))?tff[1]:'')}},
		f:function(d){
			var e = __NUKE.doRequestIfErr(d)
			if(e)
				return
			var x = d.data[0].replace(/^\s+|\s+$/g,'').split("\n")
			for(var i=0;i<x.length;i++){
				infoss._.add(
					$('/option').$0('innerHTML',x[i])
					)
				}
			}
		})
}
//fe

adminui._info = {}
/**

 */
adminui.setAutoDel = function(e){
var y,z
this.createadminwindow()
this.w._.addContent(null)
this.w._.addContent(

	_$('/button')._.attr({innerHTML:'同步auto_del_match和new_post_ip_filter',type:'button'})._.on('click',function(){
			__NUKE.doRequest({
				u:{u:__API._base+'__lib=nuke&__act=set_auto_del&raw=3',
					a:{fid:'',match:''}
					},
				b:this
				})
			}
		)
	)
this.w._.show(e)
}//fe

/**
 * 设置新用户发帖限制
 * @param {type} e
 * @param {type} fid
 * @returns {undefined}
 */
adminui.setNewUserPostLimit = function(e,fid){
var y
this.createadminwindow()
this.w._.addContent(null)
this.w._.addContent(
	"新注册用户在注册",
	y = _$('/select').$0(
		_$('/option').$0('value','','innerHTML','全局默认'),
		_$('/option').$0('value','48','innerHTML','48小时'),
		_$('/option').$0('value','24','innerHTML','24小时'),
		_$('/option').$0('value','12','innerHTML','12小时'),
		_$('/option').$0('value','6','innerHTML','6小时'),
		_$('/option').$0('value','1','innerHTML','1小时'),
		_$('/option').$0('value','0.01','innerHTML','半分钟')
		),
	"后可以在本版发帖",
	_$('/br'),
	_$('/button','innerHTML','确定','class','larger','type','button')._.on('click',function(){
			var x = y.options[y.selectedIndex].value
			__NUKE.doRequest({
				u:{u:__API._base+'__lib=modify_forum&__act=set_post_limit&raw=3',
					a:{hour:x,fid:fid}
					},
				b:this,
				f:function(d){
					if(d.error)
						return alert(d.error[0])
					alert(d.data[0])
					}
				})
			}
		)
	)
this.w._.show(e)
}//fe



/**
 * nuke UI
 * @param {type} e
 * @param {type} uid
 * @param {type} tid
 * @param {type} pid
 * @returns {undefined}
 */
adminui.nukeUi = function(e,uid,tid,pid,ffid){
var _MODE_NUKE =1 //nuke to -1
,_MODE_UNACTIVE = 2 //nuke to 0
, _MODE_LOCK = 4//nuke to -2
,  _MODE_MUTE = 8 //禁言
,  _MODE_DELPOST = 16 //删帖
,  _MODE_ANONC = 32 //发帖公告
, _MODE_LOCK_3 = 32768
, _MODE_LOCK_4 = 65536
, _MODE_LOCK_5 = 131072
,$ = _$
,a = function(x,target,count,opt){

	var o = $('/span'),t = target
	if(!opt)
		opt = 0
	if(opt & 1)
		var name = 'ckname'+Math.random()
	for(var i = 0;i<x.length;i++){
		if(!x[i])
			continue
		x[i] = x[i].split('|')
		if(!x[i][1])
			x[i][1]=''
		if(i!=0)
			o._.add(i%count ? ' ' : $('/br'))
		if(opt&1)
			o._.add(
				$('/input').$0('type','radio','name',name,'checked',x[i][2]?1:0,'onclick',function(){t.value=this.title;t.name=''},'title',x[i][1]),
				$('/span').$0('innerHTML',x[i][0])
				)
		else
			o._.add(
				$('/a').$0('href','javascript:void(0)','innerHTML',x[i][0],'onclick',function(){t.value=this.title?this.title:this.innerHTML;t.name=''},'title',x[i][1])
				)
		}
	return o
	}
,info,infos,isl,isls,range,type,ip={},ip1={},ip2={},ip3={},mute,anonc,mass,lock35,logsys
this.createadminwindow()
this.w._.addContent(null)
this.w._.addContent($('/span')._.add(

$('/span')._.add(
	'UID 换行 空格 逗号分隔',$('/br'),
	mass = $('/textarea').$0('value',uid,'disabled',__GP.admin?0:1),$('/br'),$('/br')
	),

info = $('/input','placeholder','操作记录中的说明','size',20), isls=$('/select',$('/option','innerHTML','预设说明','style',{color:'silver'}), 'onchange',function(){if(this.selectedIndex)this.previousSibling.value+=' '+this.value}), $('/button','innerHTML','编辑','type','button','onclick',function(e){commonui.editRule(e,11)}), $('/br'),
//infos = $('/input','placeholder','操作说明(发送给用户)','value','','maxlength',20), isl=$('/select',$('/option','innerHTML','预设说明','style',{color:'silver'}), 'onchange',function(){if(this.selectedIndex)this.previousSibling.value+=' '+this.value}), $('/br'),
$('/br'),		
'此时间后发布的主题与回复将被删除(回复最多删除200条)',range = $('/input').$0('value','24','type','hidden'),$('/br'),
a(['不删除|0','1小时前|1','3小时前|3','6小时前|6','12小时前|12','24小时前|24|1','72小时前|72','1周前|168',(__GP.admin ? '删除1000条|1000' : null)],range,3,1),$('/br'),
$('/br'),

'NUKE种类',type = $('/input').$0('value',_MODE_NUKE,'type','hidden'),$('/br'),
a(['普通NUKE|'+_MODE_NUKE+'|1',
	'锁定账号(被盗/广告/只能人工解锁)|'+_MODE_LOCK,
	'无操作|0',
	'锁定账号(被盗/邮箱重置密码可解锁)|'+_MODE_LOCK_3,
	'取消激活|'+_MODE_UNACTIVE,
//	'禁言1000天|'+_MODE_MUTE,
	'无操作|0',
	'锁定账号(可能被盗/修改密码可解锁)|'+_MODE_LOCK_4,
	'无操作|0',
	'无操作|0',
	'锁定账号(机器人/广告专用账号/不能解锁)|'+_MODE_LOCK_5],type,3,1),$('/br'),
$('/br'),

lock35 = $('/input','type','checkbox','style','display:none'),'LOCK3or5',$('/br'),
logsys = $('/input','type','checkbox','style','display:none'),'LOG2SYS',$('/br'),

//mute = $('/input').$0('type','checkbox','checked',1),'附带禁言30天',$('/br'),
//anonc = $('/input').$0('type','checkbox'),'发贴公告',$('/br'),
$('/br'),

$('/button').$0('innerHTML','NUKE','onclick',function(){
	var m = 0,limit=''
	if(info.name=='x')
		info.value=''
	if(range.value==1000){
		limit = 1000
		range.value=''
		}
	if(type.value)
		m |= __NUKE.toInt(type.value)
	if(ip1.value)
		m |= __NUKE.toInt(ip1.value)
	if(ip2.value)
		m |= __NUKE.toInt(ip2.value)
	if(ip3.value)
		m |= __NUKE.toInt(ip3.value)
	if(lock35.checked)
		m |= 4194304
	if(logsys.checked)
		m |= 8388608
	//if(anonc.checked)
	//	m |= _MODE_ANONC
	//console.log([uid,tid,pid,info.value,'',range.value,limit,m,ip.value])

	var nr = mass.value.match(/-?\d+/g)
	adminui.nukeQueueRet=''
	if(!nr)return
	adminui.nukeQueue = nr
	adminui.nukeArg = [0,tid,pid,info.value,'',range.value,limit,m,ip.value?ip.value:'']//,infos.value]
	var nu = function(){
		var uu = adminui.nukeQueue.shift();
		if(!parseInt(uu,10))
			return alert(adminui.nukeQueueRet)
		var a = adminui.nukeArg
		__NUKE.doRequest({
			u:__API.nuke(
				uu,
				a[1],
				a[2],
				a[3],
				a[4],
				a[5],
				a[6],
				a[7],
				a[8],
				a[9]
				),
			b:this,
			f:function(d){//如有.error则显示.error 否则显示.data
				if(!d)
					return
				var x,y='';
				if(d.error)
					x= d.error
				else if(d.data)
					x=d.data
				if(!x)
					x={0:'ERROR NO DATA'}
				if(typeof x=='string')
					y=x
				else{
					for(var k in x)
						y+=x[k]+'\n'
					}
				adminui.nukeQueueRet+='uid:'+uu+' '+y+'\n'
				window.setTimeout(nu,100)
				return true
				}
			})
		}//fe
	nu()
		
	//else{
	//	__NUKE.doRequest({
	//		u:__API.nuke(uid,tid,pid,info.value,'',range.value,limit,m,ip.value?ip.value:''),
	//		b:this
	//		})
	//	}
	}),
/*
(uid && (__GP._bit & 33554432) ? $('/span')._.add(
	$('/br'),
	$('/br'),
	$('/button').$0('innerHTML','解除锁定','onclick',function(){
		__NUKE.doRequest({
			u:{u:__API._base+'__lib=nuke&__act=reactive&raw=3',
				a:{uid:uid,clear:(0 | (this.nextSibling.checked?1:0) | (this.nextSibling.nextSibling.nextSibling.checked?2:0))}
				},
			b:this
			})
		}), 
	$('/input').$0('type','checkbox'),
	$('/span')._.add('金钱清0 '),
	$('/input').$0('type','checkbox'),
	'威望清0'
	) : ''),*/
(uid && (__GP._bit & 33554432) ? $('/span')._.add(
	$('/br'),
	$('/br'),
	$('/button').$0('innerHTML','发送建议修改密码的PM','onclick',function(){
		__NUKE.doRequest({
			u:{u:__API._base+'__lib=nuke&__act=send_pm&raw=3',
				a:{uid:uid}
				},
			b:this
			})
		})
	) : '')
))//add

__NUKE.doRequest({
	u:{u:'/nuke.php?__lib=modify_forum&__act=get_rule&raw=3',a:{fid:11,ffid:ffid?ffid:''}},
	f:function(d){
		var e = __NUKE.doRequestIfErr(d)
		if(e)
			return
		var x = d.data[0].replace(/^\s+|\s+$/g,'').split("\n")
		for(var i=0;i<x.length;i++){
			//isl._.add($('/option','innerHTML',x[i]))
			isls._.add($('/option','innerHTML',x[i]))
			}
		}
	})

this.w._.show(e)

}
//fe


adminui.remarkUi = function(e,uid){
var $ = _$,ma,re,op
this.createadminwindow()
this.w._.addContent(null)
this.w._.addTitle('添加备注')
this.w._.addContent($('/span')._.add(
	'备注身份或事迹的描述性信息供其他版主参考',$('/br'),
	'禁止添加无用信息',$('/br'),
	'添加备注在缓存过期后生效',$('/br'),
	__GP['super'] ? [ma = $('/textarea','placeholder',uid,'onclick',function(){this.placeholder='可填入多个uid 换行 空格 逗号分隔'}),$('/br')]:null,
	re = $('/input','placeholder','备注信息','size',20),$('/br'),
	__GP.admin ? [op = $('/input','type','checkbox'),'所有用户可见',$('/br')]: null,
	$('/button','innerHTML','提交','onclick',function(){
		var uids=[],v = re.value, w = ''
		v.replace(/(?:&|\?)(tid|pid)=(\d+)/g,function($0,$1,$2){w+='['+$1+']'+$2+'[/'+$1+']';return $0})
		if(w)v=w
		if(!v)
			return
		if(v.match(/\.(jpg|jpeg|gif|png)$/))
			return alert('仅限文字 ')
		if(ma.value)
			ma.value.replace(/\d+/g,function($0){uids.push($0);return $0})
		else
			uids = [uid]
		var ret='',nu = function(){
			var uu = uids.shift();
			if(uu){
				__NUKE.doRequest({
					u:__API.remarkAdd(uu,v,op.checked?1:0),
					b:this,
					f:function(d){
						var y = d?(d.error?d.error[0]:(d.data?d.data[0]:'')):''
						ret+='UID'+uu+' '+y+'\n'
						window.setTimeout(nu,100)
						return true
						}
					})
				}
			else
				alert(ret)
			}
		nu()
		})
	))


this.w._.show(e)

}
//fe


/**
 * 服务器接口测试
 * @param {type} e
 * @returns {undefined}
 */
adminui.serverDebug = function(e){


var libs,acts,query,$=_$

this.createadminwindow()
this.w._.addContent(null)
this.w._.addContent(
	$('/span')._.add(
		query = $('/textarea'),
		$('/br'),
		$('/button').$0('innerHTML','POST','onclick',function(){
			var q = query.value.replace(/\n/g,' ').replace(/^\s+|\s+$/g,'')
			if(q==='')
				return
			__NUKE.doRequest({
				u:{u:__API._base+q,
					a:{raw:3}
					},
				b:this,
				f:function(d){console.log(d)}
				})
			}),
		' 换行会替换为空格',
		$('/br'),
		$('/table')._.add(
			$('/tr')._.add(
				libs=$('/td').$0('style',{height:'20em',overflow:'scroll',verticalAlign:'top'}),
				acts=$('/td').$0('style',{height:'20em',overflow:'scroll',verticalAlign:'top'})
				)
			)
		)
	)
this.w._.show(e)

__NUKE.doRequest({
	u:__API._base+'__lib=temp&__act=list_lib&raw=1',
	f:function(d){//如有.error则显示.error 否则显示.data

		if(!d)
			return

		if(d.error)
			return alert(d.error[0])

		try{
			var x=d.data[0]
		}catch(e){
			return alert('ERROR NO DATA')
			}
		
		for(var i in x){

			libs._.add(
				$('/a').$0('href','javascript:void(0)','innerHTML',x[i],'onclick',function(){
					var lib = this.innerHTML
					acts.innerHTML='';
					__NUKE.doRequest({
						u:__API._base+'__lib=temp&__act=list_lib&lib='+lib+'&raw=1',
						f:function(d){//如有.error则显示.error 否则显示.data
							if(!d)
								return

							if(d.error[0])
								return alert(d.error[0])

							try{
								var y=d.data[0]
							}catch(e){
								return alert('ERROR NO DATA')
								}

							for(var j in y){

								acts._.add(
									$('/a').$0('href','javascript:void(0)','innerHTML',y[j],'onclick',function(){
										query.value='__lib='+lib+'&__act='+this.innerHTML+'&'
										}),
									$('/br')
									)
								}

							return true
							}
						})

					}),//a
				$('/br')
				)//libs add

			}//for
		
		return true
		}
	})


}//fe


adminui.setSets = function(e,fid){
	return this.setSubSets(e,fid)
	/*
if(!fid)fid=0;

var $=_$,w = $('/span'),f,s
this.createadminwindow()
this.w._.addTitle('子版面列表设置')
this.w._.addContent(null)
this.w._.addContent(w)

__NUKE.doRequest({
	u:__API._base+'__lib=modify_forum&__act=get_sub_list&raw=1&fid='+fid,
	f:function(d){//如有.error则显示.error 否则显示.data

		var e = __NUKE.doRequestIfErr(d)
		if(e)
			return alert(e)
		var d =  d.data,x={}

		d[1] = d[1] ? (d[1]+'').replace(/(?:^|\n)(\d+)\s+(.+)/g,function($0,$1,$2){x[$1]=$2;return $0}) : ''
		d[0] = d[0] ? (d[0]+'').replace(/[^\d]?(\d+)[^\d]?/g,function($0,$1){return $1+' '+x[$1]+'\n'}) : ''
		//w._.add($('/textarea').$0('disabled','1','value',d[1],'style','width:22em;height:7em'),$('/br'),$('/br'))
		w._.add(s = $('/textarea').$0('value',d[0],'style','width:22em;height:7em'),$('/br'),$('/br'))
		w._.add('填入合集主题的tid',$('/br'),'或镜像到合集或其他版面的镜像主题tid',$('/br'),'每行一个 将按顺序显示在子版面列表中')
		
		w._.add(	$('/br'),	$('/br'),  $('/button').$0('innerHTML','提交','onclick',function(){
				var y = s.value.match(/(?:^|\n)\d+/g)
				y = y ? y.join(' ') : ''
				__NUKE.doRequest({
					u:{u:__API._base+'__lib=modify_forum&__act=set_sub_list&raw=3&fid='+fid,
						a:{tids:y}
						},
					b:this
					})
				})	)
		
		return true
		}
	})
this.w._.show(e)
*/
}//fe


adminui.setSubSets = function(e,fid){
	
if(!fid)fid=0;

var $=_$,w = $('/span'),tb,su=__GP['super']&&__GP.ubStaff,newnod = function(id,opt,name){
return $('/tr',
	$('/td', $('/input','value',id,'placeholder','版面id/合集或版面镜像id'), $('/input','type','hidden','value','\t')),//id
	$('/td')._.add( $('/input','type','checkbox','value','t','checked',opt.indexOf('t')!=-1?'checked':''),'是合集/版面镜像 '),//if set/quoteforum
	$('/td')._.add( $('/input','type','checkbox','value','s','checked',opt.indexOf('s')!=-1?'checked':''),'子版面 '),//display as sub
	$('/td')._.add( $('/input','type','checkbox','value','q','checked',opt.indexOf('q')!=-1?'checked':'','onchange',function(){if(this.checked)this.parentNode.nextSibling.firstChild.checked=''}),'附加显示主题 '),//display as quote
	$('/td')._.add( $('/input','type','checkbox','value','u','checked',opt.indexOf('u')!=-1?'checked':'','disabled',su?'':'1','onchange',function(){if(this.checked)this.parentNode.previousSibling.firstChild.checked=''}),'合并显示主题 '),//display as union
	$('/td')._.add( $('/input','type','hidden','value','\t'), $('/button','innerHTML','添加','onclick',function(){tb.insertBefore(newnod('','',''),this.parentNode.parentNode.nextSibling)}), $('/button','innerHTML','删除','onclick',function(){this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode)}), $('/b')._.add(name))//id
	)
}//

this.setSubSets.newnod = function(x,y,z){tb._.add(newnod(x,y,z))}


this.createadminwindow()
this.w._.addTitle('子版面列表设置')
this.w._.addContent(null)
this.w._.addContent(w)

__NUKE.doRequest({
	u:__API._base+'__lib=modify_forum&__act=get_sub_list_v2&raw=1&fid='+fid,
	f:function(d){//如有.error则显示.error 否则显示.data

		var e = __NUKE.doRequestIfErr(d)
		if(e)
			return alert(e)
		var d =  d.data
		tb = $('/table')

		if(d[0]){
			var y = d[0].split(/[\t\n]/)
			console.log(y)
			for(var i=0;i<y.length;i+=3){
				tb._.add(
					newnod(y[i],y[i+1],y[i+2])
					)
				}
			}
		w._.add(tb, $('/br'), $('/button','innerHTML','添加一个','onclick',function(){tb._.add(newnod('','',''))}) )

		w._.add(	$('/br'),	$('/br'),  $('/button').$0('innerHTML','提交','onclick',function(){
				var x='',y = tb.getElementsByTagName('input')
				for(var i=0;i<y.length;i++){
					if(y[i].type=='checkbox'){
						if(y[i].checked)
							x+=y[i].value
						}
					else{
						x+=y[i].value
						}
					}
				__NUKE.doRequest({
					u:{u:__API._base+'__lib=modify_forum&__act=set_sub_list_v2&raw=3&fid='+fid,
						a:{ids:x}
						},
					b:this
					})
				})	)
		return true
		}
	})
this.w._.show(e)

}//fe
/**
延时关键字检查
 */
adminui.setFilter = function(e,fid,opt){

if(!fid)fid=0;
if(!opt)opt=1;

__NUKE.doRequest({
	u:__API._base+'__lib=filter&__act=get&opt='+opt+'&raw=1&fid='+fid,
	f:function(d){//如有.error则显示.error 否则显示.data

		if(!d)
			return

		if(d.error)
			return alert(d.error[0])

		if(!d.data[1])
			return
		
		var y = d.data[1];
		window.setTimeout(function(){
			eval("adminui.setFilter = "+y)
			adminui.setFilter(null,fid,opt)
			})
		return true
		}
	})

}//fe

/**
全局关键字检查
 */
adminui.setFilterG = function(){

__NUKE.doRequest({
	u:__API._base+'__lib=filter&__act=get_perpost&raw=1',
	f:function(d){//如有.error则显示.error 否则显示.data

		if(!d)
			return

		if(d.error)
			return alert(d.error[0])

		if(!d.data[1])
			return
		
		var y = d.data[1];
		window.setTimeout(function(){
			eval("adminui.setFilterG = "+y)
			adminui.setFilterG()
			})
		return true
		}
	})

}//fe

/**
 * 关键词合并
 */
adminui.setFilterCombine = function(){
var cb = function(x){
	var y=x.split(/\s+/),z=''
	for(var i=0;i<y.length;i++){
		if(y[i].length){
			for(var j=0;j<y.length;j++){
				if(i!=j && y[j]!==false && y[j].length && y[j].indexOf(y[i])>-1)
					y[j]=false
				}
			}
		else
			y[i]=false
		}
		
	for(var i=0;i<y.length;i++){
		if(y[i]!==false)
			z+= ' '+y[i]
		}
	return z
	}
,data

var w = commonui.createadminwindow()
w._.addTitle('关键词合并工具')
w._.addContent(null)
w._.addContent(_$('/span')._.add(
	data = _$('/textarea','style','width:30em;height:20em;'),
	_$('/button','innerHTML','合并','onclick',function(){
		var wk = data.value
		data.value = 'wait ...'
		setTimeout(function(){data.value = cb(wk)})
		})
	))
w._.show()
}//

/**
 * 
 * @param {type} e
 * @param {type} fid
 * @returns {undefined}
 */
adminui.setHint = function(e,fid){
if(!fid && !__GP.ubStaff)
	return
var data,$=_$
this.createadminwindow()
this.w._.addContent(null)
this.w._.addTitle('发帖提示')
this.w._.addContent(
	$('/span')._.add(
		'依照',
		$('/span','className','ubbcode',
			$('/div','className','quote')._.add(
				'关键词 关键词 关键词 ...',
				$('/br'),
				'包含以上关键词时的提示',
				$('/br'),
				'关键词 关键词 ...',
				$('/br'),
				'提示',
				$('/br'),
				'...'
				)
			),
		'的格式填入 将会在发帖时检查',
		$('/br'),
		'提交后一个月内有效',
		$('/br'),
		'不要使用过短的词或单字(如 SB) 易造成误匹配',
		$('/br'),
		'关键词可以使用正则匹配 请咨询程序员',
		$('/br'),
		'过多的关键词或不合适的正则匹配会造成浏览器卡顿',
		$('/br'),
		'注意此提示无访问限制 任何人皆可见',
		$('/br'),
		data = $('/textarea','style','width:30em;height:20em;'),
		$('/br'),$('/span'),$('/br'),
		$('/button').$0('innerHTML','提交','onclick',function(){
			var k = data.value.replace(/^\s+|\s+$/g,'')
			//if(k==='')
			//	return
			__NUKE.doRequest({
				u:{u:__API._base+'__lib=log_post&__act=set_post_hint&fid='+fid,
					a:{data:k,raw:3}
					},
				b:this
				})
			})
		)
	)
__NUKE.doRequest({
	u:__API._base+'__lib=log_post&__act=get_post_hint&raw=1&fid='+fid,
	b:this,
	f:function(d){
		var e = __NUKE.doRequestIfErr(d)
		if(e)
			return alert(e)
		data.value = (''+d.data[0]).replace(/^\s*(\d+)\s*/,function($0,$1){
			data.nextSibling.nextSibling.innerHTML = commonui.time2date($1,'Y-m-d H:i:s')+'前有效'
			return ''
			})
		}
	})
this.w._.show(e)
}//fe

 /**
  * 管理密码
  * @param {type} e
  * @returns {unresolved}
  */
commonui.adminPassInput = function (e){
if(!window.__CURRENT_UID || !window.__NOW)
	return alert('需要先登陆')
this.createadminwindow()
this.adminwindow._.addContent(null)
this.adminwindow._.addContent(
	'某些功能在设置正确的密码后方可使用(有效期1.5天左右) 不同域名需要设置多次 ip变动需要设置多次',
	_$('/br'),
	_$('/input','type','password','size',20),
	_$('/button','innerHTML','确定','class','larger','type','button')._.on('click',function(){
			var p = this.previousSibling.value.replace(/^\s*|\s*$/g,''), o = this

				__NUKE.doRequest({
					u:window.__API.admin_code(),
					b:o,
					f:function(d){
						var e = __NUKE.doRequestIfErr(d)
						if(e)
							return alert(e)
						d = d.data[0]
						if(!d || !d[0] || !d[1] || !d[2]  || !d[3] )
							return alert('error')
						
						for(var k in d[3]){
								var v = d[3][k]+''
								__NUKE.doRequest({
									u:v.replace('_REPLACE_COOKIE_HERE_', hex_md5(p+'_j67h8i'+__CURRENT_UID+''+d[1]+''+Math.floor(d[0]/d[2])) ),
									f:function(d){
										var e = __NUKE.doRequestIfErr(d)
										if(e)
											return alert(e)
										alert(d.data[0])
										}
									})//request2
								}
							
						}
					})//request


			}
		)
	)
this.adminwindow._.show(e)
}//fe


/**

  */
adminui.keywordStat = function (e,fid){
this.createadminwindow()
this.w._.addContent(null)
this.w._.addTitle('关键词提取统计(每周')
this.w._.show()
var y,$=_$,z=function(){return $('/td','style','padding:0 0.5em')}
__NUKE.doRequest({
	u:{u:__API._base,a:{__lib:'admin_stat',__act:'thread_keyword_stat',raw:3,act:4,fid:fid}},
	f:function(d){
		var e = __NUKE.doRequestIfErr(d)
		if(e)
			return alert(e)
		x=$('/table',
			$('/tr',
				z(),
				z()._.add('出现次数'),
				z()._.add('统计时间')
				)
			)
		for(var k in d.data[0]){
			y = d.data[0][k]
			x._.add(
				$('/tr',
					z()._.add(y[1]),
					z()._.add(y[2]),
					z()._.add(commonui.time2date(y[3]*86400,'Y-m-d'))
					)
				)
			}
		adminui.w._.addContent(x)
		}
	})
}//fe

adminui.quoteForum = function(e,fid){
this.createadminwindow()
this.w._.addContent(null)
this.w._.addTitle('版面镜像到主题')
var $ = _$, x=$('/table').$0('className','forumbox') ,y,z,h
this.w._.addContent(
	z=$('/span'),
	y=$('/input','placeholder','主题ID'),
	$('/br'),
	h=$('/input','type','checkbox'),$('/span','innerHTML','不同步更新时间'),
	$('/br'),
	$('/span','innerHTML','镜像到空合集会自动改变合集的类型'),
	$('/br'),
	$('/button','innerHTML','确定','class','larger','type','button')._.on('click',function(){
		if(y.value = parseInt(y.value,10))
			__NUKE.doRequest({
				u:{u:__API._base,a:{__lib:'modify_forum',__act:'quote_forum',raw:3,act:h.checked ? 5: 1,fid:fid,tid:y.value}}
				})
		})
	)
this.w._.show(e)
__NUKE.doRequest({
	u:{u:__API._base,a:{__lib:'modify_forum',__act:'quote_forum',raw:3,act:4,fid:fid,tid:y.value}},
	f:function(d){
		var e = __NUKE.doRequestIfErr(d)
		if(e)
			return alert(e)
		x=''
		for(var k in d.data[0])
			x+=' '+d.data[0][k]
		if(x)
			z.innerHTML = '已经镜像到的主题'+x+'<br/>'
		}
	})
}//fe

adminui.minorModerator = function(e,fid){
this.createadminwindow()
this.w._.addContent(null)
this.w._.addTitle('副版主')
var $ = _$, x=$('/table').$0('className','forumbox') ,z
this.w._.addContent(
	'副版主(用户组不会改变)可以 锁定/加亮/编辑/移动/镜像 主题 超过三个月后权限失效 可以重新设置',
	$('/br'),
	z=$('/span'),
	$('/br'),
	$('/button','innerHTML','增加一个','type','button','onclick',function(){
		z._.add(
			xy(0,0,0,0)
			)
		}),
	$('/button','innerHTML','确定','class','larger','type','button','onclick',function(){
		var j = z.childNodes,x=0,y=''
		for(var i=0;i<j.length;i++){
			if((j[i]._valueN.op&131072)==0){
				y+=j[i]._valueN.uid+'\t'+j[i]._valueN.op+'\t'
				}
			}
		if(y)
			y=y.substr(0,y.length-1)
		__NUKE.doRequest({
			u:{u:__API._base,a:{__lib:'minor_moderator',__act:'set_v2',raw:3,'fid':fid,'minor_moderator_input':y}}
			})
		})
	)
this.w._.show(e)
__NUKE.doRequest({
	u:{u:__API._base,a:{__lib:'minor_moderator',__act:'get_v2',raw:3,act:4,fid:fid}},
	f:function(d){
		var e = __NUKE.doRequestIfErr(d)
		if(e)
			return alert(e)
		x=d.data[0].split("\t")
		if(x.length>1){

				for(var i=0;i<x.length;i+=4)
					z._.add(
						xy(x[i]|0, x[i+1], x[i+2]|0, x[i+3]|0)
						)

			}
		}
	})

var xy = function(uid,name,time,type){
	return $('/span'
		,'_valueN',{'uid':uid,'op':0})//1modmark 65536renewtime
		._.add(
			$('/input','value',uid ? name+'('+uid+')' : '', 'disabled', uid ? '1' : ''
				,'onchange',function(){this.parentNode._valueN.uid=this.value}
				)
			,$('/select',
				uid ? $('/option','value',0,'innerHTML','到 '+commonui.time2date(time,'Y-m-d H:i')+' 为止有副版主权限') : null
				,$('/option','value',65536,'innerHTML','从现在开始三个月内有副版主权限')
				,$('/option','value',131072,'innerHTML','取消副版主权限')
				,'onchange',function(){this.parentNode._valueN.op|=(this.value|0)}
				),' '
			,__GP.admin||(__GP.superlesser&&__GP.ubStaff) ? [$('/input', 'type','checkbox', 'checked',(type&1)?'checked':'', 'disabled', __GP.admin||(__GP.superlesser&&__GP.ubStaff) ? '':'disabled'
				,'onchange',function(){
					if(this.checked)
						this.parentNode._valueN.op|=1
					else
						this.parentNode._valueN.op&=(~1)
					}
				) ,'用户信息中显示为版主'] : null
			,$('/br')
			)
	}
}//fe

adminui.forumStat = function(e,fid,tid,fr,da,stid){
this.createadminwindow()
this.w._.addContent(null)
this.w._.addTitle('访问统计')
var $ = _$, f,x,y,z,a,t,c,b,s,p,n={}
this.w._.addContent(
	c=$('/input','type','radio','name','yjhbn6t3','checked',(fid?'1':'')),'版面 ',
	b=$('/input','type','radio','name','yjhbn6t3','checked',(tid?'1':'')),'主题 ',
	s=$('/input','type','radio','name','yjhbn6t3','checked',(stid?'1':'')),'合集 ',
	__GP.staff ? [n=$('/input','type','radio','name','yjhbn6t3'),'全局活动用户 '] : null,
	f=$('/input','placeholder','版面或主题ID(不超过10个 需要全部正式版主权限)','value',tid?tid:(fid?fid:'')),' ',
	t=$('/input','placeholder','起始日期(年-月-日)','value',fr?fr:''),' ',
	a=$('/input','placeholder','天数(向前数 不超过三个月)','value',da?da:''),' ',
	p=$('/input','placeholder','(其他条件)','value',''),' ',
	$('/button','innerHTML','确定','class','larger','type','button')._.on('click',function(){
			__NUKE.doRequest({
				u:{u:__API._base+(p.value?p.value:''),a:{__lib:'admin_stat',__act:'forum_stat',raw:3,act:1
					,tid:(b.checked ? f.value : (n.checked ? '167':''))
					,stid:(s.checked ? f.value :'')
					,fid:(c.checked ? f.value :'')
					,date:t.value,day:a.value}},
				f:function(d){
					var e = __NUKE.doRequestIfErr(d)
					if(e)
						return alert(e)
					d = d.data[0]
					x=$('/table').$0('className','forumbox ubbtable')
					z = $('/tr',$('/td','innerHTML','/'))
/*
					//temp modify
					delete d.names[1]
					delete d.names[4]
					delete d.names[5]
					delete d.names[6]
					delete d.names[7]
					 d.names[2]="主题浏览(web"
					delete d.keys[1]
					delete d.keys[4]
					delete d.keys[5]
					delete d.keys[6]
					delete d.keys[7]
*/
					for(var k in d.names)
						z._.add($('/td','innerHTML',d.names[k]))
					x._.add(z)
					d.from |=0
					d.to |=0
					var max={}
					for(var i=d.to;i>d.from;i--){
						if(d[i]){
							for(var p in d[i])break
/*
							//temp modify
							d[i][p]["8"] = d[i][p]["8"]-d[i][p]["40"]
							d[i][p]["8"] = d[i][p]["8"]+d[i][p]["8"]*0.15+196//主题浏览web
							d[i][p]["40"] = d[i][p]["40"]+d[i][p]["40"]*0.15+196//主题浏览app
*/
							var p = d[i].sum ? d[i].sum : d[i][p];
							for(var k in d.keys){
								if((p[d.keys[k]]|0)>(max[d.keys[k]]|0))
									max[d.keys[k]] = p[d.keys[k]]|0
								}
							}
						}
					for(var i=d.to;i>d.from;i--){
						z = $('/tr')
						z._.add($('/td','innerHTML',commonui.time2date(i*86400+1,'Y-m-d')))
						if(d[i]){
							for(var p in d[i])break
							var p = d[i].sum ? d[i].sum : d[i][p];
							for(var k in d.keys)
								z._.add($('/td',$('/div','style','height:1.83em;margin-bottom:-1.83em;background-color:silver;width:'+((p[d.keys[k]]/max[d.keys[k]]*1000|0)/10)+'%'))._.add(p[d.keys[k]]===undefined ? 'N/A' : (p[d.keys[k]]|0)))
							}
						x._.add(z)
						}
					x.firstChild.firstChild.$0('innerHTML','',$('/button','innerHTML','复制表格','onclick',function(){
						var x = this.parentNode.parentNode.parentNode, y=x.getElementsByTagName('div')
						for(var i=0;i<y.length;i++)
							y[i].style.display='none'
						r = document.createRange();
						s = window.getSelection();
						s.removeAllRanges();
						try {
							r.selectNodeContents(x);
							s.addRange(r);
							} 
						catch (e) {
							r.selectNode(x);
							s.addRange(r);
							}
						try {
							document.execCommand('copy')
							} catch (err) {}
						}))
					y.innerHTML = ''
					y._.add(d.all,$('/br'),x)
					}//fe
				})
		}),
	$('/br'),
	y = $('/div')
	)
this.w._.show(e)

}//fe

adminui.getDelayAction=function(id,type){
var x
this.createadminwindow()
this.w._.addContent(null)
this.w._.addTitle('预定的延时操作')
this.w._.addContent(x=_$('/div'))
__NUKE.doRequest({
	u:{u:__API._base+'__lib=delay_action&__act=view_delay_action&about_id='+id+'&type='+type,
		a:{__output:3}
		},
	f:function(d){
		var e = __NUKE.doRequestIfErr(d)
		if(e)
			return alert(e)
		console.log(d)
		var dd = d.data[0],y=''
		for(var i in dd){
			y+="<tr><td><a href='/nuke.php?func=ucp&uid="+dd[i][0]+"'>"+dd[i][1]+"</a> 预订于 </td><td> "+commonui.time2date(dd[i][2],'Y-m-d H:i:s')+" </td><td> 进行 "+dd[i][3]+" 操作</td></tr>";
			}
		x.innerHTML = '<table>'+y+'</table>'
		}
	})
this.w._.show()
}//


adminui.selectPid = function(tid,pid,opt){
var x = sessionStorage.getItem('selectPid')
if(opt&2){
	x = x.substr(11)
	var y = x.match(/\d+/g),z={},u
	this.createadminwindow()
	this.w._.addContent(null)
	this.w._.addTitle('记录选择的帖子pid')
	this.w._.addContent('点击发帖时间选择',_$('/br'),'可以翻页',_$('/br'),'关闭浏览器窗口/打开其他主题会清空',_$('/br'),u=_$('/textarea'))
	for(var i=0;i<y.length;i++)
		z[y[i]]=1
	for(var i in z)
		u.value+=i+','
	this.w._.show()
	return
	}
if(!x || (x.substr(0,11)|0)!=tid)
	x=tid+'           '
if(opt&1)
	x = x.replace(new RegExp('\\s'+pid+'\\s'),' ')
else
	x+=pid+' '
sessionStorage.setItem('selectPid',x);
}//

adminui.viewLog = function(tou,fromu,id,about){
if(!this.viewLog.init){
	this.viewLog.init = 1
	__NUKE.doRequest({
		u:{u:__API._base+'__lib=admin_log_search&__act=search_ui',
			a:{raw:3}
			},
		f:function(d){
			if(d.data&& d.data[0]){
				eval(d.data[0])
				adminui.viewLog(tou,fromu,id,about)
				}
			}
		})
	}
}//fe


adminui._undo = function (o,id){
o.style.color='darkred'
if(window.confirm('是否要取消此操作'))
	__NUKE.doPost({u: '/nuke.php?__lib=undo&__act=undo&raw=3&logid='+id})
o.style.color=''
}//fe

adminui._long2ip= function (ip) {
if(typeof ip =='string' && ip.indexOf('.')!=-1)
	return ip
ip = __NUKE.toInt(ip)
return [ip >>> 24, ip >>> 16 & 0xFF, ip >>> 8 & 0xFF, ip & 0xFF].join('.');
}//fe

adminui._formatLog = function(x,userinfo,sh){
if(!x)
	return ''
x+=''
x = x.replace(
	/(?:\[|\()TID:(\d+)(?:\]|\))/g,
	function($0,$1){
		if($1==0)
			return $0;
		else 
			return "<a href='/read.php?tid="+$1+"' target='_blank' title='主题' onclick=\"if(ubbcode){commonui.cancelBubble(event);commonui.cancelEvent(event);ubbcode.fastViewPost(event,"+$1+",0,2)}\">[T:"+$1+"]</a>";
		})

x = x.replace(
	/(?:\[|\()PID:(\d+)(?:\]|\))/g,
	function($0,$1){
		if($1==0)
			return $0; 
		else 
			return "<a href='/read.php?pid="+$1+"' target='_blank' title='回复' onclick=\"if(ubbcode){commonui.cancelBubble(event);commonui.cancelEvent(event);ubbcode.fastViewPost(event,0,"+$1+",0)}\">[P:"+$1+"]</a>";
		})

x = x.replace(
	/\[UID:(\d+)\]/g,
	function($0,$1){
		if($1==0)
			return $0; 
		else 
			return "<a href='/nuke.php?func=ucp&uid="+$1+"' target='_blank' title='用户'>[U:"+$1+"]</a>";
		})

x = x.replace(
	/\[(STID|FID):(\d+)\]/g,
	function($0,$1,$2){
		if($2==0)
			return $0; 
		else 
			return "<a href='/thread.php?"+$1.toLowerCase()+"="+$2+"' target='_blank'>"+$0+"</a>";
		})

x = x.replace(
	/\[LOG:(\d+)\]/g,
	function($0,$1,$2){ 
		return "<a href='/nuke.php?func=adminlog&id="+$1+"' target='_blank'>"+$0+"</a>";
	})

x = x.replace(
	/\[ITEM:(\d+),(\d+)\]/g,
	function($0,$1,$2){
		if($1==0)
			return $0; 
		else 
			return "<a href='javascript:void(0)' title='物品 类别"+$1+" 子类"+$2+"'>[I:"+$1+","+$2+"]</a>";
		})

x = x.replace(
	/\[CPM\] (P|M)(\s+UNL)?/g,
	function($0,$1,$2){
		return '使用'+($1=='P'?'手机':($1=='M'?'邮箱':'??'))+'重置密码'+($2?' 解除了锁定状态':'')
		})

x = x.replace(
	/\[CP\]/g,
	function($0){
		return '修改密码'
		})

x = x.replace(
	/\[L:(\d+),(-?\d+),(\d+),(-?\d+),([\-\d\/]*)\]/g,
	function($0,$1,$2,$3,$4,$5,$6){
		var z=''
		if($1!='0'){
			if($2==='00')
				z+="在同声望("+$3+")版面中"
			else if($3!='0')
				z+="在主题<a href='/read.php?tid="+$3+"&to' target='_blank'>[TID:"+$3+"]</a>"
			else if($2!='0')
				z+="在版面<a href='/thread.php?fid="+$2+"' target='_blank'>[FID:"+$2+"]</a>"
			z+='禁言'+$1+'天 '
			}

		if($4!='0'){
			$5 = $5.split('/')
			z+='扣除声望'+$4
			var y = '';
			for(var i=0;i<$5.length;i++){
				if($5[i]=='0')
					y=' 扣除威望'+($4/150)
				else
					z+='/[RID:'+$5[i]+']'
				}
			z+=y
			}
		if(!z)
			return '无操作';
		return z
		})

return x
}//fe

adminui.gameScoreTemplate = function(e){
var $= _$,b=function(){return $('/br')}
commonui.createadminwindow()
commonui.adminwindow._.addContent(null)
commonui.adminwindow._.addContent(
	$('/span')._.add(
		'游戏名(中文) ',$('/input'),b(),
		'游戏名(原文) ',$('/input'),b(),
		'游戏类型 ',$('/input'),b(),
		'开发商 ',$('/input'),b(),
		'发行商 ',$('/input'),b(),
		'游戏官网URL ',$('/input'),b(),
		'题图(附件图地址 jpg) ',$('/input'),b(),
		'平台/发售时间/URL ',$('/input'),$('/input'),$('/input'),b(),
		'平台/发售时间/URL ',$('/input'),$('/input'),$('/input'),b(),
		'平台/发售时间/URL ',$('/input'),$('/input'),$('/input'),b(),
		'平台/发售时间/URL ',$('/input'),$('/input'),$('/input'),b(),
		'平台/发售时间/URL ',$('/input'),$('/input'),$('/input'),b(),
		'平台/发售时间/URL ',$('/input'),$('/input'),$('/input'),b(),
		'平台/发售时间/URL ',$('/input'),$('/input'),$('/input'),b(),
		'平台/发售时间/URL ',$('/input'),$('/input'),$('/input'),b(),
		$('/button','innerHTML','提交','onclick',function(){
			var x = this.parentNode.getElementsByTagName('input')
			for(var i=0;i<x.length;i++)
				x[i].value = x[i].value.replace(/^\s+|\s+$|《|》/g,'').replace(/[（）【】`]/g,function($0,$1){var x='（(）)【[】]``';return x.charAt(x.indexOf($1)+1)})
			y = "[style left 1 top 1 width 9 height 7 background #b22222 align center border-radius 0.3]\n\
[style font 4 #fff line-height 1.7 innerHTML $votedata_voteavgvalue][/style]\n\
[/style]\n\
\n\
[style left 1 top 8 width 9 color #888 align center][style innerHTML $votedata_usernum][/style]人评分[/style]\n\
\n\
[style left 11 top 1 color #444 align justify-all]\n\
[style font 3 #444 line-height 1 width 100%][comment game_title_cn]"+x[0].value+"[/comment game_title_cn][/style]\n\
\n\
\n\
[style color #444 width 100% line-height 2.5][comment game_title]"+x[1].value+"[/comment game_title][/style]\n\
[/style]\n\
\n\
[style color #444 left 11 top 6.2 line-height 1.5][comment game_release][stripbr]\n\
"
			var z = ['#CD5C5C','#DC143C','#B22222','#8B0000','#FF4500','#FF6347','#FF7F50','#FF1493','#DB7093','#C71585','#556B2F','#808000','#6B8E23','#66CDAA','#3CB371','#2E8B57','#008000','#006400','#D8BFD8','#DDA0DD','#DA70D6','#BA55D3','#9370DB','#8A2BE2','#800080','#4B0082','#483D8B','#6A5ACD','#BDB76B','#20B2AA','#5F9EA0','#008B8B','#008080','#6495ED','#4682B4','#4169E1','#A0522D','#A52A2A','#BC8F8F']
			for(var i=7;i<30;i+=3){
				if(x[i].value){
					var p = x[i].value.toUpperCase(), c = z[ (('0x'+hex_md5(p).substr(0,2))|0)/255* z.length |0 ]
					if(x[i+2].value.match(/^https?:\/\//))
						y+="[url="+x[i+2].value+"][style color #fff padding 0 0.5 background "+c+" border-radius 0.2]"+p+" [symbol link][/style][/url] "+x[i+1].value+" [stripbr]\n"
					else
						y+="[style color #fff padding 0 0.5 background "+c+" border-radius 0.2]"+x[i].value.toUpperCase()+"[/style] "+x[i+1].value+" [stripbr]\n"
					}
				}

			y+="[/comment game_release][/style]\n\n[style color #444 left 11 top 8.5]\n"
			var z
			if(x[6].value){
				z = ubbcode.attach.check('_'+Math.random(),x[6].value)
				if(!z)
					alert('必须使用附件图')
				y+="[comment game_title_image][style border-radius 0.3 width 50 src "+z.autoUrl+"][/style][/comment game_title_image]\n\n\n"
				}
			if(!z)
				z = {h:0,w:1}
			if(x[2].value)
				y+="[style float left width 15]\n\
[style font 2 line-height 1.5]游戏类型[/style]\n\
\n\
\n\
[style font 2 #b22222 line-height 1.5][omit 7][comment game_type]"+x[2].value+"[/comment game_type][/omit][/style]\n\
[/style]\n\n"
			if(x[3].value)
				y+="[style float left width 15]\n\
[style font 2 line-height 1.5]开发商[/style]\n\
\n\
\n\
[style font 2 #b22222 line-height 1.5][omit 7][comment game_devloper]"+x[3].value+"[/comment game_devloper][/omit][/style]\n\
[/style]\n\n"
			if(x[4].value)
				y+="[style float left width 15]\n\
[style font 2 line-height 1.5]发行商[/style]\n\
\n\
\n\
[style font 2 #b22222 line-height 1.5][omit 7][comment game_publisher]"+x[4].value+"[/comment game_publisher][/omit][/style]\n\
[/style]\n\n"
			if(x[5].value)
				y+="[style float left clear both]\n\
[style font 2 line-height 1.5]官方网站[/style]\n\
\n\
[comment game_website][url="+x[5].value+"][/comment game_website][style font 2 #b22222 line-height 1.5][omit 15]"+x[5].value.replace(/^http:\/\//,'')+"[/omit] [symbol link][/style][/url]\n\
[/style]\n\n"
			y="\n[randomblock]\n[fixsize height "+((24+z.h/z.w*50)|0)+" width 50 90]\n\n"+y+"[/style]\n\n[/randomblock]\n\n"
			postfunc.addText(y)
			commonui.adminwindow._.hide()
			})

		)//


	)
commonui.adminwindow._.show(e)
}//fe

adminui.fIconGen = function(){
if(this.fIconGen.load)
	return
this.fIconGen.load=1
loader.script(__SCRIPTS.imgEdit,function(){adminui.fIconGen()})
}//fe
adminui.fimgGen = function(){
if(this.fimgGen.load)
	return
this.fimgGen.load=1
loader.script(__SCRIPTS.imgEdit,function(){adminui.fimgGen()})
}//fe

if(window.__GP && __GP.userBit&4){//mod
adminui.bbscode_min_admin = function(arg){
if(arg.tId == 16403728 && !arg.pId && !arg.isSig){
	arg.txt= arg.txt+'<br/><img src="about:blank" class="x" onerror="adminui.bbscode16403728(this)"/>'
	adminui.bbscode16403728 = function(o){
		__NUKE.doRequest({
			u:{u:__API._base+'__lib=load_topic&__act=load_topic_reply_ladder',
				a:{all:1,raw:3}
				},
			f:function(d){
				var e = __NUKE.doRequestIfErr(d)
				if(e)
					return alert(e)
				var t= d.data[0],f=d.data[1],tx=''
				for(var i in t){
					tx+='[tid]'+t[i].tid+'[/tid] <a href="/read.php?tid='+t[i].tid+'" class="b" target="_blank">'+t[i].subject+'</a> <span class="silver">['+f[t[i].fid]+']</span><br/><br/>'
					}
				o.parentNode.replaceChild(_$('/span','innerHTML',tx,_$('/button','type','button','innerHTML','清除缓存','onclick',function(){

					__NUKE.doRequest({
						u:{u:__API._base+'__lib=load_topic&__act=load_topic_reply_ladder_clear_cache',
							a:{all:1,raw:3}
							}})

					})),o)
				}
			})
		}
	}
}//

}//if

/**
 * 设置版面背景图
 * @param {type} e
 * @returns {undefined}
adminui.setForumPic = function(e){
this.createadminwindow()
this.w._.addContent(null)
if(!window.__GP.admin){
	this.w._.addContent("设置版面的背景图",
		_$('/br'),
		'发帖将图片上传为附件(不要加水印)注明版面ID 并召唤管理员审核',
		_$('/br'),
		'图片高度190像素 宽度1600像素或以上 主体在左侧 图片大小不超过85k',
		_$('/br'),
		'或图片宽度190像素 高度1600像素或以上',
		_$('/br'),
		'或同时提供两种(屏幕宽度超过1440像素时使用纵向图 其他情况使用横向图)'
		)
	tTip.showdscp(e,this.w);
	return
	}
this.w._.addContent(
	'设置版面的背景图',
	_$('/br'),
	_$('/input')._.attr('size',20),
	_$('/span').$0('innerHTML','版面ID'),
	_$('/br'),
	_$('/input')._.attr('size',20),
	_$('/span').$0('innerHTML','图片地址(只限附件)'),
	_$('/br'),
	_$('/button')._.attr({innerHTML:'确定',type:'button'})._.on('click',function(){
			var fid = this.parentNode.getElementsByTagName('input'), p = fid[1].value.replace(/^http:\/\/.+?\//,'/'), fid=fid[0].value, o = this
			__NUKE.doRequest({
				u:'/nuke.php?raw=1&__lib=forum_pic&__act=forum_pic&fid='+fid+'&file='+encodeURIComponent(p),
				b:this,
				f:function(d){
					if(d.error)
						return alert(d.error[0])
					alert('done')
					}
				})
			}
		)
	)
tTip.showdscp(e,this.w);
}
*/


/*
adminui.massBuff = function(){
var x = adminui.massBuff.queue.shift()
if(!x){
	console.log('all done')
	return
	}
x = (''+x).split(' ')
if(x[0]>0){
	x[1] = Math.random()>0.4?99:107
	x[2] = 3
	__NUKE.doRequest({
		u:{u:__API._base+'__lib=nuke&__act=buff&uid='+x[0],
			a:{bid:x[1],day:x[2],nolog:1,raw:3}
			},
		f:function(){
			window.setTimeout(function(){adminui.massBuff()},500)
			}
		})
	}
else
	adminui.massBuff()
}
adminui.massBuff.queue=[]
adminui.massBuff()
*/




















//==================================================================
//版面设置相关的
adminui.modifyForum = function(e,fid){
var arg = arguments
__NUKE.doRequest2(
	'f',function(d){
		if(d && d.data && d.data[0]){
			eval(d.data[0])
			setTimeout(function(){adminui.modifyForum.apply(adminui,arg)},100)
			}
		else if(d && d.error &&d.error[0]){
			alert( d.error[0] )
			}
		}
	,'u','/nuke.php?__lib=modify_forum&__act=get&__output=3&fid='+fid
	,'getui','1'
	)
}///

adminui.modifyUserForum = function(e,fid){
var arg = arguments
__NUKE.doRequest2(
	'f',function(d){
		if(d && d.data && d.data[0]){
			eval(d.data[0])
			setTimeout(function(){adminui.modifyUserForum.apply(adminui,arg)},500)
			}
		else if(d && d.error &&d.error[0]){
			alert( d.error[0] )
			}
		}
	,'u','/nuke.php?__lib=modify_forum&__act=get&uf=1&__output=3&fid='+fid
	,'getui','1'
	)

}///

adminui.modifyForumRel = function(e,fid,stid){
var arg = arguments
__NUKE.doRequest2(
	'f',function(d){
		if(d && d.data && d.data[0]){
			eval(d.data[0])
			setTimeout(function(){adminui.modifyForumRel.apply(adminui,arg)},500)
			}
		else if(d && d.error &&d.error[0]){
			alert( d.error[0] )
			}
		}
	,'u','/nuke.php?__lib=modify_forum&__act=get_rel_name&__output=3&fid='+(fid|0)+'&stid='+(stid|0)
	,'getui','1'
	)

}///




//======================


adminui.del3in1 = function(tid,pid,fid,opt){
var sv 
, splitsv = function(y){
	if(!y)return
	var x={}
	y=y.split('\t')
	x.bit=y.shift()|0
	x.info=y.join('\t')
	return x
	}
sv = splitsv(commonui.userCache.get('lesserTriple'))
if(opt&1 || !sv){
	var ox,$=_$
	this.createadminwindow()
	this.w._.addContent(null)
	this.w._.addTitle('三连会删除帖子 禁言 删除附件 点两次执行')
	this.w._.addContent(
		ox = $('/div','style','width:50em')._.add(
			'禁言',$('/br'),
			$('/input','type','radio','name','opt0','value',128),'全论坛 ',
			$('/input','type','radio','name','opt0','value',256),'本版面 ',
			$('/input','type','radio','name','opt0','value',512),'本合集 ',
			$('/input','type','radio','name','opt0','value',8192),'本版声望 ',
			$('/br'),
			$('/input','type','radio','name','opt1','value',16),'禁言2天 ',
			$('/input','type','radio','name','opt1','value',32),'禁言4天 ',
			$('/input','type','radio','name','opt1','value',64),'禁言6天 ',
			$('/input','type','radio','name','opt1','value',16384),'禁言30天 ',
			$('/br'),
			$('/input','type','radio','name','opt2','value',0),'不扣减声望 ',
			$('/input','type','radio','name','opt2','value',1),'扣减声望',
			$('/input','type','radio','name','opt2','value',2),'加倍扣减声望',
			$('/br'),
			'删除附件',$('/br'),
			$('/input','type','checkbox','name','odela','value',32768),'删除附件 ',
			$('/br'),
			'操作说明',$('/br'),
			$('/input','name','info'), commonui.genNukeRule(tid,pid,fid,null,null),
			$('/br'),
			$('/button','innerHTML','保存设置','onclick',function(){
				var z=0,y=''
				Array.from( this.parentNode.getElementsByTagName('input')).forEach(
					function(i){
						var n = i.name+''
						if(n.charAt(0)=='o'){
							if(i.checked)z|=(i.value|0)
							}
						else if(n=='info')
							y+= i.value+' '
						else if(i.checked)
							y= y.replace(i.value+' ','')+i.value+' '
						}
					)
				commonui.userCache.set('lesserTriple', z+'\t'+y)
				})
			)
		)
	this.w._.show()

	if(sv){
		Array.from( ox.getElementsByTagName('input')).forEach(
			function(i){
				var n = i.name+''
				if(n.charAt(0)=='o' && (i.value & sv.bit))
					i.checked='checked'
				else if(n=='info')
					i.value = sv.info
				}
			)
		}
	return
	}

if(!pid)pid=0
if(!tid)return
if(pid)
	__NUKE.doRequest2('u','/nuke.php?__lib=topic_lock&__act=set&__output=3','ids',tid+','+pid,'pon',1026,'info',sv.info)
else
	__NUKE.doRequest2('u','/nuke.php?__lib=topic_move&__act=move&__output=3','tid',tid,'op',114689,'info',sv.info,'fid','','pm','','delay','','stid','')
__NUKE.doRequest2('u','/nuke.php?__lib=nuke&__act=lesser_nuke&__output=3','tid',tid,'pid',pid,'opt',  sv.bit &( ~32768) ,'infos',sv.info)
if(sv.bit & 32768)
	for(var k in ubbcode.attach.cache){
		var a = ubbcode.attach.cache[k]
		if((a.tid|0)==tid && (a.pid|0)==pid){
			for(var j in a.a){
				__NUKE.doRequest2('u','/nuke.php?func=delattach&raw=3','tid',tid,'pid',pid,'aid',a.a[j].name)
				}
			}
		}
}//fe




//拖放移动主题
document.addEventListener('dragstart',function(e){
	if(e.shiftKey || e.altKey || e.ctrlKey || e.metaKey)
		return
	var h = commonui.parentAHerf(e.target || e.srcElement)
	if(!h)
		return
	if(h.href.match(/\/read.php/)){
		var m = {}
		h.href.replace(/(?:\?|&)(tid)=(\d+)/g,function(x,k,v){m[k]=v|0; return x})
		if(m.tid)
			e.dataTransfer.setData("postTid", m.tid)
		}
	},false)//

document.addEventListener('drop',function(e){
	if(e.shiftKey || e.altKey || e.ctrlKey || e.metaKey)
		return
	var h = commonui.parentAHerf(e.target || e.srcElement)
	if(!h)//&1使用htmlloader加载 &8如果可能使用连续加载
		return
	if(h.href.match(/\/thread.php/)){
		var m = {}
		h.href.replace(/(?:\?|&)(fid|stid)=(-?\d+)/g,function(x,k,v){m[k]=v|0; return x})
		if(m.fid||m.stid){
			var tid = e.dataTransfer.getData("postTid")
			if(tid){
				tids = commonui.massAdmin.getChecked(1)
				if(tids){
					if(!tids.match(new RegExp('(?:^|,)'+tid+'(?:,|$)')))
						tids+=','+tid
					}
				adminui.movetopic(e, tids? tids :tid, 't'+tid, 0, {name:h.textContent, stid:m.stid|0, fid:m.fid|0})
				}
			}
		}
	},	false)//

document.addEventListener('dragover',function(e){
	if(e.shiftKey || e.altKey || e.ctrlKey || e.metaKey)
		return
	var h = commonui.parentAHerf(e.target || e.srcElement)
	if(!h)//&1使用htmlloader加载 &8如果可能使用连续加载
		return
	if(h.href.match(/\/thread.php/))
		e.preventDefault()
	},	false)//









