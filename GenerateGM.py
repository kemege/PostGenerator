
import json

original = open('PostGenerator.js', 'r')
output = open('PostGenerator.user.js', 'w')
manifest = open('manifest.json', 'r')

metainfo = json.loads(manifest.read())
print(metainfo.keys())
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
// @grant          GM_xmlhttpRequest
// ==/UserScript==

function GMAjax(object) {
	return GM_xmlhttpRequest({
		method: object.type,
		url: object.url,
		synchronous: !object.async,
		onload: object.success,
		onerror: object.error
		});
}
''' % metainfo)

script = original.read().decode('utf-8')
script = script.replace('$.ajax', 'GMAjax')
output.write(script)

original.close()
output.close()