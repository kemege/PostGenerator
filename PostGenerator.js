function displayMessage(title, message) {
	var dialogData = {
		dialogID: btoa(escape(title + message)),
		title: title,
		message: message
	};
	var dialogTemplate = '<div id="__dialogID__" title="__title__" style="display:none;">__message__</div>';
	dialogBody = dialogTemplate.replace(/__(\w+?)__/g, function(match, key) {
		if (dialogData[key] != undefined) {
			return dialogData[key];
		} else {
			return match;
		};
	});
	$('body').append(dialogBody);
	$(dialogData['dialogID']).dialog({
		width: 600
	});
}

function updateStatus(message) {
	if (message === '') {
		$('#searchIMDB').val('生成');
	} else {
		$('#searchIMDB').val(message);
	}
}

function translateGenre(genres) {
	genreAll = {
		'action' : '动作',
		'adventure' : '冒险',
		'animation' : '动画',
		'biography' : '传记',
		'comedy' : '喜剧',
		'crime' : '犯罪',
		'documentary' : '纪录片',
		'drama' : '剧情',
		'family' : '家庭',
		'fantasy' : '奇幻',
		'filmnoir' : '黑色电影',
		'history' : '历史',
		'horror' : '恐怖',
		'independent' : '独立电影',
		'music' : '音乐',
		'musical' : '音乐剧',
		'mystery' : '悬疑',
		'romance' : '爱情',
		'sci-fi' : '科幻',
		'short' : '短片',
		'sport' : '运动',
		'thriller' : '惊悚',
		'tvminiseries' : '迷你剧',
		'war' : '战争',
		'western' : '西部',
	};
	genreList = genres;
	genreNew = [];
	for (var genre in genreList) {
		if (genreAll[genreList[genre].toLowerCase()]!=undefined) {
			genreNew.push(genreAll[genreList[genre].toLowerCase()]);
		} else {
			genreNew.push(genreList[genre]);
		}
	}
	return genreNew.join('/');
}

function parseTemplate(template) {
	return template.replace(/__(\w+?)__/g, function(match, key) {
		if (dataArray[key]!=undefined) {
			return dataArray[key];
		} else {
			return '';
		};
	});
}

function getURL(url) {
	return new Promise(function(resolve, reject) {
		if (typeof GM_xmlhttpRequest !== 'undefined') {
			GM_xmlhttpRequest({
				method: "GET",
				url: url,
				onload: function(response) {
					resolve(response.responseText);
				}
			}); 
		} else {
			var req = new XMLHttpRequest();
			req.open('GET', url);

			req.onload = function() {
				if (req.status == 200) {
					resolve(req.response);
				}
				else {
					reject(Error(req.statusText));
				}
			};

			req.onerror = function() {
				reject(Error("Network Error"));
			};

			req.send();
		}
	});
}

function showError(err) {
	updateStatus('Error occurred. See console for details.');
	console.log(err);
}

