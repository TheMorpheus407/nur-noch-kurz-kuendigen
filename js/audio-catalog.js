"use strict";
// Asset metadata; local Qwen3-TTS, selected voices, same-cast revisions and processing in provenance.
const AUDIO_CATALOG = Object.freeze({
  "ankunft-01": {
    "url": "assets/audio/ankunft-01.wav",
    "speaker": "MIRA",
    "duration": 5.426583333333333
  },
  "ankunft-03": {
    "url": "assets/audio/ankunft-03.wav",
    "speaker": "MIRA",
    "duration": 4.56
  },
  "ankunft-04": {
    "url": "assets/audio/ankunft-04.wav",
    "speaker": "Alex Plus",
    "duration": 4.4
  },
  "ankunft-06": {
    "url": "assets/audio/ankunft-06.wav",
    "speaker": "Alex Plus",
    "duration": 3.76
  },
  "ankunft-07": {
    "url": "assets/audio/ankunft-07.wav",
    "speaker": "MIRA",
    "duration": 11.28
  },
  "ankunft-08": {
    "url": "assets/audio/ankunft-08.wav",
    "speaker": "MIRA",
    "duration": 6.1525
  },
  "ankunft-10": {
    "url": "assets/audio/ankunft-10.wav",
    "speaker": "MIRA",
    "duration": 8.24
  },
  "mira-01": {
    "url": "assets/audio/mira-01.wav",
    "speaker": "MIRA",
    "duration": 6.08
  },
  "mira-03": {
    "url": "assets/audio/mira-03.wav",
    "speaker": "MIRA",
    "duration": 4.668458333333334
  },
  "mira-04": {
    "url": "assets/audio/mira-04.wav",
    "speaker": "MIRA",
    "duration": 6.08
  },
  "mira-06": {
    "url": "assets/audio/mira-06.wav",
    "speaker": "MIRA",
    "duration": 5.6
  },
  "alexplus-01": {
    "url": "assets/audio/alexplus-01.wav",
    "speaker": "Alex Plus",
    "duration": 5.227791666666667
  },
  "alexplus-03": {
    "url": "assets/audio/alexplus-03.wav",
    "speaker": "Alex Plus",
    "duration": 5.3375
  },
  "alexplus-05": {
    "url": "assets/audio/alexplus-05.wav",
    "speaker": "Alex Plus",
    "duration": 4.64
  },
  "rolf-01": {
    "url": "assets/audio/rolf-01.wav",
    "speaker": "Rolf",
    "duration": 2.88
  },
  "rolf-03": {
    "url": "assets/audio/rolf-03.wav",
    "speaker": "Rolf",
    "duration": 6.08
  },
  "rolf-04": {
    "url": "assets/audio/rolf-04.wav",
    "speaker": "Rolf",
    "duration": 11.6
  },
  "rolf-06": {
    "url": "assets/audio/rolf-06.wav",
    "speaker": "Rolf",
    "duration": 3.84
  },
  "rolf-07": {
    "url": "assets/audio/rolf-07.wav",
    "speaker": "Rolf",
    "duration": 4.72
  },
  "miranachw2-01": {
    "url": "assets/audio/miranachw2-01.wav",
    "speaker": "MIRA",
    "duration": 7.074625
  },
  "miranachw2-02": {
    "url": "assets/audio/miranachw2-02.wav",
    "speaker": "MIRA",
    "duration": 7.52
  },
  "miranachw2-04": {
    "url": "assets/audio/miranachw2-04.wav",
    "speaker": "MIRA",
    "duration": 7.12
  },
  "alexplusnachw2-01": {
    "url": "assets/audio/alexplusnachw2-01.wav",
    "speaker": "Alex Plus",
    "duration": 5.28
  },
  "alexplusnachw2-02": {
    "url": "assets/audio/alexplusnachw2-02.wav",
    "speaker": "Alex Plus",
    "duration": 9.28
  },
  "alexplusnachw2-04": {
    "url": "assets/audio/alexplusnachw2-04.wav",
    "speaker": "Alex Plus",
    "duration": 11.12
  },
  "alexplusnachw2-05": {
    "url": "assets/audio/alexplusnachw2-05.wav",
    "speaker": "Alex Plus",
    "duration": 7.04
  },
  "alexplusnachw2-07": {
    "url": "assets/audio/alexplusnachw2-07.wav",
    "speaker": "Alex Plus",
    "duration": 3.600041666666667
  },
  "w1-01": {
    "url": "assets/audio/w1-01.wav",
    "speaker": "MIRA",
    "duration": 6.48
  },
  "w1-02": {
    "url": "assets/audio/w1-02.wav",
    "speaker": "MIRA",
    "duration": 6.0
  },
  "w2-01": {
    "url": "assets/audio/w2-01.wav",
    "speaker": "MIRA",
    "duration": 8.176166666666667
  },
  "w2-02": {
    "url": "assets/audio/w2-02.wav",
    "speaker": "MIRA",
    "duration": 4.818375
  },
  "w2-03": {
    "url": "assets/audio/w2-03.wav",
    "speaker": "Alex Plus",
    "duration": 3.28
  },
  "w2-04": {
    "url": "assets/audio/w2-04.wav",
    "speaker": "MIRA",
    "duration": 5.580375
  },
  "w3v-01": {
    "url": "assets/audio/w3v-01.wav",
    "speaker": "MIRA",
    "duration": 6.08
  },
  "w3v-02": {
    "url": "assets/audio/w3v-02.wav",
    "speaker": "Alex Plus",
    "duration": 3.948375
  },
  "w3-01": {
    "url": "assets/audio/w3-01.wav",
    "speaker": "MIRA",
    "duration": 10.16
  },
  "w3-02": {
    "url": "assets/audio/w3-02.wav",
    "speaker": "MIRA",
    "duration": 7.84
  },
  "endeA-01": {
    "url": "assets/audio/endeA-01.wav",
    "speaker": "MIRA",
    "duration": 8.08
  },
  "endeA-02": {
    "url": "assets/audio/endeA-02.wav",
    "speaker": "Alex Plus",
    "duration": 4.56
  },
  "endeA-03": {
    "url": "assets/audio/endeA-03.wav",
    "speaker": "MIRA",
    "duration": 3.5200416666666667
  },
  "endeA-04": {
    "url": "assets/audio/endeA-04.wav",
    "speaker": "MIRA",
    "duration": 4.438416666666667
  },
  "endeB-01": {
    "url": "assets/audio/endeB-01.wav",
    "speaker": "MIRA",
    "duration": 6.4
  },
  "endeB-02": {
    "url": "assets/audio/endeB-02.wav",
    "speaker": "Alex Plus",
    "duration": 5.52
  },
  "endeB-04": {
    "url": "assets/audio/endeB-04.wav",
    "speaker": "Alex Plus",
    "duration": 6.48
  },
  "endeB-06": {
    "url": "assets/audio/endeB-06.wav",
    "speaker": "Alex Plus",
    "duration": 2.2422916666666666
  }
});
