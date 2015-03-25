# s3shot
Utility to upload your latest screenshot to a configured Amazon S3 bucket.

Developed for OS X Yosemite. Your mileage may vary.

### Installation

```
npm install -g s3shot
s3shot
```

### Configuration

Copy the `s3shot.json.example` file from this repository to `~/s3shot.json` and update with your own values. By default, Mac OS X puts screenshots on your Desktop.

### Supervisord

You can run this module with supervisord with such a config, replacing the obvious values:

```
[program:s3shot]
command=/path/to/node/bin/s3shot
environment=HOME="/Users/yourusername"
user=yourusername
autorestart=true
stdout_logfile=/var/log/s3shot.log
stderr_logfile=/var/log/s3shot.log
```
