export const SITE = {
  name: 'Het Gevel Concept',
  legalName: 'Het Gevel Concept',
  tradeName: 'Het Gevel Concept',
  tagline: 'Vakmanschap zonder compromissen.',
  kvk: '42164957',
  address: {
    street: 'Dokter van Dalelaan 34',
    postalCode: '3851JB',
    city: 'Ermelo',
  },
  email: 'info@hetgevelconcept.nl',
  serviceArea: [
    'Ermelo',
    'Harderwijk',
    'Putten',
    'Nijkerk',
    'Zeewolde',
    'Barneveld',
    'Apeldoorn',
    'Zwolle',
    'Lelystad',
    'Almere',
  ],
} as const;

export const SERVICES = [
  {
    slug: 'voegwerk',
    title: 'Voegwerk',
    short: 'Oud voegwerk uitgehakt, nieuw voegwerk vakkundig aangebracht — in knipvoeg, platvolle voeg of schaduwvoeg.',
  },
  {
    slug: 'gevelreiniging',
    title: 'Gevelreiniging',
    short: 'Aanslag, mos en vervuiling professioneel verwijderd, zonder de steen of het voegwerk te beschadigen.',
  },
  {
    slug: 'impregneren',
    title: 'Impregneren',
    short: 'Waterafstotende, ademende bescherming tegen vocht en vorstschade — voor jaren extra levensduur.',
  },
  {
    slug: 'metselwerk-herstel',
    title: 'Metselwerk herstel',
    short: 'Beschadigde of verweerde stenen vakkundig vervangen, in het juiste verband en dezelfde steensoort.',
  },
  {
    slug: 'scheurherstel',
    title: 'Scheurherstel',
    short: 'Scheuren in het metselwerk duurzaam hersteld — van injectie tot stabiliserende muurankers.',
  },
  {
    slug: 'complete-gevelrenovatie',
    title: 'Complete gevelrenovatie',
    short:
      'Alles rondom uw gevel in één traject: voegwerk, metselwerk, reiniging en impregneren, tot en met nieuwe kozijnen en schilderwerk — van eerste inspectie tot opgeleverde gevel.',
  },
] as const;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/diensten/', label: 'Diensten' },
  { href: '/opdrachtgevers/', label: 'Opdrachtgevers' },
  { href: '/over-ons/', label: 'Over ons' },
  { href: '/contact/offerte-aanvragen/', label: 'Contact' },
] as const;
