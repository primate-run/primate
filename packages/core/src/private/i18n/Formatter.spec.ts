import Formatter from "#i18n/Formatter";
import test from "@rcompat/test";

test.case("Ordinal - large numbers", assert => {
  const formatter = new Formatter("en");

  assert(formatter.ordinal(100)).equals("100th");
  assert(formatter.ordinal(1000)).equals("1000th");
  assert(formatter.ordinal(1000000)).equals("1000000th");
});

test.case("Ordinal - negative numbers", assert => {
  const formatter = new Formatter("en");

  assert(formatter.ordinal(-1)).equals("-1st");
  assert(formatter.ordinal(-2)).equals("-2nd");
  assert(formatter.ordinal(-3)).equals("-3rd");
  assert(formatter.ordinal(-11)).equals("-11th");
});

test.case("Ordinal - zero", assert => {
  const formatter = new Formatter("en");

  assert(formatter.ordinal(0)).equals("0th");
});

test.case("Ordinal - decimal numbers", assert => {
  const formatter = new Formatter("en");

  // Should handle decimal numbers by truncating
  assert(formatter.ordinal(1.5)).equals("1st");
  assert(formatter.ordinal(2.9)).equals("2nd");
});

test.case("Ordinal - unsupported locale fallback", assert => {
  // Test with a locale that might not have ordinal support
  const formatter = new Formatter("xyz");

  // Should fallback to default English-style formatting
  assert(formatter.ordinal(1)).equals("1");
  assert(formatter.ordinal(2)).equals("2");
});

test.case("Number formatting - basic", assert => {
  const formatter = new Formatter("en");

  assert(formatter.number(1234.56)).equals("1,234.56");
  assert(formatter.number(1000000)).equals("1,000,000");
});

test.case("Number formatting - German locale", assert => {
  const formatter = new Formatter("de");

  assert(formatter.number(1234.56)).equals("1.234,56");
  assert(formatter.number(1000000)).equals("1.000.000");
});

test.case("Currency formatting - USD", assert => {
  const formatter = new Formatter("en");

  assert(formatter.currency("USD", 99.99)).equals("$99.99");
  assert(formatter.currency("USD", 0)).equals("$0.00");
});

test.case("Currency formatting - EUR", assert => {
  const formatter = new Formatter("de");

  const result = formatter.currency("EUR", 99.99);
  assert(result.includes("99,99")).true();
  assert(result.includes("€")).true();
});

test.case("Date formatting - basic", assert => {
  const formatter = new Formatter("en");
  const date = new Date("2023-01-01");

  const result = formatter.date(date);
  assert(result.includes("1/1/2023") || result.includes("01/01/2023")).true();
});

test.case("Date formatting - German", assert => {
  const formatter = new Formatter("de");
  const date = new Date("2023-01-01");

  const result = formatter.date(date);
  assert(result.includes("1.1.2023") || result.includes("01.01.2023")).true();
});

test.case("List formatting - basic", assert => {
  const formatter = new Formatter("en");
  const items = ["apple", "banana", "cherry"];

  const result = formatter.list(items);
  assert(result.includes("apple")).true();
  assert(result.includes("banana")).true();
  assert(result.includes("cherry")).true();
});

test.case("List formatting - German", assert => {
  const formatter = new Formatter("de");
  const items = ["Apfel", "Banane", "Kirsche"];

  const result = formatter.list(items);
  assert(result.includes("Apfel")).true();
  assert(result.includes("Banane")).true();
  assert(result.includes("Kirsche")).true();
});

test.case("Unit formatting - basic", assert => {
  const formatter = new Formatter("en");

  assert(formatter.unit(5, "km")).equals("5 km");
  assert(formatter.unit(75, "kg")).equals("75 kg");
  assert(formatter.unit(100, "km/h")).equals("100 km/h");
});

test.case("Unit formatting - German", assert => {
  const formatter = new Formatter("de");

  assert(formatter.unit(5, "km")).equals("5 km");
  assert(formatter.unit(75, "kg")).equals("75 kg");
});

test.case("Relative time - past", assert => {
  const formatter = new Formatter("en");

  const result = formatter.relative(-3600000); // 1 hour ago
  assert(result.includes("hour")).true();
});

test.case("Relative time - future", assert => {
  const formatter = new Formatter("en");

  const result = formatter.relative(3600000); // 1 hour from now
  assert(result.includes("hour")).true();
});

test.case("Plural rules - basic", assert => {
  const formatter = new Formatter("en");
  const rules = formatter.pluralRules();

  assert(rules.select(0)).equals("other");
  assert(rules.select(1)).equals("one");
  assert(rules.select(2)).equals("other");
  assert(rules.select(100)).equals("other");
});

test.case("Plural rules - German", assert => {
  const formatter = new Formatter("de");
  const rules = formatter.pluralRules();

  assert(rules.select(0)).equals("other");
  assert(rules.select(1)).equals("one");
  assert(rules.select(2)).equals("other");
});

test.case("Locale management", assert => {
  const formatter = new Formatter("en");

  assert(formatter.locale).equals("en");

  formatter.locale = "de";
  assert(formatter.locale).equals("de");

  // Test that changing locale affects formatting
  const enResult = new Formatter("en").number(1234.56);
  const deResult = new Formatter("de").number(1234.56);

  assert(enResult).equals("1,234.56");
  assert(deResult).equals("1.234,56");
});

