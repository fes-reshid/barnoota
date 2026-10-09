/* ==========================================================================
   AOCAV — Events data
   --------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO CHANGE EVENTS.
   Every event card on the home page and the events page is built from here.

   HOW TO ADD AN EVENT
   -------------------
   Copy one block below, paste it at the top of the list and change the values.

     id        a short unique name, letters and dashes only
     title     the event name
     start     "YYYY-MM-DDTHH:MM"  (24-hour time)
     end       "YYYY-MM-DDTHH:MM"  (optional)
     when      use INSTEAD of start/end for programs that repeat
               e.g. when:"Every Saturday, 10:00am – 1:00pm (school terms)"
     status    "confirmed"  — date and venue locked in
               "save-date"  — shows a gold "Save the date" chip
               "recurring"  — an ongoing program, no single date
     theme     "" (green)  |  "grad" (deep red)  |  "culture" (gold)
     category  "graduation" | "community" | "culture" | "youth" | "women" | "support"
     featured  true on ONE event only — it becomes the big banner card
     flyer     path to a poster image (optional)
     video     a YouTube link (optional) — any of these work:
               https://www.youtube.com/watch?v=XXXXXXXXXXX
               https://youtu.be/XXXXXXXXXXX
               https://www.youtube.com/shorts/XXXXXXXXXXX
               The card shows a picture with a play button; YouTube is only
               contacted once somebody presses it.
     photos    a list of image addresses (optional), e.g.
               photos: ["images/grad-1.jpg", "images/grad-2.jpg"]
     rsvp      a mailto: or https: link (optional)

   Afaan Oromoo (all optional — anything left out shows in English):
     titleOm, descOm, whenOm, costOm, rsvpLabelOm
   ========================================================================== */

