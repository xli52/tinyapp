const http = require('http');
const PORT = 8080;

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.write('<h1>Welcome to the home page.<\h1>');
    res.end(`Request Path: ${req.url}\nRequest Method: ${req.method}`);
  }
  if (req.url === '/urls') {
    res.write('<h1>some urls<\h1>');
    res.end(`Request Path: ${req.url}\nRequest Method: ${req.method}`);
  }
  
  res.statusCode = 404;
  res.write('<h1>404 Page Not Found<\h1>');
  res.end(`Request Path: ${req.url}\nRequest Method: ${req.method}`);
  
});

console.log('Server created');

server.listen(PORT, () => {
  console.log(`Server listening on: http://localhost:${PORT}`);
});

console.log('Last line (after .listen call)');