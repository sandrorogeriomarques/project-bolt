const { AddressParser } = require('./addressParser');

const parser = new AddressParser();

const testAddresses = [
  {
    input: "R. Visconde de Nacar, 529",
    expected: { street: "rua Visconde de Nacar", number: "529" }
  },
  {
    input: "Endereco: R. Bpo, Dom Jose, 2058",
    expected: { street: "rua bispo Dom Jose", number: "2058" }
  },
  {
    input: "Al, Julla da Costa, 2415",
    expected: { street: "alameda Julla da Costa", number: "2415" }
  },
  {
    input: "Rua Ubaldino do Amaral,\n856",
    expected: { street: "rua Ubaldino do Amaral", number: "856" }
  },
  {
    input: "Av. Sete de Setembro, 123A",
    expected: { street: "avenida Sete de Setembro", number: "123A" }
  },
  {
    input: "R Marechal Deodoro 1500",
    expected: { street: "rua Marechal Deodoro", number: "1500" }
  },
  {
    input: "Pc Santos Andrade, 50",
    expected: { street: "praça Santos Andrade", number: "50" }
  },
  {
    input: "Rua XV de Novembro",
    expected: { street: "rua XV de Novembro", number: "" }
  },
  {
    input: "Rua das Flores",
    expected: { street: "rua das Flores", number: "" }
  },
  {
    input: "Avenida Brasil, 1234-A",
    expected: { street: "avenida Brasil", number: "1234-A" }
  },
  {
    input: "R. Prof. Pedro Viriato Parigot de Souza, 5300",
    expected: { street: "rua professor Pedro Viriato Parigot de Souza", number: "5300" }
  },
  {
    input: "Tv. Nestor de Castro, 263",
    expected: { street: "travessa Nestor de Castro", number: "263" }
  }
];

console.log("=== Testando endereços ===\n");

testAddresses.forEach((testCase, index) => {
  console.log(`\nTeste #${index + 1}:`);
  console.log("Input:", testCase.input);
  console.log("Esperado:", testCase.expected);
  
  const result = parser.parse(testCase.input);
  console.log("Resultado:", result);
  
  const success = 
    result.street === testCase.expected.street && 
    result.number === testCase.expected.number;
  
  console.log("Status:", success ? "✅ PASSOU" : "❌ FALHOU");
  
  if (!success) {
    console.log("Diferenças encontradas:");
    if (result.street !== testCase.expected.street) {
      console.log(`- Street: esperado "${testCase.expected.street}", recebido "${result.street}"`);
    }
    if (result.number !== testCase.expected.number) {
      console.log(`- Number: esperado "${testCase.expected.number}", recebido "${result.number}"`);
    }
  }
});

console.log("\n=== Testes concluídos ===");
