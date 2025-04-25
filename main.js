const le = (xs, ys) => xs.every((x, i) => i < ys.length && x <= ys[i]);
const map2 = (xs, ys, f, empty) =>
  (xs.length > ys.length ? xs : ys).map((_, i) =>
    f(xs[i] || empty, ys[i] || empty)
  );
const add = (xs, ys) => map2(xs, ys, (x, y) => x + y, 0);
const sub = (xs, ys) => map2(xs, ys, (x, y) => x - y, 0);
function* run(acc, fracs) {
  const LIMIT = 10000;
  for (let s = 0; s < LIMIT; s++) {
    let found = false;
    for (const frac of fracs)
      if (le(frac.lhs, acc)) {
        acc = add(acc, frac.total);
        yield { acc, frac };
        found = true;
        break;
      }
    if (!found) return;
  }
  throw new Error(`Exceeded ${LIMIT} steps`);
}

function compile(code) {
  const words = [];
  function getWord(word) {
    for (let i = 0; i < words.length; i++) if (words[i] === word) return i;
    words.push(word);
    return words.length - 1;
  }
  function parseWord(word) {
    const [name, exp] = word.split("^");
    const id = getWord(name);
    if (exp === undefined) return { id, count: 1 };
    const n = parseInt(exp, 10);
    if (isNaN(n)) throw new Error(`Invalid exponent: ${exp}`);
    return { id, count: n };
  }
  function mkList(xs) {
    const max = Math.max(-1, ...xs.map((x) => x.id));
    const acc = Array(max + 1).fill(0);
    for (const x of xs) acc[x.id] += x.count;
    return acc;
  }
  const toList = (str) =>
    mkList(
      str
        .trim()
        .split(" ")
        .filter((s) => s.length)
        .map(parseWord)
    );
  const toWords = (xs) =>
    xs
      .flatMap((x, i) => {
        if (x === 0) return [];
        const word = words[i];
        if (x === 1) return [word];
        return [`${word}^${x}`];
      })
      .join(" ");
  const fracs = code
    .trim()
    .split("\n")
    .flatMap((line) => {
      const hs = line.split("=>");
      if (hs.length !== 2) {
        console.log("comment: ", hs[0]);
        return [];
      }
      const [lhs, rhs] = hs.map(toList);
      return [
        {
          lhs,
          rhs,
          total: sub(rhs, lhs),
          toString: () => `${toWords(lhs)} => ${toWords(rhs)}`,
        },
      ];
    });
  return { words, fracs, toWords, toList, run: (acc) => run(acc, fracs) };
}

const primes = [BigInt(2)];
for (let i = BigInt(3); primes.length < 1000; i += BigInt(2))
  if (primes.every((p) => i % p !== 0n)) primes.push(BigInt(i));
const bigPow = (x, n) =>
  n <= 0 ? BigInt(1) : n % 2n ? x * bigPow(x, n - 1n) : bigPow(x * x, n / 2n);
const toBig = (xs) =>
  xs.map((x, i) => bigPow(primes[i], BigInt(x))).reduce((a, b) => a * b, 1n);
function fromBig(x) {
  const xs = Array(primes.length).fill(0);
  for (let i = 0; x > 1 && i < primes.length; i++) {
    const p = primes[i];
    while (x % p === 0) {
      xs[i]++;
      x /= p;
    }
  }
  return xs;
}

function $(el) {
  if (typeof el === "string") el = document.querySelector(el);
  return {
    on: (event, fn) => el.addEventListener(event, fn),
  };
}