function fillForm() {
	updateStatus('Generating post content ......');
	var textTitle = $('input.input_text[name=subject]');
	var textMessage = $('textarea.editor[name=message]');
	var textIMDB = $('input#imdb[name=imdb]');
	var textDouban = $('input#douban[name=douban]');
	var templateMessage;
	var templateTitle;
	var fullTitle;

	var postType = $('input[name="type"]:checked', '#selectType').val();

	if (postType === 'movie') {
		// movie template
		templateMessage = '[attachthumb=1]\n◎译　　　名: __translated_title__\n◎片　　　名: __title__\n◎别　　　名: __alias__\n◎年　　　代: __year__\n◎国　　　家: __country__\n◎类　　　别: __genre__\n◎语　　　言: __language__\n◎IMDB　评分: __ratingValue__/10.0 from __ratingCount__ users (__today__)\n◎IMDB　链接: [url]http://www.imdb.com/title/tt__imdbID__/[/url]\n◎导　　　演: __director__\n◎主　　　演: __actors__\n\n◎简　　　介:\n　　__plot__';
	} else if (postType === 'drama') {
		// drama template
		templateMessage = '[attachthumb=1]\n◎译　　　名: __translated_title__\n◎片　　　名: __title__\n◎别　　　名: __alias__\n◎首　　　播: \n◎国　　　家: __country__\n◎类　　　别: __genre__\n◎语　　　言: __language__\n◎IMDB　评分: __ratingValue__/10.0 from __ratingCount__ users (__today__)\n◎IMDB　链接: [url]http://www.imdb.com/title/tt__imdbID__/[/url]\n◎集　　　数: \n◎电　视　台: \n◎编　　　剧: __writer__\n◎导　　　演: __director__\n◎主　　　演: __actors__\n\n◎简　　　介:\n　　__plot__';
	} else {
		// animation template
		templateMessage = '[attachthumb=1]\n英文名：__english_title__\n日文名：__title__\n中文名：__translated_title__\n时　间：__time__\nAniDB链接： __anidb__\n官方网站： __official_site__\n\nSTORY\n　　__plot__\n\nSTAFF\n__staff__\n\nCAST\n__actors__';
	}

	if (!('alias' in dataArray) || dataArray['alias'] == '') {
		templateMessage = templateMessage.replace('◎别　　　名: __alias__\n', '');
	};

	if (postType === 'movie' || postType === 'drama') {
		templateTitle = '__title__ / __translated_title__ (__year__)';
	} else {
		templateTitle = '__english_title__ / __title__ / __translated_title__ (__year__)';
	}
	fullTitle = parseTemplate(templateTitle);
	if (fullTitle.length <= 80) {
		textTitle.val(fullTitle);
	} else {
		displayMessage("提示", "自动生成的标题过长（超出80字符），请根据实际情况手动填写。");
	}

	if(parseInt(imdbID) > 0) textIMDB.val(imdbID);
	if(parseInt(doubanID) > 0) textDouban.val(doubanID);
	textMessage.val(parseTemplate(templateMessage));

	// append IMDB and Douban links for correction
	var IMDBLink = '';
	if (postType === 'movie' || postType === 'drama') {
		IMDBLink += 'IMDB链接 : ' + (imdbID ? ('<a target="_blank" href="'+'http://www.imdb.com/title/tt' + imdbID+'">'+'http://www.imdb.com/title/tt' + imdbID+'</a>') : '无');
		IMDBLink += '<br/>豆瓣链接 : ' + (doubanID ? ('<a target="_blank" href="'+'http://movie.douban.com/subject/' + doubanID+'">'+'http://movie.douban.com/subject/' + doubanID+'</a>') : '无');
		IMDBLink += '<br/>时光网链接 : ' + (mTimeID ? ('<a target="_blank" href="'+'http://movie.mtime.com/' + mTimeID + '/fullcredits.html">'+'http://movie.mtime.com/' + mTimeID + '/fullcredits.html</a>') : '无');
	} else {
		IMDBLink += 'Bangumi链接 : ' + (bgmID ? ('<a target="_blank" href="'+'http://bgm.tv/subject/' + bgmID + '">'+'http://bgm.tv/subject/' + bgmID + '</a>') : '无');
		IMDBLink += '<br/>AniDB链接 : ' + (bgmID ? ('<a target="_blank" href="'+'http://anidb.net/a' + anidbID + '">'+'http://anidb.net/a' + anidbID + '</a>') : '无');
	}

	$('#generateWithIMDB_Links').html(IMDBLink);

	// fill in tags
	if (postType === 'movie') {
		$('input[name=tags]').val(dataArray['year'] + '|' + dataArray['genres'].join('|') + '|' + dataArray['countries'].join('|'));
	} else if (postType === 'drama') {
		$('input[name=tags]').val(dataArray['genres'].join('|'));
	} else {
		var tags = ['Anime'];
		if (dataArray['type'] == 'TV Series') {
			tags.push('TV');
			today = new Date();
			if (parseInt(dataArray['year']) >= today.getUTCFullYear() && parseInt(dataArray['startDate'].slice(5,7)) > today.getUTCMonth()) {
				tags.push('新番连载');
			};
		};
		tags.push(dataArray['startDate'].slice(0,4) + '.' + parseInt(dataArray['startDate'].slice(5,7)));
		$('input[name=tags]').val(tags.join('|'));
	}
}

