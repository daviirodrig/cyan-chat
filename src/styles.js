// SIZE

const size_small = `
#example {
  font-size: 20px;
}

#example .badge {
  width: 16px;
  height: 16px;
  margin-right: 2px;
  margin-bottom: 3px;
}

#example .badge:last-of-type {
  margin-right: 3px;
}

#example .colon {
  margin-right: 8px;
}

#example .cheer_bits {
  font-weight: 700;
  margin-right: 4px;
}

#example .cheer_emote {
  max-height: 25px;
  margin-bottom: -6px;
}

#example .emote {
  max-width: 75px;
  height: 25px;
}

#example .emoji {
  height: 22px;
}`;

const size_medium = `
#example {
  font-size: 34px;
}

#example .badge {
  width: 28px;
  height: 28px;
  margin-right: 4px;
  margin-bottom: 6px;
}

#example .badge:last-of-type {
  margin-right: 6px;
}

#example .colon {
  margin-right: 14px;
}

#example .cheer_bits {
  font-weight: 600;
  margin-right: 7px;
}

#example .cheer_emote {
  max-height: 42px;
  margin-bottom: -10px;
}

#example .emote {
  max-width: 128px;
  height: 42px;
}

#example .emoji {
  height: 39px;
}`

const size_large = `
#example {
  font-size: 48px;
}

#example .badge {
  width: 40px;
  height: 40px;
  margin-right: 5px;
  margin-bottom: 8px;
}

#example .badge:last-of-type {
  margin-right: 8px;
}

#example .colon {
  margin-right: 20px;
}

#example .cheer_bits {
  font-weight: 500;
  margin-right: 10px;
}

#example .cheer_emote {
  max-height: 60px;
  margin-bottom: -15px;
}

#example .emote {
  max-width: 180px;
  height: 60px;
}

#example .emoji {
  height: 55px;
}`

// EMOTE SCALE

const ES_small_2 = `
#example .emote {
  max-height: 50px;
  max-width: 150px;
  height: 50px;
}

.zero-width_container {
  margin-bottom: 11px;
  margin-top: 11px;
}`

const ES_small_3 = `
#example .emote {
  max-height: 75px;
  max-width: 225px;
  height: 75px;
}

.zero-width_container {
  margin-bottom: 16.5px;
  margin-top: 16.5px;
}`

const ES_medium_2 = `
#example .emote {
  max-height: 84px;
  max-width: 252px;
  height: 84px;
}

.zero-width_container {
  margin-bottom: 18.5px;
  margin-top: 18.5px;
}`

const ES_medium_3 = `
#example .emote {
  max-height: 126px;
  max-width: 378px;
  height: 126px;
}

.zero-width_container {
  margin-bottom: 27.5px;
  margin-top: 27.5px;
}`

const ES_large_2 = `
#example .emote {
  max-height: 120px;
  max-width: 360px;
  height: 120px;
}

.zero-width_container {
  margin-bottom: 26.25px;
  margin-top: 26.25px;
}`

const ES_large_3 = `
#example .emote {
  max-height: 180px;
  max-width: 540px;
  height: 180px;
}

.zero-width_container {
  margin-bottom: 28px;
  margin-top: 28px;
}`

// STROKE

const stroke_thin = `
:root {
  --stroke-1: 1px;
  --stroke-2: 2px;
  --stroke-3: 3px;
  --stroke-1-min: -1px;
  --stroke-2-min: -2px;
  --stroke-3-min: -3px;
}

#example {
  text-shadow: var(--stroke-1) var(--stroke-3) 0px #000,
               var(--stroke-2) var(--stroke-2) 0px #000,
               var(--stroke-3) var(--stroke-1) 0px #000,
               var(--stroke-3) 0px 0px #000,
               var(--stroke-3) var(--stroke-1-min) 0px #000,
               var(--stroke-2) var(--stroke-2-min) 0px #000,
               var(--stroke-1) var(--stroke-3-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3) 0px #000,
               var(--stroke-2-min) var(--stroke-2) 0px #000,
               var(--stroke-3-min) var(--stroke-1) 0px #000,
               var(--stroke-3-min) 0px 0px #000,
               var(--stroke-3-min) var(--stroke-1-min) 0px #000,
               var(--stroke-2-min) var(--stroke-2-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3-min) 0px #000,
               var(--stroke-3) var(--stroke-1) 0px #000,
               var(--stroke-2) var(--stroke-2) 0px #000,
               var(--stroke-1) var(--stroke-3) 0px #000,
               0px var(--stroke-3) 0px #000,
               var(--stroke-1-min) var(--stroke-3) 0px #000,
               var(--stroke-2-min) var(--stroke-2) 0px #000,
               var(--stroke-3-min) var(--stroke-1) 0px #000,
               var(--stroke-3) var(--stroke-1-min) 0px #000,
               var(--stroke-2) var(--stroke-2-min) 0px #000,
               var(--stroke-1) var(--stroke-3-min) 0px #000,
               0px var(--stroke-3-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3-min) 0px #000,
               var(--stroke-2-min) var(--stroke-2-min) 0px #000,
               var(--stroke-3-min) var(--stroke-1-min) 0px #000;
 
}`

