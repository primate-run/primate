import i18n from "#i18n/index/server";
import type TypeOf from "#i18n/TypeOf";
import test from "@rcompat/test";

const en_config = {
  defaultLocale: "en" as const,
  locales: {
    en: {
      // basic
      simple: "Hello world",
      greeting: "Hello {name}",
      empty: "",

      // numbers
      count: "You have {count:n} items",
      decimal: "Value: {val:n}",
      large_number: "Population: {pop:n}",

      // plurals
      plural: "You have {count:n|an item|items}",
      zero_plural: "You have {count:n|zero|one|several} {count:n|item|items}",
      two_plural: "Found {count:n|one|other} result",
      many_plural: "{count:n|zero|one|few|many|other} {count:n|file|files}",

      // date
      date: "Today is {date:d}",
      date_number: "Timestamp: {ts:d}",
      past_date: "Created on {date:d}",

      // currency
      currency: "Price: {price:c}",
      usd: "Cost: {amount:c}",
      zero_currency: "Free: {price:c}",

      // ordinals
      ordinal: "Position: {pos:o}",
      rank: "You are {place:o}",

      // relative time
      ago: "Posted {time:a}",
      future: "Starts {time:a}",
      now: "Updated {time:a}",

      // lists
      list: "Items: {items:l}",
      empty_list: "Tags: {tags:l}",
      single_item: "Selected: {item:l}",

      // units
      distance_km: "Distance: {dist:u(km)}",
      distance_m: "Height: {h:u(m)}",
      distance_mi: "Distance: {dist:u(mi)}",
      weight_kg: "Weight: {w:u(kg)}",
      weight_lb: "Weight: {w:u(lb)}",
      temperature_c: "Temperature: {temp:u(celsius)}",
      temperature_f: "Temperature: {temp:u(fahrenheit)}",
      speed_kmh: "Speed: {spd:u(km/h)}",
      speed_mph: "Speed: {spd:u(mph)}",
      volume_l: "Volume: {vol:u(l)}",
      volume_gal: "Volume: {vol:u(gallon)}",
      data_mb: "Size: {size:u(MB)}",
      data_gb: "Size: {size:u(GB)}",
      time_h: "Duration: {dur:u(hour)}",
      time_min: "Duration: {dur:u(minute)}",
      energy_kwh: "Consumption: {cons:u(kWh)}",
      power_kw: "Power: {pwr:u(kW)}",

      // multiple parameters
      multiple: "You have {count:n} items on {date:d}",
      complex: "User {name} bought {qty:n|one|other} book for {price:c}",

      // edge cases
      special_chars: "Price: {price:c} - {name}!",
      nested_braces: "Data: {{escaped}} and {real:n}",
      unicode: "Name: {name} - 你好",

      // backref
      added_items: "Added {n:n|{n} item|{n} items}",
      found_results: "Found {count:n|{count} result|{count} results}",
      zero_bf: "You have {num:n|no items|{num} item|{num} items}",
      large: "Processing {count:n|{count} item|{count} items}",
      dup: "Processing {n:n|1 file|{n} files} in {n} {n:n|batch|batches}",
      decimal_bf: "Progress: {pct:n|{pct}% complete|{pct}% complete}",

      // nested objects/arrays
      onboarding: {
        steps: [
          { title: "Category setup", description: "..." },
          { title: "Income", description: "..." },
          { title: "Expenses", description: "..." },
        ],
        greeting: "Welcome {name}",
        added: "Added {n:n|{n} item|{n} items}",
        plain: ["a", "b", "c"],
      },
    },
  },
};

