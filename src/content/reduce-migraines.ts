// Ways to reduce migraines — paraphrased from the pages below (read 2026-11-20).
// General information, not medical advice. Mayo Clinic refused automated
// reading, so nothing here comes from it.

const NHS = { name: "NHS", page: "Migraine", url: "https://www.nhs.uk/conditions/migraine/" } as const;
const AMF_TRIGGERS = {
  name: "American Migraine Foundation",
  page: "Top 10 migraine triggers",
  url: "https://americanmigrainefoundation.org/resource-library/top-10-migraine-triggers/",
} as const;
const AMF_LIFESTYLE = {
  name: "American Migraine Foundation",
  page: "Lifestyle changes for migraine",
  url: "https://americanmigrainefoundation.org/resource-library/lifestyle-changes-for-migraine/",
} as const;

export const ALLOWED_SOURCES = [NHS.url, AMF_TRIGGERS.url, AMF_LIFESTYLE.url];

export type AdviceSource = { name: "NHS" | "American Migraine Foundation"; page: string; url: string };

export type AdviceTopic = {
  id: string;
  title: string;
  /** App trigger names this topic speaks to (see DEFAULT_TRIGGERS). */
  triggers: string[];
  tips: string[];
  sources: AdviceSource[];
};

export const ADVICE_TOPICS: AdviceTopic[] = [
  {
    id: "sleep",
    title: "Sleep",
    triggers: ["poor sleep"],
    tips: [
      "Go to bed and get up at about the same times every day, aiming for 7–8 hours.",
      "Put screens away for about two hours before bed.",
      "Keep the bedroom cool and dark.",
    ],
    sources: [NHS, AMF_TRIGGERS, AMF_LIFESTYLE],
  },
  {
    id: "stress",
    title: "Stress",
    triggers: ["stress"],
    tips: [
      "Relaxation techniques, meditation or biofeedback can help prevent attacks.",
      "Talking therapy (CBT) is another option for managing stress.",
      "Limit news and TV, for example to 30 minutes in the morning and evening.",
    ],
    sources: [NHS, AMF_TRIGGERS, AMF_LIFESTYLE],
  },
  {
    id: "meals",
    title: "Regular meals",
    triggers: ["skipped meal"],
    tips: [
      "Eat at regular times; skipping meals is a common trigger.",
      "Going without food can lower your pain threshold, so eat regularly through the day.",
    ],
    sources: [NHS, AMF_LIFESTYLE],
  },
  {
    id: "hydration",
    title: "Hydration",
    triggers: ["dehydration"],
    tips: [
      "Drink water steadily through the day; carrying a bottle makes it easier.",
      "Add an extra glass of water for each caffeinated drink.",
    ],
    sources: [NHS, AMF_TRIGGERS, AMF_LIFESTYLE],
  },
  {
    id: "caffeine",
    title: "Caffeine",
    triggers: ["caffeine"],
    tips: [
      "Too much caffeine is a common trigger, and so is suddenly having less than usual.",
      "Keep your daily amount steady rather than swinging up and down.",
      "Effects vary from person to person, so your diary is the best guide.",
    ],
    sources: [NHS, AMF_TRIGGERS, AMF_LIFESTYLE],
  },
  {
    id: "alcohol",
    title: "Alcohol",
    triggers: ["alcohol"],
    tips: [
      "Limit alcohol; it's a common trigger.",
      "Red wine isn't the only culprit — other drinks can be just as likely, so learn your own limit.",
    ],
    sources: [NHS, AMF_TRIGGERS],
  },
  {
    id: "weather",
    title: "Weather",
    triggers: ["weather change"],
    tips: [
      "Storms, heat and changes in air pressure can set off attacks.",
      "Heat and humidity can dehydrate you, so drink more on those days.",
      "When the weather is bad for you, do outdoor errands in the cooler part of the day.",
    ],
    sources: [AMF_TRIGGERS],
  },
  {
    id: "cycle",
    title: "Periods and hormones",
    triggers: ["period/cycle"],
    tips: [
      "Periods are a common trigger, and period-related migraines can be longer and more severe.",
      "Some hormonal contraception can steady hormone levels — worth discussing with a doctor.",
      "If migraines regularly come before or during your period, mention it to your GP.",
    ],
    sources: [NHS, AMF_TRIGGERS],
  },
  {
    id: "light",
    title: "Bright light and screens",
    triggers: ["bright light", "screen time"],
    tips: [
      "Wear sunglasses outdoors.",
      "Sit near a window rather than under flickering or harsh lights.",
      "During an attack, lying down in a dark room can help.",
    ],
    sources: [NHS, AMF_TRIGGERS],
  },
  {
    id: "smells",
    title: "Strong smells",
    triggers: ["strong smell"],
    tips: [
      "Perfume, strong cooking smells, cleaning chemicals and petrol fumes can be triggers.",
      "Avoid the ones you notice set you off.",
    ],
    sources: [AMF_TRIGGERS],
  },
  {
    id: "food",
    title: "Food",
    triggers: ["specific food"],
    tips: [
      "Often-named culprits include aged cheese, chocolate, cured meats, MSG and artificial sweeteners.",
      "Not everyone has food triggers — only avoid ones your diary points to.",
      "Craving sweets can be an early sign of an attack rather than its cause.",
    ],
    sources: [AMF_TRIGGERS, AMF_LIFESTYLE],
  },
  {
    id: "exercise",
    title: "Exercise",
    triggers: ["exercise"],
    tips: [
      "Regular exercise helps prevent migraines; not getting enough is a listed trigger.",
      "Aim for 30–50 minutes of moderate activity, 3–5 days a week, building up gently.",
    ],
    sources: [NHS, AMF_LIFESTYLE],
  },
  {
    id: "diary",
    title: "Keep a diary",
    triggers: [],
    tips: [
      "Logging each migraine helps you find your triggers — that's what this app is for.",
      "Bring it to appointments; your doctor can use it to plan treatment.",
    ],
    sources: [NHS, AMF_LIFESTYLE],
  },
  {
    id: "see-a-doctor",
    title: "When to see a doctor",
    triggers: [],
    tips: [
      "See a GP if migraines are severe, getting worse, lasting longer, happening more than once a week, or hard to control.",
      "Get an urgent appointment (NHS 111 in the UK) if an attack lasts more than 72 hours, an aura lasts over an hour, or you're pregnant or have just had a baby.",
      "Call emergency services for: a sudden, extremely painful headache; trouble speaking or remembering; loss of vision or blurred or double vision; drowsiness or confusion; a seizure; a very high temperature; weakness on one side of the body or face; or a recent head injury.",
    ],
    sources: [NHS],
  },
];

/**
 * Topics matching her logged triggers first, in her trigger-frequency order
 * (`myTriggers` is most frequent first); "When to see a doctor" always last.
 */
export function orderTopics(
  topics: AdviceTopic[],
  myTriggers: string[],
): { topic: AdviceTopic; mine: boolean }[] {
  const rank = (t: AdviceTopic) => {
    const hits = t.triggers.map((x) => myTriggers.indexOf(x)).filter((i) => i >= 0);
    return hits.length ? Math.min(...hits) : Infinity;
  };
  const last = topics.filter((t) => t.id === "see-a-doctor");
  const rest = topics.filter((t) => t.id !== "see-a-doctor");
  const mine = rest.filter((t) => rank(t) !== Infinity).sort((a, b) => rank(a) - rank(b));
  const others = rest.filter((t) => rank(t) === Infinity);
  return [
    ...mine.map((topic) => ({ topic, mine: true })),
    ...others.map((topic) => ({ topic, mine: false })),
    ...last.map((topic) => ({ topic, mine: false })),
  ];
}
