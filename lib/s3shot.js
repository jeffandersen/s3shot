var uploader = exports; exports.constructor = function uploader(){};

var fs = require('fs');
var path = require('path');
var open = require('open');
var watch = require('watch');
var AWS = require('aws-sdk');

var env = process.env;
var HOME_DIR = env.HOME || env.HOMEPATH || env.USERPROFILE;
var DESKTOP_DIR = path.join(HOME_DIR, 'Desktop');

function S3Shot(conf) {
  this.bucket = conf.bucket;
  this.accessKey = conf.accessKey;
  this.secretAccessKey = conf.secretAccessKey;

  if (!this.bucket || !this.accessKey || !this.secretAccessKey) {
    throw new Error('AWS bucket, accessKey and secretAccessKey required');
  }

  this.directory = conf.directory || DESKTOP_DIR;
  this.type = conf.type || 'image/png';
  this.prefix = conf.prefix || 'Screen Shot';
  this.acl = conf.acl || 'public-read';
  this.domain = 'https://s3.amazonaws.com/' + this.bucket;
  this.open = conf.autoOpen || false;
  this.deleteAfterUpload = conf.deleteAfterUpload || true;
}

/**
 * Configure the s3 module with credentials
 */
S3Shot.prototype.configure = function() {
  AWS.config.update({
    accessKeyId: this.accessKey,
    secretAccessKey: this.secretAccessKey
  });

  this.s3 = new AWS.S3();

  return this;
};

/**
 * Watch the configured directory for changes
 */
S3Shot.prototype.watch = function() {
  var self = this;

  // Monitor for new files created in supplied directory
  watch.createMonitor(self.directory, function(mon) {
    console.log('Watching for new files');

    mon.on('created', function(filepath) {
      var filename = filepath.replace(self.directory + '/', '');

      // Only process if matches filename prefix
      if (filename.indexOf(self.prefix) !== 0) {
        console.warn('Not a screenshot', filename);
        return;
      }

      // Attempt upload of file
      self._upload(filepath, filename, function(err, url) {
        if (err) {
          return console.error('Failed to upload screenshot', err);
        }

        // Copy the URL to system clipboard with pbcopy
        console.log('Copied', url);
        pbcopy(url);

        // Open in browser if specified
        if (self.open) {
          console.log('Opening in browser');
          open(url);
        }
      });
    });
  });
};

/**
 * Upload the newly created file to s3
 */
S3Shot.prototype._upload = function(filepath, filename, cb) {
  var self = this;

  console.log('Attempting upload of', filepath);
  fs.readFile(filepath, function(err, buf) {
    if (err) {
      return console.error('Could not read file', filepath);
    }

    console.log('Putting object to s3');
    self.s3.putObject({
      Bucket: self.bucket,
      Key: filename,
      Body: buf,
      ACL: self.acl,
      ContentType: self.type
    }, function(err) {
      if (err) {
        return cb(err);
      }

      fs.unlink(filepath, function(err) {
        if (err) {
          console.error('Failed to unlink file', err, filepath);
        }

        cb(null, self.domain + '/' + encodeURIComponent(filename));
      });
    });
  });
};

// pbcopy util
function pbcopy(data) {
  var proc = require('child_process').spawn('pbcopy');
  proc.stdin.write(data);
  proc.stdin.end();
}

uploader.S3Shot = S3Shot;
