var nock = require('nock');
var path = require('path');
var fs = require('fs-extra');

var defaults = {
  baseDir: path.join(process.cwd(), 'test', 'fixtures'),
  beforeCallback : 'before', // suite setup callback
  afterCallback : 'after'// suite cleanup callback
};

function playback (definitionName){
  
  definitionName = definitionName.endsWith('.json') ? definitionName : definitionName + '.json';


  //todo: strict typechecking
  var beforeCallback = typeof defaults.beforeCallback === 'string'? global[defaults.beforeCallback]: defaults.beforeCallback;
  var afterCallback = typeof defaults.afterCallback === 'string'? global[defaults.afterCallback]: defaults.afterCallback;

  //definition path
  var definitionsPath = path.join( defaults.baseDir, definitionName);
  var hasDefinitions;

  beforeCallback(function(done){
    //check if definition exists and readable
    fs.access(definitionsPath, fs.R_OK | fs.R_OK, function(err){     
      if(err){
        //not found, start recording
        nock.recorder.rec({
          'output_objects':  true,
          'dont_print':      true
        });       
      }
      else{
        //definitions found, load them
        hasDefinitions = true;   
        nock.load(definitionsPath);            
      }
      return done();
    });
  });

  afterCallback(function(done){
    if(hasDefinitions){
      return done();
    }

    //suite finished, save the recorded definitions
    var definitions = nock.recorder.play();
    fs.ensureFile(definitionsPath, function(err){
      if(err){
        done(err);
      }
      fs.writeFile(definitionsPath, JSON.stringify(definitions, null, 2), done);      
    });
  });
};

module.exports = playback;
module.exports.defaults = defaults;