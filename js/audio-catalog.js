"use strict";
const AUDIO_CATALOG = Object.freeze({
  "homeMessages032-07": {
    "url": "assets/audio/homeMessages032-07.wav",
    "speaker": "Alex Plus",
    "duration": 3.1067916666666666
  },
  "homeMessages032-08": {
    "url": "assets/audio/homeMessages032-08.wav",
    "speaker": "Alex Plus",
    "duration": 6.56
  },
  "homeMessages032-10": {
    "url": "assets/audio/homeMessages032-10.wav",
    "speaker": "Alex Plus",
    "duration": 3.600041666666667
  },
  "homeMessages032-12": {
    "url": "assets/audio/homeMessages032-12.wav",
    "speaker": "Alex Plus",
    "duration": 4.501291666666667
  },
  "receptionIntro032-01": {
    "url": "assets/audio/receptionIntro032-01.wav",
    "speaker": "MIRA",
    "duration": 1.52
  },
  "receptionIntro032-03": {
    "url": "assets/audio/receptionIntro032-03.wav",
    "speaker": "MIRA",
    "duration": 6.720041666666667
  },
  "receptionIntro032-05": {
    "url": "assets/audio/receptionIntro032-05.wav",
    "speaker": "MIRA",
    "duration": 6.333333333333333
  },
  "receptionIntro032-07": {
    "url": "assets/audio/receptionIntro032-07.wav",
    "speaker": "MIRA",
    "duration": 8.4
  },
  "receptionIntro032-08": {
    "url": "assets/audio/receptionIntro032-08.wav",
    "speaker": "MIRA",
    "duration": 4.4
  },
  "meetPlus032-02": {
    "url": "assets/audio/meetPlus032-02.wav",
    "speaker": "Alex Plus",
    "duration": 1.84
  },
  "meetPlus032-04": {
    "url": "assets/audio/meetPlus032-04.wav",
    "speaker": "Alex Plus",
    "duration": 7.0601666666666665
  },
  "reasonSelf032-02": {
    "url": "assets/audio/reasonSelf032-02.wav",
    "speaker": "Alex Plus",
    "duration": 5.28
  },
  "reasonMoney032-02": {
    "url": "assets/audio/reasonMoney032-02.wav",
    "speaker": "Alex Plus",
    "duration": 8.199916666666667
  },
  "meetRolf032-01": {
    "url": "assets/audio/meetRolf032-01.wav",
    "speaker": "Rolf",
    "duration": 3.28
  },
  "meetRolf032-03": {
    "url": "assets/audio/meetRolf032-03.wav",
    "speaker": "Rolf",
    "duration": 5.92
  },
  "earlyRolf032-02": {
    "url": "assets/audio/earlyRolf032-02.wav",
    "speaker": "Rolf",
    "duration": 4.88
  },
  "earlyRolf032-04": {
    "url": "assets/audio/earlyRolf032-04.wav",
    "speaker": "Rolf",
    "duration": 5.92
  },
  "caseRound2032-02": {
    "url": "assets/audio/caseRound2032-02.wav",
    "speaker": "MIRA",
    "duration": 3.0729583333333332
  },
  "caseRound2032-03": {
    "url": "assets/audio/caseRound2032-03.wav",
    "speaker": "MIRA",
    "duration": 6.48
  },
  "caseRound2032-05": {
    "url": "assets/audio/caseRound2032-05.wav",
    "speaker": "MIRA",
    "duration": 6.56
  },
  "caseSuccess032-02": {
    "url": "assets/audio/caseSuccess032-02.wav",
    "speaker": "MIRA",
    "duration": 5.68
  },
  "caseSuccess032-03": {
    "url": "assets/audio/caseSuccess032-03.wav",
    "speaker": "MIRA",
    "duration": 7.894458333333334
  },
  "salesLoop032-02": {
    "url": "assets/audio/salesLoop032-02.wav",
    "speaker": "Alex Plus",
    "duration": 3.28
  },
  "salesLoop032-04": {
    "url": "assets/audio/salesLoop032-04.wav",
    "speaker": "Alex Plus",
    "duration": 3.28
  },
  "salesLoop032-06": {
    "url": "assets/audio/salesLoop032-06.wav",
    "speaker": "MIRA",
    "duration": 2.4
  },
  "salesLoop032-07": {
    "url": "assets/audio/salesLoop032-07.wav",
    "speaker": "MIRA",
    "duration": 6.633291666666667
  },
  "testSalesOn032-01": {
    "url": "assets/audio/testSalesOn032-01.wav",
    "speaker": "Alex Plus",
    "duration": 3.28
  },
  "testSalesOff032-01": {
    "url": "assets/audio/testSalesOff032-01.wav",
    "speaker": "Alex Plus",
    "duration": 6.772541666666666
  },
  "afterTest032-02": {
    "url": "assets/audio/afterTest032-02.wav",
    "speaker": "Alex Plus",
    "duration": 2.4
  },
  "afterTest032-04": {
    "url": "assets/audio/afterTest032-04.wav",
    "speaker": "Alex Plus",
    "duration": 0.64
  },
  "afterTest032-06": {
    "url": "assets/audio/afterTest032-06.wav",
    "speaker": "Alex Plus",
    "duration": 5.92
  },
  "afterTest032-08": {
    "url": "assets/audio/afterTest032-08.wav",
    "speaker": "Alex Plus",
    "duration": 3.04
  },
  "letterRead032-02": {
    "url": "assets/audio/letterRead032-02.wav",
    "speaker": "Alex Plus",
    "duration": 4.48
  },
  "letterRead032-04": {
    "url": "assets/audio/letterRead032-04.wav",
    "speaker": "Alex Plus",
    "duration": 3.787
  },
  "letterPrivate032-02": {
    "url": "assets/audio/letterPrivate032-02.wav",
    "speaker": "Alex Plus",
    "duration": 3.52625
  },
  "letterPrivate032-04": {
    "url": "assets/audio/letterPrivate032-04.wav",
    "speaker": "Alex Plus",
    "duration": 3.92
  },
  "closeout032-01": {
    "url": "assets/audio/closeout032-01.wav",
    "speaker": "MIRA",
    "duration": 6.1117083333333335
  },
  "closeout032-03": {
    "url": "assets/audio/closeout032-03.wav",
    "speaker": "MIRA",
    "duration": 2.56
  },
  "closeout032-04": {
    "url": "assets/audio/closeout032-04.wav",
    "speaker": "Alex Plus",
    "duration": 4.080041666666666
  },
  "askRolf032-02": {
    "url": "assets/audio/askRolf032-02.wav",
    "speaker": "Rolf",
    "duration": 6.286083333333333
  },
  "askRolf032-04": {
    "url": "assets/audio/askRolf032-04.wav",
    "speaker": "Rolf",
    "duration": 5.737208333333333
  },
  "askRolf032-05": {
    "url": "assets/audio/askRolf032-05.wav",
    "speaker": "Rolf",
    "duration": 6.937291666666667
  },
  "connectPreview032-02": {
    "url": "assets/audio/connectPreview032-02.wav",
    "speaker": "MIRA",
    "duration": 6.281166666666667
  },
  "beforeChoice032-01": {
    "url": "assets/audio/beforeChoice032-01.wav",
    "speaker": "MIRA",
    "duration": 7.04
  },
  "beforeChoice032-02": {
    "url": "assets/audio/beforeChoice032-02.wav",
    "speaker": "Alex Plus",
    "duration": 6.72
  },
  "beforeChoice032-03": {
    "url": "assets/audio/beforeChoice032-03.wav",
    "speaker": "MIRA",
    "duration": 3.761125
  },
  "deleteGoodbye032-02": {
    "url": "assets/audio/deleteGoodbye032-02.wav",
    "speaker": "Alex Plus",
    "duration": 3.44
  },
  "deleteGoodbye032-04": {
    "url": "assets/audio/deleteGoodbye032-04.wav",
    "speaker": "Alex Plus",
    "duration": 4.946583333333334
  },
  "deleteDone032-01": {
    "url": "assets/audio/deleteDone032-01.wav",
    "speaker": "MIRA",
    "duration": 6.24
  },
  "takeAgreement032-02": {
    "url": "assets/audio/takeAgreement032-02.wav",
    "speaker": "Alex Plus",
    "duration": 1.36
  },
  "takeAgreement032-03": {
    "url": "assets/audio/takeAgreement032-03.wav",
    "speaker": "MIRA",
    "duration": 10.0
  },
  "localBoot032-02": {
    "url": "assets/audio/localBoot032-02.wav",
    "speaker": "Alex Plus",
    "duration": 7.04
  },
  "takeDone032-01": {
    "url": "assets/audio/takeDone032-01.wav",
    "speaker": "MIRA",
    "duration": 7.980958333333334
  },
  "takeDone032-02": {
    "url": "assets/audio/takeDone032-02.wav",
    "speaker": "Alex Plus",
    "duration": 3.84
  },
  "lastTake032-01": {
    "url": "assets/audio/lastTake032-01.wav",
    "speaker": "Alex Plus",
    "duration": 2.48
  }
});
