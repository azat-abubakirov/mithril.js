var fs = require("fs")
var path = require("path")
var marked = require("marked")
var layout = fs.readFileSync("./docs/layout.html", "utf-8")
var version = JSON.parse(fs.readFileSync("./package.json", "utf-8")).version
try {fs.mkdirSync("archive")} catch (e) {}
try {fs.mkdirSync("archive/v" + version)} catch (e) {}
try {fs.mkdirSync("archive/v" + version + "/lib")} catch (e) {}
try {fs.mkdirSync("archive/v" + version + "/lib/prism")} catch (e) {}

var guides = fs.readFileSync("docs/guides.md", "utf-8")
var methods = fs.readFileSync("docs/methods.md", "utf-8")

generate("docs")

function generate(pathname) {
	if (fs.lstatSync(pathname).isDirectory()) {
		fs.readdirSync(pathname).forEach(function(filename) {
			generate(pathname + "/" + filename)
		})
	}
	else if (!pathname.match(/tutorials|archive/)) {
		if (pathname.match(/\.md$/)) {
			var outputFilename = pathname.replace(/\.md$/, ".html")
			var markdown = fs.readFileSync(pathname, "utf-8")
			var fixed = markdown
				.replace(/`((?:\S| -> |, )+)(\|)(\S+)`/gim, function(match, a, b, c) { // fix pipes in code tags
					return "<code>" + (a + b + c).replace(/\|/g, "&#124;") + "</code>"
				})
				.replace(/(^# .+?(?:\r?\n){2,}?)(?:(-(?:.|\r|\n)+?)((?:\r?\n){2,})|)/m, function(match, title, nav, space) { // inject menu
					var file = path.basename(pathname)
					var link = new RegExp("([ \t]*)(- )(\\[.+?\\]\\(" + file + "\\))")
					var replace = function(match, space, li, link) {
						return space + li + "**" + link + "**" + (nav ? "\n" + nav.replace(/(^|\n)/g, "$1\t" + space) : "")
					}
					var modified = guides.match(link) ? guides.replace(link, replace) : methods.replace(link, replace)
					return title + modified + "\n\n"
				})
				.replace(/(\]\([^\)]+)(\.md)/gim, function(match, path, extension) {
					return path + (path.match(/http/) ? extension : ".html")
				}) // fix links
			var markedHtml = marked(fixed)
				.replace(/(\W)Array<([^/<]+?)>/gim, "$1Array&lt;$2&gt;") // Fix type signatures containing Array<...>
			var html = layout
				.replace(/\[version\]/, version) // update version
				.replace(/\[body\]/, markedHtml)
				.replace(/<h5 id="([^"]+?)">([^<]+?)<\/h5>/gim, function(match, id, text) { // fix anchors
					return "<h5 id=\"" + text.toLowerCase().replace(/\.|\[|\]|&quot;|\//g, "") + "\">" + text + "</h5>"
				})
			fs.writeFileSync("archive/v" + version + "/" + outputFilename.replace(/^docs\//, ""), html, "utf-8")
		}
		else if (!pathname.match(/lint|generate/)) {
			fs.writeFileSync("archive/v" + version + "/" + pathname.replace(/^docs\//, ""), fs.readFileSync(pathname, "utf-8"), "utf-8")
		}
	}
}
