import axios from 'axios';

const baseURL = 'http://localhost:8094';

// Dados de teste
const testData = {
  origin_address: "Rua Mateus Leme, 2018 - Centro Cívico, Curitiba - PR, 80530-010",
  origin_lat: -25.4141,
  origin_lng: -49.2624,
  destination_address: "Rua Padre Agostinho, 2885 - Mercês, Curitiba - PR, 80710-000",
  destination_lat: -25.4141,
  destination_lng: -49.2924,
  distance: 5000, // 5km em metros
  duration: 900,  // 15 minutos em segundos
  points: [
    [-25.4141, -49.2624],
    [-25.4141, -49.2724],
    [-25.4141, -49.2824],
    [-25.4141, -49.2924]
  ]
};

async function testMatrixCache() {
  try {
    console.log('1. Salvando rota no cache...');
    console.log('Dados sendo enviados:', JSON.stringify(testData, null, 2));
    const saveResponse = await axios.post(`${baseURL}/api/matrix-cache`, testData);
    console.log('Resposta do servidor:', saveResponse.data);

    console.log('\n2. Buscando rota do cache...');
    const findResponse = await axios.get(`${baseURL}/api/matrix-cache`, {
      params: {
        origin_lat: testData.origin_lat,
        origin_lng: testData.origin_lng,
        destination_lat: testData.destination_lat,
        destination_lng: testData.destination_lng
      }
    });
    console.log('Rota encontrada:', findResponse.data);

  } catch (error) {
    console.error('Erro:', error.response?.data || error);
  }
}

// Executar testes
testMatrixCache();
