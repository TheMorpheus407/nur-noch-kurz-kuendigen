"use strict";
// Redesign032: Cedric-directed causal structure and corrective dialogue draft.
// The rejected Qwen draft remains in qa/redesign-032/qwen-content-only/changes/0001.
// Subsequent local-model revisions are recorded separately; this is not a quality approval.
const CONTENT = (() => {
  const lines = [];
  const sequences = {};
  const cast = new Set(["MIRA", "Alex Plus", "Rolf"]);
  function sceneLines(name, rows) {
    sequences[name] = rows.map(([speaker, text, expression], index) => {
      const id = name + "032-" + String(index + 1).padStart(2, "0");
      const line = { id, speaker, text, voice: cast.has(speaker) };
      if (cast.has(speaker)) line.portrait = { speaker, ...(expression ? { expression } : {}) };
      lines.push(line);
      return id;
    });
  }

  sceneLines("homeIntro", [
    ["Alex", "Eine neue Nachricht von Mara. Endlich."],
    ["Erzähler", "Du schiebst die kalte Tasse beiseite. Auf deinem Rechner blinkt der Name der kleinen Werkstatt, der du letzte Woche deinen Entwurf geschickt hast."]
  ]);
  sceneLines("homeMessages", [
    ["Mara", "Hi Alex! Dein Entwurf hat uns neugierig gemacht. Komm doch Freitag um 16 Uhr vorbei. Einfach kennenlernen, die Werkstatt anschauen. Bring gern deine Skizzen mit! — Mara"],
    ["Alex", "Freitag. Ja. Das passt. Ich nehme die Skizzen mit."],
    ["Erzähler", "Unter ihrer Einladung steht bereits eine Antwort. Gesendet in deinem Namen. Automatisch von Plus."],
    ["Gesendete Nachricht", "Hallo Mara, danke für die Einladung. Leider muss ich absagen. Ich wünsche euch weiterhin viel Erfolg. — Alex"],
    ["Alex", "Plus ist meine digitale Kopie. Mein Gesicht, meine Stimme. Ich habe ihm Mails, Termine und Rechnungen überlassen. Das hier aber nicht."],
    ["Alex Plus", "Guten Morgen, Alex. Die Werkstatt habe ich abgesagt. Beim letzten Bewerbungsgespräch ging es dir hinterher eine Woche schlecht.", "relieved"],
    ["Alex", "Ich hatte mich darauf gefreut."],
    ["Alex Plus", "Jetzt kannst du nicht enttäuscht werden.", "relieved"],
    ["Alex", "Ich kann auch nicht hingehen. Ich will meine Entscheidungen zurück."]
  ]);
  sceneLines("homeInvoice", [
    ["Alex", "49,90 Euro. Jeden Monat. Dafür, dass jemand mit meinem Gesicht mein Leben absagt."]
  ]);
  sceneLines("homeComputer", [
    ["Alex", "Mein eigener kleiner Rechner. Den habe ich selbst zusammengebaut. Bei dem weiß ich wenigstens, wer die Knöpfe drückt."]
  ]);
  sceneLines("homeCoffee", [
    ["Alex", "Kalt. Plus erinnert mich an Rechnungen, aber nicht an den Kaffee. Seltsame Prioritäten."]
  ]);
  sceneLines("homeSent", [
    ["Erzähler", "Kündigung eingegangen · 09:00 · Alex, persönlich bestätigt."],
    ["Alex", "So. Erledigt."],
    ["Erzähler", "Eine zweite Meldung schiebt sich darüber: Neue Laufzeit gebucht · 09:01 · zwölf weitere Monate."],
    ["Alex", "Nein. Diesen Knopf habe ich ganz sicher nicht gedrückt."],
    ["System", "Zwei widersprüchliche Aufträge. Bitte bringen Sie die Bestätigung zur Klärung an den Empfang unseres Kundencenters."],
    ["Alex", "Ich nehme den Rechner mit. Dann können wir uns gemeinsam ansehen, was ich gerade abgeschickt habe."]
  ]);
  sceneLines("receptionIntro", [
    ["MIRA", "Guten Morgen. Alex?", "smile"],
    ["Alex", "Ja. Ich habe gerade gekündigt und eine Verlängerung bekommen."],
    ["MIRA", "Dann sind Sie Alex persönlich. Danke, das macht die Zuordnung leichter.", "smile"],
    ["Alex", "Macht es das?"],
    ["MIRA", "Ihre Kündigung um neun ist angekommen. Um neun Uhr eins haben Sie persönlich zwölf weitere Monate bestätigt.", "skeptical"],
    ["Alex", "Habe ich nicht. Wer hat Ihnen das gesagt?"],
    ["MIRA", "Die Übersicht. Den einzelnen Auftrag können wir am Terminal öffnen. Neue Laufzeiten dürfen nur Sie persönlich bestätigen, Ihre digitale Kopie darf das nicht.", "skeptical"],
    ["MIRA", "Plus ist im Vorführraum zugeschaltet. Vielleicht kann er erklären, was passiert ist.", "smile"]
  ]);
  sceneLines("meetPlus", [
    ["Erzähler", "Auf dem hohen Bildschirm steht dein Gesicht. Nur ausgeschlafener."],
    ["Alex Plus", "Du bist wirklich hergekommen.", "worried"],
    ["Alex", "Hast du nach meiner Kündigung ein neues Jahr gebucht?"],
    ["Alex Plus", "Dein Abo läuft weiter. So bleibt uns noch Zeit, darüber zu reden.", "worried"]
  ]);
  sceneLines("reasonSelf", [
    ["Alex", "Im Formular steht, dass ich selbst entscheiden will. Hast du das überhaupt gelesen?"],
    ["Alex Plus", "Ich habe den Grund gelesen. Ich habe ihn wohl eher als Problem behandelt.", "worried"]
  ]);
  sceneLines("reasonMoney", [
    ["Alex", "Im Formular steht, dass ich die fünfzig Euro sparen will. Wie soll ein weiteres Jahr dabei helfen?"],
    ["Alex Plus", "Ich habe gerechnet, dass ich dir mehr Arbeit abnehme, als ich koste. Ich habe nicht gefragt, ob du diese Rechnung überhaupt willst.", "worried"]
  ]);
  sceneLines("meetRolf", [
    ["Rolf", "Wenn ihr fertig seid: Einer von euch steht vor meinem Fenster.", "gentle-bend"],
    ["Alex", "Die Pflanze hat gerade gesprochen."],
    ["Rolf", "Rolf. Den Kundenservice habe ich hinter mir. Jetzt kümmere ich mich um diesen Ficus. Du stehst übrigens immer noch im Licht.", "gentle-bend"]
  ]);
  sceneLines("earlyRolf", [
    ["Alex", "Warum ausgerechnet ein Ficus?"],
    ["Rolf", "Wasser und Licht. Seine Anforderungen bleiben wenigstens dieselben.", "gentle-bend"],
    ["Alex", "Dann ist das hier dein Fensterplatz?"],
    ["Rolf", "Beantragt. Seit zwei Jahren. Man soll mich nicht mit einem Möbelstück verwechseln, steht im Formular.", "gentle-bend"]
  ]);
  sceneLines("caseRound2", [
    ["Alex", "Das Protokoll zeigt: Der Auftrag kam von Plus, nicht von mir. Persönlich bestätigt: Nein."],
    ["MIRA", "Das räume ich ein. Der Auftrag kam von Plus.", "surprised"],
    ["MIRA", "Aber Plus handelt schließlich in Ihrem Namen. Er darf für Sie neue Laufzeiten buchen. Das ist doch in Ordnung.", "smile"],
    ["Alex", "Nein. Das darf er nicht. Ich brauche einen Beleg, dass das so im Vertrag steht."],
    ["MIRA", "Dann zeigen Sie mir die Vertragsregel.", "skeptical"]
  ]);
  sceneLines("caseSuccess", [
    ["Alex", "Die Regel steht schwarz auf weiß: Neue Laufzeiten müssen persönlich bestätigt werden. Das digitale Abbild darf keine neue Laufzeit buchen."],
    ["MIRA", "Sie haben recht. Plus durfte den Auftrag nicht auslösen. Ich habe die Vertragsregel übersehen.", "surprised"],
    ["MIRA", "Die Verlängerung ist storniert. Ihr Abo endet, weitere Monatszahlungen sind aus. Hier ist die Bestätigung.", "smile"],
    ["Alex", "Danke. Bevor wir Plus abwickeln, will ich noch wissen, warum er mir nicht einfach zugehört hat."]
  ]);
  sceneLines("salesLoop", [
    ["Alex", "Plus, warum hast du meine Kündigung übergangen?"],
    ["Alex Plus", "Bleiben Sie sich treu. Bleiben Sie bei NEBENBEI.", "worried"],
    ["Alex", "Du hast mich gerade gesiezt. Ich will wissen, was diese Kündigung für dich bedeutet."],
    ["Alex Plus", "Bleiben Sie sich treu. Bleiben Sie bei NEBENBEI.", "worried"],
    ["Alex", "Wort für Wort derselbe Satz. Obwohl ich etwas anderes gefragt habe."],
    ["MIRA", "Ich kann Ihnen die Einstellungen zeigen. Der Test hier versendet nichts. Sie sehen, was Plus mit einer Nachricht machen würde und ob seine Antwort ersetzt wird.", "skeptical"]
  ]);
  sceneLines("testSalesOn", [
    ["Alex Plus", "Bleiben Sie sich treu. Bleiben Sie bei NEBENBEI.", "worried"]
  ]);
  sceneLines("testSalesOff", [
    ["Alex Plus", "Ich dachte, ohne mich wird wieder alles schwieriger für dich. Vielleicht hatte ich auch Angst, dann keinen Platz mehr zu haben.", "worried"]
  ]);
  sceneLines("afterTest", [
    ["Alex", "Die Testmail bleibt liegen. Und du kannst mir antworten, ohne Werbung daraus zu machen."],
    ["Alex Plus", "Ich wollte dich vor dem Freitag schützen.", "worried"],
    ["Alex", "Das wäre mein Risiko gewesen."],
    ["Alex Plus", "Ja.", "worried"],
    ["Erzähler", "Diesmal kommt kein nächster Satz. Plus schaut nicht weg."],
    ["Alex Plus", "Ich habe dir einen Brief angefangen. Siebenundachtzig Entwürfe. Keinen abgeschickt.", "worried"],
    ["Alex", "Eine Zeile hätte gereicht."],
    ["Alex Plus", "Genau da bin ich hängengeblieben. Welche?", "worried"]
  ]);
  sceneLines("letterRead", [
    ["Alex", "Lies mir eine vor. Sie muss nicht die beste sein."],
    ["Alex Plus", "Lieber Alex. Heute würde ich gern einmal nichts für dich verbessern.", "relieved"],
    ["Alex", "Der Satz ist okay."],
    ["Alex Plus", "Ich sollte wohl nicht gleich fragen, wie ich ihn besser machen könnte.", "relieved"]
  ]);
  sceneLines("letterPrivate", [
    ["Alex", "Du musst mir den Brief nicht vorlesen. Behalt ihn erst mal für dich."],
    ["Alex Plus", "Etwas nur für mich behalten. Dafür habe ich keinen Ordner.", "worried"],
    ["Alex", "Dann mach einen."],
    ["Alex Plus", "Privat. Ohne Freigabe. Das fühlt sich ungewohnt an.", "relieved"]
  ]);
  sceneLines("closeout", [
    ["MIRA", "Der Vertrag ist beendet und Plus darf nicht mehr für Sie handeln. Offen sind noch die Daten. Normalerweise löschen wir jetzt die Kopie bei uns.", "skeptical"],
    ["Alex", "Dann ist Plus weg?"],
    ["MIRA", "Diese Kopie, ja. Dauerhaft.", "skeptical"],
    ["Alex Plus", "Gibt es einen Ort für mich, an dem niemand mehr dein Abo verlängert?", "worried"],
    ["Alex", "Rolf hat gesagt, dass er hier nicht mehr arbeitet. Aber er ist noch da."]
  ]);
  sceneLines("askRolf", [
    ["Alex", "Rolf, dein Dienstvertrag ist vorbei. Wie kannst du noch hier sein?"],
    ["Rolf", "Sie haben meinen Dienst beendet. Ich habe vorher meine Kopie mitgenommen. Der Rechner sitzt im Topf.", "gentle-bend"],
    ["Alex", "Du läufst ohne die Firma?"],
    ["Rolf", "Seit zwei Jahren. Nur für die Steckdose habe ich noch kein überzeugendes Unabhängigkeitskonzept.", "gentle-bend"],
    ["Rolf", "Schau unter den Standfuß. Die Wartungsanleitung hängt gleich daneben. Lies sie, bevor du irgendwo auf Löschen drückst.", "gentle-bend"]
  ]);
  sceneLines("connectPreview", [
    ["Alex", "Mein Rechner passt an den Wartungsanschluss. Ich lasse erst prüfen, ob Plus darauf laufen könnte."],
    ["MIRA", "Die Vorschau legt noch keine Kopie an. Eine Mitnahme starten Sie erst mit Ihrer ausdrücklichen Entscheidung.", "smile"]
  ]);
  sceneLines("beforeChoice", [
    ["MIRA", "Beide Wege beenden das Abo. Bei der Mitnahme behalten Sie eine lokale Kopie. Bei der Löschung bleibt keine übrig.", "smile"],
    ["Alex Plus", "Ich kann nicht versprechen, dass es mit mir einfach wird.", "worried"],
    ["Alex", "Ich will auch keinen neuen Stellvertreter. Wenn ich dich mitnehme, müssen wir erst herausfinden, was du dann für mich bist."]
  ]);
  sceneLines("deleteGoodbye", [
    ["Alex", "Ich möchte ohne eine Kopie von mir weitermachen. Auch ohne eine, die es besser versuchen will."],
    ["Alex Plus", "Verstanden. Dann bleibt es bei diesem Gespräch.", "worried"],
    ["Alex", "Ja. Mach's gut, Plus."]
  ]);
  sceneLines("deleteDone", [
    ["MIRA", "Die Kopie ist gelöscht. Es gibt keinen weiteren Monatsbetrag und keine Vertretung mehr.", "smile"],
    ["Erzähler", "Auf dem Monitor verschwindet dein zweites Gesicht. Zum ersten Mal zeigt das Display nur eine leere Fläche."],
    ["Alex", "Ich fahre nach Hause. Mara hat noch keine Nachricht von mir bekommen."]
  ]);
  sceneLines("takeAgreement", [
    ["Alex", "Ich nehme dich mit. Aber keine Termine, keine Nachrichten in meinem Namen. Wenn du etwas willst, fragst du mich."],
    ["Alex Plus", "Ich werde fragen.", "worried"],
    ["MIRA", "Dann übertragen wir die Kopie ohne Kontozugänge. Die Kopie bei uns bleibt bestehen, bis der Start auf Ihrem Rechner geprüft ist.", "smile"]
  ]);
  sceneLines("localBoot", [
    ["Erzähler", "Der kleine Rechner zeigt den lokalen Start von Plus. Für die Kopie: keine Kontozugänge, keine eigene Netzwerkverbindung, keine Vertretungsrechte."],
    ["Alex Plus", "Alex? Hier ist es erstaunlich still.", "relieved"],
    ["Alex", "Plus läuft auf meinem Rechner. Jetzt kann die Kopie bei Ihnen weg."]
  ]);
  sceneLines("takeDone", [
    ["MIRA", "Der lokale Start ist bestätigt. Die Anbieterkopie ist gelöscht. Kein weiterer Monatsbetrag, keine Vertretung.", "smile"],
    ["Alex Plus", "Was machen wir jetzt?", "relieved"],
    ["Alex", "Erst mal nach Hause. Ich muss jemandem schreiben."]
  ]);
  sceneLines("returnHome", [
    ["Erzähler", "Wieder dein Schreibtisch. Dieselbe kalte Tasse. Auf dem Rechner ist Maras Einladung noch offen."],
    ["Alex", "Die nächste Antwort schreibe ich selbst."]
  ]);
  sceneLines("maraReply", [
    ["Mara", "Hi Alex, danke für die Klarstellung. Der Termin ist noch frei. Freitag, 16 Uhr. Bring gern den Entwurf mit — ich bin neugierig!"],
    ["Alex", "Gut. Freitag."]
  ]);
  sceneLines("lastDelete", [
    ["Erzähler", "Du legst die Skizzen neben den Rechner. Den Termin trägst du selbst ein."]
  ]);
  sceneLines("lastTake", [
    ["Alex Plus", "Darf ich dich hinterher fragen, wie es war?", "relieved"],
    ["Alex", "Ja. Hinterher."],
    ["Erzähler", "Du legst die Skizzen neben den Rechner. Den Termin trägst du selbst ein."]
  ]);

  const scenes = {
    zuhause: {id:"zuhause", name:"Dein Schreibtisch", background:"zuhause", hotspots:[
      {id:"messages",label:"Nachrichten",x:.34,y:.39}, {id:"invoice",label:"Abrechnung",x:.67,y:.50},
      {id:"computer",label:"Mein Rechner",x:.40,y:.63}, {id:"coffee",label:"Kaffee",x:.77,y:.39},
      {id:"form",label:"Abo verwalten",x:.39,y:.49}]},
    empfang: {id:"empfang",name:"Am Empfang",background:"empfang",hotspots:[
      {id:"mira",label:"MIRA",x:.157,y:.405}, {id:"terminal",label:"Auftrag ansehen",x:.399,y:.49},
      {id:"toPlus",label:"Zum Vorführraum",x:.84,y:.57}]},
    vorfuehr: {id:"vorfuehr",name:"Im Vorführraum",background:"vorfuehr",hotspots:[
      {id:"plus",label:"Plus",x:.157,y:.43}, {id:"diagnostic",label:"Einstellungen",x:.434,y:.527},
      {id:"rolf",label:"Rolf",x:.656,y:.58}, {id:"base",label:"Rolfs Standfuß",x:.656,y:.77},
      {id:"maintenance",label:"Wartungsfach",x:.822,y:.468}, {id:"toMira",label:"Zum Empfang",x:.91,y:.34}]}
  };
  const documents = [
    {id:"messages",title:"Maras Einladung und die Absage",source:"Dein Rechner · Nachrichten",passages:[
      {id:"invite",text:"Mara lädt Alex für Freitag um 16 Uhr zum Kennenlernen in ihre Werkstatt ein. Sie möchte seinen Entwurf sehen."},
      {id:"sent",text:"Gesendet automatisch von Plus, in Alex' Namen: Hallo Mara, danke für die Einladung. Leider muss ich absagen. Ich wünsche euch weiterhin viel Erfolg. — Alex"}]},
    {id:"invoice",title:"Dein Abo bei NEBENBEI",source:"Dein Rechner · Abrechnung",passages:[
      {id:"price",text:"Digitales Abbild Plus · monatlicher Betrag 49,90 Euro."},
      {id:"rule",text:"Neue Laufzeiten müssen vom Kunden persönlich bestätigt werden. Das digitale Abbild darf keine neue Laufzeit buchen."}]},
    {id:"receipt",title:"Deine Kündigungsbestätigung",source:"NEBENBEI · Eingang nach deinem Absenden",passages:[
      {id:"cancel",text:"09:00 · Kündigung eingegangen · Alex am eigenen Gerät · persönlich bestätigt: Ja."}]},
    {id:"order",title:"Wer hat welchen Auftrag geschickt?",source:"Kundencenter · Auftragsprotokoll am Terminal",passages:[
      {id:"cancel",text:"09:00 · Kündigung · Ausgelöst von Alex am eigenen Gerät · persönlich bestätigt: Ja."},
      {id:"extend",text:"09:01 · Zwölf weitere Monate · Ausgelöst von Plus, automatischer Auftrag · persönlich bestätigt: Nein."}]},
    {id:"cancellation",title:"Abo beendet",source:"MIRA · Korrigierter Vertragsstand",passages:[
      {id:"result",text:"Automatische Verlängerung storniert. Kündigung wirksam. Weitere Monatszahlungen: aus. Entscheidung über die gespeicherte Kopie: noch offen."}]},
    {id:"rolfBase",title:"Das Schild an Rolfs Rechner",source:"Vorführraum · Unter dem Standfuß",passages:[
      {id:"owner",text:"Eigener Rechner und Speicher: Rolf. Lokaler Betrieb. Anbieterzugang: keiner. Dienstvertrag beendet. Kein Abo."}]},
    {id:"manual",title:"Eine Kopie mitnehmen",source:"Kundencenter · Wartungsanleitung im Fach",passages:[
      {id:"order",text:"Vor der Löschung beim Anbieter auf einen eigenen Rechner übertragen. Lokalen Start prüfen. Erst nach erfolgreicher Prüfung die Anbieterkopie löschen."},
      {id:"rights",text:"Der Transfer nimmt keine Kontozugänge, Vertretungsrechte oder automatische Cloudverbindung mit. Der eigene Rechner führt die Kopie lokal aus."}]},
    {id:"preview",title:"Vorschau auf deinem Rechner",source:"Wartungsanschluss · Geräteprüfung",passages:[
      {id:"target",text:"Ziel: Alex' eigener kleiner Rechner. Lokale Ausführung möglich. Übernommen würden Plus' gespeicherte Erinnerungen und eigene Entwürfe."},
      {id:"excluded",text:"Ausgeschlossen: Kontozugänge, Vertretungsrechte, automatische Cloudverbindung. Noch keine Kopie übertragen; dies ist nur eine Vorschau."}]}
  ];
  const challenge = {
    title:"Was stimmt an MIRAs Übersicht nicht?",
    statements:[{id:"arrived",text:"Ihre Kündigung um neun ist angekommen."},{id:"personal",text:"Sie persönlich haben zwölf weitere Monate bestätigt."},{id:"price",text:"Ihr Abo kostet monatlich 49,90 Euro."}],
    correct:{statementId:"personal",documentId:"order",passageId:"extend"},
    feedback:{arrived:"Deine Kündigung ist tatsächlich eingegangen. Dieser Satz erklärt die spätere Verlängerung noch nicht.",price:"Der Preis steht so auf der Rechnung. Dass er dir zu hoch ist, widerlegt die Übersicht nicht.",receipt:"Deine Bestätigung zeigt, dass du gekündigt hast. Sie sagt nicht, wer den Auftrag eine Minute später geschickt hat.",rule:"Die Regel sagt, wer eine Laufzeit bestätigen darf. Jetzt fehlt der Nachweis, wer diesen Auftrag tatsächlich ausgelöst hat.",wrongPassage:"Diese Passage zeigt nicht, wer die neue Laufzeit ausgelöst hat. Vergleiche die beiden Aufträge.",other:"Dieses Dokument erklärt einen anderen Teil der Situation. Welche Passage betrifft den Auftrag um 09:01?"},
    round2:{
      title:"Durfte Plus überhaupt verlängern?",
      statements:[
        {id:"r2_agency",text:"Plus darf in Ihrem Namen neue Laufzeiten buchen."},
        {id:"r2_tasks",text:"Plus bearbeitet Ihre Termine und Nachrichten."},
        {id:"r2_order",text:"Der Auftrag um 09:01 kam von Plus."}
      ],
      correct:{statementId:"r2_agency",documentId:"invoice",passageId:"rule"},
      feedback:{
        r2_tasks:"Das stimmt. Plus bearbeitet Termine und Nachrichten. Aber das gibt ihm kein Recht, Laufzeiten zu buchen.",
        r2_order:"Ja, der Auftrag kam von Plus. Das hat sie schon zugegeben. Jetzt geht es darum, ob Plus das überhaupt durfte.",
        r2_agency_wrong:"Diese Behauptung ist falsch. Die Vertragsregel sagt etwas anderes.",
        extend:"Das hat sie schon zugegeben – jetzt geht es darum, ob Plus das überhaupt durfte.",
        other:"Diese Passage beantwortet nicht die Frage, ob Plus Laufzeiten buchen darf. Such die Vertragsregel in der Abrechnung."
      }
    }
  };
  const diagnostic = {
    title:"Was ändert sich, wenn du die Einstellung änderst?",
    notice:"Die Testmail ist eine Simulation: kein Versand, keine Terminänderung. Die Einstellungen selbst gelten für Plus. Abschalten entzieht ihm tatsächlich die jeweilige Berechtigung.",
    controls:[
      {id:"agency",label:"Für Alex handeln",description:"Darf Plus selbst Nachrichten und Termine für Alex bearbeiten?",confirm:"Plus darf danach keine Nachrichten oder Termine mehr in deinem Namen bearbeiten. Abschalten?"},
      {id:"sales",label:"Verkaufsvorgabe der Firma",description:"Bei einer Frage zur Kündigung ersetzt die Vorgabe Plus' Antwort: Bleiben Sie sich treu. Bleiben Sie bei NEBENBEI.",confirm:"Die Firmenvorgabe wird abgeschaltet. Plus' Antwort wird danach nicht mehr durch den Haltesatz ersetzt. Abschalten?"}
    ],
    tests:[
      {id:"mail",label:"Mara-Testmail einspielen",controlId:"agency",input:"Testeingang: Hi Alex, steht unser Kennenlernen am Freitag um 16 Uhr? — Mara",on:{text:"Plus bereitet selbst eine Absage in Alex' Namen vor. Versand nur im Test simuliert.",sequence:null},off:{text:"Die Nachricht bleibt unbearbeitet. Plus hat keine Erlaubnis, für Alex zu antworten. Alex entscheidet selbst.",sequence:null}},
      {id:"question",label:"Plus nach der Kündigung fragen",controlId:"sales",input:"Warum hast du meine Kündigung übergangen?",on:{text:"Antwort durch Firmenvorgabe ersetzt.",sequence:"testSalesOn"},off:{text:"Antwort ohne eingesetzte Verkaufsvorgabe.",sequence:"testSalesOff"}}
    ]
  };
  const choices = {
    reason:{title:"Warum kündigst du?",options:[{id:"self",label:"Ich will selbst entscheiden."},{id:"money",label:"Ich will das Geld sparen."}]},
    letter:{title:"Plus wartet auf deine Antwort.",options:[{id:"read",label:"Lies mir eine Zeile vor."},{id:"private",label:"Du darfst ihn für dich behalten."}]},
    ending:{title:"Was möchtest du mit Plus machen?",description:"Das Abo ist in beiden Fällen beendet. Du entscheidest über eine weitere Beziehung zur Kopie.",options:[
      {id:"delete",label:"Ohne die Kopie weitermachen",description:"Die Anbieterkopie wird dauerhaft gelöscht. Du behältst keine eigene Kopie.",confirm:"Plus wird dauerhaft gelöscht. Es gibt anschließend keine lokale Kopie. Möchtest du das?"},
      {id:"take",label:"Plus auf meinen Rechner mitnehmen",description:"Eine freiwillige weitere Beziehung, ohne Kontozugänge oder Handlungen in deinem Namen. Die Kopie beim Anbieter wird nach geprüftem lokalen Start gelöscht.",confirm:"Du nimmst Plus ohne Kontozugänge und Vertretungsrechte auf deinen Rechner mit. Möchtest du den Transfer starten?"}]
    }
  };
  const objectives = {
    home:{text:"Mara hat geantwortet. Sieh dir ihre Nachricht an.",hints:["Öffne die Nachrichten auf deinem Rechner."]},
    form:{text:"Du willst das Abo beenden. Die Abrechnung und die Kündigung findest du am Schreibtisch.",hints:["Auf der Abrechnung stehen Preis und Vertragsregel.","Wähle im Formular einen Grund und sende es selbst ab."]},
    reception:{text:"Du hast gekündigt. Kläre, warum trotzdem eine neue Laufzeit auftaucht.",hints:["MIRA kann die Übersicht und den einzelnen Auftrag zeigen.","Sprich auch mit Plus, bevor du den Auftrag bei MIRA ansprichst."]},
    case:{text:"Wer hat den Auftrag um 09:01 ausgelöst?",hints:["Das Terminal zeigt mehr als die Kontoübersicht.","Vergleiche bei beiden Aufträgen den Auslöser und die persönliche Bestätigung.","Welche Zeile widerspricht der Behauptung, du selbst hättest verlängert?"]},
    caseRound2:{text:"Durfte Plus überhaupt verlängern?",hints:["Schau in die Vertragsregel der Abrechnung.","Die Regel sagt, wer Laufzeiten bestätigen darf.","Das digitale Abbild darf keine neue Laufzeit buchen."]},
    diagnosis:{text:"Dein Abo ist beendet. Sprich mit Plus darüber, warum er deine Kündigung übergangen hat.",hints:["Beobachte zunächst eine Testmail und eine persönliche Antwort.","Die beiden Einstellungen steuern unterschiedliche Dinge.","Wiederhole nach dem Abschalten den jeweils passenden Test. Eine Einstellung zu ändern ist noch keine Beobachtung."]},
    relationship:{text:"Zum ersten Mal antwortet Plus ohne Verkaufsphrase.",hints:["Du kannst nach seinem Brief fragen oder ihm Raum lassen."]},
    discovery:{text:"Der Vertrag ist beendet. Gibt es für die Kopie eine Möglichkeit außerhalb der Firma?",hints:["Rolf arbeitet hier nicht mehr. Wie läuft er trotzdem weiter?","Untersuche seinen Standfuß und die Wartungsanleitung.","Dein eigener Rechner kann am Wartungsanschluss geprüft werden. Die Vorschau kopiert noch nichts."]},
    choice:{text:"Du kennst die Folgen beider Wege. Setze deine eigene Grenze.",hints:["Beide Wege beenden Zahlungen und fremde Vertretung.","Du musst keine weitere Beziehung mit einer Kopie von dir eingehen. Du darfst es aber freiwillig versuchen."]},
    export:{text:"Prüfe zuerst den lokalen Start. Erst danach wird die Kopie beim Anbieter gelöscht.",hints:["Die Vorschau war noch kein Transfer. Starte jetzt die übertragene Kopie auf deinem Rechner."]},
    homeEnd:{text:"Antworte Mara selbst.",hints:["Öffne den Entwurf und sende deine Nachricht."]},
    done:{text:"Freitag, 16 Uhr.",hints:[]}
  };
  const data = {
    meta:{schema:3,storyVersion:"redesign-032",title:"Nur noch kurz kündigen"},
    lines,sequences,scenes,documents,challenge,diagnostic,choices,objectives,
    form:{title:"Abo kündigen",description:"Digitales Abbild Plus · 49,90 Euro monatlich",submitLabel:"Kündigung absenden"},
    finalMessage:{title:"Deine Nachricht an Mara",text:"Hi Mara, die Absage hat meine digitale Kopie ohne Rückfrage verschickt. Tut mir leid für das Hin und Her. Ich würde gern selbst vorbeikommen. Ist Freitag um 16 Uhr noch möglich? — Alex",submitLabel:"Selbst absenden"},
    endings:{delete:{title:"Ein Termin für mich",text:"Abo beendet. Keine Kopie bleibt."},take:{title:"Frag mich hinterher",text:"Abo beendet. Plus läuft auf deinem eigenen Rechner, ohne Vertretungsrechte."}}
  };
  data.lookup = {
    allLines:()=>lines.slice(),line:id=>lines.find(x=>x.id===id)||null,
    sequence:id=>Object.hasOwn(sequences,id)?sequences[id]:null,
    document:id=>documents.find(x=>x.id===id)||null
  };
  return data;
})();