function fetchIMDB() {
	$.ajax({
		url: 'http://www.imdb.com/title/tt' + imdbID,
		type: 'GET',
		processData: true,
		async: false,
		dataType: 'text',
		success: function(data) {
			

			// fetch poster
			var posterPageLink = imdbPage.find('#img_primary div.image a');
			var posterPageURL = posterPageLink[0].href;

			$.ajax({
				url: posterPageURL.replace('http://pt.vm.fudan.edu.cn', 'http://www.imdb.com'),
				type: 'GET',
				processData: true,
				async: false,
				dataType: 'text',
				success: function(data2) {
					var posterPage = $(data2);
					var posterURL = posterPage.find('#primary-img')[0].src;
					dataArray['posterURL'] = posterURL;
					console.log(posterURL);

					// fetch poster image as blob
					var xhr = new XMLHttpRequest();
					xhr.onreadystatechange = function() {
						if (this.readyState == 4 && this.status == 200) {
							var url = window.URL || window.webkitURL;
							$('#postAttachment2').append('<dd><img id="poster" src="" /></dd>');
							document.getElementById('poster').src = url.createObjectURL(this.response);
						};
					};
					xhr.open('GET', posterURL);
					xhr.responseType = 'blob';
					xhr.send();
				}
			});
			console.log(dataArray);
		},
		error: function () {
			displayMessage('错误', '无法连接到IMDB网站。<br/>请检查您的外网连接。');
			return 233;
		}
	});
	// check Douban data
	if (parseInt(doubanID)>0) {
		fetchDouban(doubanID);
	} else {
		searchDouban(dataArray['title']);
	};
}

function parseIMDB(data) {
	// parse IMDB DOM here
	imdbPage = $(data);
	dataArray['imdbID'] = imdbID;
	dataArray['title'] = imdbPage.find('h1.header span.itemprop[itemprop=name]').text();
	dataArray['ratingValue'] = imdbPage.find('span[itemprop=ratingValue]').text();
	dataArray['ratingCount'] = imdbPage.find('span[itemprop=ratingCount]').text();
	dataArray['plot'] = imdbPage.find('div.inline[itemprop=description]').text().trim().replace(/[ \n\t]+/g, ' ');
	dataArray['year'] = imdbPage.find('h1.header .nobr').text();
	dataArray['year'] = /\d{4}/.exec(dataArray['year']);
	dataArray['time'] = new Date();
	dataArray['today'] = dataArray['time'].getFullYear() + '' + (dataArray['time'].getMonth()<9?'0'+(dataArray['time'].getMonth()+1):dataArray['time'].getMonth()+1) + '' + (dataArray['time'].getDate()<10?'0'+dataArray['time'].getDate():dataArray['time'].getDate());
	imdbPage.find('div.see-more[itemprop=genre] a').each(function() {
		dataArray['genres'].push($(this).text().trim());
	});

	directorTag = imdbPage.find('div.txt-block[itemprop=director] a span[itemprop=name]');
	directorTag.each(function (index, element) {
		dataArray['directors'].push($(this).text());
	});
	dataArray['director'] = dataArray['directors'].join("/");

	imdbPage.find('div.txt-block[itemprop=creator] a span[itemprop=name]').each(function () {
		dataArray['writers'].push($(this).text());
	});
	dataArray['writer'] = dataArray['writers'].join("/");

	castTag = imdbPage.find('div#titleCast .cast_list');
	castTag.find('tr').each(function() {
		if (this.className=="") return;
		dataArray['actors'].push($(this).find('.itemprop[itemprop=actor]').text().trim() + '  ......  ' + $(this).find('td.character div').text().trim().replace(/[ \n\t]+/g, ' '));
	});
	dataArray['actors'] = dataArray['actors'].join('\n　　　　　　　');

	dataArray['genre'] = translateGenre(dataArray['genres']);

	if (imdbPage.find('#titleDetails > div:nth-child(4) h4').text().indexOf('Language')>-1) {
		imdbPage.find('#titleDetails > div:nth-child(4) a').each(function () {
			dataArray['languages'].push($(this).text());
		});
	} else if (imdbPage.find('#titleDetails > div:nth-child(5) h4').text().indexOf('Language')>-1) {
		imdbPage.find('#titleDetails > div:nth-child(5) a').each(function () {
			dataArray['languages'].push($(this).text());
		});
	};
	dataArray['language'] = dataArray['languages'].join('/');

	if (imdbPage.find('#titleDetails > div:nth-child(4) h4').text().indexOf('Country')>-1) {
		imdbPage.find('#titleDetails > div:nth-child(4) a').each(function () {
			dataArray['countries'].push($(this).text());
		});
	} else if (imdbPage.find('#titleDetails > div:nth-child(3) h4').text().indexOf('Country')>-1) {
		imdbPage.find('#titleDetails > div:nth-child(3) a').each(function () {
			dataArray['countries'].push($(this).text());
		});
	};
	dataArray['country'] = dataArray['countries'].join('/');
}

