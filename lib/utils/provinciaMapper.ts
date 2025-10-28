// /lib/utils/provinciaMapper.ts

/**
 * Mapping delle province italiane: nome completo → sigla
 * Include tutte le province italiane (107 totali)
 */
const PROVINCE_MAP: Record<string, string> = {
  // Veneto (focus principale per caso Miteni)
  vicenza: "VI",
  padova: "PD",
  venezia: "VE",
  verona: "VR",
  treviso: "TV",
  rovigo: "RO",
  belluno: "BL",
  
  // Lombardia
  milano: "MI",
  bergamo: "BG",
  brescia: "BS",
  como: "CO",
  cremona: "CR",
  lecco: "LC",
  lodi: "LO",
  mantova: "MN",
  pavia: "PV",
  sondrio: "SO",
  varese: "VA",
  "monza e brianza": "MB",
  "monza": "MB",
  
  // Piemonte
  torino: "TO",
  alessandria: "AL",
  asti: "AT",
  biella: "BI",
  cuneo: "CN",
  novara: "NO",
  verbania: "VB",
  vercelli: "VC",
  
  // Trentino-Alto Adige
  trento: "TN",
  bolzano: "BZ",
  
  // Friuli-Venezia Giulia
  trieste: "TS",
  gorizia: "GO",
  pordenone: "PN",
  udine: "UD",
  
  // Liguria
  genova: "GE",
  imperia: "IM",
  savona: "SV",
  "la spezia": "SP",
  spezia: "SP",
  
  // Emilia-Romagna
  bologna: "BO",
  ferrara: "FE",
  forli: "FC",
  "forlì": "FC",
  "forli cesena": "FC",
  "forlì-cesena": "FC",
  modena: "MO",
  parma: "PR",
  piacenza: "PC",
  ravenna: "RA",
  "reggio emilia": "RE",
  "reggio": "RE",
  rimini: "RN",
  
  // Toscana
  firenze: "FI",
  arezzo: "AR",
  grosseto: "GR",
  livorno: "LI",
  lucca: "LU",
  "massa carrara": "MS",
  "massa": "MS",
  pisa: "PI",
  pistoia: "PT",
  prato: "PO",
  siena: "SI",
  
  // Umbria
  perugia: "PG",
  terni: "TR",
  
  // Marche
  ancona: "AN",
  "ascoli piceno": "AP",
  "ascoli": "AP",
  fermo: "FM",
  macerata: "MC",
  "pesaro urbino": "PU",
  "pesaro": "PU",
  
  // Lazio
  roma: "RM",
  frosinone: "FR",
  latina: "LT",
  rieti: "RI",
  viterbo: "VT",
  
  // Abruzzo
  "l'aquila": "AQ",
  "aquila": "AQ",
  chieti: "CH",
  pescara: "PE",
  teramo: "TE",
  
  // Molise
  campobasso: "CB",
  isernia: "IS",
  
  // Campania
  napoli: "NA",
  avellino: "AV",
  benevento: "BN",
  caserta: "CE",
  salerno: "SA",
  
  // Puglia
  bari: "BA",
  "barletta andria trani": "BT",
  "barletta": "BT",
  brindisi: "BR",
  foggia: "FG",
  lecce: "LE",
  taranto: "TA",
  
  // Basilicata
  potenza: "PZ",
  matera: "MT",
  
  // Calabria
  catanzaro: "CZ",
  cosenza: "CS",
  crotone: "KR",
  "reggio calabria": "RC",
  "vibo valentia": "VV",
  "vibo": "VV",
  
  // Sicilia
  palermo: "PA",
  agrigento: "AG",
  caltanissetta: "CL",
  catania: "CT",
  enna: "EN",
  messina: "ME",
  ragusa: "RG",
  siracusa: "SR",
  trapani: "TP",
  
  // Sardegna
  cagliari: "CA",
  carbonia: "CI",
  "carbonia iglesias": "CI",
  nuoro: "NU",
  oristano: "OR",
  sassari: "SS",
  "olbia tempio": "OT",
  "olbia": "OT",
  "medio campidano": "VS",
  "ogliastra": "OG",
  
  // Sud Sardegna (nuova provincia)
  "sud sardegna": "SU",
};

/**
 * Tutte le sigle valide (per validazione)
 */
const SIGLE_VALIDE = new Set([
  "AG", "AL", "AN", "AO", "AP", "AQ", "AR", "AT", "AV", "BA", "BG", "BI", "BL", "BN", "BO", "BR", "BS", "BT",
  "BZ", "CA", "CB", "CE", "CH", "CI", "CL", "CN", "CO", "CR", "CS", "CT", "CZ", "EN", "FC", "FE", "FG", "FI",
  "FM", "FR", "GE", "GO", "GR", "IM", "IS", "KR", "LC", "LE", "LI", "LO", "LT", "LU", "MB", "MC", "ME", "MI",
  "MN", "MO", "MS", "MT", "NA", "NO", "NU", "OG", "OR", "OT", "PA", "PC", "PD", "PE", "PG", "PI", "PN", "PO",
  "PR", "PT", "PU", "PV", "PZ", "RA", "RC", "RE", "RG", "RI", "RM", "RN", "RO", "SA", "SI", "SO", "SP", "SR",
  "SS", "SU", "SV", "TA", "TE", "TN", "TO", "TP", "TR", "TS", "TV", "UD", "VA", "VB", "VC", "VE", "VI", "VR",
  "VS", "VT", "VV",
]);

/**
 * Mappa il nome di una provincia (o sigla) alla sua sigla ufficiale
 * @param input - Nome completo, parziale o sigla della provincia
 * @returns Sigla della provincia o null se non trovata
 */
export function mapProvinciaSigla(input: string): string | null {
  const normalized = input.trim().toLowerCase();
  
  // Se è già una sigla valida (2 lettere)
  if (normalized.length === 2) {
    const sigla = normalized.toUpperCase();
    if (SIGLE_VALIDE.has(sigla)) {
      return sigla;
    }
  }
  
  // Cerca match esatto nel mapping
  if (PROVINCE_MAP[normalized]) {
    return PROVINCE_MAP[normalized];
  }
  
  // Cerca match parziale (es. "vicen" → "vicenza" → "VI")
  for (const [nome, sigla] of Object.entries(PROVINCE_MAP)) {
    if (nome.startsWith(normalized) || normalized.startsWith(nome)) {
      return sigla;
    }
  }
  
  return null;
}

/**
 * Verifica se una sigla è valida
 */
export function isSiglaValida(sigla: string): boolean {
  return SIGLE_VALIDE.has(sigla.toUpperCase());
}

/**
 * Ottieni il nome completo da una sigla
 */
export function getSiglaToNome(): Record<string, string> {
  const reverse: Record<string, string> = {};
  for (const [nome, sigla] of Object.entries(PROVINCE_MAP)) {
    if (!reverse[sigla]) {
      // Prendi il primo nome associato (il più comune)
      reverse[sigla] = nome.charAt(0).toUpperCase() + nome.slice(1);
    }
  }
  return reverse;
}


