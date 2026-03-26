export interface CidadeBrasil {
  nome: string;
  estado: string;
  nomeEstado: string;
  codigoIbge: string;
  latitude: number;
  longitude: number;
}

/**
 * Base de cidades brasileiras com coordenadas reais.
 * Inclui todas as capitais + principais cidades por estado.
 * Formato de exibição: "Cidade - UF"
 */
export const CIDADES_BRASIL: CidadeBrasil[] = [
  // ACRE
  { nome: "Rio Branco", estado: "AC", nomeEstado: "Acre", codigoIbge: "1200401", latitude: -9.9747, longitude: -67.8100 },
  { nome: "Cruzeiro do Sul", estado: "AC", nomeEstado: "Acre", codigoIbge: "1200203", latitude: -7.6315, longitude: -72.6753 },

  // ALAGOAS
  { nome: "Maceió", estado: "AL", nomeEstado: "Alagoas", codigoIbge: "2704302", latitude: -9.6658, longitude: -35.7353 },
  { nome: "Arapiraca", estado: "AL", nomeEstado: "Alagoas", codigoIbge: "2700300", latitude: -9.7525, longitude: -36.6612 },
  { nome: "Palmeira dos Índios", estado: "AL", nomeEstado: "Alagoas", codigoIbge: "2706307", latitude: -9.4062, longitude: -36.6328 },

  // AMAPÁ
  { nome: "Macapá", estado: "AP", nomeEstado: "Amapá", codigoIbge: "1600303", latitude: 0.0349, longitude: -51.0694 },
  { nome: "Santana", estado: "AP", nomeEstado: "Amapá", codigoIbge: "1600600", latitude: -0.0583, longitude: -51.1728 },

  // AMAZONAS
  { nome: "Manaus", estado: "AM", nomeEstado: "Amazonas", codigoIbge: "1302603", latitude: -3.1190, longitude: -60.0217 },
  { nome: "Parintins", estado: "AM", nomeEstado: "Amazonas", codigoIbge: "1303403", latitude: -2.6284, longitude: -56.7353 },
  { nome: "Itacoatiara", estado: "AM", nomeEstado: "Amazonas", codigoIbge: "1301902", latitude: -3.1386, longitude: -58.4442 },

  // BAHIA
  { nome: "Salvador", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2927408", latitude: -12.9714, longitude: -38.5014 },
  { nome: "Feira de Santana", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2910800", latitude: -12.2669, longitude: -38.9666 },
  { nome: "Vitória da Conquista", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2933307", latitude: -14.8619, longitude: -40.8444 },
  { nome: "Camaçari", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2905701", latitude: -12.6996, longitude: -38.3263 },
  { nome: "Itabuna", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2914802", latitude: -14.7876, longitude: -39.2781 },
  { nome: "Juazeiro", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2918407", latitude: -9.4163, longitude: -40.5032 },
  { nome: "Ilhéus", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2913606", latitude: -14.7881, longitude: -39.0494 },
  { nome: "Lauro de Freitas", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2919207", latitude: -12.8978, longitude: -38.3271 },
  { nome: "Teixeira de Freitas", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2931350", latitude: -17.5353, longitude: -39.7436 },
  { nome: "Barreiras", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2903201", latitude: -12.1528, longitude: -44.9940 },
  { nome: "Porto Seguro", estado: "BA", nomeEstado: "Bahia", codigoIbge: "2925303", latitude: -16.4435, longitude: -39.0643 },

  // CEARÁ
  { nome: "Fortaleza", estado: "CE", nomeEstado: "Ceará", codigoIbge: "2304400", latitude: -3.7172, longitude: -38.5433 },
  { nome: "Caucaia", estado: "CE", nomeEstado: "Ceará", codigoIbge: "2303709", latitude: -3.7361, longitude: -38.6531 },
  { nome: "Juazeiro do Norte", estado: "CE", nomeEstado: "Ceará", codigoIbge: "2307304", latitude: -7.2131, longitude: -39.3150 },
  { nome: "Maracanaú", estado: "CE", nomeEstado: "Ceará", codigoIbge: "2307650", latitude: -3.8768, longitude: -38.6255 },
  { nome: "Sobral", estado: "CE", nomeEstado: "Ceará", codigoIbge: "2312908", latitude: -3.6861, longitude: -40.3482 },
  { nome: "Crato", estado: "CE", nomeEstado: "Ceará", codigoIbge: "2304202", latitude: -7.2342, longitude: -39.4088 },

  // DISTRITO FEDERAL
  { nome: "Brasília", estado: "DF", nomeEstado: "Distrito Federal", codigoIbge: "5300108", latitude: -15.7975, longitude: -47.8919 },

  // ESPÍRITO SANTO
  { nome: "Vitória", estado: "ES", nomeEstado: "Espírito Santo", codigoIbge: "3205309", latitude: -20.3155, longitude: -40.3128 },
  { nome: "Vila Velha", estado: "ES", nomeEstado: "Espírito Santo", codigoIbge: "3205200", latitude: -20.3297, longitude: -40.2925 },
  { nome: "Serra", estado: "ES", nomeEstado: "Espírito Santo", codigoIbge: "3205002", latitude: -20.1209, longitude: -40.3075 },
  { nome: "Cariacica", estado: "ES", nomeEstado: "Espírito Santo", codigoIbge: "3201308", latitude: -20.2635, longitude: -40.4165 },
  { nome: "Cachoeiro de Itapemirim", estado: "ES", nomeEstado: "Espírito Santo", codigoIbge: "3201209", latitude: -20.8489, longitude: -41.1128 },
  { nome: "Linhares", estado: "ES", nomeEstado: "Espírito Santo", codigoIbge: "3203205", latitude: -19.3911, longitude: -40.0722 },

  // GOIÁS
  { nome: "Goiânia", estado: "GO", nomeEstado: "Goiás", codigoIbge: "5208707", latitude: -16.6869, longitude: -49.2648 },
  { nome: "Aparecida de Goiânia", estado: "GO", nomeEstado: "Goiás", codigoIbge: "5201405", latitude: -16.8198, longitude: -49.2469 },
  { nome: "Anápolis", estado: "GO", nomeEstado: "Goiás", codigoIbge: "5201108", latitude: -16.3281, longitude: -48.9530 },
  { nome: "Rio Verde", estado: "GO", nomeEstado: "Goiás", codigoIbge: "5218805", latitude: -17.7928, longitude: -50.9292 },
  { nome: "Luziânia", estado: "GO", nomeEstado: "Goiás", codigoIbge: "5212501", latitude: -16.2532, longitude: -47.9502 },
  { nome: "Águas Lindas de Goiás", estado: "GO", nomeEstado: "Goiás", codigoIbge: "5200258", latitude: -15.7672, longitude: -48.2815 },
  { nome: "Valparaíso de Goiás", estado: "GO", nomeEstado: "Goiás", codigoIbge: "5221858", latitude: -16.0681, longitude: -47.9753 },

  // MARANHÃO
  { nome: "São Luís", estado: "MA", nomeEstado: "Maranhão", codigoIbge: "2111300", latitude: -2.5297, longitude: -44.2825 },
  { nome: "Imperatriz", estado: "MA", nomeEstado: "Maranhão", codigoIbge: "2105302", latitude: -5.5189, longitude: -47.4916 },
  { nome: "São José de Ribamar", estado: "MA", nomeEstado: "Maranhão", codigoIbge: "2111201", latitude: -2.5491, longitude: -44.0592 },
  { nome: "Timon", estado: "MA", nomeEstado: "Maranhão", codigoIbge: "2112209", latitude: -5.0940, longitude: -42.8360 },
  { nome: "Caxias", estado: "MA", nomeEstado: "Maranhão", codigoIbge: "2103000", latitude: -4.8581, longitude: -43.3560 },
  { nome: "Codó", estado: "MA", nomeEstado: "Maranhão", codigoIbge: "2103307", latitude: -4.4553, longitude: -43.8856 },
  { nome: "Bacabal", estado: "MA", nomeEstado: "Maranhão", codigoIbge: "2101202", latitude: -4.2247, longitude: -44.7831 },

  // MATO GROSSO
  { nome: "Cuiabá", estado: "MT", nomeEstado: "Mato Grosso", codigoIbge: "5103403", latitude: -15.6014, longitude: -56.0979 },
  { nome: "Várzea Grande", estado: "MT", nomeEstado: "Mato Grosso", codigoIbge: "5108402", latitude: -15.6469, longitude: -56.1322 },
  { nome: "Rondonópolis", estado: "MT", nomeEstado: "Mato Grosso", codigoIbge: "5107602", latitude: -16.4673, longitude: -54.6372 },
  { nome: "Sinop", estado: "MT", nomeEstado: "Mato Grosso", codigoIbge: "5107909", latitude: -11.8642, longitude: -55.5066 },
  { nome: "Tangará da Serra", estado: "MT", nomeEstado: "Mato Grosso", codigoIbge: "5107958", latitude: -14.6229, longitude: -57.4988 },
  { nome: "Cáceres", estado: "MT", nomeEstado: "Mato Grosso", codigoIbge: "5102504", latitude: -16.0706, longitude: -57.6791 },
  { nome: "Sorriso", estado: "MT", nomeEstado: "Mato Grosso", codigoIbge: "5107925", latitude: -12.5425, longitude: -55.7112 },

  // MATO GROSSO DO SUL
  { nome: "Campo Grande", estado: "MS", nomeEstado: "Mato Grosso do Sul", codigoIbge: "5002704", latitude: -20.4697, longitude: -54.6201 },
  { nome: "Dourados", estado: "MS", nomeEstado: "Mato Grosso do Sul", codigoIbge: "5003702", latitude: -22.2211, longitude: -54.8056 },
  { nome: "Três Lagoas", estado: "MS", nomeEstado: "Mato Grosso do Sul", codigoIbge: "5008305", latitude: -20.7849, longitude: -51.7008 },
  { nome: "Corumbá", estado: "MS", nomeEstado: "Mato Grosso do Sul", codigoIbge: "5003207", latitude: -19.0089, longitude: -57.6514 },
  { nome: "Ponta Porã", estado: "MS", nomeEstado: "Mato Grosso do Sul", codigoIbge: "5006606", latitude: -22.5357, longitude: -55.7256 },

  // MINAS GERAIS
  { nome: "Belo Horizonte", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3106200", latitude: -19.9167, longitude: -43.9345 },
  { nome: "Uberlândia", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3170206", latitude: -18.9186, longitude: -48.2772 },
  { nome: "Contagem", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3118601", latitude: -19.9320, longitude: -44.0539 },
  { nome: "Juiz de Fora", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3136702", latitude: -21.7642, longitude: -43.3503 },
  { nome: "Betim", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3106705", latitude: -19.9677, longitude: -44.1983 },
  { nome: "Montes Claros", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3143302", latitude: -16.7350, longitude: -43.8615 },
  { nome: "Ribeirão das Neves", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3154606", latitude: -19.7667, longitude: -44.0868 },
  { nome: "Uberaba", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3170107", latitude: -19.7473, longitude: -47.9318 },
  { nome: "Governador Valadares", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3127701", latitude: -18.8510, longitude: -41.9495 },
  { nome: "Ipatinga", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3131307", latitude: -19.4684, longitude: -42.5368 },
  { nome: "Sete Lagoas", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3167202", latitude: -19.4611, longitude: -44.2467 },
  { nome: "Divinópolis", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3122306", latitude: -20.1389, longitude: -44.8842 },
  { nome: "Santa Luzia", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3157807", latitude: -19.7697, longitude: -43.8515 },
  { nome: "Poços de Caldas", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3151800", latitude: -21.7878, longitude: -46.5613 },
  { nome: "Teófilo Otoni", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3168606", latitude: -17.8575, longitude: -41.5050 },
  { nome: "Patos de Minas", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3148004", latitude: -18.5789, longitude: -46.5181 },
  { nome: "Pouso Alegre", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3152501", latitude: -22.2300, longitude: -45.9364 },
  { nome: "Varginha", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3170701", latitude: -21.5514, longitude: -45.4303 },
  { nome: "Barbacena", estado: "MG", nomeEstado: "Minas Gerais", codigoIbge: "3105608", latitude: -21.2256, longitude: -43.7742 },

  // PARÁ
  { nome: "Belém", estado: "PA", nomeEstado: "Pará", codigoIbge: "1501402", latitude: -1.4558, longitude: -48.5024 },
  { nome: "Ananindeua", estado: "PA", nomeEstado: "Pará", codigoIbge: "1500800", latitude: -1.3659, longitude: -48.3886 },
  { nome: "Santarém", estado: "PA", nomeEstado: "Pará", codigoIbge: "1506807", latitude: -2.4426, longitude: -54.7081 },
  { nome: "Marabá", estado: "PA", nomeEstado: "Pará", codigoIbge: "1504208", latitude: -5.3686, longitude: -49.1178 },
  { nome: "Parauapebas", estado: "PA", nomeEstado: "Pará", codigoIbge: "1505536", latitude: -6.0678, longitude: -49.9018 },
  { nome: "Castanhal", estado: "PA", nomeEstado: "Pará", codigoIbge: "1502400", latitude: -1.2930, longitude: -47.9262 },

  // PARAÍBA
  { nome: "João Pessoa", estado: "PB", nomeEstado: "Paraíba", codigoIbge: "2507507", latitude: -7.1195, longitude: -34.8450 },
  { nome: "Campina Grande", estado: "PB", nomeEstado: "Paraíba", codigoIbge: "2504009", latitude: -7.2290, longitude: -35.8813 },
  { nome: "Santa Rita", estado: "PB", nomeEstado: "Paraíba", codigoIbge: "2513703", latitude: -7.1139, longitude: -34.9783 },
  { nome: "Patos", estado: "PB", nomeEstado: "Paraíba", codigoIbge: "2510808", latitude: -7.0176, longitude: -37.2804 },

  // PARANÁ
  { nome: "Curitiba", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4106902", latitude: -25.4284, longitude: -49.2733 },
  { nome: "Londrina", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4113700", latitude: -23.3045, longitude: -51.1696 },
  { nome: "Maringá", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4115200", latitude: -23.4273, longitude: -51.9375 },
  { nome: "Ponta Grossa", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4119905", latitude: -25.0994, longitude: -50.1583 },
  { nome: "Cascavel", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4104808", latitude: -24.9578, longitude: -53.4596 },
  { nome: "São José dos Pinhais", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4125506", latitude: -25.5369, longitude: -49.2084 },
  { nome: "Foz do Iguaçu", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4108304", latitude: -25.5163, longitude: -54.5854 },
  { nome: "Colombo", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4105805", latitude: -25.2917, longitude: -49.2234 },
  { nome: "Guarapuava", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4109401", latitude: -25.3907, longitude: -51.4628 },
  { nome: "Paranaguá", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4118204", latitude: -25.5205, longitude: -48.5095 },
  { nome: "Toledo", estado: "PR", nomeEstado: "Paraná", codigoIbge: "4127700", latitude: -24.7247, longitude: -53.7431 },

  // PERNAMBUCO
  { nome: "Recife", estado: "PE", nomeEstado: "Pernambuco", codigoIbge: "2611606", latitude: -8.0476, longitude: -34.8770 },
  { nome: "Jaboatão dos Guararapes", estado: "PE", nomeEstado: "Pernambuco", codigoIbge: "2607901", latitude: -8.1801, longitude: -35.0154 },
  { nome: "Olinda", estado: "PE", nomeEstado: "Pernambuco", codigoIbge: "2609600", latitude: -8.0089, longitude: -34.8553 },
  { nome: "Caruaru", estado: "PE", nomeEstado: "Pernambuco", codigoIbge: "2604106", latitude: -8.2823, longitude: -35.9761 },
  { nome: "Petrolina", estado: "PE", nomeEstado: "Pernambuco", codigoIbge: "2611101", latitude: -9.3891, longitude: -40.5027 },
  { nome: "Paulista", estado: "PE", nomeEstado: "Pernambuco", codigoIbge: "2610707", latitude: -7.9394, longitude: -34.8728 },
  { nome: "Garanhuns", estado: "PE", nomeEstado: "Pernambuco", codigoIbge: "2606002", latitude: -8.8906, longitude: -36.4928 },

  // PIAUÍ
  { nome: "Teresina", estado: "PI", nomeEstado: "Piauí", codigoIbge: "2211001", latitude: -5.0892, longitude: -42.8019 },
  { nome: "Parnaíba", estado: "PI", nomeEstado: "Piauí", codigoIbge: "2207702", latitude: -2.9054, longitude: -41.7761 },
  { nome: "Picos", estado: "PI", nomeEstado: "Piauí", codigoIbge: "2208007", latitude: -7.0769, longitude: -41.4671 },
  { nome: "Floriano", estado: "PI", nomeEstado: "Piauí", codigoIbge: "2203909", latitude: -6.7672, longitude: -43.0228 },

  // RIO DE JANEIRO
  { nome: "Rio de Janeiro", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3304557", latitude: -22.9068, longitude: -43.1729 },
  { nome: "São Gonçalo", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3304904", latitude: -22.8269, longitude: -43.0634 },
  { nome: "Duque de Caxias", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3301702", latitude: -22.7856, longitude: -43.3117 },
  { nome: "Nova Iguaçu", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3303500", latitude: -22.7592, longitude: -43.4510 },
  { nome: "Niterói", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3303302", latitude: -22.8833, longitude: -43.1036 },
  { nome: "Belford Roxo", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3300456", latitude: -22.7643, longitude: -43.3995 },
  { nome: "Campos dos Goytacazes", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3301009", latitude: -21.7545, longitude: -41.3244 },
  { nome: "Petrópolis", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3303906", latitude: -22.5112, longitude: -43.1779 },
  { nome: "Volta Redonda", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3306305", latitude: -22.5232, longitude: -44.1042 },
  { nome: "Macaé", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3302403", latitude: -22.3768, longitude: -41.7869 },
  { nome: "Cabo Frio", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3300704", latitude: -22.8789, longitude: -42.0189 },
  { nome: "Angra dos Reis", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3300100", latitude: -23.0067, longitude: -44.3181 },
  { nome: "Teresópolis", estado: "RJ", nomeEstado: "Rio de Janeiro", codigoIbge: "3305802", latitude: -22.4126, longitude: -42.9664 },

  // RIO GRANDE DO NORTE
  { nome: "Natal", estado: "RN", nomeEstado: "Rio Grande do Norte", codigoIbge: "2408102", latitude: -5.7945, longitude: -35.2110 },
  { nome: "Mossoró", estado: "RN", nomeEstado: "Rio Grande do Norte", codigoIbge: "2408003", latitude: -5.1878, longitude: -37.3441 },
  { nome: "Parnamirim", estado: "RN", nomeEstado: "Rio Grande do Norte", codigoIbge: "2403251", latitude: -5.9156, longitude: -35.2627 },
  { nome: "Caicó", estado: "RN", nomeEstado: "Rio Grande do Norte", codigoIbge: "2402006", latitude: -6.4584, longitude: -37.0974 },

  // RIO GRANDE DO SUL
  { nome: "Porto Alegre", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4314902", latitude: -30.0346, longitude: -51.2177 },
  { nome: "Caxias do Sul", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4305108", latitude: -29.1681, longitude: -51.1794 },
  { nome: "Pelotas", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4314407", latitude: -31.7649, longitude: -52.3371 },
  { nome: "Canoas", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4304606", latitude: -29.9178, longitude: -51.1740 },
  { nome: "Santa Maria", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4316907", latitude: -29.6842, longitude: -53.8069 },
  { nome: "Gravataí", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4309209", latitude: -29.9447, longitude: -50.9920 },
  { nome: "Viamão", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4323002", latitude: -30.0810, longitude: -51.0234 },
  { nome: "Novo Hamburgo", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4313409", latitude: -29.6879, longitude: -51.1306 },
  { nome: "São Leopoldo", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4318705", latitude: -29.7604, longitude: -51.1472 },
  { nome: "Rio Grande", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4315602", latitude: -32.0350, longitude: -52.0986 },
  { nome: "Passo Fundo", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4314100", latitude: -28.2624, longitude: -52.4068 },
  { nome: "Bagé", estado: "RS", nomeEstado: "Rio Grande do Sul", codigoIbge: "4301602", latitude: -31.3314, longitude: -54.1069 },

  // RONDÔNIA
  { nome: "Porto Velho", estado: "RO", nomeEstado: "Rondônia", codigoIbge: "1100205", latitude: -8.7612, longitude: -63.9004 },
  { nome: "Ji-Paraná", estado: "RO", nomeEstado: "Rondônia", codigoIbge: "1100122", latitude: -10.8853, longitude: -61.9514 },
  { nome: "Vilhena", estado: "RO", nomeEstado: "Rondônia", codigoIbge: "1100304", latitude: -12.7406, longitude: -60.1489 },
  { nome: "Cacoal", estado: "RO", nomeEstado: "Rondônia", codigoIbge: "1100049", latitude: -11.4386, longitude: -61.4472 },

  // RORAIMA
  { nome: "Boa Vista", estado: "RR", nomeEstado: "Roraima", codigoIbge: "1400100", latitude: 2.8195, longitude: -60.6714 },

  // SANTA CATARINA
  { nome: "Florianópolis", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4205407", latitude: -27.5954, longitude: -48.5480 },
  { nome: "Joinville", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4209102", latitude: -26.3045, longitude: -48.8487 },
  { nome: "Blumenau", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4202404", latitude: -26.9194, longitude: -49.0661 },
  { nome: "São José", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4216602", latitude: -27.6136, longitude: -48.6366 },
  { nome: "Chapecó", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4204202", latitude: -27.1007, longitude: -52.6152 },
  { nome: "Criciúma", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4204608", latitude: -28.6775, longitude: -49.3697 },
  { nome: "Itajaí", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4208203", latitude: -26.9101, longitude: -48.6616 },
  { nome: "Jaraguá do Sul", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4208906", latitude: -26.4858, longitude: -49.0714 },
  { nome: "Lages", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4209300", latitude: -27.8161, longitude: -50.3261 },
  { nome: "Balneário Camboriú", estado: "SC", nomeEstado: "Santa Catarina", codigoIbge: "4202008", latitude: -26.9911, longitude: -48.6351 },

  // SÃO PAULO
  { nome: "São Paulo", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3550308", latitude: -23.5505, longitude: -46.6333 },
  { nome: "Guarulhos", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3518800", latitude: -23.4538, longitude: -46.5333 },
  { nome: "Campinas", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3509502", latitude: -22.9099, longitude: -47.0626 },
  { nome: "São Bernardo do Campo", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3548708", latitude: -23.6914, longitude: -46.5646 },
  { nome: "Santo André", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3547809", latitude: -23.6737, longitude: -46.5432 },
  { nome: "São José dos Campos", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3549904", latitude: -23.1896, longitude: -45.8841 },
  { nome: "Osasco", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3534401", latitude: -23.5325, longitude: -46.7917 },
  { nome: "Ribeirão Preto", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3543402", latitude: -21.1704, longitude: -47.8103 },
  { nome: "Sorocaba", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3552205", latitude: -23.5015, longitude: -47.4526 },
  { nome: "Santos", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3548500", latitude: -23.9608, longitude: -46.3336 },
  { nome: "Mauá", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3529401", latitude: -23.6677, longitude: -46.4613 },
  { nome: "São José do Rio Preto", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3549805", latitude: -20.8113, longitude: -49.3758 },
  { nome: "Mogi das Cruzes", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3530508", latitude: -23.5229, longitude: -46.1853 },
  { nome: "Piracicaba", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3538709", latitude: -22.7338, longitude: -47.6476 },
  { nome: "Jundiaí", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3525904", latitude: -23.1857, longitude: -46.8978 },
  { nome: "Bauru", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3506003", latitude: -22.3246, longitude: -49.0871 },
  { nome: "São Vicente", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3551009", latitude: -23.9574, longitude: -46.3922 },
  { nome: "Praia Grande", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3541000", latitude: -24.0058, longitude: -46.4028 },
  { nome: "Carapicuíba", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3510609", latitude: -23.5233, longitude: -46.8356 },
  { nome: "Guarujá", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3518701", latitude: -23.9933, longitude: -46.2564 },
  { nome: "Taubaté", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3554102", latitude: -23.0204, longitude: -45.5558 },
  { nome: "Limeira", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3526902", latitude: -22.5642, longitude: -47.4013 },
  { nome: "Suzano", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3552502", latitude: -23.5425, longitude: -46.3108 },
  { nome: "Franca", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3516200", latitude: -20.5390, longitude: -47.4008 },
  { nome: "Presidente Prudente", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3541406", latitude: -22.1207, longitude: -51.3882 },
  { nome: "Marília", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3529005", latitude: -22.2140, longitude: -49.9461 },
  { nome: "Araraquara", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3503208", latitude: -21.7845, longitude: -48.1754 },
  { nome: "Araçatuba", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3502804", latitude: -21.2089, longitude: -50.4328 },
  { nome: "Itapetininga", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3522307", latitude: -23.5917, longitude: -48.0531 },
  { nome: "Registro", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3542602", latitude: -24.4872, longitude: -47.8442 },
  { nome: "Assis", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3504008", latitude: -22.6617, longitude: -50.4121 },
  { nome: "Ourinhos", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3534708", latitude: -22.9789, longitude: -49.8708 },
  { nome: "Botucatu", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3507506", latitude: -22.8861, longitude: -48.4450 },
  { nome: "Americana", estado: "SP", nomeEstado: "São Paulo", codigoIbge: "3501608", latitude: -22.7392, longitude: -47.3314 },

  // SERGIPE
  { nome: "Aracaju", estado: "SE", nomeEstado: "Sergipe", codigoIbge: "2800308", latitude: -10.9111, longitude: -37.0717 },
  { nome: "Nossa Senhora do Socorro", estado: "SE", nomeEstado: "Sergipe", codigoIbge: "2804805", latitude: -10.8553, longitude: -37.1261 },
  { nome: "Lagarto", estado: "SE", nomeEstado: "Sergipe", codigoIbge: "2803500", latitude: -10.9171, longitude: -37.6533 },
  { nome: "Itabaiana", estado: "SE", nomeEstado: "Sergipe", codigoIbge: "2802908", latitude: -10.6850, longitude: -37.4253 },

  // TOCANTINS
  { nome: "Palmas", estado: "TO", nomeEstado: "Tocantins", codigoIbge: "1721000", latitude: -10.1689, longitude: -48.3317 },
  { nome: "Araguaína", estado: "TO", nomeEstado: "Tocantins", codigoIbge: "1702109", latitude: -7.1911, longitude: -48.2072 },
  { nome: "Gurupi", estado: "TO", nomeEstado: "Tocantins", codigoIbge: "1709500", latitude: -11.7272, longitude: -49.0686 },
  { nome: "Porto Nacional", estado: "TO", nomeEstado: "Tocantins", codigoIbge: "1718204", latitude: -10.7081, longitude: -48.4172 },
];

/**
 * Formata nome de exibição: "Cidade - UF"
 */
export const formatCityDisplay = (cidade: CidadeBrasil): string =>
  `${cidade.nome} - ${cidade.estado}`;

/**
 * Busca cidades por texto (nome ou estado)
 */
export const searchCidades = (query: string, limit = 10): CidadeBrasil[] => {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return CIDADES_BRASIL
    .filter((c) => {
      const nome = c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const estado = c.estado.toLowerCase();
      const nomeEstado = c.nomeEstado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const display = `${nome} - ${estado}`;
      return nome.includes(q) || estado.includes(q) || nomeEstado.includes(q) || display.includes(q);
    })
    .slice(0, limit);
};

/**
 * Encontra cidade por display string "Cidade - UF"
 */
export const findCityByDisplay = (display: string): CidadeBrasil | undefined => {
  const [nome, estado] = display.split(" - ").map(s => s.trim());
  if (!nome || !estado) return undefined;
  return CIDADES_BRASIL.find(
    c => c.nome.toLowerCase() === nome.toLowerCase() && c.estado.toLowerCase() === estado.toLowerCase()
  );
};

/**
 * Encontra cidade pelo nome (retorna a primeira match)
 */
export const findCityByName = (name: string): CidadeBrasil | undefined => {
  const q = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Try exact match first
  const exact = CIDADES_BRASIL.find(c => 
    c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === q
  );
  if (exact) return exact;
  // Try partial (city part of legacy format "Cidade, UF - Terminal")
  const cityPart = name.split(",")[0].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CIDADES_BRASIL.find(c => 
    c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cityPart
  );
};
