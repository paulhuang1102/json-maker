const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
// const { readFile } = require('fs').promises

const arg = process.argv.slice(2);
const OUPUT = './ouptut/';
const SOURCE = './source/'
const workbook = XLSX.readFile(path.resolve(__dirname, SOURCE + arg[0]));
const sheetNames = workbook.SheetNames; 
const worksheet = workbook.Sheets[sheetNames[0]];
const sheetJson = XLSX.utils.sheet_to_json(worksheet, { defval: null }); // defval for show all colmn

const langs = sheetJson[0];
delete langs.code;
Object.keys(langs).map(l => langs[l] = {});

const walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    list = list.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const ensureDirExist = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirExist(dirname);
  fs.mkdirSync(dirname);
}

walk(path.resolve(__dirname, SOURCE + arg[1]), (err, results) => {
  if (err) throw err;

  results.forEach(file => {
    fs.readFile(file, (err, content) => {
      if (err) throw err;

      const filename = path.basename(file).replace('.json', '');
      const data = JSON.parse(content);
  
      Object.keys(data)
        .map(key => sheetJson.find(sheet => sheet.code === key))
        .filter(v => !!v)
        .forEach(t => {
          Object.keys(langs)
            .map(key => {
              if (langs[key][filename] === undefined) langs[key][filename] = {};
              langs[key][filename][t.code] = t[key];
            });
        })
      
      Object.keys(langs).forEach((lang) => {
        Object.keys(langs[lang]).forEach(key => {
          const outputPath = OUPUT + lang + '/' + key + '.json';
          ensureDirExist(outputPath);
          fs.writeFile(outputPath, JSON.stringify(langs[lang][key]), (err) => {
            if (err) throw err;
            console.log('complete', lang, key);
          })
        })
      })
    })
  })
  
})


