import {
  DEFAULT_EXPENSE_CATEGORY,
  DEFAULT_INCOME_CATEGORY,
  type TransactionType,
} from "./types";

// Keyword dictionaries are matched case-insensitively against the transaction
// description. Order matters within a list — first match wins.
const INCOME_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Зарплата",
    keywords: ["зарплат", "аванс", "оклад", "salary"],
  },
  {
    category: "Возврат / кэшбэк",
    keywords: ["кэшбэк", "кешбэк", "возврат", "cashback", "рефанд", "refund"],
  },
  {
    category: "Переводы (входящие)",
    keywords: ["перевод", "пополнение", "поступление", "зачисление"],
  },
];

const EXPENSE_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Продукты",
    keywords: [
      "magnum", "small", "galmart", "ramstore", "small mart", "продукт",
      "supermarket", "market", "маркет", "food", "грин", "green",
      "fresh", "azbuka", "артур", "kaspi food",
    ],
  },
  {
    category: "Кафе и рестораны",
    keywords: [
      "кафе", "ресторан", "coffee", "кофе", "starbucks", "costa",
      "su", "пицц", "pizza", "kfc", "макдонал", "mcdonald", "burger",
      "cafe", "restaurant", "bar", "бар ",
    ],
  },
  {
    category: "Транспорт",
    keywords: [
      "такси", "taxi", "yandex", "indriver", "автобус", "metro", "метро",
      "бензин", "азс", "petroretail", "petrol", "gas station", "helios",
      "shell", "kazmunay",
    ],
  },
  {
    category: "Коммуналка и связь",
    keywords: [
      "коммун", "связь", "интернет", "internet", "beeline", "tele2",
      "altel", "activ", "kcell", "电", "электро", "квартплат",
      "жкх", "оплата услуг",
    ],
  },
  {
    category: "Здоровье",
    keywords: [
      "аптек", "pharmacy", "клиник", "clinic", "больниц", "стоматолог",
      "dentist", "медицин", "health",
    ],
  },
  {
    category: "Развлечения",
    keywords: [
      "кино", "cinema", "concert", "концерт", "театр", "развлеч",
      "entertainment", "game", "игр", "subscription", "подписка",
      "netflix", "spotify",
    ],
  },
  {
    category: "Снятие наличных",
    keywords: ["снятие", "банкомат", "atm", "cash withdrawal", "наличны"],
  },
  {
    category: "Кредит / займ",
    keywords: ["кредит", "займ", "loan", "credit"],
  },
  {
    category: "Переводы (исходящие)",
    keywords: ["перевод", "на карту", "p2p"],
  },
  {
    category: "Покупки",
    keywords: [
      "покупка", "магазин", "shop", "store", "техника", "одежда",
      "wildberries", "kaspi магазин", "marketplace",
    ],
  },
];

function matchRules(
  description: string,
  rules: Array<{ category: string; keywords: string[] }>
): string | null {
  const lower = description.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category;
    }
  }
  return null;
}

export function categorize(description: string, type: TransactionType): string {
  if (type === "income") {
    return matchRules(description, INCOME_RULES) ?? DEFAULT_INCOME_CATEGORY;
  }
  return matchRules(description, EXPENSE_RULES) ?? DEFAULT_EXPENSE_CATEGORY;
}
