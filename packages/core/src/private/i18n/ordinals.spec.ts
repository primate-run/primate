import Formatter from "#i18n/Formatter";
import test from "@rcompat/test";

test.case("English", assert => {
  const formatter = new Formatter("en");

  assert(formatter.ordinal(1)).equals("1st");
  assert(formatter.ordinal(2)).equals("2nd");
  assert(formatter.ordinal(3)).equals("3rd");
  assert(formatter.ordinal(4)).equals("4th");
  assert(formatter.ordinal(11)).equals("11th");
  assert(formatter.ordinal(12)).equals("12th");
  assert(formatter.ordinal(13)).equals("13th");
  assert(formatter.ordinal(21)).equals("21st");
  assert(formatter.ordinal(22)).equals("22nd");
  assert(formatter.ordinal(23)).equals("23rd");
  assert(formatter.ordinal(101)).equals("101st");
  assert(formatter.ordinal(102)).equals("102nd");
  assert(formatter.ordinal(103)).equals("103rd");
});

test.case("French", assert => {
  const formatter = new Formatter("fr");

  assert(formatter.ordinal(1)).equals("1er");
  assert(formatter.ordinal(2)).equals("2e");
  assert(formatter.ordinal(3)).equals("3e");
  assert(formatter.ordinal(21)).equals("21e");
});

test.case("Dutch", assert => {
  const formatter = new Formatter("nl");

  assert(formatter.ordinal(1)).equals("1e");
  assert(formatter.ordinal(2)).equals("2e");
  assert(formatter.ordinal(3)).equals("3e");
  assert(formatter.ordinal(21)).equals("21e");
});

test.case("Swedish", assert => {
  const formatter = new Formatter("sv");

  assert(formatter.ordinal(1)).equals("1:a");
  assert(formatter.ordinal(2)).equals("2:a");
  assert(formatter.ordinal(3)).equals("3:e");
  assert(formatter.ordinal(21)).equals("21:a");
});

["ru", "uk", "be"].forEach(l => {
  test.case(`Russian (${l})`, assert => {
    const f = new Formatter(l);
    assert(f.ordinal(1)).equals("1-й");
    assert(f.ordinal(2)).equals("2-й");
    assert(f.ordinal(3)).equals("3-й");
    assert(f.ordinal(21)).equals("21-й");
  });
});

test.case("Romanian", assert => {
  const f = new Formatter("ro");
  assert(f.ordinal(1)).equals("1-lea");
  assert(f.ordinal(2)).equals("2-lea");
  assert(f.ordinal(3)).equals("3-lea");
  assert(f.ordinal(21)).equals("21-lea");
});

test.case("Irish", assert => {
  const f = new Formatter("ga");
  assert(f.ordinal(1)).equals("1ú");
  assert(f.ordinal(2)).equals("2ú");
  assert(f.ordinal(3)).equals("3ú");
  assert(f.ordinal(21)).equals("21ú");
});

test.case("Greek", assert => {
  const f = new Formatter("el");
  assert(f.ordinal(1)).equals("1ος");
  assert(f.ordinal(2)).equals("2ος");
  assert(f.ordinal(3)).equals("3ος");
  assert(f.ordinal(21)).equals("21ος");
});

test.case("Japanese", assert => {
  const f = new Formatter("ja");
  assert(f.ordinal(1)).equals("第1");
  assert(f.ordinal(2)).equals("第2");
  assert(f.ordinal(3)).equals("第3");
  assert(f.ordinal(21)).equals("第21");
});

["zh", "zh-CN", "zh-TW"].forEach(locale => {
  test.case(`Chinese ${locale}`, assert => {
    const f = new Formatter(locale);
    assert(f.ordinal(1)).equals("第1");
    assert(f.ordinal(2)).equals("第2");
    assert(f.ordinal(3)).equals("第3");
    assert(f.ordinal(21)).equals("第21");
  });
});

test.case("Thai", assert => {
  const f = new Formatter("th");
  assert(f.ordinal(1)).equals("ที่1");
  assert(f.ordinal(2)).equals("ที่2");
  assert(f.ordinal(3)).equals("ที่3");
  assert(f.ordinal(21)).equals("ที่21");
});

test.case("Vietnamese", assert => {
  const f = new Formatter("vi");
  assert(f.ordinal(1)).equals("thứ 1");
  assert(f.ordinal(2)).equals("thứ 2");
  assert(f.ordinal(3)).equals("thứ 3");
  assert(f.ordinal(21)).equals("thứ 21");
});

test.case("Armenian", assert => {
  const f = new Formatter("hy");
  assert(f.ordinal(1)).equals("1-ին");
  assert(f.ordinal(2)).equals("2-րդ");
  assert(f.ordinal(3)).equals("3-րդ");
  assert(f.ordinal(21)).equals("21-րդ");
});

[
  // German Danish Norwegian Icelandic
  "de", "da", "no", "is",
  // Polish Czech Slovak
  "pl", "cs", "sk",
  // Serbian Croatian Bosnian Slovenian Macedonian
  "sr", "hr", "bs", "sl", "mk",
  // Latvian Lithuanian
  "lv", "lt",
  // Finnish Estonian, Hungarian Turkish
  "fi", "et", "hu", "tr",
  // Albanian
  "sq",
].forEach(locale => {
  test.case(`dot ${locale}`, assert => {
    const formatter = new Formatter(locale);

    assert(formatter.ordinal(1)).equals("1.");
    assert(formatter.ordinal(2)).equals("2.");
    assert(formatter.ordinal(3)).equals("3.");
    assert(formatter.ordinal(10)).equals("10.");
    assert(formatter.ordinal(21)).equals("21.");
    assert(formatter.ordinal(101)).equals("101.");
  });
});

[
  "es", // Spanish
  "it", // Italian
  "pt", // Portuguese
  "gl", // Galician
].forEach(locale => {
  test.case(`numero ${locale}`, assert => {
    const formatter = new Formatter(locale);

    assert(formatter.ordinal(1)).equals("1º");
    assert(formatter.ordinal(2)).equals("2º");
    assert(formatter.ordinal(3)).equals("3º");
    assert(formatter.ordinal(10)).equals("10º");
    assert(formatter.ordinal(21)).equals("21º");
    assert(formatter.ordinal(101)).equals("101º");
  });
});
