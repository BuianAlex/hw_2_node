const fs = require('fs');
const { Transform } = require('stream');
const readline = require('readline');
const appArgs = process.argv.slice(2);
const fileName = appArgs[0];

if (!fileName || !appArgs[1]) {
  process.stdout.write(
    `
Necessary arguments - FILENAME and options. Example: $ node app newFile create

Option list:
  create - create file with 10 000 records (+ check if file exist)
  read - read file to console
  add - add to end file from console
  toUp - all records to uppercase
  clean - clean digits from the file and save all found digit to digitsList.md file
  update - all records in the file to lowercase after capitalize

`
  );
}

function fileRead(fileName) {
  const stream = fs.createReadStream(fileName);
  stream.on('error', () => {
    process.stdout.write(`
    
Something went wrong.

`);
  });
  return stream;
}

function createFile() {
  if (!fs.existsSync(fileName)) {
    const wrNewFile = fs.createWriteStream(fileName);
    for (let i = 0; i < 10000; i += 1) {
      wrNewFile.write(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque
     dignissim orci id ex cursus, nec ultricies leo suscipit. Lorem ipsum 
     dolor sit amet, consectetur adipiscing elit. Vestibulum semper felis 
     eu massa sodales ullamcorper vitae dignissim ex. Phasellus risus mi, maximus 
     sed sapien vel, ultrices semper nunc. Duis et lorem quis tortor tempor dapibus 
     et vitae sapien. Donec molestie augue purus, eget mattis nisi fermentum a. 
     Nunc scelerisque lectus eget lobortis pretium. Vivamus scelerisque cursus 
     malesuada.`);
    }
    wrNewFile.end();
    wrNewFile.on('finish', () => {
      console.log('File created successfully.');
    });
  } else {
    console.log('File exist already');
  }
}

function readToConsole() {
  const readFile = fileRead(fileName);
  readFile.pipe(process.stdout);
  readFile.on('close', () => {
    process.stdout.write('\n');
  });
}

function writeToFile() {
  const wstream = fs.createWriteStream(fileName, {
    flags: 'a'
  });
  process.stdin.setEncoding('utf8');
  process.stdout.write('Write something [ctrl+c] to save:\n');
  process.stdin.on('readable', () => {
    let chunk;
    while ((chunk = process.stdin.read()) !== null) {
      wstream.write(chunk);
    }
  });

  process.stdin.on('end', () => {
    wstream.end();
    process.stdout.write('end');
  });
}

const uppercaseTransformer = new Transform({
  readableObjectMode: true,
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

const digitsCleanTransformer = new Transform({
  readableObjectMode: true,
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    const strChunk = chunk.toString();
    const digits = strChunk.replace(/\D/g, '');
    if (digits) {
      const wstream = fs.createWriteStream('./digitsList', {
        flags: 'a'
      });
      wstream.write(JSON.stringify({ time: Date.now(), digits: digits }));
      wstream.write('\n');
      wstream.end();
    }
    this.push(strChunk.replace(/\d/g, ''));
    callback();
  }
});

const lowercaseTransform = new Transform({
  readableObjectMode: true,
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toLowerCase());
    callback();
  }
});

const capitalizeTransform = new Transform({
  readableObjectMode: true,
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    const strChunk = chunk.toString();
    const str = strChunk.split(' ');
    for (let i = 0; i < str.length; i++) {
      if (str.length > 0) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].substr(1);
      }
    }
    const res = str.join(' ');
    this.push(res);
    callback();
  }
});

function update() {
  const readFile = fileRead(fileName);
  readFile
    .pipe(lowercaseTransform)
    .pipe(capitalizeTransform)
    .pipe(process.stdout);
}

function uppercase() {
  const readFile = fileRead(fileName);
  readFile.pipe(uppercaseTransformer).pipe(process.stdout);
}

function cleanDigits() {
  const readFile = fileRead(fileName);
  readFile.pipe(digitsCleanTransformer).pipe(process.stdout);
}

switch (appArgs[1]) {
  case 'create':
    createFile();
    break;
  case 'read':
    readToConsole();
    break;
  case 'add':
    writeToFile();
    break;
  case 'toUp':
    uppercase();
    break;
  case 'clean':
    cleanDigits();
    break;
  case 'update':
    update();
    break;
  default:
    break;
}