function parseMTime(page) {
	// parse MTime page here
	mTimePage = $(page);
	// replace Actor list
	dataArray['actors'] = [];
	mTimePage.find('.db_actor dl dd').each(function (index, element) {
		if (index>=30) {
			return;
		};
		var actor = $(element).find('.actor_tit').text().trim().replace(/ +/g, ' ');
		var character = $(element).find('.character_tit').text().trim().replace(/ +/g, ' ');
		if (character.trim()=='') {
			dataArray['actors'].push(actor);
		} else {
			dataArray['actors'].push(actor + '  ......  ' + character);
		};
		
	});
	dataArray['actors'] = dataArray['actors'].join('\n　　　　　　　');
}

function parseDouban(data) {
	// parse Douban JSON array here
	dataArray['translated_title'] = data['title'];
	dataArray['plot'] = data['summary'].replace(/\n/g, '\n　　');
	dataArray['alias'] = data['aka'].join('/');
	dataArray['country'] = data['countries'].join('/');
	if (data['casts'].length>0) {
		dataArray['actors_list'] = [];
		for (var cast in data['casts']) {
			dataArray['actors_list'].push(data['casts'][cast]['name']);
		}
		dataArray['actors'] = dataArray['actors_list'].join('/');
	};
	if (data['directors'].length>0) {
		dataArray['directors_list'] = [];
		for (var director in data['directors']) {
			dataArray['directors_list'].push(data['directors'][director]['name']);
		}
		dataArray['director'] = dataArray['directors_list'].join('/');
	};
}

function parseDoubanSearch(data) {
	var defer = $.Deferred();
	// parse Douban JSON search results array here
	if (data['total']>1) {
		// prompt for selection
		var dialog = $('<div style="display:none;" title="请选择最匹配的豆瓣条目" id="promptDouban"></div>');
		$('body').append(dialog);
		dialogInnerHTML = '';
		for (var i in data['subjects']) {
			dialogInnerHTML += '<button class="selectDouban" douban="'+data['subjects'][i]['id']+'">'+data['subjects'][i]['original_title']+' / '+data['subjects'][i]['title']+' ('+data['subjects'][i]['year']+') ['+data['subjects'][i]['subtype']+']</button><br/>';
		};
		dialogInnerHTML += '<button id="skipDouban">不，这些都不匹配</button><br/>';
		dialogInnerHTML = '<center>' + dialogInnerHTML + '</center>';
		dialog.html(dialogInnerHTML);
		$('.selectDouban').button().click(function() {
			// fetch data for selected Douban ID
			$('#promptDouban').dialog('destroy');
			defer.resolve(parseInt($(this).attr('douban')));
		});
		$('#skipDouban').button().click(function() {
			$('#promptDouban').dialog('destroy');
			defer.resolve(0);
		});
		$('#promptDouban').dialog({
			width: 600
		});
	} else if (data['total'] == 1) {
		defer.resolve(parseInt(data['subjects'][0]['id']));
	}

	return defer.promise();
}

