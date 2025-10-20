class Player {
  constructor(name, main) {
    this.name = name;
    this.main = main;
    this.characters = [];
    this.practiceList = new Set();
    this.nicknames = {};
    this.appleKills = {};
    this.notes = "";
  }

  async loadData() {
    const [charData, nicknameData, appleData, notesData] = await Promise.all([
      fetch("characters.json").then(res => res.json()).catch(() => ({})),
      fetch("nicknames.json").then(res => res.json()).catch(() => ({})),
      fetch("applekill.json").then(res => res.json()).catch(() => ({})),
      fetch("notes.txt").then(res => res.text()).catch(() => "")
    ]);

    this.characters = charData.characters || [];
    this.nicknames = nicknameData || {};
    this.appleKills = appleData || {};
    this.notes = notesData || "";

    // Load saved practice list if available
    const saved = JSON.parse(localStorage.getItem("practiceList") || "[]");
    this.practiceList = new Set(saved);
  }

  savePracticeList() {
    localStorage.setItem("practiceList", JSON.stringify([...this.practiceList]));
  }

  resolveNickname(input) {
    const lower = input.toLowerCase();
    const foundChar = this.characters.find(c => c.toLowerCase() === lower);
    if (foundChar) return foundChar;
    for (const [character, nickList] of Object.entries(this.nicknames)) {
      if (nickList.some(n => n.toLowerCase() === lower)) return character;
    }
    return null;
  }

  addPractice(name) {
    const resolved = this.resolveNickname(name);
    if (resolved) {
      this.practiceList.add(resolved);
      this.savePracticeList();
      return `${resolved} added to practice list.`;
    }
    return "Character not found.";
  }

  removePractice(name) {
    const resolved = this.resolveNickname(name);
    if (resolved && this.practiceList.has(resolved)) {
      this.practiceList.delete(resolved);
      this.savePracticeList();
      return `${resolved} removed from practice list.`;
    }
    return "Character not found in practice list.";
  }

  getPracticeList() {
    return Array.from(this.practiceList).sort();
  }

  getRoster() {
    return this.characters.sort();
  }

  getAppleKills(name) {
    const resolved = this.resolveNickname(name);
    const data = this.appleKills[resolved];
    const stageNameMap = {
      BF_Kalos: "BF and Kalos",
      SV_Town: "SV and Town",
      SBF_FD_PS2_Hollow: "SBF, FD, PS2, and Hollow"
    };
    if (!data) return "No apple kill data found.";

    const output = [];
    if (typeof data === "object" && Object.values(data)[0] instanceof Object) {
      for (const [sub, stages] of Object.entries(data)) {
        output.push(`🍎 ${sub}:`);
        for (const [key, label] of Object.entries(stageNameMap)) {
          output.push(` - ${label}: ${stages[key] || "No data"}`);
        }
      }
    } else {
      for (const [key, label] of Object.entries(stageNameMap)) {
        output.push(`🍎 ${label}: ${data[key] || "No data"}`);
      }
    }
    return output.join("\n");
  }

  getNotes(name) {
    const resolved = this.resolveNickname(name);
    if (!resolved) return "Character not found.";
    const lines = this.notes.split("\n");
    const results = [];
    let capturing = false;
    for (const line of lines) {
      if (line.trim() === resolved) {
        capturing = true;
        continue;
      }
      
      if (this.characters.includes(line.trim()) && line.trim() !== resolved && capturing) break;
      
      if (capturing) results.push(line);
    }
    return results.length ? results.join("\n") : "No notes found.";
  }
}

const player = new Player("Fresh", "Pac-Man");
let selectedCharacter = null;

player.loadData().then(() => console.log("Data loaded."));

function output(text) {
  document.getElementById("output").innerText = text;
}

function setCharacter() {
  const input = document.getElementById("character-input").value.trim();
  if (!input) {
    output("Please enter a character name.");
    return;
  }
  const resolved = player.resolveNickname(input);
  if (!resolved) {
    output("Character not recognized.");
    selectedCharacter = null;
    document.getElementById("current-char").innerText = "No character selected";
  } else {
    selectedCharacter = resolved;
    document.getElementById("current-char").innerText = `Selected: ${resolved}`;
    output(`Character set to ${resolved}`);
  }
}