const de_config = {
  defaultLocale: "de" as const,
  currency: "EUR" as const,
  locales: {
    de: {
      // basic
      simple: "Hallo Welt",
      greeting: "Hallo {name}",
      empty: "",

      // numbers
      count: "Du hast {count:n} Artikel",
      decimal: "Wert: {val:n}",
      large_number: "Bevölkerung: {pop:n}",

      // plurals
      plural: "Du hast {count:n|einen|mehrere} Artikel",
      zero_plural: "Du hast {count:n|keine|einen|mehrere} Artikel",
      two_plural: "{count:n|Ein Ergebnis|Mehrere Ergebnisse} gefunden",
      many_plural: "{count:n|keine|eine|mehrere} {count:n|Datei|Dateien}",

      // dates
      date: "Heute ist {date:d}",
      date_number: "Zeitstempel: {ts:d}",
      past_date: "Erstellt am {date:d}",

      // currency
      currency: "Preis: {price:c}",
      usd: "Kosten: {amount:c}",
      zero_currency: "Kostenlos: {price:c}",

      // ordinals
      ordinal: "Position: {pos:o}",
      rank: "Du bist {place:o}",

      // relative time
      ago: "Veröffentlicht {time:a}",
      future: "Beginnt {time:a}",
      now: "Aktualisiert {time:a}",

      // list
      list: "Artikel: {items:l}",
      empty_list: "Tags: {tags:l}",
      single_item: "Ausgewählt: {item:l}",

      // units
      distance_km: "Entfernung: {dist:u(km)}",
      distance_m: "Höhe: {h:u(m)}",
      weight_kg: "Gewicht: {w:u(kg)}",
      temperature_c: "Temperatur: {temp:u(celsius)}",
      temperature_f: "Temperatur: {temp:u(fahrenheit)}",
      speed_kmh: "Geschwindigkeit: {spd:u(km/h)}",
      volume_l: "Volumen: {vol:u(l)}",
      data_mb: "Größe: {size:u(MB)}",
      data_gb: "Größe: {size:u(GB)}",
      time_h: "Dauer: {dur:u(hour)}",
      time_min: "Dauer: {dur:u(minute)}",
      energy_kwh: "Verbrauch: {cons:u(kWh)}",

      // multiple parameters
      multiple: "Du hast {count:n} Artikel am {date:d}",
      complex: "Nutzer {name} kaufte {qty:n|ein|mehrere} Buch für {price:c}",

      // edge cases
      special_chars: "Preis: {price:c} - {name}!",
      nested_braces: "Daten: {{escaped}} und {real:n}",
      unicode: "Name: {name} - Hallo",

      // backref
      added_items: "{n:n|{n} Eintrag|{n} Einträge} hinzugefügt",
      found_results: "{count:n|{count} Ergebnis|{count} Ergebnisse} gefunden",
      zero_bf: "Du hast {num:n|keine Artikel|{num} Artikel|{num} Artikel}",
      large: "Verarbeitung von {count:n|{count} Element|{count} Elementen}",
      dup: "{n:n|1 Datei|{n} Dateien} in {n} {n:n|Charge|Chargen} verarbeitet",
      decimal_bf: "Fortschritt: {pct:n|{pct}%|{pct}%} abgeschlossen",

      // nested objects/arrays
      onboarding: {
        steps: [
          { title: "Kategorieeinrichtung", description: "..." },
          { title: "Einkommen", description: "..." },
          { title: "Ausgaben", description: "..." },
        ],
        greeting: "Willkommen {name}",
        added: "{n} {n:n|Eintrag|Einträge} hinzugefügt",
        plain: ["a", "b", "c"],
      },
    },
  },
};

const en = i18n(en_config) as any;
const de = i18n(de_config) as any;

test.case("simple message without parameters", assert => {
  assert(en("simple")).equals("Hello world");
  assert(de("simple")).equals("Hallo Welt");
});

test.case("basic string replacement", assert => {
  assert(en("greeting", { name: "World" })).equals("Hello World");
  assert(de("greeting", { name: "Welt" })).equals("Hallo Welt");
});

test.case("number formatting", assert => {
  const input = { count: 42 };
  assert(en("count", input)).equals("You have 42 items");
  assert(de("count", input)).equals("Du hast 42 Artikel");
});

test.case("decimal number formatting", assert => {
  const input = { val: 1234.56 };
  assert(en("decimal", input)).equals("Value: 1,234.56");
  assert(de("decimal", input)).equals("Wert: 1.234,56");
});

test.case("large number formatting", assert => {
  const input = { pop: 1_000_000 };
  assert(en("large_number", input)).equals("Population: 1,000,000");
  assert(de("large_number", input)).equals("Bevölkerung: 1.000.000");
});

test.case("plural selection - one", assert => {
  const input = { count: 1 };
  assert(en("plural", input)).equals("You have an item");
  assert(de("plural", input)).equals("Du hast einen Artikel");
});

