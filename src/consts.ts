export const SITE = {
  name: 'Het Gevel Concept',
  legalName: 'VP Euro Corporation B.V.',
  tradeName: 'Het Gevel Concept',
  tagline: 'Vakmanschap zonder compromissen.',
  kvk: '83601864',
  btw: '[BTW-nummer]',
  address: {
    street: 'Bijsselseweg 11-26',
    postalCode: '8256RE',
    city: 'Biddinghuizen',
  },
  phone: '+31 6 57485066',
  phoneHref: 'tel:+31657485066',
  email: 'info@hetgevelconcept.nl',
  serviceArea: [
    'Harderwijk',
    'Ermelo',
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
    short: 'Alle diensten gecombineerd in één traject, van eerste inspectie tot opgeleverde, beschermde gevel.',
  },
] as const;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/diensten/', label: 'Diensten' },
  { href: '/opdrachtgevers/', label: 'Opdrachtgevers' },
  { href: '/over-ons/', label: 'Over ons' },
  { href: '/contact/offerte-aanvragen/', label: 'Contact' },
] as const;
