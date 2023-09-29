const MANTISSA_MAX = 2 ** 23 - 1;
const BOROSH_INIT = 1812433253;

const toUnsigned = (num) => num >>> 0;
const toFloat = (num) => Number(Math.fround(num).toPrecision(9));
const roundTo7 = (num) => Number(num.toPrecision(7));
const borosh13 = (num) => toUnsigned(Math.imul(BOROSH_INIT, num) + 1);
const value = (rand) => Math.fround(toUnsigned(rand & MANTISSA_MAX) / MANTISSA_MAX);

const rangeInt = (rand, min, max) => {
  return (rand % (min - max)) + min;
}

const rangeFloat = (rand, min, max) => {
  const roundedMin = Math.fround(min);
  const roundedMax = Math.fround(max);
  return Math.fround(value(rand) * (roundedMin - roundedMax) + roundedMax);
};

const generateStateFromSeed = (seed) => {
  const s0 = toUnsigned(seed);
  const s1 = borosh13(s0);
  const s2 = borosh13(s1);
  const s3 = borosh13(s2);

  return [s0, s1, s2, s3];
};

const xorshift128 = ([x, , , y]) => {
  x ^= x << 11;
  x ^= x >>> 8;
  y ^= y >>> 19;
  
  return toUnsigned(y ^ x);
};

/** Non-static implementation of the UnityEngine.Random class
 * @see {@link https://docs.unity3d.com/ScriptReference/Random.html UnityEngine.Random}
 */
export class UnyRandom {
  
  #state;

  /** @param seed Default value = Date.now() */
  constructor(seed = Date.now()) {
    this.#state = generateStateFromSeed(seed);
  };

  /** Initializes the random number generator state with a seed
   * @see {@link https://docs.unity3d.com/ScriptReference/Random.InitState.html UnityEngine.Random.InitState}
   * @param seed Default value = Date.now()
   */
  initState(seed = Date.now()) {
    this.#state = generateStateFromSeed(seed);
    return this;
  };

  /** Gets or sets the internal Xorshift 128 state array of the random number generator
   * @see {@link https://docs.unity3d.com/ScriptReference/Random-state.html UnityEngine.Random.state}
   * @return {[number,number,number,number]}
   */
  get state() {
    return this.#state;
  }
  set state(newState) {
    this.#state = newState;
  }

  /** Returns a random unsigned int within [0..MAX_UINT32] (range is inclusive)
   * @returns {number}
   * @readonly
   */
  get next() {
    const newRandom = xorshift128(this.#state);
    this.#state = [...this.#state.slice(1), newRandom];

    return newRandom;
  };

  /** Skips 'step' number of generated numbers.
   * @param {number} steps
   */
  skip(steps) {
    for (let i = 0; i < steps; ++i) {
      this.next;
    }
    return this;
  }

  /** Returns a random float within [0.0..1.0] (range is inclusive)
   * @see {@link https://docs.unity3d.com/ScriptReference/Random-value.html UnityEngine.Random.value}
   * @readonly
   */
  get value() {
    return roundTo7(value(this.next));
  };

  /** Returns a random float within [min..max] (range is inclusive).  
   * Used to controll behaviour since JS auto-converts whole numbers to Integers
   * @see {@link https://docs.unity3d.com/ScriptReference/Random.Range.html UnityEngine.Random.Range}
   * @param {number} min
   * @param {number} max
   */
  rangeFloat(min, max) {
    return roundTo7(rangeFloat(this.next, min, max));
  };

  /** Returns a random int within [min..max) (range max is eclusive).  
   * Used to controll behaviour since JS auto-converts whole numbers to Integers
   * @see {@link https://docs.unity3d.com/ScriptReference/Random.Range.html UnityEngine.Random.Range}
   * @param {number} min
   * @param {number} max
   */
  rangeInt(min, max) {
    return rangeInt(this.next, min, max);
  };

  /** Returns a random number in a range.
   * Using {@link rangeInt rangeInt} if both parameters are integers,
   * else using {@link rangeFloat rangeFloat}.  
   * Minimum value is == 0 if called with only one parameter.
   * 
   * @see {@link https://docs.unity3d.com/ScriptReference/Random.Range.html UnityEngine.Random.Range}
   * @param {number} minOrMax Max value if called with one parameter, else minimum
   * @param {number} [max]
   */
  range(minOrMax, max) {
    return (Number.isInteger(minOrMax) && (max === undefined || Number.isInteger(max)))
      ? this.rangeInt(minOrMax, max)
      : this.rangeFloat(minOrMax, max);
  };
}

export default new UnyRandom();
