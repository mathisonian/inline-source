var path = require('path')
	, fs = require('fs')
	, uglify = require('uglify-js')
	, CleanCSS = require('clean-css')
	, RE_INLINE_SOURCE = /\s*?(<script[^>]*?\sinline[^>]*?><\/script>)/gm
	, RE_INLINE_HREF = /\s*?(<link.*?\sinline[^>]*>)/gm
	, RE_SRC = /src=["|'](.+)["|']/
	, RE_HREF = /href=["|'](.+)["|']/;

/**
 * Parse 'html' for <script> and <link> tags containing an 'inline' attribute
 * @param {String} htmlpath
 * @param {String} html
 */

var matches = [];
module.exports = function(htmlpath, html) {
	var match;

	// Parse inline <script> tags
	while (match = RE_INLINE_SOURCE.exec(html)) {

		if(matches.indexOf(match[1]) > -1) {
			break;
		}
		matches.push(match[1]);
		html = inline('js', match[1], htmlpath, html);
	}

	// Parse inline <link> tags
	while (match = RE_INLINE_HREF.exec(html)) {
		html = inline('css', match[1], htmlpath, html);
	}

	return html;
};

/**
 * Inline a 'source' tag in 'html'
 * @param {String} type
 * @param {String} source
 * @param {String} htmlpath
 * @param {String} html
 * @returns {String}
 */
function inline(type, source, htmlpath, html) {
	var isCSS = (type == 'css')
		, tag = isCSS ? 'style' : 'script'
		, content = '<' + tag + '>'
		// Parse url
		, filepath = path.resolve(path.extname(htmlpath).length ? path.dirname(htmlpath) : htmlpath, source.match(isCSS ? RE_HREF : RE_SRC)[1])
		, filecontent;


	if (fs.existsSync(filepath)) {
		filecontent = fs.readFileSync(filepath, 'utf8');
		// Compress
		try {
			filecontent = isCSS
				? new CleanCSS().minify(filecontent)
				: uglify.minify(filecontent, {fromString: true}).code;
		} catch (err) {
		}
		content += filecontent + '</' + tag + '>';
		// Inline

		var newHtml = html.replace(source, content);

		return html.replace(source, content);
	} else {
		// Remove 'inline' attribute
		return html.replace(source, source.replace(' inline', ''))
	}
}