test.case("plural selection - other", assert => {
  const input = { count: 2 };
  assert(en("plural", input)).equals("You have items");
  assert(de("plural", input)).equals("Du hast mehrere Artikel");
});

test.case("plural selection with zero", assert => {
  const input = { count: 0 };
  assert(en("zero_plural", input)).equals("You have zero items");
  assert(de("zero_plural", input)).equals("Du hast keine Artikel");
});

test.case("plural selection with many", assert => {
  const input = { count: 100 };
  assert(en("many_plural", input)).equals("other files");
  assert(de("many_plural", input)).equals("mehrere Dateien");
});

test.case("backref in number plurals", assert => {
  assert(en("added_items", { n: 1 })).equals("Added 1 item");
  assert(en("added_items", { n: 5 })).equals("Added 5 items");
  assert(de("added_items", { n: 1 })).equals("1 Eintrag hinzugefügt");
  assert(de("added_items", { n: 5 })).equals("5 Einträge hinzugefügt");

  assert(en("zero_bf", { num: 0 })).equals("You have no items");
  assert(en("zero_bf", { num: 1 })).equals("You have 1 item");
  assert(en("zero_bf", { num: 3 })).equals("You have 3 items");
  assert(de("zero_bf", { num: 0 })).equals("Du hast keine Artikel");
  assert(de("zero_bf", { num: 1 })).equals("Du hast 1 Artikel");
  assert(de("zero_bf", { num: 7 })).equals("Du hast 7 Artikel");
});

test.case("backref with formatted numbers", assert => {
  const input = { count: 1234 };
  assert(en("large", input)).equals("Processing 1,234 items");
  assert(de("large", input)).equals("Verarbeitung von 1.234 Elementen");
});

test.case("multiple backrefs in same message", assert => {
  assert(en("dup", { n: 1 })).equals("Processing 1 file in 1 batch");
  assert(en("dup", { n: 3 })).equals("Processing 3 files in 3 batches");
  assert(de("dup", { n: 1 })).equals("1 Datei in 1 Charge verarbeitet");
  assert(de("dup", { n: 3 })).equals("3 Dateien in 3 Chargen verarbeitet");
});

test.case("backref edge cases", assert => {
  const input = { pct: 45.7 };
  assert(en("decimal_bf", input)).equals("Progress: 45.7% complete");
  assert(de("decimal_bf", input)).equals("Fortschritt: 45,7% abgeschlossen");
});

test.case("date formatting", assert => {
  const input = { date: new Date("2023-06-12") };
  assert(en("date", input)).equals("Today is 6/12/2023");
  assert(de("date", input)).equals("Heute ist 12.6.2023");
});

test.case("date from number", assert => {
  const input = { ts: 1672531200000 }; // 2023-01-01
  assert(en("date_number", input)).equals("Timestamp: 1/1/2023");
  assert(de("date_number", input)).equals("Zeitstempel: 1.1.2023");
});

test.case("currency formatting", assert => {
  const input = { price: 99.99 };
  assert(en("currency", input)).equals("Price: $99.99");
  assert(de("currency", input)).equals("Preis: 99,99 €");
});

test.case("zero currency", assert => {
  const input = { price: 0 };
  assert(en("zero_currency", input)).equals("Free: $0.00");
  assert(de("zero_currency", input)).equals("Kostenlos: 0,00 €");
});

test.case("ordinal formatting - 1st", assert => {
  const input = { pos: 1 };
  assert(en("ordinal", input)).equals("Position: 1st");
  assert(de("ordinal", input)).equals("Position: 1.");
});

test.case("ordinal formatting - 2nd", assert => {
  const input = { pos: 2 };
  assert(en("ordinal", input)).equals("Position: 2nd");
  assert(de("ordinal", input)).equals("Position: 2.");
});

test.case("ordinal formatting - 3rd", assert => {
  const input = { pos: 3 };
  assert(en("ordinal", input)).equals("Position: 3rd");
  assert(de("ordinal", input)).equals("Position: 3.");
});

test.case("ordinal formatting - 11th", assert => {
  const input = { pos: 11 };
  assert(en("ordinal", input)).equals("Position: 11th");
  assert(de("ordinal", input)).equals("Position: 11.");
});

