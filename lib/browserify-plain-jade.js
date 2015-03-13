var through = require('through');
var jade = require('jade');

function getJadeDependencies(inputString, options) {
  var parser = new jade.Parser(inputString, options.filename, options);
  parser.parse();
  return parser.dependencies;
}

module.exports = function(file) {
  if (!/\.jade$/.test(file)) {
    return through();
  }

  var data = '';

  function write(buf) {
    data += buf;
  }

  function end() {
    var that = this;

    jade.render(data, {filename:file}, function(err, html) {
      if (err) {
        that.emit('error', err);
        return;
      }

      html = html.replace(/\"/g, '\u005C\u0022');
      html = html.replace(/^(.*)/gm, '"$1');
      html = html.replace(/(.+)$/gm, '$1" +');
      html = html.replace(/\+$/, '');

      html = 'module.exports = ' + html + ';\n';

      that.queue(html);
      that.queue(null);

      var dependencies = getJadeDependencies(data, {filename: file});
      dependencies.forEach(function(f){
        that.emit("file", f);
      });

    });
  }

  return through(write, end);
};