function addChar() {
  if (!selectedCharacter) return output("No character selected.");
  output(player.addPractice(selectedCharacter));
}

function removeChar() {
  if (!selectedCharacter) return output("No character selected.");
  output(player.removePractice(selectedCharacter));
}

function viewPractice() {
  const list = player.getPracticeList();
  output(list.length ? "Practice List:\n" + list.join(", ") : "Practice list is empty.");
}

function showApple() {
  if (!selectedCharacter) return output("No character selected.");
  output(player.getAppleKills(selectedCharacter));
}

function showNotes() {
  if (!selectedCharacter) return output("No character selected.");
  
  let notes = player.getNotes(selectedCharacter);

  // 🧹 Remove OOS Punishes section if it appears
  const oosIndex = notes.indexOf("🛡️ Out of Shield Punishes vs");
  if (oosIndex !== -1) {
    notes = notes.substring(0, oosIndex).trim();
  }

  output(notes || "No notes found.");
}

function extractOOSSection(notesText, selectedCharacter) {
  const lines = notesText.split("\n");
  const result = [];
  let capturing = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Start when we see the correct OOS header
    if (trimmed.startsWith(`🛡️ Out of Shield Punishes vs ${selectedCharacter}`)) {
      capturing = true;
      result.push(line); // include the header itself
      continue;
    }

    // Stop when we hit another character name (means next section)
    if (
      capturing &&
      trimmed !== "" &&
      player.characters.includes(trimmed)
    ) {
      break;
    }

    // Capture all lines once active
    if (capturing) {
      result.push(line);
    }
  }

  return result.length ? result.join("\n") : null;
}

function showOOS() {
  if (!selectedCharacter) return output("No character selected.");
  const notes = player.getNotes(selectedCharacter);
  const oosSection = extractOOSSection(notes, selectedCharacter);

  if (oosSection) output(oosSection);
  else output(`No Out of Shield data found for ${selectedCharacter}.`);
}


// 🕹️ DAL Checker
function getDAL() {
  const works = ["Link", "Samus", "Kirby", "Fox", "Pikachu", "Captain Falcon", "Peach", "Sheik", "Zelda", "Marth",
      "Lucina", "Roy", "Chrom", "Charizard", "Toon Link", "Mega Man", "Wii Fit Trainer", "Rosalina & Luma", "Little Mac", "Pac-Man",
      "Robin", "Shulk", "Ryu", "Ken", "Bayonetta", "Inkling", "Piranha Plant", "Hero", "Terry", "Kazuya", "Mii Gunner"];
  
  const t_works = ["Donkey Kong", "Pit", "Wario", "King Dedede", "R.O.B.", "Wolf",
      "Palutena", "Corrin", "Simon", "Richter", "Incineroar", "Joker", "Banjo & Kazooie", "Byleth", "Aegis"];
  
  const fsmash_lol = ["Mario", "Yoshi", "Luigi", "Ness", "Jigglypuff", "Bowser", "Ice Climbers", 
      "Dr. Mario", "Pichu", "Falco", "Young Link", "Mewtwo", "Mr. Game & Watch", "Meta Knight", "Zero Suit Samus",
      "Squirtle", "Ivysaur", "Lucas", "Olimar", "Lucario", "Villager", "Bowser Jr.", "Duck Hunt", "Isabelle",
      "Min Min", "Mii Brawler", "Mii Swordfighter"];

  let message = "";
  if (!selectedCharacter) return output("No character selected.");

  if (works.includes(selectedCharacter)) {
    message = `Down Smash at Ledge works against ${selectedCharacter}.`;
  } else if (t_works.includes(selectedCharacter)) {
    message = `Down Smash at Ledge *typically* works against ${selectedCharacter}, you may want to space it closer to the ledge.`;
  } else if (fsmash_lol.includes(selectedCharacter)) {
    message = `Just fsmash ${selectedCharacter} lol.`;
  } else {
    message = `Doesn't work on ${selectedCharacter}.`;
  }

  output(message);
}

function viewRoster() {
  const list = player.getRoster();
  output(list.length ? "Full Roster:\n" + list.join(", ") : "Roster is empty.");
}
