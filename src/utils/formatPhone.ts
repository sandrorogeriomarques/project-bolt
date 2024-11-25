export function formatPhoneNumber(phone: string, countryCode: string): string {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Remove o código do país se já estiver presente no número
  const countryCodeClean = countryCode.replace(/\D/g, '');
  const phoneWithoutCountry = cleanPhone.startsWith(countryCodeClean)
    ? cleanPhone.slice(countryCodeClean.length)
    : cleanPhone;

  // Retorna o número formatado com o código do país
  return `${countryCodeClean}${phoneWithoutCountry}`;
}
