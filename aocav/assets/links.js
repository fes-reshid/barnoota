/* ==========================================================================
   AOCAV — useful links
   --------------------------------------------------------------------------
   EDIT THIS FILE, or use the Links tab in the admin page.

   Each link:
     id        a short unique name, letters and dashes only
     cat       which group it appears under (see CATS below)
     title     English name          titleOm   Afaan Oromoo name
     desc      English description   descOm    Afaan Oromoo description
     url       the web address (optional if there is only a phone number)
     phone     a phone number to call (optional)
     order     lower numbers appear first
     published false hides it from the website

   Please check a link still works before adding it. Government pages move.
   ========================================================================== */

window.AOCAV_LINK_CATEGORIES = [
  { id: 'urgent',     title: 'If you need help now',        titleOm: 'Yoo amma gargaarsa barbaaddan' },
  { id: 'government', title: 'Government services',          titleOm: 'Tajaajila mootummaa' },
  { id: 'settle',     title: 'Settling in & learning English', titleOm: 'Qubannaa fi Afaan Ingiliffaa barachuu' },
  { id: 'health',     title: 'Health & wellbeing',           titleOm: 'Fayyaa fi nagaa' },
  { id: 'work',       title: 'Work, money & housing',        titleOm: 'Hojii, maallaqa fi mana' },
  { id: 'family',     title: 'Children, school & young people', titleOm: 'Ijoollee, mana barumsaa fi dargaggoota' },
  { id: 'legal',      title: 'Legal help & your rights',     titleOm: 'Gargaarsa seeraa fi mirga keessan' },
  { id: 'oromo',      title: 'Oromo language, media & culture', titleOm: 'Afaan, miidiyaa fi aadaa Oromoo' }
];

