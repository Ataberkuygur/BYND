const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

function createServer() {
  const dataFile = path.join(__dirname, 'tasks.json');
  let tasks = [];
  let nextId = 1;

  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    tasks = data.tasks || [];
    nextId = data.nextId || 1;
  } catch {
    // ignore missing or invalid file
  }

  const save = () => {
    fs.writeFileSync(dataFile, JSON.stringify({ tasks, nextId }, null, 2));
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('BYND API');
    }

    if (req.method === 'GET' && url.pathname === '/tasks') {
      return res.end(JSON.stringify(tasks));
    }

    if (req.method === 'GET' && url.pathname.startsWith('/tasks/')) {
      const id = parseInt(url.pathname.split('/')[2], 10);
      const task = tasks.find(t => t.id === id);
      if (!task) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'not found' }));
      }
      return res.end(JSON.stringify(task));
    }

    if (req.method === 'POST' && url.pathname === '/tasks') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          if (!data.title) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: 'title required' }));
          }
          const task = { id: nextId++, title: data.title, completed: false };
          tasks.push(task);
          save();
          res.writeHead(201);
          return res.end(JSON.stringify(task));
        } catch (err) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'invalid json' }));
        }
      });
      return;
    }

    if (req.method === 'POST' && url.pathname.startsWith('/tasks/') && url.pathname.endsWith('/complete')) {
      const id = parseInt(url.pathname.split('/')[2], 10);
      const task = tasks.find(t => t.id === id);
      if (!task) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'not found' }));
      }
      task.completed = true;
      save();
      return res.end(JSON.stringify(task));
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/tasks/')) {
      const id = parseInt(url.pathname.split('/')[2], 10);
      const task = tasks.find(t => t.id === id);
      if (!task) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'not found' }));
      }
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          if (!('title' in data) && !('completed' in data)) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: 'nothing to update' }));
          }
          if ('title' in data) {
            if (typeof data.title !== 'string' || !data.title) {
              res.writeHead(400);
              return res.end(JSON.stringify({ error: 'invalid title' }));
            }
            task.title = data.title;
          }
          if ('completed' in data) {
            if (typeof data.completed !== 'boolean') {
              res.writeHead(400);
              return res.end(JSON.stringify({ error: 'invalid completed' }));
            }
            task.completed = data.completed;
          }
          save();
          return res.end(JSON.stringify(task));
        } catch {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'invalid json' }));
        }
      });
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/tasks/')) {
      const id = parseInt(url.pathname.split('/')[2], 10);
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'not found' }));
      }
      tasks.splice(index, 1);
      save();
      res.writeHead(204);
      return res.end();
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  return server;
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = { createServer };
