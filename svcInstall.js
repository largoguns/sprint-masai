var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Sprint Masai',
  description: 'Sprint Masai',
  script: 'C:\\dev\\sprint-masai\\app.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

svc.on('install',function(){
  svc.start();
});

svc.install();