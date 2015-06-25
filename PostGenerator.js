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
	console.log(err);
}

function fillForm() {
	console.debug('Generating post content ......');
	var textTitle = $('input.input_text[name=subject]');
	var textMessage = $('textarea.editor[name=message]');
	var textIMDB = $('input#imdb[name=imdb]');
	var textDouban = $('input#douban[name=douban]');
	var templateMessage;
	if ($('input[name="type"]:checked', '#selectType').val()=='movie') {
		// movie template
		templateMessage = '[attachthumb=1]\n◎译　　　名: __translated_title__\n◎片　　　名: __title__\n◎别　　　名: __alias__\n◎年　　　代: __year__\n◎国　　　家: __country__\n◎类　　　别: __genre__\n◎语　　　言: __language__\n◎IMDB　评分: __ratingValue__/10.0 from __ratingCount__ users (__today__)\n◎IMDB　链接: [url]http://www.imdb.com/title/tt__imdbID__/[/url]\n◎导　　　演: __director__\n◎主　　　演: __actors__\n\n◎简　　　介:\n　　__plot__';
	} else {
		// drama template
		templateMessage = '[attachthumb=1]\n◎译　　　名: __translated_title__\n◎片　　　名: __title__\n◎别　　　名: __alias__\n◎首　　　播: \n◎国　　　家: __country__\n◎类　　　别: __genre__\n◎语　　　言: __language__\n◎IMDB　评分: __ratingValue__/10.0 from __ratingCount__ users (__today__)\n◎IMDB　链接: [url]http://www.imdb.com/title/tt__imdbID__/[/url]\n◎集　　　数: \n◎电　视　台: \n◎编　　　剧: __writer__\n◎导　　　演: __director__\n◎主　　　演: __actors__\n\n◎简　　　介:\n　　__plot__';
	};
	var templateTitle = '__title__ / __translated_title__ (__year__)';
	if (!('alias' in dataArray) || dataArray['alias'] == '') {
		templateMessage = templateMessage.replace('◎别　　　名: __alias__\n', '');
	};
	textTitle.val(parseTemplate(templateTitle));
	if(parseInt(imdbID) > 0) textIMDB.val(imdbID);
	if(parseInt(doubanID) > 0) textDouban.val(doubanID);
	textMessage.val(parseTemplate(templateMessage));
	// append IMDB and Douban links for correction
	var IMDBLink = ' IMDB链接 : ' + (imdbID ? ('<a target="_blank" href="'+'http://www.imdb.com/title/tt' + imdbID+'">'+'http://www.imdb.com/title/tt' + imdbID+'</a>') : '无');
	IMDBLink += ' 豆瓣链接 : ' + (doubanID ? ('<a target="_blank" href="'+'http://movie.douban.com/subject/' + doubanID+'">'+'http://movie.douban.com/subject/' + doubanID+'</a>') : '无');
	IMDBLink += ' 时光网链接 : ' + (mTimeID ? ('<a target="_blank" href="'+'http://movie.mtime.com/' + mTimeID + '/fullcredits.html">'+'http://movie.mtime.com/' + mTimeID + '/fullcredits.html</a>') : '无');
	$('#generateWithIMDB_Links').html(IMDBLink);
	// fill in tags
	if ($('input[name="type"]:checked', '#selectType').val()=='movie') {
		$('input[name=tags]').val(dataArray['year'] + '|' + dataArray['genres'].join('|') + '|' + dataArray['countries'].join('|'));
	} else {
		$('input[name=tags]').val(dataArray['genres'].join('|'));
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

	// console.log(imdbPage.find('#titleDetails > div:nth-child(4) a'));
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

function *go() {
	imdbID = $('input#textIMDB').val();
	imdbID = /(\d+)/.exec(imdbID) ? /(\d+)/.exec(imdbID)[1] : '';
	doubanID = $('input#textDouban').val();
	mTimeID = $('input#textMTime').val();
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
			IMDBPage = yield getURL('http://www.imdb.com/title/tt' + imdbID);
			IMDBPage = IMDBPage.replace(/<img/g, '<nimg'); // Avoid loading images in IMDB Page
			parseIMDB(IMDBPage);
			hasData = true;
			console.log('Getting IMDB');
		}
		if (!(parseInt(doubanID) > 0)) {
			searchDoubanJSON = yield getURL('http://api.douban.com/v2/movie/search?&count=5&q=' + dataArray['title']).then(JSON.parse, showError);
			searchDouban = yield parseDoubanSearch(searchDoubanJSON).then(function (res) {doubanID = res;});
			console.log('Search Finished.');console.log(doubanID);
		}
		if (parseInt(doubanID) > 0) {
			DoubanPage = yield getURL('http://api.douban.com/v2/movie/subject/' + doubanID).then(JSON.parse, showError);
			parseDouban(DoubanPage);
			hasData = true;
			console.log('Getting Douban');
		}
		if (parseInt(mTimeID) > 0) {
			MTimePage = yield getURL('http://movie.mtime.com/' + mTimeID + '/fullcredits.html');
			parseMTime(MTimePage);
		}
	}
	catch (err) {
		showError(err);
	}
	
	if (hasData) {
		fillForm();
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
var hasData = false;
// Add a textbox and a button for triggering
var description = $('<dt>根据IMDB ID生成介绍贴</dt>');
var form = $('<dd id="generateWithIMDB"></dd>');
var textbox = $('<input type="text" id="textIMDB" placeholder="IMDB ID，如tt1234567" style="margin-left: 5px;" />');
var doubanTextbox = $('<input type="text" id="textDouban" placeholder="豆瓣ID，如1234567" style="margin-left: 5px;" />');
var mTimeTextbox = $('<input type="text" id="textMTime" placeholder="时光网ID，如123456" style="margin-left: 5px;" />');
var select = $('<span id="selectType"><input type="radio" value="movie" id="movie" name="type" checked="checked"><label for="movie">电影</label><input type="radio" value="drama" id="drama" name="type"><label for="drama">美剧</label></span>');
var links = $('<div id="generateWithIMDB_Links"></div>');
var buttonGo = $('<input type="button" id="searchOMDB" style="margin-left:5px;padding: 3px 5px;" value="生成" />');
buttonGo.click(spawner);
$(form).append(textbox).append(doubanTextbox).append(mTimeTextbox).append(select).append(buttonGo).append(links);
$('dl#post_header').append(description).append(form);