function parseBangumiAPI(data) {
	// API reference: https://github.com/jabbany/dhufufu/blob/master/bangumi/api.txt
	dataArray['actors_list'] = [];
	for (var i = data['crt'].length - 1; i >= 0; i--) {
		dataArray['actors_list'].push(data['crt'][i]['name'] + '： ' + (data['crt'][i]['actors'] ? data['crt'][i]['actors'][0]['name'] : 'N/A'));
	}
	dataArray['actors'] = dataArray['actors_list'].join('\n');

	// rearrange staff by roles
	var staff = {}
	for (var i = data['staff'].length - 1; i >= 0; i--) {
		for (var j = data['staff'][i]['jobs'].length - 1; j >= 0; j--) {
			if (data['staff'][i]['jobs'][j] in staff) {
				staff[data['staff'][i]['jobs'][j]].push(data['staff'][i]['name']);
			} else {
				staff[data['staff'][i]['jobs'][j]] = [data['staff'][i]['name']];
			}
		}
	}
	dataArray['staff'] = '';
	for (var i in staff) {
		dataArray['staff'] += i + '： ' + staff[i].join(', ') + '\n';
	};

	dataArray['plot'] = data['summary'].replace(/\n/g, '\n　　');
	dataArray['title'] = data['name'];
	dataArray['translated_title'] = data['name_cn'];
	dataArray['time'] = data['air_date'].slice(0,4) + '.' + data['air_date'].slice(5,7);
	dataArray['year'] = data['air_date'].slice(0,4);
}

function parseBangumi(page) {
	var jobList = ['原作','导演','脚本','分镜','演出','音乐','人物原案','人物设定','系列构成','色彩设计','作画监督','摄影监督','原画','剪辑','音响监督','制片人','制作','音乐制作','动画制作'];
	var bgmPage = $(page);
	dataArray['staff_list'] = [];
	dataArray['actors_list'] = [];

	bgmPage.find('#browserItemList > li').each(function() {
		// parse cast here
		characterName = $(this).find('strong').text().trim();
		voiceName = $(this).find('a[rel="v:starring"]').text().trim();
		voiceName = voiceName || "N/A"
		dataArray['actors_list'].push(characterName + ': ' + voiceName);
	});
	dataArray['actors'] = dataArray['actors_list'].join('\n');

	bgmPage.find('#infobox > li').each(function() {
		// parse staff here
		var job = $(this).find('span.tip').text().trim();
		if (jobList.indexOf(job.slice(0, -1)) > -1) {
			dataArray['staff_list'].push(this.textContent.trim());
		} else if (job.slice(0, -1) === '中文名') {
			dataArray['translated_title'] = this.textContent.replace(/中文名:/, '').trim();
		}
	});
	dataArray['staff'] = dataArray['staff_list'].join('\n');

	dataArray['plot'] = bgmPage.find('#subject_summary').text().replace(/\n/g, '\n　　').trim();
}

function parseAniDB(data) {
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(data, 'text/xml');
	var xml = $(xmlDoc);
	var engTitleNodes = xml.find('title').filter(function() {
		if (this.getAttribute('type') === 'main') return this;
	});
	if (engTitleNodes.length) {
		dataArray['english_title'] = engTitleNodes[0].textContent;
	}

	var jpnTitleNodes = xml.find('title').filter(function() {
		if (this.getAttribute('type') === 'official' && this.getAttribute('xml:lang') === 'ja') return this;
	});
	if (jpnTitleNodes.length) {
		dataArray['title'] = jpnTitleNodes[0].textContent;
	}
	
	var typeTag = xml.find('type');
	if (typeTag.length > 0) {
		dataArray['type'] = typeTag[0].textContent;
	};

	var dateTag = xml.find('startdate');
	if (dateTag.length > 0) {
		var startDate = dateTag[0].textContent;
		dataArray['startDate'] = startDate;
		dataArray['time'] = startDate.slice(0,4) + '.' + startDate.slice(5,7);
		dataArray['year'] = startDate.slice(0,4);
	};

	var siteTag = xml.find('anime > url');
	if (siteTag.length > 0) {
		dataArray['official_site'] = siteTag[0].textContent;
	};
	dataArray['anidb'] = 'http://anidb.net/' + anidbID;
}