test.case("relative time - past", assert => {
  const input = { time: -3600000 }; // 1 hour ago
  assert(en("ago", input)).equals("Posted 1 hour ago");
  assert(de("ago", input)).equals("Veröffentlicht vor 1 Stunde");
});

test.case("relative time - future", assert => {
  const input = { time: 3600000 }; // 1 hour from now
  assert(en("future", input)).equals("Starts in 1 hour");
  assert(de("future", input)).equals("Beginnt in 1 Stunde");
});

test.case("relative time - now", assert => {
  const input = { time: 0 }; // now
  assert(en("now", input)).equals("Updated now");
  assert(de("now", input)).equals("Aktualisiert jetzt");
});

test.case("list formatting", assert => {
  assert(en("list", { items: ["apple", "banana", "cherry"] }))
    .equals("Items: apple, banana, and cherry");
  assert(de("list", { items: ["Apfel", "Banane", "Kirsche"] }))
    .equals("Artikel: Apfel, Banane und Kirsche");
});

test.case("empty list", assert => {
  const input = { tags: [] };
  assert(en("empty_list", input)).equals("Tags: ");
  assert(de("empty_list", input)).equals("Tags: ");
});

test.case("single item list", assert => {
  const english = { item: ["apple"] };
  const german = { item: ["Apfel"] };

  assert(en("single_item", english)).equals("Selected: apple");
  assert(de("single_item", german)).equals("Ausgewählt: Apfel");
});

test.case("unit formatting - distance", assert => {
  assert(en("distance_km", { dist: 5 })).equals("Distance: 5 km");
  assert(en("distance_m", { h: 150 })).equals("Height: 150 m");
  assert(en("distance_mi", { dist: 10 })).equals("Distance: 10 mi");

  assert(de("distance_km", { dist: 5 })).equals("Entfernung: 5 km");
  assert(de("distance_m", { h: 150 })).equals("Höhe: 150 m");
});

test.case("unit formatting - weight", assert => {
  assert(en("weight_kg", { w: 75 })).equals("Weight: 75 kg");
  assert(en("weight_lb", { w: 165 })).equals("Weight: 165 lb");

  assert(de("weight_kg", { w: 75 })).equals("Gewicht: 75 kg");
});

test.case("unit formatting - temperature", assert => {
  assert(en("temperature_c", { temp: 25 })).equals("Temperature: 25°C");
  assert(en("temperature_f", { temp: 77 })).equals("Temperature: 77°F");
  assert(de("temperature_c", { temp: 25 })).equals("Temperatur: 25 °C");
  assert(de("temperature_f", { temp: 77 })).equals("Temperatur: 77 °F");
});

test.case("unit formatting - speed", assert => {
  assert(en("speed_kmh", { spd: 100 })).equals("Speed: 100 km/h");
  assert(en("speed_mph", { spd: 60 })).equals("Speed: 60 mph");
  assert(de("speed_kmh", { spd: 100 })).equals("Geschwindigkeit: 100 km/h");
});

test.case("unit formatting - volume", assert => {
  assert(en("volume_l", { vol: 2 })).equals("Volume: 2 L");
  assert(en("volume_gal", { vol: 5 })).equals("Volume: 5 gal");
  assert(de("volume_l", { vol: 2 })).equals("Volumen: 2 l");
});

test.case("unit formatting - data", assert => {
  assert(en("data_mb", { size: 500 })).equals("Size: 500 Mb");
  assert(en("data_gb", { size: 2 })).equals("Size: 2 Gb");
  assert(de("data_mb", { size: 500 })).equals("Größe: 500 Mb");
  assert(de("data_gb", { size: 2 })).equals("Größe: 2 Gb");
});

test.case("unit formatting - time", assert => {
  assert(en("time_h", { dur: 3 })).equals("Duration: 3 hr");
  assert(en("time_min", { dur: 45 })).equals("Duration: 45 min");
  assert(de("time_h", { dur: 3 })).equals("Dauer: 3 Std.");
  assert(de("time_min", { dur: 45 })).equals("Dauer: 45 Min.");
});

test.case("unit formatting - energy and power", assert => {
  assert(en("energy_kwh", { cons: 150 })).equals("Consumption: 150 kwh");
  assert(en("power_kw", { pwr: 2 })).equals("Power: 2 kw");
  assert(de("energy_kwh", { cons: 150 })).equals("Verbrauch: 150 kwh");
});

