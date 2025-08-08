const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { createServer } = require('./server');

async function startServer() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  return { server, base: `http://localhost:${port}` };
}

function cleanup() {
  try { fs.unlinkSync('tasks.json'); } catch {}
}

test('task lifecycle with persistence', async () => {
  cleanup();
  const { server, base } = await startServer();
  try {
    let res = await fetch(`${base}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'one' })
    });
    assert.strictEqual(res.status, 201);
    const first = await res.json();

    res = await fetch(`${base}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'two' })
    });
    const second = await res.json();

    res = await fetch(`${base}/tasks/${first.id}/complete`, { method: 'POST' });
    assert.strictEqual(res.status, 200);

    res = await fetch(`${base}/tasks/${second.id}`, { method: 'DELETE' });
    assert.strictEqual(res.status, 204);

    res = await fetch(`${base}/tasks/${first.id}`);
    assert.strictEqual(res.status, 200);
    const fetched = await res.json();
    assert.strictEqual(fetched.completed, true);

    res = await fetch(`${base}/tasks/${second.id}`);
    assert.strictEqual(res.status, 404);

    const saved = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
    assert.strictEqual(saved.tasks.length, 1);
    assert.strictEqual(saved.tasks[0].id, first.id);
  } finally {
    server.close();
    cleanup();
  }
});