function *go() {
	imdbID = $('input#textIMDB').val();
	imdbID = /(\d+)/.exec(imdbID) ? /(\d+)/.exec(imdbID)[1] : '';
	doubanID = $('input#textDouban').val();
	mTimeID = $('input#textMTime').val();
	bgmID = $('input#textBangumi').val();
	anidbID = $('input#textAniDB').val();
	dataArray = {
		'title': undefined,
		'genres': [],
		'directors': [],
		'actors': [],
		'languages': [],
		'writers': [],
		'countries': []
	}

	try {
		if (parseInt(imdbID) > 0) {
			updateStatus('Getting IMDB');
			IMDBPage = yield getURL('http://www.imdb.com/title/tt' + imdbID);
			IMDBPage = IMDBPage.replace(/<img/g, '<nimg'); // Avoid loading images in IMDB Page
			parseIMDB(IMDBPage);
			updateStatus('Finished getting IMDB');
			hasData = true;
		}
		if (!(parseInt(doubanID) > 0) && parseInt(imdbID) > 0) {
			updateStatus('Searching Douban');
			searchDoubanJSON = yield getURL('http://api.douban.com/v2/movie/search?&count=5&q=' + dataArray['title']).then(JSON.parse, showError);
			searchDouban = yield parseDoubanSearch(searchDoubanJSON).then(function (res) {doubanID = res;});
			updateStatus('Finished searching Douban');
		}
		if (parseInt(doubanID) > 0) {
			updateStatus('Getting Douban');
			DoubanPage = yield getURL('http://api.douban.com/v2/movie/subject/' + doubanID).then(JSON.parse, showError);
			parseDouban(DoubanPage);
			hasData = true;
			updateStatus('Finished getting Douban');
		}
		if (parseInt(mTimeID) > 0) {
			updateStatus('Getting MTime');
			MTimePage = yield getURL('http://movie.mtime.com/' + mTimeID + '/fullcredits.html');
			parseMTime(MTimePage);
			updateStatus('Finished getting MTime');
		}
		if (parseInt(bgmID) > 0) {
			updateStatus('Getting Bangumi');
			// BangumiPage = yield getURL('http://api.bgm.tv/subject/' + bgmID + '?responseGroup=large').then(JSON.parse, showError);
			BangumiPage = yield getURL('http://bgm.tv/subject/' + bgmID);
			BangumiPage = BangumiPage.replace(/<img/g, '<nimg'); // Avoid loading images in Bangumi Page
			parseBangumi(BangumiPage);
			hasData = true;
			updateStatus('Finished getting Bangumi');
		}
		if (parseInt(anidbID) > 0) {
			updateStatus('Getting AniDB');
			AniDBPage = yield getURL('http://api.anidb.net:9001/httpapi?request=anime&client=postgenerator&clientver=1&protover=1&aid=' + anidbID);
			parseAniDB(AniDBPage);
			updateStatus('Finished getting AniDB');
		}

		if (hasData) {
			fillForm();
		}
		updateStatus('');
	}
	catch (err) {
		showError(err);
	}
}

function spawn(generatorFunc) {
	function continuer(verb, arg) {
		var result;
		try {
			result = generator[verb](arg);
		} catch (err) {
			return Promise.reject(err);
		}
		if (result.done) {
			return result.value;
		} else {
			return Promise.resolve(result.value).then(onFulfilled, onRejected);
		}
	}
	var generator = generatorFunc();
	var onFulfilled = continuer.bind(continuer, "next");
	var onRejected = continuer.bind(continuer, "throw");
	return onFulfilled();
}

function spawner() {
	spawn(go);
}

// Register some functions and variables in the global scope
var dataArray = {};
var imdbID = undefined;
var doubanID = undefined;
var mTimeID = undefined;
var bgmID = undefined;
var anidbID = undefined;
var hasData = false;
// Add a textbox and a button for triggering
var description = $('<dt>根据IMDB ID生成介绍贴</dt>');
var form = $('<dd id="generateWithIMDB"></dd>');

// Textboxes for xxDB ID
var searchDescription = $('<dt>搜索</dt>');
var searchForm = $('<dd></dd>');
var textbox = $('<input type="text" id="textIMDB" placeholder="IMDB ID，如tt1234567" style="" />');
var doubanTextbox = $('<input type="text" id="textDouban" placeholder="豆瓣ID，如1234567" style="margin-left: 5px;" />');
var mTimeTextbox = $('<input type="text" id="textMTime" placeholder="时光网ID，如123456" style="margin-left: 5px;" />');
var bgmTextbox = $('<input type="text" id="textBangumi" placeholder="Bangumi ID，如123456" style="display: none;" />');
var anidbTextbox = $('<input type="text" id="textAniDB" placeholder="AniDB ID，如123456" style="margin-left: 5px; display: none;" />');

