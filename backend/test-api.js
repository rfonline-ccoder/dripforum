const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api${path}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Тестирую API endpoints...\n');
  
  try {
    // Тест 1: Health check
    console.log('1️⃣ Тест /api/health');
    const healthResult = await makeRequest('/health');
    console.log(`   Статус: ${healthResult.status}`);
    console.log(`   Ответ: ${JSON.stringify(healthResult.data)}`);
    console.log('');
    
    // Тест 2: Список пользователей
    console.log('2️⃣ Тест /api/users');
    const usersResult = await makeRequest('/users');
    console.log(`   Статус: ${usersResult.status}`);
    if (usersResult.status === 200) {
      console.log(`   Пользователей: ${usersResult.data.length}`);
      if (usersResult.data.length > 0) {
        console.log(`   Первый: ${usersResult.data[0].username} (ID: ${usersResult.data[0].id})`);
      }
    } else {
      console.log(`   Ошибка: ${JSON.stringify(usersResult.data)}`);
    }
    console.log('');
    
    // Тест 3: Конкретный пользователь
    console.log('3️⃣ Тест /api/users/1');
    const userResult = await makeRequest('/users/1');
    console.log(`   Статус: ${userResult.status}`);
    if (userResult.status === 200) {
      console.log(`   Пользователь: ${userResult.data.username}`);
    } else {
      console.log(`   Ошибка: ${JSON.stringify(userResult.data)}`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testAPI();