const stroke_medium = `
:root {
  --stroke-1: 1.5px;
  --stroke-2: 3px;
  --stroke-3: 4.5px;
  --stroke-1-min: -1.5px;
  --stroke-2-min: -3px;
  --stroke-3-min: -4.5px;
}

#example {
  text-shadow: var(--stroke-1) var(--stroke-3) 0px #000,
               var(--stroke-2) var(--stroke-2) 0px #000,
               var(--stroke-3) var(--stroke-1) 0px #000,
               var(--stroke-3) 0px 0px #000,
               var(--stroke-3) var(--stroke-1-min) 0px #000,
               var(--stroke-2) var(--stroke-2-min) 0px #000,
               var(--stroke-1) var(--stroke-3-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3) 0px #000,
               var(--stroke-2-min) var(--stroke-2) 0px #000,
               var(--stroke-3-min) var(--stroke-1) 0px #000,
               var(--stroke-3-min) 0px 0px #000,
               var(--stroke-3-min) var(--stroke-1-min) 0px #000,
               var(--stroke-2-min) var(--stroke-2-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3-min) 0px #000,
               var(--stroke-3) var(--stroke-1) 0px #000,
               var(--stroke-2) var(--stroke-2) 0px #000,
               var(--stroke-1) var(--stroke-3) 0px #000,
               0px var(--stroke-3) 0px #000,
               var(--stroke-1-min) var(--stroke-3) 0px #000,
               var(--stroke-2-min) var(--stroke-2) 0px #000,
               var(--stroke-3-min) var(--stroke-1) 0px #000,
               var(--stroke-3) var(--stroke-1-min) 0px #000,
               var(--stroke-2) var(--stroke-2-min) 0px #000,
               var(--stroke-1) var(--stroke-3-min) 0px #000,
               0px var(--stroke-3-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3-min) 0px #000,
               var(--stroke-2-min) var(--stroke-2-min) 0px #000,
               var(--stroke-3-min) var(--stroke-1-min) 0px #000;
 
}`

const stroke_thick = `
:root {
  --stroke-1: 2px;
  --stroke-2: 4px;
  --stroke-3: 6px;
  --stroke-1-min: -2px;
  --stroke-2-min: -4px;
  --stroke-3-min: -6px;
}

#example {
  text-shadow: var(--stroke-1) var(--stroke-3) 0px #000,
               var(--stroke-2) var(--stroke-2) 0px #000,
               var(--stroke-3) var(--stroke-1) 0px #000,
               var(--stroke-3) 0px 0px #000,
               var(--stroke-3) var(--stroke-1-min) 0px #000,
               var(--stroke-2) var(--stroke-2-min) 0px #000,
               var(--stroke-1) var(--stroke-3-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3) 0px #000,
               var(--stroke-2-min) var(--stroke-2) 0px #000,
               var(--stroke-3-min) var(--stroke-1) 0px #000,
               var(--stroke-3-min) 0px 0px #000,
               var(--stroke-3-min) var(--stroke-1-min) 0px #000,
               var(--stroke-2-min) var(--stroke-2-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3-min) 0px #000,
               var(--stroke-3) var(--stroke-1) 0px #000,
               var(--stroke-2) var(--stroke-2) 0px #000,
               var(--stroke-1) var(--stroke-3) 0px #000,
               0px var(--stroke-3) 0px #000,
               var(--stroke-1-min) var(--stroke-3) 0px #000,
               var(--stroke-2-min) var(--stroke-2) 0px #000,
               var(--stroke-3-min) var(--stroke-1) 0px #000,
               var(--stroke-3) var(--stroke-1-min) 0px #000,
               var(--stroke-2) var(--stroke-2-min) 0px #000,
               var(--stroke-1) var(--stroke-3-min) 0px #000,
               0px var(--stroke-3-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3-min) 0px #000,
               var(--stroke-2-min) var(--stroke-2-min) 0px #000,
               var(--stroke-3-min) var(--stroke-1-min) 0px #000;
 
}`

const stroke_thicker = `
:root {
  --stroke-1: 2.5px;
  --stroke-2: 5px;
  --stroke-3: 7.5px;
  --stroke-1-min: -2.5px;
  --stroke-2-min: -5px;
  --stroke-3-min: -7.5px;
}

#example {
  text-shadow: var(--stroke-1) var(--stroke-3) 0px #000,
               var(--stroke-2) var(--stroke-2) 0px #000,
               var(--stroke-3) var(--stroke-1) 0px #000,
               var(--stroke-3) 0px 0px #000,
               var(--stroke-3) var(--stroke-1-min) 0px #000,
               var(--stroke-2) var(--stroke-2-min) 0px #000,
               var(--stroke-1) var(--stroke-3-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3) 0px #000,
               var(--stroke-2-min) var(--stroke-2) 0px #000,
               var(--stroke-3-min) var(--stroke-1) 0px #000,
               var(--stroke-3-min) 0px 0px #000,
               var(--stroke-3-min) var(--stroke-1-min) 0px #000,
               var(--stroke-2-min) var(--stroke-2-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3-min) 0px #000,
               var(--stroke-3) var(--stroke-1) 0px #000,
               var(--stroke-2) var(--stroke-2) 0px #000,
               var(--stroke-1) var(--stroke-3) 0px #000,
               0px var(--stroke-3) 0px #000,
               var(--stroke-1-min) var(--stroke-3) 0px #000,
               var(--stroke-2-min) var(--stroke-2) 0px #000,
               var(--stroke-3-min) var(--stroke-1) 0px #000,
               var(--stroke-3) var(--stroke-1-min) 0px #000,
               var(--stroke-2) var(--stroke-2-min) 0px #000,
               var(--stroke-1) var(--stroke-3-min) 0px #000,
               0px var(--stroke-3-min) 0px #000,
               var(--stroke-1-min) var(--stroke-3-min) 0px #000,
               var(--stroke-2-min) var(--stroke-2-min) 0px #000,
               var(--stroke-3-min) var(--stroke-1-min) 0px #000;
 
}`