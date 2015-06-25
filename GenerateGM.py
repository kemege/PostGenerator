# -*- encoding: utf8 -*-
import json, io

original = io.open('PostGenerator.js', 'r', encoding="utf-8")
output = io.open('PostGenerator.user.js', 'w', encoding="utf-8")
manifest = io.open('manifest.json', 'r', encoding="utf-8")

metainfo = json.loads(manifest.read())

metainfo['include'] = metainfo['content_scripts'][0]['matches'][0]
output.write('''
// ==UserScript==
// @name           %(name)s
// @description    Generate a post with a given IMDB id
// @version        %(version)s
// @author         kemege
// @namespace      kemege
// @include        %(include)s
// @icon           http://pt.vm.fudan.edu.cn/favicon.ico
// @require        http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.2.min.js
// @require        https://code.jquery.com/ui/1.8.2/jquery-ui.min.js
// @grant          GM_xmlhttpRequest
// ==/UserScript==
''' % metainfo)

script = original.read()
script = script.replace('$.ajax', 'GMAjax')
output.write(script)

original.close()
output.close()