window.AOCAV_LINKS = [

  /* ----------------------------- urgent ----------------------------- */
  {
    id: 'emergency', cat: 'urgent', order: 1,
    title: 'Police, fire, ambulance', titleOm: 'Poolisii, ibidda, ambulaansii',
    desc: 'Call in an emergency, any time. Ask for an interpreter if you need one — say the language you speak.',
    descOm: 'Yeroo balaa, yeroo kamiyyuu bilbilaa. Nama afaan hiiku gaafadhaa — afaan dubbattan himaa.',
    phone: '000'
  },
  {
    id: 'tis', cat: 'urgent', order: 2,
    title: 'TIS National — free interpreters', titleOm: 'TIS National — hiiktuu bilisaa',
    desc: 'Free telephone interpreting in Afaan Oromoo, 24 hours. Call them, or ask any government office, doctor or hospital to call an interpreter for you.',
    descOm: 'Bilbilaan Afaan Oromootiin hiikuu bilisaa, sa’aatii 24. Ofii keessan bilbilaa, yookaan waajjira mootummaa, doktora yookaan hospitaala hiiktuu akka waamaniif gaafadhaa.',
    url: 'https://www.tisnational.gov.au/', phone: '131 450'
  },
  {
    id: 'lifeline', cat: 'urgent', order: 3,
    title: 'Lifeline — crisis support', titleOm: 'Lifeline — gargaarsa rakkoo cimaa',
    desc: 'Someone to talk to, 24 hours a day, if you are struggling or thinking about suicide.',
    descOm: 'Yoo rakkattan yookaan of ajjeesuu yaaddan, nama isin dubbisu, guyyaa guutuu.',
    url: 'https://www.lifeline.org.au/', phone: '13 11 14'
  },
  {
    id: 'safesteps', cat: 'urgent', order: 4,
    title: 'Safe Steps — family violence', titleOm: 'Safe Steps — goolii maatii',
    desc: 'Victoria’s 24-hour family violence response line for women and children. Free and confidential.',
    descOm: 'Sarara deebii goolii maatii Viktooriyaa sa’aatii 24, dubartootaa fi ijoolleef. Bilisaa fi iccitiidhaan.',
    url: 'https://www.safesteps.org.au/', phone: '1800 015 188'
  },
  {
    id: 'respect', cat: 'urgent', order: 5,
    title: '1800RESPECT', titleOm: '1800RESPECT',
    desc: 'National counselling line for family violence and sexual assault, 24 hours, with interpreters.',
    descOm: 'Sarara gorsa biyyoolessaa goolii maatii fi gudeeddiif, sa’aatii 24, hiiktuu waliin.',
    url: 'https://www.1800respect.org.au/', phone: '1800 737 732'
  },
  {
    id: 'nurseoncall', cat: 'urgent', order: 6,
    title: 'NURSE-ON-CALL', titleOm: 'NURSE-ON-CALL',
    desc: 'Speak to a registered nurse in Victoria, 24 hours, when you are not sure how serious something is.',
    descOm: 'Yoo dhukkubni hammam cimaa akka ta’e hin beekne, Viktooriyaa keessatti narsii waliin dubbadhaa, sa’aatii 24.',
    url: 'https://www.betterhealth.vic.gov.au/nurseoncall', phone: '1300 60 60 24'
  },

  /* --------------------------- government --------------------------- */
  {
    id: 'mygov', cat: 'government', order: 1,
    title: 'myGov', titleOm: 'myGov',
    desc: 'One login for Centrelink, Medicare, the tax office and more. Most government business starts here.',
    descOm: 'Seensa tokkoon Centrelink, Medicare, waajjira gibiraa fi kan biroo. Hojiin mootummaa baay’een asii jalqaba.',
    url: 'https://my.gov.au/'
  },
  {
    id: 'services-australia', cat: 'government', order: 2,
    title: 'Services Australia — Centrelink & Medicare', titleOm: 'Services Australia — Centrelink fi Medicare',
    desc: 'Payments, Medicare cards, family assistance and concession cards. Their multilingual phone line is 131 202.',
    descOm: 'Kaffaltii, kaardii Medicare, gargaarsa maatii fi kaardii hir’isaa. Sararri afaan hedduu 131 202 dha.',
    url: 'https://www.servicesaustralia.gov.au/', phone: '131 202'
  },
  {
    id: 'home-affairs', cat: 'government', order: 3,
    title: 'Department of Home Affairs — visas & citizenship', titleOm: 'Ministeera Dhimma Keessaa — viizaa fi lammummaa',
    desc: 'Visa applications and conditions, family reunion, travel documents and becoming an Australian citizen.',
    descOm: 'Iyyannoo viizaa, walitti deebi’uu maatii, waraqaa imalaa fi lammii Awustiraaliyaa ta’uu.',
    url: 'https://immi.homeaffairs.gov.au/'
  },
  {
    id: 'vic-gov', cat: 'government', order: 4,
    title: 'Victorian Government services', titleOm: 'Tajaajila Mootummaa Viktooriyaa',
    desc: 'State services: schools, health, transport, housing and concessions in Victoria.',
    descOm: 'Tajaajila naannoo: mana barumsaa, fayyaa, geejjiba, mana fi hir’isa Viktooriyaa keessatti.',
    url: 'https://www.vic.gov.au/'
  },
  {
    id: 'vmc', cat: 'government', order: 5,
    title: 'Victorian Multicultural Commission', titleOm: 'Komishinii Aadaa Hedduu Viktooriyaa',
    desc: 'Grants, community programs and the state’s link to multicultural communities like ours.',
    descOm: 'Deeggarsa maallaqaa, sagantaa hawaasaa fi hidhata mootummaa naannoo hawaasa aadaa hedduu waliin.',
    url: 'https://www.multiculturalcommission.vic.gov.au/'
  },
  {
    id: 'vicroads', cat: 'government', order: 6,
    title: 'VicRoads — licences & registration', titleOm: 'VicRoads — hayyama konkolaachisuu fi galmee',
    desc: 'Learner permits, driving tests, overseas licence transfers and registering a car.',
    descOm: 'Hayyama baratootaa, qormaata konkolaachisuu, hayyama biyya alaa jijjiiruu fi konkolaataa galmeessuu.',
    url: 'https://www.vicroads.vic.gov.au/'
  },

  /* ----------------------------- settle ----------------------------- */
  {
    id: 'amep', cat: 'settle', order: 1,
    title: 'Free English classes (AMEP)', titleOm: 'Barnoota Afaan Ingiliffaa bilisaa (AMEP)',
    desc: 'The Adult Migrant English Program: free English lessons for eligible migrants, with free childcare for children under school age.',
    descOm: 'AMEP: barnoota Afaan Ingiliffaa bilisaa godaantota ulaagaa guutaniif, ijoollee umurii mana barumsaa hin geenyeef kunuunsa bilisaa waliin.',
    url: 'https://immi.homeaffairs.gov.au/settling-in-australia/amep/overview'
  },
  {
    id: 'ames', cat: 'settle', order: 2,
    title: 'AMES Australia', titleOm: 'AMES Australia',
    desc: 'One of Victoria’s main providers of English classes, settlement help and employment support for new arrivals.',
    descOm: 'Dhaabbata Viktooriyaa keessaa tokko kan barnoota Afaan Ingiliffaa, gargaarsa qubannaa fi hojii argachuu namoota haaraa dhufaniif kennu.',
    url: 'https://www.ames.net.au/'
  },
  {
    id: 'sets', cat: 'settle', order: 3,
    title: 'Settlement support (SETS)', titleOm: 'Deeggarsa qubannaa (SETS)',
    desc: 'The federal settlement program that funds casework, English conversation, homework clubs and employment readiness for new arrivals.',
    descOm: 'Sagantaa qubannaa federaalaa kan gargaarsa dhuunfaa, haasawa Afaan Ingiliffaa, kilabii hojii manaa fi qophii hojii deeggaru.',
    url: 'https://immi.homeaffairs.gov.au/settling-in-australia/sets-program'
  },

  /* ----------------------------- health ----------------------------- */
  {
    id: 'healthdirect', cat: 'health', order: 1,
    title: 'Healthdirect', titleOm: 'Healthdirect',
    desc: 'Trusted health advice and a service finder for doctors, pharmacies and hospitals near you.',
    descOm: 'Gorsa fayyaa amanamaa fi barbaacha tajaajilaa doktora, farmaasii fi hospitaala naannoo keessan.',
    url: 'https://www.healthdirect.gov.au/'
  },
  {
    id: 'betterhealth', cat: 'health', order: 2,
    title: 'Better Health Channel', titleOm: 'Better Health Channel',
    desc: 'Plain-language health information from the Victorian Government, including many pages translated into other languages.',
    descOm: 'Odeeffannoo fayyaa afaan salphaadhaan Mootummaa Viktooriyaa irraa, fuulota afaan biraatti hiikaman hedduu dabalatee.',
    url: 'https://www.betterhealth.vic.gov.au/'
  },
  {
    id: 'foundation-house', cat: 'health', order: 3,
    title: 'Foundation House', titleOm: 'Foundation House',
    desc: 'Free counselling and support for people of refugee background who have experienced torture or trauma. Offices in Brunswick, Sunshine and Dandenong.',
    descOm: 'Gorsaa fi deeggarsa bilisaa namoota baqattummaan dhufanii dararaa yookaan miidhaa sammuu argataniif. Waajjirri Brunswick, Sunshine fi Dandenong jira.',
    url: 'https://www.foundationhouse.org.au/'
  },

  /* ------------------------------ work ------------------------------ */
  {
    id: 'workforce', cat: 'work', order: 1,
    title: 'Workforce Australia — finding a job', titleOm: 'Workforce Australia — hojii barbaaduu',
    desc: 'Job listings and free help with résumés, applications and training.',
    descOm: 'Tarree hojii fi gargaarsa bilisaa CV, iyyannoo fi leenjiif.',
    url: 'https://www.workforceaustralia.gov.au/'
  },
  {
    id: 'fairwork', cat: 'work', order: 2,
    title: 'Fair Work Ombudsman — your rights at work', titleOm: 'Fair Work Ombudsman — mirga hojii keessan',
    desc: 'What your minimum pay and conditions must be, and what to do if an employer is not paying you properly. Free, and they use interpreters.',
    descOm: 'Kaffaltii fi haalli xiqqaan maal ta’uu akka qabu, akkasumas yoo hojjechiisaan sirriitti isin hin kaffalle maal gochuu akka qabdan. Bilisaa dha, hiiktuus ni fayyadamu.',
    url: 'https://www.fairwork.gov.au/'
  },
  {
    id: 'ato', cat: 'work', order: 3,
    title: 'Australian Taxation Office', titleOm: 'Waajjira Gibira Awustiraaliyaa',
    desc: 'Tax file numbers, tax returns and superannuation.',
    descOm: 'Lakkoofsa gibiraa, deebii gibiraa fi supeeranuweeshinii.',
    url: 'https://www.ato.gov.au/'
  },
  {
    id: 'housing-vic', cat: 'work', order: 4,
    title: 'Housing Victoria', titleOm: 'Mana Viktooriyaa',
    desc: 'Public and community housing applications, bond loans and help if you are at risk of becoming homeless.',
    descOm: 'Iyyannoo mana ummataa fi hawaasaa, liqii boondii fi gargaarsa yoo mana dhabuuf jirtan.',
    url: 'https://www.housing.vic.gov.au/'
  },

  /* ----------------------------- family ----------------------------- */
  {
    id: 'enrol-school', cat: 'family', order: 1,
    title: 'Enrolling your child in school', titleOm: 'Ijoollee keessan mana barumsaa galmeessuu',
    desc: 'How school works in Victoria, what year your child starts, and how to enrol.',
    descOm: 'Manni barumsaa Viktooriyaa keessatti akkamitti akka hojjetu, mucaan keessan kutaa kam akka jalqabu, fi akkamitti galmeessuu akka dandeessan.',
    url: 'https://www.vic.gov.au/school-enrolment'
  },
  {
    id: 'cmy', cat: 'family', order: 2,
    title: 'Centre for Multicultural Youth', titleOm: 'Wiirtuu Dargaggoota Aadaa Hedduu',
    desc: 'Programs, advocacy and support for young people aged about 12 to 25 from migrant and refugee backgrounds.',
    descOm: 'Sagantaa, falmii fi deeggarsa dargaggoota umurii 12 hanga 25 kan godaantotaa fi baqattootaa.',
    url: 'https://www.cmy.net.au/'
  },
  {
    id: 'kids-helpline', cat: 'family', order: 3,
    title: 'Kids Helpline', titleOm: 'Kids Helpline',
    desc: 'Free, confidential counselling for young people aged 5 to 25, any time of day or night.',
    descOm: 'Gorsa bilisaa fi iccitii dargaggoota umurii 5 hanga 25, yeroo kamiyyuu.',
    url: 'https://kidshelpline.com.au/', phone: '1800 55 1800'
  },

  /* ------------------------------ legal ----------------------------- */
  {
    id: 'vla', cat: 'legal', order: 1,
    title: 'Victoria Legal Aid', titleOm: 'Gargaarsa Seeraa Viktooriyaa',
    desc: 'Free legal information and advice on family law, fines, criminal matters, tenancy and more. Interpreters available.',
    descOm: 'Odeeffannoo fi gorsa seeraa bilisaa seera maatii, adabbii, dhimma yakkaa, kiraa manaa fi kan biroo irratti. Hiiktuun ni jira.',
    url: 'https://www.legalaid.vic.gov.au/', phone: '1300 792 387'
  },
  {
    id: 'ahrc', cat: 'legal', order: 2,
    title: 'Australian Human Rights Commission', titleOm: 'Komishinii Mirga Namoomaa Awustiraaliyaa',
    desc: 'Where to complain if you have been treated unfairly because of your race, religion, age or disability.',
    descOm: 'Yoo sanyii, amantii, umurii yookaan qaama miidhamummaa keessaniin wal-qixxummaan hin ilaalamne, eessatti komii dhiyeessuu akka dandeessan.',
    url: 'https://humanrights.gov.au/'
  },

  /* ------------------------------ oromo ----------------------------- */
  {
    id: 'sbs-oromo', cat: 'oromo', order: 1,
    title: 'SBS Afaan Oromoo', titleOm: 'SBS Afaan Oromoo',
    desc: 'Australia’s public broadcaster in Afaan Oromoo: news, the "Australia Explained" series about life and laws here, and lessons for learning English.',
    descOm: 'Raadiyoo ummataa Awustiraaliyaa Afaan Oromootiin: oduu, sagantaa "Australia Explained" waa’ee jireenyaa fi seera biyyattii, akkasumas barnoota Afaan Ingiliffaa.',
    url: 'https://www.sbs.com.au/language/oromo'
  },
  {
    id: 'osa', cat: 'oromo', order: 2,
    title: 'Oromo Studies Association', titleOm: 'Waldaa Qorannoo Oromoo',
    desc: 'A global association of scholars publishing the Journal of Oromo Studies and holding an annual conference on Oromo history, language and society.',
    descOm: 'Waldaa hayyootaa addunyaa kan Journal of Oromo Studies maxxansuu fi waggaatti waltajjii seenaa, afaanii fi hawaasa Oromoo irratti qopheessu.',
    url: 'https://oromostudies.org/'
  }

];
