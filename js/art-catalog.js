"use strict";
// Operator asset metadata; local Krea 2 Turbo FP8; separate MIRA, Alex Plus and Rolf LoRAs as documented.
const ART_ASSETS = Object.freeze({
  "rooms": {
    "empfang": {
      "url": "assets/art/empfang.png",
      "width": 2048,
      "height": 1152,
      "hotspots": {
        "mira": {
          "x": 0.157,
          "y": 0.405
        },
        "terminal": {
          "x": 0.399,
          "y": 0.49
        },
        "vertragsfach": {
          "x": 0.619,
          "y": 0.606
        },
        "drucker": {
          "x": 0.844,
          "y": 0.572
        }
      }
    },
    "vorfuehr": {
      "url": "assets/art/vorfuehr.png",
      "width": 2048,
      "height": 1152,
      "hotspots": {
        "alexPlus": {
          "x": 0.157,
          "y": 0.43
        },
        "konsole": {
          "x": 0.434,
          "y": 0.527
        },
        "rolf": {
          "x": 0.656,
          "y": 0.67
        },
        "wartungsfach": {
          "x": 0.822,
          "y": 0.468
        }
      }
    },
    "zuhause": {
      "url": "assets/art/zuhause.png",
      "width": 2048,
      "height": 1152,
      "hotspots": {
        "messages": {
          "x": 0.299805,
          "y": 0.342882
        },
        "form": {
          "x": 0.319824,
          "y": 0.46441
        },
        "computer": {
          "x": 0.427246,
          "y": 0.685764
        },
        "invoice": {
          "x": 0.710449,
          "y": 0.568576
        },
        "coffee": {
          "x": 0.861816,
          "y": 0.381944
        }
      }
    }
  },
  "portraits": {
    "MIRA": {
      "url": "assets/art/sprites/mira-neutral.png",
      "width": 1008,
      "height": 976
    },
    "Alex Plus": {
      "url": "assets/art/sprites/alex-plus-neutral.png",
      "width": 968,
      "height": 944
    },
    "Rolf": {
      "url": "assets/art/sprites/rolf-gentle-bend.png",
      "width": 1024,
      "height": 1024
    }
  },
  "expressions": {
    "MIRA": {
      "smile": {
        "url": "assets/art/sprites/mira-smile.png",
        "width": 1024,
        "height": 1024
      },
      "skeptical": {
        "url": "assets/art/sprites/mira-skeptical.png",
        "width": 1024,
        "height": 1024
      },
      "surprised": {
        "url": "assets/art/sprites/mira-surprised.png",
        "width": 1024,
        "height": 1024
      }
    },
    "Alex Plus": {
      "worried": {
        "url": "assets/art/sprites/alex-plus-worried.png",
        "width": 1024,
        "height": 1024
      },
      "relieved": {
        "url": "assets/art/sprites/alex-plus-relieved.png",
        "width": 1024,
        "height": 1024
      }
    },
    "Rolf": {
      "gentle-bend": {
        "url": "assets/art/sprites/rolf-gentle-bend.png",
        "width": 1024,
        "height": 1024
      }
    }
  },
  "portraitByLine": {
    "ankunft-01": {
      "speaker": "MIRA",
      "expression": "smile"
    },
    "endeA-04": {
      "speaker": "MIRA",
      "expression": "smile"
    },
    "ankunft-08": {
      "speaker": "MIRA",
      "expression": "skeptical"
    },
    "mira-04": {
      "speaker": "MIRA",
      "expression": "skeptical"
    },
    "w2-01": {
      "speaker": "MIRA",
      "expression": "surprised"
    },
    "w2-03": {
      "speaker": "Alex Plus",
      "expression": "worried"
    },
    "alexplusnachw2-01": {
      "speaker": "Alex Plus",
      "expression": "worried"
    },
    "alexplusnachw2-02": {
      "speaker": "Alex Plus",
      "expression": "worried"
    },
    "alexplusnachw2-04": {
      "speaker": "Alex Plus",
      "expression": "worried"
    },
    "alexplusnachw2-05": {
      "speaker": "Alex Plus",
      "expression": "worried"
    },
    "alexplusnachw2-07": {
      "speaker": "Alex Plus",
      "expression": "worried"
    },
    "w3v-02": {
      "speaker": "Alex Plus",
      "expression": "worried"
    },
    "endeA-02": {
      "speaker": "Alex Plus",
      "expression": "worried"
    },
    "endeB-02": {
      "speaker": "Alex Plus",
      "expression": "relieved"
    },
    "endeB-04": {
      "speaker": "Alex Plus",
      "expression": "relieved"
    },
    "endeB-06": {
      "speaker": "Alex Plus",
      "expression": "relieved"
    },
    "rolf-01": {
      "speaker": "Rolf",
      "expression": "gentle-bend"
    },
    "rolf-03": {
      "speaker": "Rolf",
      "expression": "gentle-bend"
    },
    "rolf-04": {
      "speaker": "Rolf",
      "expression": "gentle-bend"
    },
    "rolf-06": {
      "speaker": "Rolf",
      "expression": "gentle-bend"
    },
    "rolf-07": {
      "speaker": "Rolf",
      "expression": "gentle-bend"
    }
  }
});
