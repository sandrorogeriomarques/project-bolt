export class AddressParser {
  private readonly streetTypes = {
    r: 'rua',
    av: 'avenida',
    al: 'alameda',
    pc: 'praça',
    tv: 'travessa',
    rod: 'rodovia',
    est: 'estrada'
  };

  private readonly titleAbbreviations = {
    'prof': 'professor',
    'dr': 'doutor',
    'eng': 'engenheiro',
    'bpo': 'bispo',
    'pe': 'padre',
    'dom': 'dom'
  };

  private normalizeStreetType(street: string): string {
    // Normaliza abreviações de tipos de logradouro
    let normalized = street.toLowerCase();
    
    // Trata casos específicos como "Al." ou "R."
    normalized = normalized.replace(/^al\.|^alameda\s+/i, 'alameda ');
    normalized = normalized.replace(/^r\.|^rua\s+/i, 'rua ');
    normalized = normalized.replace(/^av\.|^avenida\s+/i, 'avenida ');
    
    return normalized;
  }

  private normalizeSpecialCharacters(text: string): string {
    // Remove acentos e caracteres especiais, mantendo apenas letras, números e espaços
    return text.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^\w\s,-]/g, '')
              .toLowerCase();
  }

  public parse(address: string): { street: string; number: string } {
    // Remove prefixo "Endereco:" e espaços extras
    address = address.replace(/^Endereco:\s*/i, '').trim();
    
    // Junta linhas quebradas
    address = address.replace(/\s*\n\s*/g, ' ');

    // Extrai o número do endereço usando várias estratégias
    let number = '';
    let street = address;

    // Estratégia 1: Número após a última vírgula
    const parts = address.split(',');
    const lastPart = parts[parts.length - 1].trim();
    if (/^\d+/.test(lastPart)) {
      number = lastPart.match(/^\d+/)[0];
      street = parts.slice(0, -1).join(',').trim();
    }

    // Estratégia 2: Número no final do endereço
    if (!number) {
      const numberMatch = address.match(/\s(\d+)\s*$/);
      if (numberMatch) {
        number = numberMatch[1];
        street = address.replace(numberMatch[0], '').trim();
      }
    }

    // Estratégia 3: Procurar por número após o tipo de logradouro
    if (!number) {
      const numberMatch = address.match(/(?:r\.|rua|av\.|avenida|al\.|alameda)\s+[^,]+?(\d+)/i);
      if (numberMatch) {
        number = numberMatch[1];
        street = address.replace(numberMatch[1], '').trim();
      }
    }

    // Normaliza o endereço
    street = this.normalizeStreetType(street);
    street = this.normalizeSpecialCharacters(street);

    // Normaliza títulos e abreviações
    for (const [abbr, full] of Object.entries(this.titleAbbreviations)) {
      const abbrRegex = new RegExp(`\\b${abbr}[.,]?\\b`, 'gi');
      street = street.replace(abbrRegex, full);
    }

    // Remove pontuações extras e espaços múltiplos
    street = street.replace(/[.,]+/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();

    return { street, number };
  }

  private isValidNumber(str: string): boolean {
    return /^\d+[A-Za-z]?(-\d+[A-Za-z]?)?$/.test(str.trim());
  }
}

export const addressParser = new AddressParser();

// Testar alguns endereços
const parser = new AddressParser();

console.log("=== Testando endereços ===\n");

const testCases = [
  "R. Visconde de Nacar, 529",
  "Endereco: R. Bpo, Dom Jose, 2058",
  "Al, Julla da Costa, 2415",
  "Rua Ubaldino do Amaral,\n856",
  "Av. Sete de Setembro, 123A",
  "R Marechal Deodoro 1500",
  "Pc Santos Andrade, 50",
  "Rua XV de Novembro",
  "R. Prof. Pedro Viriato Parigot de Souza, 5300",
  "Tv. Nestor de Castro, 263"
];

testCases.forEach((address, index) => {
  console.log(`\nTeste #${index + 1}:`);
  console.log("Input:", address);
  const result = parser.parse(address);
  console.log("Resultado:", result);
});

console.log("\n=== Testes concluídos ===");