window.AOCAV_EVENTS = [

  {
    id: 'graduation-2026',
    title: 'Annual Graduation & Achievement Ceremony',
    start: '2026-12-06T13:00',
    end: '2026-12-06T17:30',
    status: 'save-date',
    theme: 'grad',
    category: 'graduation',
    featured: true,
    venue: 'Oromo Resource Centre',
    address: '664–678 Downing St, Mount Cottrell VIC 3024',
    cost: 'Free — families and friends warmly welcome',
    desc: 'Our proudest day of the year. The whole community gathers to cap and congratulate every Oromo-Australian who finished Year 12, TAFE, an apprenticeship, a university degree or an Afaan Oromoo school certificate. Expect speeches from our graduates, a traditional coffee ceremony, singing, dancing and a shared meal that runs until the last family leaves.',
    highlights: [
      'Capping and certificates for every graduate',
      'Elders’ blessing and the lighting of the Odaa candle',
      'Buna (coffee) ceremony and shared community dinner',
      'Cultural performance by our youth dance group',
      'Family photographs in the garden'
    ],
    rsvp: 'mailto:info@aocav.com?subject=Graduation%20Ceremony%202026&body=Hello%20AOCAV%2C%0A%0AI%20would%20like%20to%20register%20for%20the%20Annual%20Graduation%20%26%20Achievement%20Ceremony.%0A%0AGraduate%20name%3A%0AQualification%20completed%3A%0AInstitution%3A%0ANumber%20of%20guests%3A%0AContact%20phone%3A%0A%0AThank%20you.',
    rsvpLabel: 'Nominate a graduate'
  },

  {
    id: 'elders-voices-2026',
    title: 'Elders Voices',
    start: '2026-10-17T14:00',
    end: '2026-10-17T17:00',
    status: 'confirmed',
    theme: '',
    category: 'community',
    venue: 'Oromo Resource Centre',
    address: '664–678 Downing St, Mount Cottrell VIC 3024',
    cost: 'Free — elders, families and young people all welcome',
    desc: 'A welcoming gathering to celebrate Oromo culture, share stories and build connections across generations over a cup of coffee. Connecting generations, preserving culture, strengthening community.',
    flyer: 'images/elders-voices-flyer.jpg',
    funder: 'Funded by the City of Melbourne',
    rsvp: 'mailto:info@aocav.com?subject=Elders%20Voices%20—%2017%20October',
    rsvpLabel: 'Let us know you’re coming'
  },

  {
    id: 'cultural-night-2026',
    title: 'Oromo Cultural Night & Community Dinner',
    start: '2026-11-21T17:30',
    end: '2026-11-21T21:30',
    status: 'save-date',
    theme: 'culture',
    category: 'culture',
    venue: 'Venue to be announced — Melbourne’s west',
    address: 'Details confirmed closer to the date',
    cost: 'Tickets — family pricing available',
    desc: 'An evening of Oromo music, shaggoyyee and ragadaa dancing, traditional dress, poetry and a full community dinner. Our biggest social night of the year and a wonderful first introduction for friends and neighbours who are new to Oromo culture.',
    rsvp: 'mailto:info@aocav.com?subject=Oromo%20Cultural%20Night%20—%2021%20November',
    rsvpLabel: 'Join the guest list'
  },

  {
    id: 'family-fun-day-2027',
    title: 'Community Soccer & Family Fun Day',
    start: '2027-02-14T10:00',
    end: '2027-02-14T16:00',
    status: 'save-date',
    theme: '',
    category: 'youth',
    venue: 'Local sports reserve — Melbourne’s west',
    address: 'Details confirmed closer to the date',
    cost: 'Free',
    desc: 'Junior and senior soccer matches, a jumping castle for the little ones, a barbecue, and health and settlement information stalls. A relaxed day for families to meet one another before the school year gets busy.',
    rsvp: 'mailto:info@aocav.com?subject=Family%20Fun%20Day%202027',
    rsvpLabel: 'Register a team'
  },

  /* ----------------------- Ongoing weekly programs ----------------------- */

  {
    id: 'afaan-oromoo-school',
    title: 'Afaan Oromoo Saturday School',
    when: 'Every Saturday, 10:00am – 1:00pm (school terms)',
    status: 'recurring',
    theme: '',
    category: 'youth',
    venue: 'Oromo Resource Centre',
    address: 'Mount Cottrell VIC 3024',
    cost: 'Free for members',
    desc: 'Reading, writing and speaking Afaan Oromoo for children aged 5–16, taught by volunteer teachers from our own community. Students who complete the year receive a certificate at the December graduation ceremony.',
    rsvp: 'mailto:info@aocav.com?subject=Afaan%20Oromoo%20Saturday%20School%20enrolment',
    rsvpLabel: 'Enrol a child'
  },

  {
    id: 'youth-leadership',
    title: 'Youth Leadership & Mentoring Circle',
    when: 'Second Saturday of each month, 3:00pm – 5:30pm',
    status: 'recurring',
    theme: '',
    category: 'youth',
    venue: 'Oromo Resource Centre',
    address: 'Mount Cottrell VIC 3024',
    cost: 'Free',
    desc: 'Mentoring, study support, public speaking and leadership development for young people aged 14–25 — run with university students and professionals from our community who have walked the same road.',
    rsvp: 'mailto:info@aocav.com?subject=Youth%20Leadership%20Circle',
    rsvpLabel: 'Join the circle'
  },

  {
    id: 'womens-buna',
    title: 'Women’s Buna & Wellbeing Circle',
    when: 'Fortnightly Wednesdays, 11:00am – 1:00pm',
    status: 'recurring',
    theme: '',
    category: 'women',
    venue: 'Oromo Resource Centre',
    address: 'Mount Cottrell VIC 3024',
    cost: 'Free — childcare available',
    desc: 'A warm space for Oromo women to share a coffee ceremony, practise English, talk about health and family wellbeing, and support one another. Guest speakers visit regularly on health, housing and family services.',
    rsvp: 'mailto:info@aocav.com?subject=Women%E2%80%99s%20Buna%20Circle',
    rsvpLabel: 'Come along'
  },

  {
    id: 'settlement-desk',
    title: 'Settlement & Paperwork Help Desk',
    when: 'Every Thursday, 10:00am – 2:00pm',
    status: 'recurring',
    theme: '',
    category: 'support',
    venue: 'AOCAV Office, Footscray',
    address: 'Shop 20A, 136 Nicholson Street, Footscray VIC 3011',
    cost: 'Free',
    desc: 'Help in Afaan Oromoo with Centrelink and Medicare forms, housing applications, school enrolments, letters from government, and referrals to legal, health and employment services. Walk in or book ahead.',
    rsvp: 'mailto:info@aocav.com?subject=Settlement%20Help%20Desk%20booking',
    rsvpLabel: 'Book a time'
  },

  /* ------------------------------- Past ---------------------------------- */

  {
    id: 'irreecha-2026',
    title: 'Irreecha Birraa — Thanksgiving Festival',
    start: '2026-10-04T11:00',
    end: '2026-10-04T16:00',
    status: 'confirmed',
    theme: 'culture',
    category: 'culture',
    venue: 'By the water, Melbourne',
    address: 'Victoria',
    cost: 'Free',
    desc: 'Our community gathered by the water in white and colour, carrying fresh grass and flowers, to give thanks for the end of the rains and the arrival of spring — the oldest and best-loved celebration in the Oromo calendar.'
  },

  {
    id: 'health-morning-2026',
    title: 'Community Health & Wellbeing Morning',
    start: '2026-08-15T10:00',
    end: '2026-08-15T13:00',
    status: 'confirmed',
    theme: '',
    category: 'support',
    venue: 'AOCAV Office, Footscray',
    address: 'Shop 20A, 136 Nicholson Street, Footscray VIC 3011',
    cost: 'Free',
    desc: 'Free health checks, interpreters on hand, and plain-language information sessions on diabetes, heart health and mental wellbeing, delivered with local health services.'
  }

];
