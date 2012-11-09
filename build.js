// Combine JS and CSS files
// ---
//
// Make sure you install the npm dependencies
//   > cd YOUR_PROJECT_FOLDER
//   > npm install
//
// Than run:
//   > node build



var _cli = require('commander'),
    _minimatch = require('minimatch'),
    _wrench = require('wrench'),
    _fs = require('fs'),
    _path = require('path'),
    _requirejs = require('requirejs');



// ========
// SETTINGS
// ========


var DEV_FOLDER = 'src/';
var DIST_FOLDER = 'dist/';
var FILE_ENCODING = 'utf-8';


// Configs reused across all the r.js JS optimizations
// reference: https://github.com/jrburke/r.js/blob/master/build/example.build.js
var BASE_JS_SETTINGS = {
        logLevel : 1,
        baseUrl : DEV_FOLDER + 'js',
        paths : {
        },
        inlineText: true,
        optimize : 'uglify',
        //optimize : 'none',
        pragmasOnSave : {
            excludeHbs : true,
            excludeHbsParser : true
        },
        hbs : {
            disableI18n : true
        },
        // exclude plugins after build
        stubModules : [
            'json',
            'mdown',
            'hbs',
            'text'
        ],
        exclude : [],
        include :[]
    };



// ========
// COMMANDS
// ========


_cli
    .command('deploy')
    .description('optimize CSS/JS files and copy files to deploy.')
    .action(function(){
        purgeDeploy();
        copyFilesToDeploy();
        optimizeJS(optimizeCSS);
    });

_cli
    .command('optimize-js')
    .description('optimize JS files and combine into fewer files to improve page load performance.')
    .action(optimizeJS);

_cli
    .command('optimize-css')
    .description('optimize CSS files and combine into fewer files to improve page load performance.')
    .action(optimizeCSS);



// ============================================================================
// TASKS
// ============================================================================

var _optimizeStartTime;
var _nOptimizedModules = 0;

function optimizeJS(cb){
    echo('optimizing JS files...');

    _optimizeStartTime = Date.now();

    uglify(DEV_FOLDER + 'js/lib/require.js', _path.join(DIST_FOLDER, 'js/lib/require.js'), [
        '@license RequireJS 2.1.0 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.',
        'Available via the MIT or new BSD license.',
        'see: http://github.com/jrburke/requirejs for details'
    ]);
    /*
    //jquery only used if local
    uglify('js/lib/jquery/jquery.js', _path.join(DIST_FOLDER, 'js/lib/jquery/jquery.js'), [
        'jQuery v1.8.2 jquery.com | jquery.org/license'
    ]);
     */

    rjs({
        name : 'app',
        out : _path.join(DIST_FOLDER, 'js/app.js')
    }, function(){
        echo('Build date: '+ (new Date()).toUTCString());
        echo('optimized %d modules in %d miliseconds.', _nOptimizedModules, Date.now() - _optimizeStartTime);
        if (typeof cb === 'function') cb();
    });

    rjs({
        name : 'app',
        optimize : 'none',
        out : _path.join(DIST_FOLDER, 'js/app.raw.js')
    }, function(){
        echo('Build date: '+ (new Date()).toUTCString());
        echo('optimized %d modules in %d miliseconds.', _nOptimizedModules, Date.now() - _optimizeStartTime);
        if (typeof cb === 'function') cb();
    });
}



// ---

function optimizeCSS(cb){
    _requirejs.optimize({
        optimizeCss : 'standard',
        cssIn: DEV_FOLDER + 'css/master.css',
        out: _path.join(DIST_FOLDER, 'css/master.css')
    }, function(response){
        echo('optimized CSS files');
        if (typeof cb === 'function') cb();
    });
    _requirejs.optimize({
        optimizeCss : 'standard.keepLines',
        cssIn: DEV_FOLDER + 'css/master.css',
        out: _path.join(DIST_FOLDER, 'css/master.raw.css')
    }, function(response){
        echo('optimized CSS files');
        if (typeof cb === 'function') cb();
    });
}


// ---


function purgeDeploy(){
    echo('deleting old deploy files...');

    if (! _fs.existsSync(DIST_FOLDER)) return;

    var files = _wrench.readdirSyncRecursive(DIST_FOLDER);

    // filter files that shouldn't be deleted
    files = filterFiles(files, [
        '{**/,}.svn{/**,}'
    ]);

    var stat;
    files.forEach(function(path){
        path = DIST_FOLDER + path;
        stat = _fs.statSync(path);
        if( stat.isFile() ) {
            _fs.unlinkSync(path);
        } else if( stat.isDirectory() ){
            if (! _fs.readdirSync(path).length) {
                //only delete folder if empty
                _fs.rmdirSync(path);
            }
        }
    });
}