// Search Forms for xxDB
var searchFormIMDB = $('<form target="_blank" method="GET" action="http://www.imdb.com/find" id="searchFormIMDB" style=" float: left;"><input type="text" name="q" class="searchForm" placeholder="搜索IMDB" style="" /><input type="hidden" name="s" value="all" /><input type="hidden" name="ref_" value="nv_sr_fn" /></form>');
var searchFormDouban = $('<form target="_blank" method="GET" action="http://movie.douban.com/subject_search" id="searchFormDouban" style=" float: left;"><input type="text" name="search_text" class="searchForm" placeholder="搜索豆瓣" style="margin-left: 5px;" /></form>');
var searchFormMTime = $('<form target="_blank" method="GET" action="http://search.mtime.com/search/" id="searchFormMTime" style=" float: left;"><input type="text" name="q" class="searchForm" placeholder="搜索时光网" style="margin-left: 5px;" /></form>');
var searchFormBangumi = $('<input type="text" name="search_text" class="searchFormBangumi" id="searchFormBangumi" placeholder="搜索Bangumi" style="display: none; float: left;" />');
var searchFormAniDB = $('<form target="_blank" method="GET" action="http://anidb.net/perl-bin/animedb.pl" id="searchFormAniDB" style="display: none; float: left;"><input type="text" name="adb.search" class="searchForm" placeholder="搜索AniDB" style="margin-left: 5px;" /><input type="hidden" name="show" value="animelist" /><input type="hidden" name="do.search" value="search" /></form>');

// Select list for post types
var select = $('<span id="selectType">' + 
	'<input type="radio" value="movie" id="movie" name="type" checked="checked"><label for="movie">电影</label>' + 
	'<input type="radio" value="drama" id="drama" name="type"><label for="drama">美剧</label>' + 
	'<input type="radio" value="animation" id="animation" name="type"><label for="animation">动画</label>' + 
	'</span>');

// Area for xxDB Page Links
var links = $('<div id="generateWithIMDB_Links"></div>');

// Button to start working
var buttonGo = $('<input type="button" id="searchIMDB" style="margin-left:5px;padding: 3px 5px;" value="生成" />');
buttonGo.click(spawner);

// Arrange all controls
$(form).append(textbox).append(doubanTextbox).append(mTimeTextbox).append(bgmTextbox).append(anidbTextbox).append(select).append(buttonGo).append(links);
$(searchForm).append(searchFormIMDB).append(searchFormDouban).append(searchFormMTime).append(searchFormBangumi).append(searchFormAniDB);
$('dl#post_header').append(description).append(form).append(searchDescription).append(searchForm);

// Only show relevant textboxes for every post type
$('#movie, #drama').click(function() {
	$('#textIMDB, #textDouban, #textMTime, #searchFormIMDB, #searchFormDouban, #searchFormMTime').show();
	$('#textAniDB, #textBangumi, #searchFormAniDB, #searchFormBangumi').hide();
});
$('#animation').click(function() {
	$('#textIMDB, #textDouban, #textMTime, #searchFormIMDB, #searchFormDouban, #searchFormMTime').hide();
	$('#textAniDB, #textBangumi, #searchFormAniDB, #searchFormBangumi').show();
});

// Try to guess post type
(function () {
	var board = /(?:board\=)\d+/.exec(location.href);
	if (board.length) {
		var boardID = parseInt(board[0].slice(6));
		if (boardID === 8) {
			$('#animation').click();
		}
		if (boardID === 17) {
			$('#drama').click();
		}
	}
})();

// Quick search Forms
$('#searchFormBangumi').keypress(function (e) {
	if (e.which == 13) {
		window.open('http://bgm.tv/subject_search/' + $(this).val() + '?cat=2', '_blank');
		return false;
	}
});