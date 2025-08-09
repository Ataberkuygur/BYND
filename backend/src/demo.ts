import axios from 'axios';

async function run() {
  const base = process.env.DEMO_BASE || 'http://localhost:4010';
  const rnd = Math.floor(Math.random() * 1e6);
  const email = `demo_${rnd}@example.com`;
  const password = 'Pass1234!';
  console.log('Registering', email);
  const reg = await axios.post(base + '/auth/register', { email, password });
  const token = reg.data.token;
  console.log('Token acquired length=', token.length);
  const auth = { Authorization: 'Bearer ' + token };
  console.log('Creating task');
  const task = await axios.post(base + '/tasks', { title: 'Demo Task' }, { headers: auth });
  console.log('Task created id=', task.data.id);
  console.log('AI interpret');
  const ai = await axios.post(base + '/ai/interpret', { utterance: 'Write summary tonight 8pm' }, { headers: auth });
  console.log('AI created count=', ai.data.length);
  console.log('Future self reply');
  const fs = await axios.post(base + '/ai/future-self', { message: 'Encourage me' }, { headers: auth });
  console.log('Future self:', (fs.data.reply || '').slice(0, 80));
  console.log('Listing tasks');
  const list = await axios.get(base + '/tasks', { headers: auth });
  console.log('Total tasks now=', list.data.length);
}

run().catch(e => { console.error(e.response?.data || e.message); process.exit(1); });