test.case("multiple parameters", assert => {
  const input = { count: 3, date: new Date("2023-01-01") };
  assert(en("multiple", input)).equals("You have 3 items on 1/1/2023");
  assert(de("multiple", input)).equals("Du hast 3 Artikel am 1.1.2023");
});

test.case("complex multiple parameters with plural", assert => {
  const input = { name: "Bob", qty: 1, price: 29.99 };
  assert(en("complex", input)).equals("User Bob bought one book for $29.99");
  assert(de("complex", input)).equals("Nutzer Bob kaufte ein Buch für 29,99 €");
});

test.case("missing parameter", assert => {
  const input = {};
  assert(en("greeting", input)).equals("Hello ");
  assert(de("greeting", input)).equals("Hallo ");
});

test.case("empty message", assert => {
  assert(en("empty")).equals("");
  assert(de("empty")).equals("");
});

test.case("special characters", assert => {
  const input = { price: 19.99, name: "John" };
  assert(en("special_chars", input)).equals("Price: $19.99 - John!");
  assert(de("special_chars", input)).equals("Preis: 19,99 € - John!");
});

test.case("nested braces (escaped)", assert => {
  const input = { real: 42 };
  assert(en("nested_braces", input)).equals(`Data: {escaped} and ${42}`);
  assert(de("nested_braces", input)).equals(`Daten: {escaped} und ${42}`);
});

test.case("unicode characters", assert => {
  const input = { name: "张三" };
  assert(en("unicode", input)).equals("Name: 张三 - 你好");
  assert(de("unicode", input)).equals("Name: 张三 - Hallo");
});

test.case("missing key", assert => {
  assert(en("nonexistent")).equals("nonexistent");
  assert(de("nonexistent")).equals("nonexistent");
});

test.case("TypeOf type assertions", assert => {
  type NumType = TypeOf<"n">;
  type DateType = TypeOf<"d">;
  type CurrencyType = TypeOf<"c">;
  type ListType = TypeOf<"l">;
  type UnitType = TypeOf<"u(km)">;

  const num: NumType = 42;
  const date: DateType = new Date();
  const currency: CurrencyType = 99.99;
  const list: ListType = ["a", "b"];
  const unit: UnitType = 10;

  assert(num).equals(42);
  assert(date.getTime() > 0).true();
  assert(currency).equals(99.99);
  assert(list.length).equals(2);
  assert(unit).equals(10);
});

test.case("invalid date", assert => {
  const input = { date: new Date("invalid") };
  assert(en("date", input)).equals("Today is Invalid Date");
  assert(de("date", input)).equals("Heute ist Invalid Date");
});

test.case("NaN number", assert => {
  const input = { count: NaN };
  assert(en("count", input)).equals("You have NaN items");
  assert(de("count", input)).equals("Du hast NaN Artikel");
});

test.case("Infinity number", assert => {
  const input = { count: Infinity };
  assert(en("count", input)).equals("You have ∞ items");
  assert(de("count", input)).equals("Du hast ∞ Artikel");
});

test.case("nested objects/arrays via dot-path", assert => {
  const steps = en("onboarding.steps") as any;
  assert(Array.isArray(steps)).true();
  assert(steps.length).equals(3);
  assert(steps[0].title).equals("Category setup");

  assert(en("onboarding.steps.0.title")).equals("Category setup");
  assert(de("onboarding.steps.1.title")).equals("Einkommen");

  assert(en("onboarding.greeting", { name: "Sam" })).equals("Welcome Sam");
  assert(de("onboarding.greeting", { name: "Sam" })).equals("Willkommen Sam");

  // deep string still formats (parity)
  assert(en("onboarding.added", { n: 2 })).equals("Added 2 items");
  assert(de("onboarding.added", { n: 2 })).equals("2 Einträge hinzugefügt");

  // array indices supported
  assert(en("onboarding.plain.1")).equals("b");

  // missing deep path falls back to key string
  assert(en("onboarding.steps.99.title")).equals("onboarding.steps.99.title");
});

test.case("reject dotted catalog keys (runtime)", assert => {
  assert(() => i18n({
    defaultLocale: "en" as const,
    locales: {
      en: {
        "bad.key": "nope",
      },
    },
  } as any)).throws();
});