function copyFilesToDeploy(){
    echo('copying files to deploy...');

    var files = _wrench.readdirSyncRecursive(DEV_FOLDER);

    // filter files that shouldn't be copied
    files = filterFiles(files, [
        '_*',
        '.*',
        '.DS_Store',
        '{**/,}.svn{/**,}',
        'node_modules/**',
        'tests/**',
        'css/**',
        'img/tmp/**',
        'build.js',
        'package.json',
        'README.md',
        'update.sh'
    ]);

    // add files that would be excluded by globs above
    //files.push('.htaccess');
    files.forEach(function(path){
        //skip directories
        if(_fs.statSync(DEV_FOLDER + path).isFile() ){
            var distPath = _path.join(DIST_FOLDER, path);
            safeCreateDir(distPath);
            _fs.writeFileSync(distPath, _fs.readFileSync(DEV_FOLDER + path));
        }
    });

    _fs.writeFileSync(DIST_FOLDER + 'README.md', "# Do NOT edit these files!\n\nThey are going to be deleted on the next build,\ncheck files inside the 'dev/' folder instead.\n\nLast Build: "+ (new Date()).toUTCString());
}



// =======
// HELPERS
// =======


function echo(var_args){
    var args = Array.prototype.slice.call(arguments);
    args[0] = '  '+ args[0];
    console.log.apply(console, args);
}


function safeCreateDir(path) {
    var dir = _path.dirname(path);
    if (! _fs.existsSync(dir)) {
        _wrench.mkdirSyncRecursive(dir);
    }
}


function filterFiles(files, excludes) {
    var globOpts = {
        matchBase: true,
        dot : true
    };
    excludes = excludes.map(function(val){
        //minimatch currently have a bug with star globs (https://github.com/isaacs/minimatch/issues/5)
        return _minimatch.makeRe(val, globOpts);
    });

    files = files.map(function(filePath){
        // need to normalize and convert slashes to unix standard
        // otherwise the RegExp test will fail on windows
        return _path.normalize(filePath).replace(/\\/g, '/');
    });

    return files.filter(function(filePath){
        return ! excludes.some(function(glob){
            return glob.test(filePath);
        });
    });
}

function uglify(srcPath, distPath, licenseArr) {
    var
      uglyfyJS = require('uglify-js'),
      jsp = uglyfyJS.parser,
      pro = uglyfyJS.uglify,
      ast = jsp.parse( _fs.readFileSync(srcPath, FILE_ENCODING) ),
      prepend = licenseArr? '\/**\n * '+ licenseArr.join('\n * ') +'\n */\n' : '';

    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);

    safeCreateDir(distPath);
    _fs.writeFileSync(distPath, prepend + pro.gen_code(ast), FILE_ENCODING);
    echo('"%s" uglified.', distPath);
}

function rjs(opts, cb){
    _requirejs.optimize( mixIn(BASE_JS_SETTINGS, opts), function(){
        _nOptimizedModules += 1;
        if (typeof cb === 'function') {
            cb.apply(null, Array.prototype.slice.call(arguments));
        }
    });
}


function mixIn(target, objects){
    var i = 1,
        key, cur;
    while(cur = arguments[i++]){
        for(key in cur){
            if(Object.prototype.hasOwnProperty.call(cur, key)){
                target[key] = cur[key];
            }
        }
    }
    return target;
}


// ==============
// parse commands
// ==============


_cli.parse(process.argv);


if (!_cli.args.length) {
    // show help by default
    _cli.parse([process.argv[0], process.argv[1], '-h']);
    process.exit(0);
} else {
    //warn aboud invalid commands
    var validCommands = _cli.commands.map(function(cmd){
        return cmd.name;
    });
    var invalidCommands = _cli.args.filter(function(cmd){
        //if command executed it will be an object and not a string
        return (typeof cmd === 'string' && validCommands.indexOf(cmd) === -1);
    });
    if (invalidCommands.length) {
        console.log('\n [ERROR] - Invalid command: "%s". See "--help" for a list of available commands.\n', invalidCommands.join(', '));
    }
}
