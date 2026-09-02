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

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/diensten/', label: 'Diensten' },
  { href: '/opdrachtgevers/', label: 'Opdrachtgevers' },
  { href: '/over-ons/', label: 'Over ons' },
  { href: '/contact/offerte-aanvragen/', label: 'Contact' },
] as const;
